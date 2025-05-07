use crate::config::{config, save_config};

#[tauri::command]
#[specta::specta]
pub async fn set_watermark(enable: bool) {
    let mut config = config().await.write().await;
    config.watermark = enable;
    drop(config);
    save_config().await;
}

#[tauri::command]
#[specta::specta]
pub async fn get_watermark() -> bool {
    let config = config().await.read().await;
    config.watermark
}

#[tauri::command]
#[specta::specta]
pub async fn get_server_info() -> (String, String) {
    let config = config().await.read().await;
    (config.remote.clone(), config.token.clone())
}

#[tauri::command]
#[specta::specta]
pub async fn set_server_info(remote: String, token: String) {
    let mut config = config().await.write().await;
    config.remote = remote;
    config.token = token;
    drop(config);
    save_config().await;
}
