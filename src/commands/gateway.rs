// Gateway and runtime config commands.
//
// get_runtime_config: returns the full runtime config to the frontend on startup.
// refresh_gateway_url: re-fetches the session token and rebuilds the gateway URL.

use serde::Serialize;
use tauri::State;

use crate::process::dashboard::{build_gateway_url, fetch_session_token};
use crate::state::AppState;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeConfig {
    pub api_base_url: String,
    pub gateway_url: String,
    pub session_token: Option<String>,
    pub current_profile: String,
    pub transport: String,
}

/// Returns the runtime configuration to the frontend for initialization.
/// Replaces the Electron preload's synchronous injection of window.__HERMES_RUNTIME__.
#[tauri::command]
pub fn get_runtime_config(state: State<'_, AppState>) -> Result<RuntimeConfig, String> {
    let inner = state.inner.lock().map_err(|e| e.to_string())?;
    let transport = std::env::var("HERMES_DESKTOP_TRANSPORT")
        .unwrap_or_else(|_| "sse".to_string());
    Ok(RuntimeConfig {
        api_base_url: inner.api_base_url.clone(),
        gateway_url: inner.gateway_url.clone(),
        session_token: inner.session_token.clone(),
        current_profile: inner.current_profile.clone(),
        transport,
    })
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RefreshGatewayResult {
    pub gateway_url: String,
    pub session_token: Option<String>,
}

/// Re-fetch the session token from the dashboard and return a fresh gateway URL.
#[tauri::command]
pub async fn refresh_gateway_url(
    state: State<'_, AppState>,
) -> Result<RefreshGatewayResult, String> {
    let api_base_url = {
        let inner = state.inner.lock().map_err(|e| e.to_string())?;
        inner.api_base_url.clone()
    };

    let env_token = std::env::var("HERMES_DESKTOP_SESSION_TOKEN").ok();
    let fresh_token = match env_token {
        Some(t) => Some(t),
        None => fetch_session_token(&api_base_url).await,
    };

    let fresh_url = build_gateway_url(&api_base_url, fresh_token.as_deref());

    // Update state
    {
        let mut inner = state.inner.lock().map_err(|e| e.to_string())?;
        inner.gateway_url = fresh_url.clone();
        inner.session_token = fresh_token.clone();
    }

    Ok(RefreshGatewayResult {
        gateway_url: fresh_url,
        session_token: fresh_token,
    })
}
