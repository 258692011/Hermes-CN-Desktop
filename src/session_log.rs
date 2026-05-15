// Session log file reading.
//
// Replaces the /__hermes_session_log/ route handler in
// hermes-cn-ui-v1/apps/desktop/src/main/main.ts lines 507-529.
//
// Returns the raw session log JSON — the frontend's existing
// sessionLogToMessages() handles the transform to avoid duplicating logic.

use std::fs;
use std::path::Path;

/// Read a session log file and return the raw JSON content.
/// Returns (status_code, json_body).
pub fn handle_session_log_request(
    session_id: &str,
    hermes_home: &str,
) -> (u16, serde_json::Value) {
    // Validate session ID (alphanumeric + underscore + dash only)
    if !session_id
        .chars()
        .all(|c| c.is_alphanumeric() || c == '_' || c == '-')
    {
        return (
            400,
            serde_json::json!({ "message": "invalid session id" }),
        );
    }

    let log_path = Path::new(hermes_home)
        .join("sessions")
        .join(format!("session_{}.json", session_id));

    match fs::read_to_string(&log_path) {
        Ok(content) => {
            match serde_json::from_str::<serde_json::Value>(&content) {
                Ok(log_data) => (
                    200,
                    serde_json::json!({
                        "session_id": session_id,
                        "raw_log": log_data,
                    }),
                ),
                Err(_) => (
                    500,
                    serde_json::json!({ "message": "failed to parse session log" }),
                ),
            }
        }
        Err(_) => (
            404,
            serde_json::json!({ "message": "session log not found" }),
        ),
    }
}
