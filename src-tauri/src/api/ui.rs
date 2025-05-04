use tauri::AppHandle;
use tauri_specta::Event;

use crate::event::ProgressEvent;

#[tauri::command]
#[specta::specta]
pub fn set_progress(handle: AppHandle, p: (isize, isize)) {
    ProgressEvent(p.0, p.1).emit(&handle).unwrap();
}
