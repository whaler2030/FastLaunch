use crate::programs::load_programs;
use serde::Serialize;
use std::path::Path;
use std::process::{Command, Stdio};
use std::time::Instant;
use tauri::Emitter;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RunResult {
    pub success: bool,
    pub output: String,
    pub error: String,
    pub duration_ms: u64,
}

#[tauri::command]
pub async fn run_program(
    app: tauri::AppHandle,
    id: String,
) -> Result<RunResult, String> {
    // Load programs to find the target
    let programs = load_programs(app.clone())?;
    let program = programs
        .iter()
        .find(|p| p.id == id)
        .ok_or_else(|| format!("程序不存在: {}", id))?;

    // Check if script exists
    if !Path::new(&program.path).exists() {
        return Ok(RunResult {
            success: false,
            output: String::new(),
            error: format!("脚本不存在: {}", program.path),
            duration_ms: 0,
        });
    }

    // Get Python path (default to system python3 on macOS)
    let python_path = program.python_path.clone().unwrap_or_else(|| {
        if cfg!(target_os = "macos") {
            "/usr/bin/python3".to_string()
        } else {
            "python".to_string()
        }
    });

    // Emit start event
    app.emit("run-start", &program.name).ok();

    let start = Instant::now();

    // Execute Python script
    let output = Command::new(&python_path)
        .arg(&program.path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output();

    let duration_ms = start.elapsed().as_millis() as u64;

    match output {
        Ok(result) => {
            let stdout = String::from_utf8_lossy(&result.stdout).to_string();
            let stderr = String::from_utf8_lossy(&result.stderr).to_string();

            // Emit output event
            app.emit("run-output", &stdout).ok();

            Ok(RunResult {
                success: result.status.success(),
                output: stdout,
                error: stderr,
                duration_ms,
            })
        }
        Err(e) => Ok(RunResult {
            success: false,
            output: String::new(),
            error: format!("执行失败: {}", e),
            duration_ms: 0,
        }),
    }
}

#[tauri::command]
pub fn get_python_versions() -> Vec<String> {
    let mut versions = Vec::new();

    // Common Python paths to check
    let common_paths = vec![
        "/usr/bin/python3",
        "/usr/local/bin/python3",
        "/opt/homebrew/bin/python3",
        "~/.pyenv/shims/python",
        "~/.pyenv/shims/python3",
    ];

    for path in common_paths {
        let expanded = if path.starts_with('~') {
            shellexpand::tilde(&path).to_string()
        } else {
            path.to_string()
        };

        if Path::new(&expanded).exists() {
            versions.push(expanded);
        }
    }

    versions
}