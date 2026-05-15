use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

use crate::error::{AppError, AppResult};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FilePickerResult {
    pub canceled: bool,
    pub paths: Vec<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspacePathInput {
    pub path: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SimpleApiResult {
    pub ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}

#[tauri::command]
pub async fn pick_files(app: tauri::AppHandle) -> AppResult<FilePickerResult> {
    use tauri_plugin_dialog::DialogExt;

    let (tx, rx) = tokio::sync::oneshot::channel();

    app.dialog()
        .file()
        .set_title("选择附件")
        .pick_files(move |paths| {
            let result = match paths {
                Some(file_paths) => FilePickerResult {
                    canceled: false,
                    paths: file_paths
                        .iter()
                        .filter_map(|p| p.as_path().map(|pp| pp.to_string_lossy().to_string()))
                        .collect(),
                },
                None => FilePickerResult {
                    canceled: true,
                    paths: vec![],
                },
            };
            let _ = tx.send(result);
        });

    rx.await.map_err(|e| AppError::Internal(e.to_string()))
}

#[tauri::command]
pub async fn pick_directory(app: tauri::AppHandle) -> AppResult<FilePickerResult> {
    use tauri_plugin_dialog::DialogExt;

    let (tx, rx) = tokio::sync::oneshot::channel();

    app.dialog()
        .file()
        .set_title("选择工作区")
        .pick_folders(move |paths| {
            let result = match paths {
                Some(dir_paths) => FilePickerResult {
                    canceled: false,
                    paths: dir_paths
                        .iter()
                        .filter_map(|p| p.as_path().map(|pp| pp.to_string_lossy().to_string()))
                        .collect(),
                },
                None => FilePickerResult {
                    canceled: true,
                    paths: vec![],
                },
            };
            let _ = tx.send(result);
        });

    rx.await.map_err(|e| AppError::Internal(e.to_string()))
}

#[tauri::command]
pub fn create_workspace_project() -> AppResult<FilePickerResult> {
    let documents = dirs::document_dir()
        .or_else(dirs::home_dir)
        .unwrap_or_else(|| PathBuf::from("."));

    let base_name = "NewProject";
    let mut path = documents.join(base_name);

    for i in 0..100 {
        if i > 0 {
            path = documents.join(format!("{} {}", base_name, i + 1));
        }
        if !path.exists() {
            break;
        }
    }

    if path.exists() {
        path = documents.join(format!(
            "{} {}",
            base_name,
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis()
        ));
    }

    fs::create_dir_all(&path)?;

    Ok(FilePickerResult {
        canceled: false,
        paths: vec![path.to_string_lossy().to_string()],
    })
}

#[tauri::command]
pub async fn open_workspace_path(input: WorkspacePathInput) -> AppResult<SimpleApiResult> {
    let path = input.path.trim();
    if path.is_empty() {
        return Err(AppError::InvalidRequest("Empty path".to_string()));
    }

    open::that(path).map_err(|e| AppError::FileError(format!("Failed to open: {}", e)))?;

    Ok(SimpleApiResult {
        ok: true,
        message: None,
    })
}
