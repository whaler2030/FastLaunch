---
name: FastLaunch Tauri Integration
description: 将 React Web 应用转换为 macOS 桌面应用，集成 Tauri 2.x 实现文件系统操作、Python 脚本执行和数据持久化
type: project
---

# FastLaunch Tauri 集成设计

## 背景

FastLaunch 是一个 Python 程序管理器，目前为 React + Vite Web 应用，使用 mock 数据。需要集成 Tauri 2.x 转换为 macOS 桌面应用，实现：
- 真实的文件系统操作
- Python 脚本执行
- JSON 文件数据持久化

## 技术决策

| 决策项 | 选择 | 原因 |
|--------|------|------|
| 桌面框架 | Tauri 2.x | 轻量、安全、Rust 后端性能好 |
| 数据持久化 | JSON 文件 | 简单直接，适合程序列表这种扁平数据 |
| Python 执行 | 直接调用解释器 | 简单可靠，用户可指定 Python 路径 |
| 窗口模式 | 单窗口 | 类似 Finder，所有操作在主窗口完成 |

---

## 1. 项目结构

```
fastlaunch/
├── src/                      # React 前端（现有）
├── src-tauri/               # Tauri Rust 后端（新增）
│   ├── src/
│   │   ├── main.rs          # 入口，Tauri 配置
│   │   ├── lib.rs           # Commands 定义
│   │   ├── programs.rs      # 程序管理逻辑
│   │   └── executor.rs      # Python 执行逻辑
│   ├── tauri.conf.json      # Tauri 配置
│   ├── Cargo.toml           # Rust 依赖
│   └── capabilities/        # 权限配置
│       └── default.json
├── data/                    # 应用数据目录（开发模式）
│   └── programs.json        # 程序列表
└── package.json             # 更新 npm scripts
```

---

## 2. 数据模型与持久化

### 数据文件位置

- **生产环境**: `~/Library/Application Support/FastLaunch/programs.json`
- **开发环境**: 项目根目录 `data/programs.json`

### Program 数据结构

```typescript
interface Program {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;                    // Python 脚本绝对路径
  category: string;
  tags: string[];
  createdAt: string;
  lastRun?: string;
  favorite?: boolean;
  pythonPath?: string;             // 新增：可选的 Python 解释器路径
  envVars?: Record<string, string>; // 新增：环境变量
}
```

### Rust Commands

| Command | 功能 |
|---------|------|
| `load_programs()` | 从 JSON 文件读取程序列表 |
| `save_programs(programs)` | 保存到 JSON 文件 |
| `add_program(program)` | 添加新程序 |
| `delete_program(id)` | 删除程序 |
| `update_program(program)` | 更新程序信息 |

---

## 3. Python 执行逻辑

### 执行流程

```
前端调用 run_program(id)
    ↓
Rust 加载程序配置，获取脚本路径和 Python 路径
    ↓
创建子进程执行: python <script_path>
    ↓
捕获 stdout/stderr，通过事件流实时推送
    ↓
执行完成，返回结果（成功/失败、输出、耗时）
```

### Rust Commands

| Command | 功能 |
|---------|------|
| `run_program(id)` | 执行程序，返回运行结果 |
| `get_python_versions()` | 扫描系统可用的 Python 解释器 |

### 实时反馈

- 使用 Tauri `emit()` 推送运行状态事件
- 前端监听 `run-output` 事件显示实时日志
- 运行完成后 toast 提示

### 错误处理

| 场景 | 处理方式 |
|------|----------|
| Python 不存在 | 提示安装或选择解释器 |
| 脚本不存在 | 提示检查路径 |
| 执行失败 | 显示 stderr 内容 |

---

## 4. 前端改造

### 改动点

1. **替换 mockData**
   - 删除 `src/app/data/mockData.ts`
   - 从 Tauri 后端获取真实数据

2. **新增 API 层**
   - `src/api/programs.ts` — 程序管理 Tauri invoke
   - `src/api/executor.ts` — 执行相关 Tauri invoke

3. **UI 增强**
   - `ProgramCard` 添加运行状态指示器
   - `ProgramDetail` 添加实时输出面板

4. **表单增强**
   - `ProgramForm` 添加 Python 解释器选择
   - 添加环境变量配置输入

### 保持不变

- 路由结构
- UI 组件库 (Shadcn)
- 整体布局和样式

---

## 5. Tauri 窗口与权限配置

### 窗口配置

```json
{
  "windows": [{
    "title": "FastLaunch",
    "width": 1200,
    "height": 800,
    "minWidth": 900,
    "minHeight": 600,
    "resizable": true,
    "center": true
  }]
}
```

### 权限配置

| 权限 | 用途 |
|------|------|
| `fs:default` | 文件系统读写（JSON 存储） |
| `process:default` | 进程执行（运行 Python） |
| `dialog:default` | 文件选择对话框 |
| `shell:allow-open` | 打开外部应用 |
| `clipboard:default` | 复制路径到剪贴板 |

### 应用标识

- Bundle ID: `com.fastlaunch.app`
- 应用名称: `FastLaunch`
- 版本: `0.1.0`

---

## 6. 实现步骤概要

1. 安装 Tauri CLI 和依赖
2. 初始化 `src-tauri` 目录
3. 配置 `tauri.conf.json` 和权限
4. 实现 Rust 后端 Commands
5. 更新 package.json scripts
6. 改造前端 API 层和 UI
7. 测试并调试

---

## Why & How to Apply

**Why:** 当前 Web 应用无法真正管理本地 Python 脚本，用户需要一个桌面工具来统一管理和快速执行常用脚本。

**How to apply:** 按照 writing-plans 生成的实现计划逐步执行，先完成 Tauri 基础集成确保 `npm run tauri:dev` 可运行，再逐步实现各功能模块。