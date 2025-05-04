use tauri_specta::Builder;

pub mod database;
pub mod document;
pub mod record;

pub fn bind_types(builder: Builder) -> Builder {
    // TODO 把没有出现在 command 和 event 上出现的类型导出
    builder
        .typ::<document::Document>()
        .typ::<document::DocumentInfo>()
}
