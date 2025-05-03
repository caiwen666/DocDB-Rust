use crate::config::UPLOADED_FILE_PATH;
pub async fn is_file_exists(md5: &str) -> bool {
    let path = format!("{}/{}.pdf", UPLOADED_FILE_PATH, md5);
    tokio::fs::try_exists(path)
        .await
        .expect("Failed to check file existence:")
}
