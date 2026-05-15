// SSE proxy: connects to the dashboard's /api/v2/events from Rust (no CORS)
// and forwards events to the frontend via Tauri's event system.
//
// In production mode, the Tauri WebView can't directly EventSource to
// http://127.0.0.1:9119 because of cross-origin restrictions (the webview
// origin is tauri://localhost). This command bridges that gap by making the
// HTTP request from Rust (no CORS) and forwarding via Tauri events.

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use futures_util::StreamExt;
use serde::Deserialize;
use tauri::{Emitter, Listener, State};

use crate::state::AppState;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectGatewayInput {
    #[serde(default)]
    pub client_id: Option<String>,
}

#[tauri::command]
pub async fn connect_gateway_sse(
    input: ConnectGatewayInput,
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let (api_base_url, session_token) = {
        let inner = state.inner.lock().map_err(|e| e.to_string())?;
        (inner.api_base_url.clone(), inner.session_token.clone())
    };

    let mut url = format!("{}/api/v2/events", api_base_url.trim_end_matches('/'));
    let mut params = vec![];
    if let Some(ref token) = session_token {
        params.push(format!("token={}", token));
    }
    if let Some(ref cid) = input.client_id {
        params.push(format!("client_id={}", cid));
    }
    if !params.is_empty() {
        url = format!("{}?{}", url, params.join("&"));
    }

    let client = reqwest::Client::new();
    let mut req = client.get(&url).header("Accept", "text/event-stream");
    if let Some(ref token) = session_token {
        req = req.header("Authorization", format!("Bearer {}", token));
    }

    let response = req.send().await.map_err(|e| format!("SSE connect failed: {}", e))?;
    if !response.status().is_success() {
        return Err(format!("SSE HTTP {}", response.status()));
    }

    let stop = Arc::new(AtomicBool::new(false));
    let stop_clone = stop.clone();

    let _unlisten = app.listen("gateway-sse-disconnect", move |_| {
        stop_clone.store(true, Ordering::Relaxed);
    });

    // Spawn background task to read the SSE stream
    let app_clone = app.clone();
    tauri::async_runtime::spawn(async move {
        let mut stream = response.bytes_stream();
        let mut buffer = String::new();

        while let Some(chunk_result) = stream.next().await {
            if stop.load(Ordering::Relaxed) {
                break;
            }

            let chunk = match chunk_result {
                Ok(c) => c,
                Err(e) => {
                    log::error!("SSE stream read error: {}", e);
                    let _ = app_clone.emit("gateway-sse-error", e.to_string());
                    break;
                }
            };

            buffer.push_str(&String::from_utf8_lossy(&chunk));

            // Process complete lines (SSE frames end with \n\n or \n)
            while let Some(pos) = buffer.find('\n') {
                let line = buffer[..pos].trim_end_matches('\r').to_string();
                buffer = buffer[pos + 1..].to_string();

                if line.starts_with("data: ") {
                    let data = &line[6..];
                    let _ = app_clone.emit("gateway-sse-event", data.to_string());
                }
                // Skip empty lines, "event:" lines, and ": ping" comments
            }
        }

        log::info!("SSE stream ended");
        let _ = app_clone.emit("gateway-sse-error", "SSE stream ended".to_string());
    });

    Ok(())
}
