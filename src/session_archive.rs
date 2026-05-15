// Session archive state management.
//
// Replaces the archive logic in hermes-cn-ui-v1/apps/desktop/src/main/main.ts
// lines 289-411. Manages a local JSON file that tracks which sessions are
// "archived" (hidden from the session list but not deleted from the backend).

use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};

const SESSION_ARCHIVE_STATE_FILE: &str = "session-ui-state.json";

#[derive(Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ArchiveState {
    #[serde(default)]
    archived_sessions: Vec<String>,
}

fn archive_state_path(hermes_home: &str) -> PathBuf {
    Path::new(hermes_home).join(SESSION_ARCHIVE_STATE_FILE)
}

fn normalize_ids(ids: &[String]) -> Vec<String> {
    let mut seen = HashSet::new();
    ids.iter()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty() && seen.insert(s.clone()))
        .collect()
}

pub fn read_archive_state(hermes_home: &str) -> HashSet<String> {
    let path = archive_state_path(hermes_home);
    let content = match fs::read_to_string(&path) {
        Ok(c) => c,
        Err(_) => return HashSet::new(),
    };
    let state: ArchiveState = serde_json::from_str(&content).unwrap_or_default();
    normalize_ids(&state.archived_sessions).into_iter().collect()
}

pub fn write_archive_state(hermes_home: &str, ids: &HashSet<String>) -> Result<(), String> {
    let path = archive_state_path(hermes_home);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let state = ArchiveState {
        archived_sessions: normalize_ids(&ids.iter().cloned().collect::<Vec<_>>()),
    };
    let json = serde_json::to_string_pretty(&state).map_err(|e| e.to_string())?;
    fs::write(&path, format!("{}\n", json)).map_err(|e| e.to_string())
}

/// Check if a path matches /api/sessions/{id}/archive and extract the session ID.
pub fn extract_archive_session_id(path: &str) -> Option<String> {
    let re = regex::Regex::new(r"^/api/sessions/([^/]+)/archive$").ok()?;
    let url_path = if let Ok(url) = url::Url::parse(&format!("http://x{}", path)) {
        url.path().to_string()
    } else {
        path.to_string()
    };
    let caps = re.captures(&url_path)?;
    let raw = caps.get(1)?.as_str().to_string();
    let decoded = urlencoding::decode(&raw).ok()?.into_owned();
    let trimmed = decoded.trim().to_string();
    if trimmed.is_empty() { None } else { Some(trimmed) }
}

/// Handle a POST/PUT/DELETE request to /api/sessions/{id}/archive.
/// Returns a JSON response body, or None if the path doesn't match.
pub fn handle_archive_request(
    path: &str,
    method: &str,
    hermes_home: &str,
) -> Option<(u16, serde_json::Value)> {
    let session_id = extract_archive_session_id(path)?;
    let upper = method.to_uppercase();

    if !["POST", "PUT", "DELETE"].contains(&upper.as_str()) {
        return Some((
            405,
            serde_json::json!({ "message": "method not allowed" }),
        ));
    }

    let mut archived = read_archive_state(hermes_home);
    if upper == "DELETE" {
        archived.remove(&session_id);
    } else {
        archived.insert(session_id.clone());
    }

    if let Err(e) = write_archive_state(hermes_home, &archived) {
        return Some((500, serde_json::json!({ "error": e })));
    }

    Some((
        200,
        serde_json::json!({
            "ok": true,
            "session_id": session_id,
            "archived": upper != "DELETE",
        }),
    ))
}

/// Filter archived sessions from a /api/sessions or /api/sessions/search response.
pub fn filter_archived_from_response(
    path: &str,
    method: &str,
    hermes_home: &str,
    body: &str,
) -> String {
    if method.to_uppercase() != "GET" {
        return body.to_string();
    }

    let url_path = if let Ok(url) = url::Url::parse(&format!("http://x{}", path)) {
        // Check for include_archived=true query param
        if url.query_pairs().any(|(k, v)| k == "include_archived" && v == "true") {
            return body.to_string();
        }
        url.path().to_string()
    } else {
        return body.to_string();
    };

    let is_sessions = url_path == "/api/sessions";
    let is_search = url_path == "/api/sessions/search";
    if !is_sessions && !is_search {
        return body.to_string();
    }

    let archived = read_archive_state(hermes_home);
    if archived.is_empty() {
        return body.to_string();
    }

    let mut data: serde_json::Value = match serde_json::from_str(body) {
        Ok(d) => d,
        Err(_) => return body.to_string(),
    };

    if is_sessions {
        if let Some(sessions) = data.get_mut("sessions").and_then(|s| s.as_array_mut()) {
            let before = sessions.len();
            sessions.retain(|s| {
                s.get("id")
                    .and_then(|id| id.as_str())
                    .map(|id| !archived.contains(id))
                    .unwrap_or(true)
            });
            let removed = before - sessions.len();
            if removed > 0 {
                if let Some(total) = data.get_mut("total").and_then(|t| t.as_i64()) {
                    data["total"] = serde_json::json!(std::cmp::max(0, total - removed as i64));
                }
            }
        }
    }

    if is_search {
        if let Some(results) = data.get_mut("results").and_then(|r| r.as_array_mut()) {
            results.retain(|r| {
                r.get("session_id")
                    .and_then(|id| id.as_str())
                    .map(|id| !archived.contains(id))
                    .unwrap_or(true)
            });
        }
    }

    serde_json::to_string(&data).unwrap_or_else(|_| body.to_string())
}
