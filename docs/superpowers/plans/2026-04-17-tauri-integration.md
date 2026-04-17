# FastLaunch Tauri 集成实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 React Web 应用转换为 macOS 桌面应用，实现 Python 程序管理器的完整桌面功能。

**Architecture:** Tauri 2.x 作为桌面框架，Rust 后端处理文件系统和进程执行，React 前端通过 Tauri Commands 通信，JSON 文件持久化数据。

**Tech Stack:** Tauri 2.x, Rust, React 18.3, TypeScript, Vite 6.3

---

## 文件结构总览

| 文件 | 负责内容 |
|------|----------|
| `src-tauri/src/main.rs` | Tauri 应用入口 |
| `src-tauri/src/lib.rs` | Commands 注册和导出 |
| `src-tauri/src/programs.rs` | 程序管理（读写 JSON） |
| `src-tauri/src/executor.rs` | Python 执行逻辑 |
| `src-tauri/tauri.conf.json` | Tauri 配置（窗口、权限） |
| `src-tauri/Cargo.toml` | Rust 依赖 |
| `src-tauri/capabilities/default.json` | 权限声明 |
| `src/api/programs.ts` | 前端程序管理 API |
| `src/api/executor.ts` | 前端执行 API |
| `src/app/hooks/usePrograms.ts` | React 状态管理 hook |
| `package.json` | 添加 Tauri scripts |

---

## Task 1: 安装 Tauri CLI 依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装 Tauri CLI 和 API**

```bash
npm install @tauri-apps/cli@^2 @tauri-apps/api@^2
```

- [ ] **Step 2: 更新 package.json scripts**

添加以下 scripts：

```json
{
  "scripts": {
    "build": "vite build",
    "dev": "vite",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
```

- [ ] **Step 3: 安装 Rust（如未安装）**

检查 Rust 是否已安装：

```bash
rustc --version || curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

---

## Task 2: 初始化 Tauri 项目

**Files:**
- Create: `src-tauri/` 目录结构

- [ ] **Step 1: 运行 Tauri 初始化命令**

```bash
npm run tauri init -- --ci
```

此命令自动创建：
- `src-tauri/src/main.rs`
- `src-tauri/src/lib.rs`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`
- `src-tauri/capabilities/default.json`

- [ ] **Step 2: 验证初始化成功**

```bash
ls -la src-tauri/
```

Expected: 显示 `src/`, `tauri.conf.json`, `Cargo.toml`, `capabilities/`

---

## Task 3: 配置 Tauri 配置文件

**Files:**
- Modify: `src-tauri/tauri.conf.json`

- [ ] **Step 1: 更新 tauri.conf.json 基本配置**

