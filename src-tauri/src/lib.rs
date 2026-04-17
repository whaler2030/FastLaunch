mod programs;
mod executor;
mod categories;
mod icons;

use programs::*;
use executor::*;
use categories::*;
use icons::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            load_programs,
            save_programs,
            add_program,
            delete_program,
            update_program,
            run_program,
            get_python_versions,
            open_directory,
            run_in_terminal,
            load_categories,
            save_categories,
            add_category,
            update_category,
            delete_category,
            save_custom_icon,
            delete_custom_icon,
            get_icon_base64,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}