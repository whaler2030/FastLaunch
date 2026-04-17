use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Category {
    pub id: String,
    pub name: String,
    pub icon: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sort_order: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<String>,
}

fn get_categories_file_path(_app: &tauri::AppHandle) -> PathBuf {
    if cfg!(debug_assertions) {
        std::env::temp_dir()
            .join("fastlaunch")
            .join("categories.json")
    } else {
        dirs::data_local_dir()
            .unwrap()
            .join("FastLaunch")
            .join("categories.json")
    }
}

fn get_default_categories() -> Vec<Category> {
    vec![
        Category {
            id: "data".to_string(),
            name: "数据处理".to_string(),
            icon: "Database".to_string(),
            sort_order: Some(1),
            created_at: Some("2026-01-01".to_string()),
            ..Default::default()
        },
        Category {
            id: "automation".to_string(),
            name: "自动化工具".to_string(),
            icon: "Zap".to_string(),
            sort_order: Some(2),
            created_at: Some("2026-01-01".to_string()),
            ..Default::default()
        },
        Category {
            id: "web".to_string(),
            name: "Web 开发".to_string(),
            icon: "Globe".to_string(),
            sort_order: Some(3),
            created_at: Some("2026-01-01".to_string()),
            ..Default::default()
        },
        Category {
            id: "ml".to_string(),
            name: "机器学习".to_string(),
            icon: "Brain".to_string(),
            sort_order: Some(4),
            created_at: Some("2026-01-01".to_string()),
            ..Default::default()
        },
    ]
}

fn load_categories_internal(app: &tauri::AppHandle) -> Result<Vec<Category>, String> {
    let path = get_categories_file_path(app);
    if !path.exists() {
        return Ok(get_default_categories());
    }
    let content = fs::read_to_string(&path)
        .map_err(|e| format!("读取文件失败: {}", e))?;
    let categories: Vec<Category> = serde_json::from_str(&content)
        .map_err(|e| format!("解析 JSON 失败: {}", e))?;
    Ok(categories)
}

fn save_categories_internal(app: &tauri::AppHandle, categories: &[Category]) -> Result<(), String> {
    let path = get_categories_file_path(app);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("创建目录失败: {}", e))?;
    }
    let content = serde_json::to_string_pretty(categories)
        .map_err(|e| format!("序列化失败: {}", e))?;
    fs::write(&path, content)
        .map_err(|e| format!("写入文件失败: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn load_categories(app: tauri::AppHandle) -> Result<Vec<Category>, String> {
    load_categories_internal(&app)
}

#[tauri::command]
pub fn save_categories(app: tauri::AppHandle, categories: Vec<Category>) -> Result<(), String> {
    save_categories_internal(&app, &categories)
}

#[tauri::command]
pub fn add_category(app: tauri::AppHandle, category: Category) -> Result<(), String> {
    let mut categories = load_categories_internal(&app)?;

    // 检查 ID 是否已存在
    if categories.iter().any(|c| c.id == category.id) {
        return Err("分类 ID 已存在".to_string());
    }

    categories.push(category);
    save_categories_internal(&app, &categories)?;
    Ok(())
}

#[tauri::command]
pub fn update_category(app: tauri::AppHandle, category: Category) -> Result<(), String> {
    let mut categories = load_categories_internal(&app)?;
    if let Some(pos) = categories.iter().position(|c| c.id == category.id) {
        categories[pos] = category;
        save_categories_internal(&app, &categories)?;
        Ok(())
    } else {
        Err("分类不存在".to_string())
    }
}

#[tauri::command]
pub fn delete_category(app: tauri::AppHandle, id: String) -> Result<(), String> {
    let mut categories = load_categories_internal(&app)?;
    let original_len = categories.len();
    categories.retain(|c| c.id != id);

    if categories.len() == original_len {
        return Err("分类不存在".to_string());
    }

    save_categories_internal(&app, &categories)?;
    Ok(())
}