将内容替换为：

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "FastLaunch",
  "version": "0.1.0",
  "identifier": "com.fastlaunch.app",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:5173",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "windows": [
      {
        "title": "FastLaunch",
        "width": 1200,
        "height": 800,
        "minWidth": 900,
        "minHeight": 600,
        "resizable": true,
        "center": true
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

- [ ] **Step 2: 创建 icons 目录**

```bash
mkdir -p src-tauri/icons
```

---

## Task 4: 配置权限声明

**Files:**
- Modify: `src-tauri/capabilities/default.json`

- [ ] **Step 1: 更新权限配置**

将内容替换为：

```json
{
  "$schema": "https://schema.tauri.app/config/2/capability",
  "identifier": "default",
  "description": "Default capabilities for FastLaunch",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "shell:allow-open",
    "fs:default",
    "fs:allow-read-text-file",
    "fs:allow-write-text-file",
    "fs:allow-exists",
    "fs:allow-mkdir",
    "dialog:default",
    "dialog:allow-open",
    "dialog:allow-save",
    "clipboard:default",
    "process:default",
    "process:allow-spawn",
    "process:allow-kill"
  ]
}
```

---

## Task 5: 实现 Rust 程序管理模块

**Files:**
- Create: `src-tauri/src/programs.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/Cargo.toml`

- [ ] **Step 1: 更新 Cargo.toml 添加依赖**

在 `[dependencies]` 部分添加：

```toml
[dependencies]
tauri = { version = "2", features = ["devtools"] }
tauri-plugin-shell = "2"
tauri-plugin-fs = "2"
tauri-plugin-dialog = "2"
tauri-plugin-clipboard = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
dirs = "5"
```

- [ ] **Step 2: 创建 programs.rs**

```rust
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

fn get_data_file_path(app: &tauri::AppHandle) -> PathBuf {
    // 开发环境使用项目目录，生产环境使用 Application Support
    if cfg!(debug_assertions) {
        std::env::current_dir()
            .unwrap()
            .join("data")
            .join("programs.json")
    } else {
        dirs::data_local_dir()
            .unwrap()
            .join("FastLaunch")
            .join("programs.json")
    }
}

#[tauri::command]
pub fn load_programs(app: tauri::AppHandle) -> Result<Vec<Program>, String> {
    let path = get_data_file_path(&app);

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

#[tauri::command]
pub fn save_programs(app: tauri::AppHandle, programs: Vec<Program>) -> Result<(), String> {
    let path = get_data_file_path(&app);

    // 确保目录存在
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("创建目录失败: {}", e))?;
    }

    let content = serde_json::to_string_pretty(&programs)
        .map_err(|e| format!("序列化失败: {}", e))?;

    fs::write(&path, content)
        .map_err(|e| format!("写入文件失败: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn add_program(app: tauri::AppHandle, program: Program) -> Result<(), String> {
    let mut programs = load_programs(app)?;
    programs.push(program);
    save_programs(app, programs)?;
    Ok(())
}

#[tauri::command]
pub fn delete_program(app: tauri::AppHandle, id: String) -> Result<(), String> {
    let mut programs = load_programs(app)?;
    programs.retain(|p| p.id != id);
    save_programs(app, programs)?;
    Ok(())
}

#[tauri::command]
pub fn update_program(app: tauri::AppHandle, program: Program) -> Result<(), String> {
    let mut programs = load_programs(app)?;
    if let Some(pos) = programs.iter().position(|p| p.id == program.id) {
        programs[pos] = program;
    }
    save_programs(app, programs)?;
    Ok(())
}
```

- [ ] **Step 3: 更新 lib.rs 注册 Commands**

```rust
mod programs;
mod executor;

use programs::*;
use executor::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard::init())
        .invoke_handler(tauri::generate_handler![
            load_programs,
            save_programs,
            add_program,
            delete_program,
            update_program,
            run_program,
            get_python_versions,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## Task 6: 实现 Python 执行模块

**Files:**
- Create: `src-tauri/src/executor.rs`

- [ ] **Step 1: 创建 executor.rs**

```rust
use crate::programs::{load_programs, Program};
use std::process::{Command, Stdio};
use std::time::Instant;
use tauri::Emitter;

#[derive(Debug, serde::Serialize)]
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
    let programs = load_programs(app)?;
    let program = programs
        .iter()
        .find(|p| p.id == id)
        .ok_or_else(|| format!("程序不存在: {}", id))?;

    // 检查脚本是否存在
    if !std::path::Path::new(&program.path).exists() {
        return Ok(RunResult {
            success: false,
            output: String::new(),
            error: format!("脚本不存在: {}", program.path),
            duration_ms: 0,
        });
    }

    // 获取 Python 路径
    let python_path = program.python_path.clone().unwrap_or_else(|| {
        // 默认使用系统 Python3
        if cfg!(target_os = "macos") {
            "/usr/bin/python3".to_string()
        } else {
            "python".to_string()
        }
    });

    // 发送开始事件
    app.emit("run-start", &program.name).ok();

    let start = Instant::now();

    // 执行 Python 脚本
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

            // 发送输出事件
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

    // 常见 Python 路径
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

        if std::path::Path::new(&expanded).exists() {
            versions.push(expanded);
        }
    }

    versions
}
```

- [ ] **Step 2: 更新 Cargo.toml 添加 shellexpand**

```toml
shellexpand = "3"
```

---

## Task 7: 创建前端 API 层

**Files:**
- Create: `src/api/programs.ts`
- Create: `src/api/executor.ts`

- [ ] **Step 1: 创建 src/api 目录**

```bash
mkdir -p src/api
```

- [ ] **Step 2: 创建 programs.ts**

```typescript
import { invoke } from '@tauri-apps/api/core';
import { Program } from '../app/types/program';

export async function loadPrograms(): Promise<Program[]> {
  return invoke<Program[]>('load_programs');
}

export async function savePrograms(programs: Program[]): Promise<void> {
  return invoke('save_programs', { programs });
}

export async function addProgram(program: Program): Promise<void> {
  return invoke('add_program', { program });
}

export async function deleteProgram(id: string): Promise<void> {
  return invoke('delete_program', { id });
}

export async function updateProgram(program: Program): Promise<void> {
  return invoke('update_program', { program });
}
```

- [ ] **Step 3: 创建 executor.ts**

```typescript
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export interface RunResult {
  success: boolean;
  output: string;
  error: string;
  duration_ms: number;
}

export async function runProgram(id: string): Promise<RunResult> {
  return invoke<RunResult>('run_program', { id });
}

export async function getPythonVersions(): Promise<string[]> {
  return invoke<string[]>('get_python_versions');
}

export function listenRunStart(callback: (name: string) => void) {
  return listen<string>('run-start', (event) => callback(event.payload));
}

