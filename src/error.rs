// Domain error types for the Tauri backend.
//
// Replaces the `Result<T, String>` pattern with typed errors that:
// - Give each failure a clear category for frontend handling
// - Implement Serialize so Tauri can return them to the renderer
// - Implement Display via thiserror for human-readable messages

use serde::Serialize;

#[derive(Debug, Clone, thiserror::Error)]
pub enum AppError {
    // --- Dashboard process ---
    #[error("Dashboard startup failed: {0}")]
    DashboardStartup(String),

    #[error("Dashboard not reachable at {0}")]
    DashboardUnreachable(String),

    #[error("Dashboard probe failed: {0}")]
    DashboardProbe(String),

    // --- Gateway / SSE ---
    #[error("SSE connection failed: {0}")]
    SseConnect(String),

    #[error("SSE stream error: {0}")]
    SseStream(String),

    // --- Runtime management ---
    #[error("Runtime update manifest not configured")]
    RuntimeManifestNotConfigured,

    #[error("Runtime update check failed: {0}")]
    RuntimeCheckFailed(String),

    #[error("Runtime download failed: {0}")]
    RuntimeDownloadFailed(String),

    #[error("Runtime signature verification failed: {0}")]
    RuntimeSignatureInvalid(String),

    #[error("Runtime SHA-256 mismatch: expected {expected}, got {actual}")]
    RuntimeChecksumMismatch { expected: String, actual: String },

    #[error("Runtime extraction failed: {0}")]
    RuntimeExtractFailed(String),

    #[error("Runtime smoke check failed: {0}")]
    RuntimeSmokeFailed(String),

    #[error("Runtime install failed: {0}")]
    RuntimeInstallFailed(String),

    #[error("No previous runtime version to rollback to")]
    RuntimeNoPreviousVersion,

    // --- Profile ---
    #[error("Invalid profile name: {0}")]
    ProfileInvalidName(String),

    #[error("Profile directory missing: {0}")]
    ProfileDirMissing(String),

    #[error("Profile switch already in progress")]
    ProfileSwitchInFlight,

    #[error("Desktop is not the dashboard owner")]
    ProfileNotOwner,

    #[error("Profile switch failed: {0}")]
    ProfileSwitchFailed(String),

    // --- API proxy ---
    #[error("Invalid API request: {0}")]
    InvalidRequest(String),

    #[error("API proxy error: {0}")]
    ProxyError(String),

    #[error("Request outside allowed origin: {0}")]
    OriginViolation(String),

    // --- File operations ---
    #[error("File operation failed: {0}")]
    FileError(String),

    // --- State ---
    #[error("App state lock poisoned")]
    StateLockPoisoned,

    #[error("Desktop runtime not ready")]
    NotReady,

    // --- Generic (escape hatch for truly unexpected errors) ---
    #[error("{0}")]
    Internal(String),
}

// Tauri requires Serialize to return errors to the frontend.
// We serialize as the Display string — the frontend sees a human-readable message.
impl Serialize for AppError {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.to_string())
    }
}

// Convenience: convert any std::sync::PoisonError into AppError
impl<T> From<std::sync::PoisonError<T>> for AppError {
    fn from(_: std::sync::PoisonError<T>) -> Self {
        AppError::StateLockPoisoned
    }
}

// Convenience: convert reqwest errors
impl From<reqwest::Error> for AppError {
    fn from(e: reqwest::Error) -> Self {
        if e.is_timeout() {
            AppError::ProxyError(format!("Request timed out: {}", e))
        } else if e.is_connect() {
            AppError::DashboardUnreachable(e.to_string())
        } else {
            AppError::ProxyError(e.to_string())
        }
    }
}

// Convenience: convert IO errors
impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        AppError::FileError(e.to_string())
    }
}

// Convenience: convert URL parse errors
impl From<url::ParseError> for AppError {
    fn from(e: url::ParseError) -> Self {
        AppError::InvalidRequest(e.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;
