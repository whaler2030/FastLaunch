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

    // Common Python paths to check (including conda/miniconda)
    let common_paths = vec![
        "/usr/bin/python3",
        "/usr/local/bin/python3",
        "/opt/homebrew/bin/python3",
        "/opt/homebrew/opt/python@3/bin/python3",
        // Conda/Miniconda paths
        "/opt/miniconda3/bin/python3",
        "/opt/miniconda/bin/python3",
        "/opt/anaconda3/bin/python3",
        "/opt/anaconda/bin/python3",
        // User-specific conda paths (expanded later)
        "~/opt/miniconda3/bin/python3",
        "~/opt/miniconda/bin/python3",
        "~/miniconda3/bin/python3",
        "~/miniconda/bin/python3",
        "~/anaconda3/bin/python3",
        "~/anaconda/bin/python3",
        // pyenv
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
            // Avoid duplicates
            if !versions.contains(&expanded) {
                versions.push(expanded);
            }
        }
    }

    // If no Python found, try to find via PATH environment
    if versions.is_empty() {
        // Try common names
        for name in &["python3", "python"] {
            if let Ok(output) = std::process::Command::new("which")
                .arg(name)
                .output()
            {
                if output.status.success() {
                    let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                    if !path.is_empty() && Path::new(&path).exists() && !versions.contains(&path) {
                        versions.push(path);
                    }
                }
            }
        }
    }

    versions
}

/// macOS: 打开目录（用 Finder）
#[tauri::command]
pub fn open_directory(path: String) -> Result<(), String> {
    let dir_path = if Path::new(&path).is_file() {
        // 如果是文件，获取其父目录
        path.rsplit_once('/')
            .map(|(dir, _)| dir)
            .unwrap_or(&path)
            .to_string()
    } else {
        path
    };

    let output = Command::new("/usr/bin/open")
        .arg(&dir_path)
        .output();

    match output {
        Ok(result) => {
            if result.status.success() {
                Ok(())
            } else {
                Err(String::from_utf8_lossy(&result.stderr).to_string())
            }
        }
        Err(e) => Err(format!("打开目录失败: {}", e)),
    }
}

/// macOS: 在 Terminal.app 中运行脚本
#[tauri::command]
pub fn run_in_terminal(script_path: String) -> Result<(), String> {
    // 使用 AppleScript 让 Terminal 实际执行脚本
    let script = format!(
        "tell application \"Terminal\" to do script \"python3 '{}'\"",
        script_path
    );

    let output = Command::new("/usr/bin/osascript")
        .arg("-e")
        .arg(&script)
        .output();

    match output {
        Ok(result) => {
            if result.status.success() {
                Ok(())
            } else {
                Err(String::from_utf8_lossy(&result.stderr).to_string())
            }
        }
        Err(e) => Err(format!("打开终端失败: {}", e)),
    }
}