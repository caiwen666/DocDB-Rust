use crate::config::CWD;

#[tauri::command]
#[specta::specta]
/// 打开打包后的文件
/// 传递文件名
pub fn open_temp_file(target: String) {
    let mut cwd = CWD.clone();
    cwd.push("data");
    cwd.push("tmp");
    cwd.push(target);
    let _ = open::that(cwd);
}

#[tauri::command]
#[specta::specta]
/// 打开临时文件夹
pub fn open_temp_dir() {
    let mut cwd = CWD.clone();
    cwd.push("data");
    cwd.push("tmp");
    let _ = open::that(cwd);
}
