use std::fs;
use std::path::PathBuf;
use base64::{Engine as _, engine::general_purpose};

fn get_icons_dir_path(_app: &tauri::AppHandle) -> PathBuf {
    if cfg!(debug_assertions) {
        std::env::temp_dir().join("fastlaunch").join("icons")
    } else {
        dirs::data_local_dir()
            .unwrap()
            .join("FastLaunch")
            .join("icons")
    }
}

#[tauri::command]
pub fn save_custom_icon(
    app: tauri::AppHandle,
    program_id: String,
    source_path: String,
) -> Result<String, String> {
    let icons_dir = get_icons_dir_path(&app);
    fs::create_dir_all(&icons_dir)
        .map_err(|e| format!("创建目录失败: {}", e))?;

    let source = PathBuf::from(&source_path);
    let ext = source
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("png");

    let target_path = icons_dir.join(format!("{}.{}", program_id, ext));

    fs::copy(&source, &target_path)
        .map_err(|e| format!("复制文件失败: {}", e))?;

    // 返回带有协议标识的路径，前端会处理
    Ok(format!("icon://{}.{}", program_id, ext))
}

#[tauri::command]
pub fn get_icon_base64(app: tauri::AppHandle, icon_ref: String) -> Result<String, String> {
    let icons_dir = get_icons_dir_path(&app);

    // icon_ref format: "icon://program_id.ext"
    let clean_ref = icon_ref.replace("icon://", "");

    let icon_path = icons_dir.join(&clean_ref);

    if !icon_path.exists() {
        return Err("图标文件不存在".to_string());
    }

    let bytes = fs::read(&icon_path)
        .map_err(|e| format!("读取文件失败: {}", e))?;

    let ext = icon_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("png");

    let mime_type = match ext {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "svg" => "image/svg+xml",
        "webp" => "image/webp",
        "gif" => "image/gif",
        _ => "image/png",
    };

    let base64_str = general_purpose::STANDARD.encode(&bytes);
    Ok(format!("data:{};base64,{}", mime_type, base64_str))
}

#[tauri::command]
pub fn delete_custom_icon(app: tauri::AppHandle, program_id: String) -> Result<(), String> {
    let icons_dir = get_icons_dir_path(&app);

    for ext in &["png", "jpg", "jpeg", "svg", "webp", "gif"] {
        let icon_path = icons_dir.join(format!("{}.{}", program_id, ext));
        if icon_path.exists() {
            fs::remove_file(&icon_path)
                .map_err(|e| format!("删除文件失败: {}", e))?;
        }
    }
    Ok(())
}