use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Program {
    pub id: String,
    pub name: String,
    pub description: String,
    pub icon: String,
    pub path: String,
    pub category: String,
    pub tags: Vec<String>,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "lastRun")]
    pub last_run: Option<String>,
    pub favorite: Option<bool>,
    #[serde(rename = "pythonPath")]
    pub python_path: Option<String>,
    #[serde(rename = "envVars")]
    pub env_vars: Option<serde_json::Value>,
}

fn get_data_file_path(_app: &tauri::AppHandle) -> PathBuf {
    // 开发环境使用项目目录外的位置，避免触发 tauri dev 重建
    if cfg!(debug_assertions) {
        // 使用临时目录或用户目录，不在 src-tauri 内
        std::env::temp_dir()
            .join("fastlaunch")
            .join("programs.json")
    } else {
        dirs::data_local_dir()
            .unwrap()
            .join("FastLaunch")
            .join("programs.json")
    }
}

// 内部函数使用引用
fn load_programs_internal(app: &tauri::AppHandle) -> Result<Vec<Program>, String> {
    let path = get_data_file_path(app);

    if !path.exists() {
        // 返回空列表，首次运行
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(&path)
        .map_err(|e| format!("读取文件失败: {}", e))?;

    let programs: Vec<Program> = serde_json::from_str(&content)
        .map_err(|e| format!("解析 JSON 失败: {}", e))?;

    Ok(programs)
}

fn save_programs_internal(app: &tauri::AppHandle, programs: &Vec<Program>) -> Result<(), String> {
    let path = get_data_file_path(app);

    // 确保目录存在
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("创建目录失败: {}", e))?;
    }

    let content = serde_json::to_string_pretty(programs)
        .map_err(|e| format!("序列化失败: {}", e))?;

    fs::write(&path, content)
        .map_err(|e| format!("写入文件失败: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn load_programs(app: tauri::AppHandle) -> Result<Vec<Program>, String> {
    load_programs_internal(&app)
}

#[tauri::command]
pub fn save_programs(app: tauri::AppHandle, programs: Vec<Program>) -> Result<(), String> {
    save_programs_internal(&app, &programs)
}

#[tauri::command]
pub fn add_program(app: tauri::AppHandle, program: Program) -> Result<(), String> {
    let mut programs = load_programs_internal(&app)?;
    programs.push(program);
    save_programs_internal(&app, &programs)?;
    Ok(())
}

#[tauri::command]
pub fn delete_program(app: tauri::AppHandle, id: String) -> Result<(), String> {
    let mut programs = load_programs_internal(&app)?;
    programs.retain(|p| p.id != id);
    save_programs_internal(&app, &programs)?;
    Ok(())
}

#[tauri::command]
pub fn update_program(app: tauri::AppHandle, program: Program) -> Result<(), String> {
    let mut programs = load_programs_internal(&app)?;
    if let Some(pos) = programs.iter().position(|p| p.id == program.id) {
        programs[pos] = program;
    }
    save_programs_internal(&app, &programs)?;
    Ok(())
}