mod api;
mod client;
mod config;
mod database;
mod document;
mod event;
mod test;
mod utils;

use crate::config::check_database_update;
use crate::event::ProgressEvent;
use specta_typescript::BigIntExportBehavior;
use specta_typescript::Typescript;
use src_shared::types::bind_types;
use std::thread;
use tauri_specta::{collect_commands, collect_events, Builder};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = Builder::<tauri::Wry>::new()
        .commands(collect_commands![
            database::get_database_summary,
            document::search_document,
            document::open_document,
            document::get_document_by_md5,
            document::fetch_document,
            document::delete_document,
            document::update_document,
            document::add_document,
            document::touch_document,
            utils::file::parse_pdf,
            api::common::open_temp_file,
            api::common::open_temp_dir,
            api::ui::set_progress,
            database::update_database,
        ])
        .events(collect_events![ProgressEvent]);

    let builder = bind_types(builder);

    #[cfg(debug_assertions)]
    builder
        .export(
            Typescript::default().bigint(BigIntExportBehavior::Number),
            "./src/bindings.ts",
        )
        .expect("Failed to export typescript bindings!");

    thread::spawn(check_database_update);

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            database::get_database_summary,
            document::search_document,
            document::open_document,
            document::get_document_by_md5,
            document::delete_document,
            document::update_document,
            document::fetch_document,
            document::add_document,
            document::touch_document,
            utils::file::parse_pdf,
            api::common::open_temp_file,
            api::common::open_temp_dir,
            api::ui::set_progress,
            database::update_database,
        ])
        .setup(move |app| {
            builder.mount_events(app);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