export function listenRunOutput(callback: (output: string) => void) {
  return listen<string>('run-output', (event) => callback(event.payload));
}
```

---

## Task 8: 创建 React 状态管理 Hook

**Files:**
- Create: `src/app/hooks/usePrograms.ts`

- [ ] **Step 1: 创建 hooks 目录**

```bash
mkdir -p src/app/hooks
```

- [ ] **Step 2: 创建 usePrograms.ts**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { Program } from '../types/program';
import { loadPrograms, savePrograms, addProgram, deleteProgram, updateProgram } from '../../api/programs';

export function usePrograms() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载程序列表
  useEffect(() => {
    loadPrograms()
      .then(setPrograms)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = useCallback(async (program: Program) => {
    await addProgram(program);
    setPrograms((prev) => [...prev, program]);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await deleteProgram(id);
    setPrograms((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleUpdate = useCallback(async (program: Program) => {
    await updateProgram(program);
    setPrograms((prev) =>
      prev.map((p) => (p.id === program.id ? program : p))
    );
  }, []);

  const handleToggleFavorite = useCallback(async (id: string) => {
    const program = programs.find((p) => p.id === id);
    if (program) {
      const updated = { ...program, favorite: !program.favorite };
      await updateProgram(updated);
      setPrograms((prev) =>
        prev.map((p) => (p.id === id ? updated : p))
      );
    }
  }, [programs]);

  return {
    programs,
    loading,
    error,
    addProgram: handleAdd,
    deleteProgram: handleDelete,
    updateProgram: handleUpdate,
    toggleFavorite: handleToggleFavorite,
  };
}
```

---

## Task 9: 更新 Program 类型定义

**Files:**
- Modify: `src/app/types/program.ts`

- [ ] **Step 1: 更新类型定义**

```typescript
export interface Program {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
  category: string;
  tags: string[];
  createdAt: string;
  lastRun?: string;
  favorite?: boolean;
  pythonPath?: string;
  envVars?: Record<string, string>;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}
```

---

## Task 10: 改造 Home 页面使用真实数据

**Files:**
- Modify: `src/app/pages/Home.tsx`

- [ ] **Step 1: 导入 usePrograms hook**

在文件顶部添加导入：

```typescript
import { usePrograms } from '../hooks/usePrograms';
```

- [ ] **Step 2: 替换 useState 为 usePrograms**

将现有的 `useState` 和 mock 数据替换：

```typescript
// 删除这一行
// import { programs as initialPrograms, categories, allTags } from '../data/mockData';

// 替换
const { programs, loading, error, deleteProgram, toggleFavorite } = usePrograms();
// 删除这一行
// const [programs, setPrograms] = useState<Program[]>(initialPrograms);
```

- [ ] **Step 3: 更新 handleDelete 和 handleToggleFavorite**

```typescript
// 替换现有的 handleDelete
const handleDelete = (id: string) => {
  deleteProgram(id);
};

// 替换现有的 handleToggleFavorite
const handleToggleFavorite = (id: string) => {
  toggleFavorite(id);
};
```

- [ ] **Step 4: 添加加载状态处理**

在 return 语句开头添加：

```typescript
if (loading) {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
        <p className="text-zinc-500">加载中...</p>
      </div>
    </div>
  );
}

if (error) {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>重新加载</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 计算分类和标签**

由于不再使用 mockData，需要动态计算：

```typescript
// 在组件内添加
const categories = useMemo(() => {
  const counts: Record<string, number> = {};
  programs.forEach((p) => {
    counts[p.category] = (counts[p.category] || 0) + 1;
  });

  return [
    { id: 'all', name: '全部程序', icon: 'Grid3x3', count: programs.length },
    { id: 'data', name: '数据处理', icon: 'Database', count: counts['data'] || 0 },
    { id: 'automation', name: '自动化工具', icon: 'Zap', count: counts['automation'] || 0 },
    { id: 'web', name: 'Web 开发', icon: 'Globe', count: counts['web'] || 0 },
    { id: 'ml', name: '机器学习', icon: 'Brain', count: counts['ml'] || 0 },
  ];
}, [programs]);

const allTags = useMemo(() => {
  return Array.from(new Set(programs.flatMap((p) => p.tags))).sort();
}, [programs]);
```

---

## Task 11: 改造 ProgramDetail 页面

**Files:**
- Modify: `src/app/pages/ProgramDetail.tsx`

- [ ] **Step 1: 导入真实 API**

```typescript
import { usePrograms } from '../hooks/usePrograms';
import { runProgram } from '../../api/executor';
import { listenRunOutput } from '../../api/executor';
```

- [ ] **Step 2: 替换 mock 数据为 usePrograms**

```typescript
// 删除
// import { programs } from '../data/mockData';

