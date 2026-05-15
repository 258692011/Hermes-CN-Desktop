// Native file/directory dialog commands + workspace helpers.
//
// Replaces the Electron ipcMain handlers for pickFiles, pickDirectory,
// createWorkspaceProject, and openWorkspacePath.

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

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

/// Open a native file picker dialog (multi-select).
#[tauri::command]
pub async fn pick_files(app: tauri::AppHandle) -> Result<FilePickerResult, String> {
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

    rx.await.map_err(|e| e.to_string())
}

/// Open a native directory picker dialog.
#[tauri::command]
pub async fn pick_directory(app: tauri::AppHandle) -> Result<FilePickerResult, String> {
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

    rx.await.map_err(|e| e.to_string())
}

/// Create a new project directory in the user's Documents folder.
/// Returns the path of the created directory.
#[tauri::command]
pub fn create_workspace_project() -> Result<FilePickerResult, String> {
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

    fs::create_dir_all(&path).map_err(|e| format!("Failed to create project dir: {}", e))?;

    Ok(FilePickerResult {
        canceled: false,
        paths: vec![path.to_string_lossy().to_string()],
    })
}

/// Open a path in the OS file manager (Finder/Explorer).
#[tauri::command]
pub async fn open_workspace_path(input: WorkspacePathInput) -> Result<SimpleApiResult, String> {
    let path = input.path.trim();
    if path.is_empty() {
        return Err("Empty path".to_string());
    }

    open::that(path).map_err(|e| format!("Failed to open path: {}", e))?;

    Ok(SimpleApiResult {
        ok: true,
        message: None,
    })
}