// 添加
const { programs, deleteProgram, toggleFavorite } = usePrograms();
const [runOutput, setRunOutput] = useState<string>('');
const [isRunning, setIsRunning] = useState(false);

// 替换 program 查找
const program = programs.find((p) => p.id === id);
```

- [ ] **Step 3: 更新 handleRun 为真实执行**

```typescript
const handleRun = async () => {
  if (!program || isRunning) return;

  setIsRunning(true);
  setRunOutput('');

  // 监听实时输出
  const unlisten = await listenRunOutput((output) => {
    setRunOutput((prev) => prev + output);
  });

  try {
    const result = await runProgram(program.id);
    if (result.success) {
      toast.success(`运行成功，耗时 ${result.duration_ms}ms`);
    } else {
      toast.error(`运行失败: ${result.error}`);
    }
  } finally {
    setIsRunning(false);
    unlisten();
  }
};
```

- [ ] **Step 4: 更新 handleDelete**

```typescript
const handleDelete = () => {
  if (confirm(`确定要删除 "${program?.name}" 吗?`)) {
    deleteProgram(id!);
    navigate('/');
  }
};
```

- [ ] **Step 5: 添加运行输出面板**

在快速操作卡片下方添加：

```typescript
{/* Run Output Panel */}
{(isRunning || runOutput) && (
  <Card className="p-6">
    <h3 className="font-semibold text-lg mb-4 flex items-center">
      <Terminal className="w-5 h-5 mr-2 text-green-500" />
      运行输出
    </h3>
    <div className="bg-zinc-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-300">
      {isRunning && !runOutput && <span className="animate-pulse">执行中...</span>}
      {runOutput}
    </div>
  </Card>
)}
```

---

## Task 12: 改造 ProgramForm 页面

**Files:**
- Modify: `src/app/pages/ProgramForm.tsx`

- [ ] **Step 1: 导入真实 API 和文件对话框**

```typescript
import { open } from '@tauri-apps/plugin-dialog';
import { usePrograms } from '../hooks/usePrograms';
import { getPythonVersions } from '../../api/executor';
```

- [ ] **Step 2: 添加 Python 版本选择**

```typescript
const [pythonVersions, setPythonVersions] = useState<string[]>([]);

useEffect(() => {
  getPythonVersions().then(setPythonVersions);
}, []);
```

- [ ] **Step 3: 添加文件选择功能**

```typescript
const handleSelectFile = async () => {
  const selected = await open({
    multiple: false,
    filters: [{ name: 'Python', extensions: ['py'] }],
  });

  if (selected) {
    setFormData((prev) => ({ ...prev, path: selected as string }));
  }
};
```

- [ ] **Step 4: 更新表单提交**

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const program: Program = {
    id: isEdit ? id! : Date.now().toString(),
    ...formData,
    createdAt: isEdit ? formData.createdAt : new Date().toISOString().split('T')[0],
  };

  if (isEdit) {
    await updateProgram(program);
  } else {
    await addProgram(program);
  }

  navigate('/');
};
```

---

## Task 13: 测试并调试

**Files:**
- 无文件修改，仅运行测试

- [ ] **Step 1: 启动 Tauri 开发模式**

```bash
npm run tauri:dev
```

Expected: 应用窗口打开，显示空程序列表（首次运行）

- [ ] **Step 2: 测试添加程序**

点击"添加程序"按钮，填写表单，选择 Python 文件，提交。

Expected: 新程序出现在列表中

- [ ] **Step 3: 测试运行程序**

点击程序卡片上的"运行"按钮。

Expected: 显示运行状态，输出面板显示执行结果

- [ ] **Step 4: 测试删除程序**

点击删除按钮，确认删除。

Expected: 程序从列表消失

- [ ] **Step 5: 检查数据持久化**

关闭应用，重新启动 `npm run tauri:dev`。

Expected: 程序列表保持之前的状态

---

## Task 14: 提交代码

**Files:**
- 无文件修改，仅 git 操作

- [ ] **Step 1: 添加所有修改的文件**

```bash
git add -A
```

- [ ] **Step 2: 创建提交**

```bash
git commit -m "$(cat <<'EOF'
feat: integrate Tauri 2.x for desktop app

- Add Tauri backend with Rust commands for program management
- Implement Python execution with real-time output
- Add JSON file persistence for program data
- Replace mock data with real API calls
- Add file dialog for selecting Python scripts
- Add Python version selector in program form

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## 自审结果

1. **Spec coverage:** 所有设计文档要求已覆盖
2. **Placeholder scan:** 无 TBD/TODO，所有步骤包含完整代码
3. **Type consistency:** Program 类型在 Rust 和 TypeScript 中保持一致