# FastLaunch

一款简洁优雅的 Python 程序管理器，让你轻松管理和执行 Python 脚本。

![FastLaunch](https://img.shields.io/badge/version-1.0.0-blue)
![Tauri](https://img.shields.io/badge/Tauri-2.x-green)
![React](https://img.shields.io/badge/React-18-blue)

## ✨ 功能特性

- 📦 **卡片式管理** - 直观的卡片界面，一目了然
- ⚡ **一键运行** - 快速执行 Python 程序，实时显示输出
- 💻 **终端运行** - 在 Terminal.app 中运行脚本
- 📁 **打开目录** - 快速在 Finder 中打开脚本所在目录
- ❤️ **收藏功能** - 标记常用程序，快速访问
- 🏷️ **分类管理** - 自定义分类，灵活组织
- 🎨 **自定义图标** - 上传图片作为程序图标
- 🌙 **深色模式** - 自动适应系统主题

## 🖥️ 系统要求

- macOS 10.15+
- Python 3.x

## 📦 安装

从 [Releases](https://github.com/whaler2030/fastlaunch/releases) 页面下载最新版本的 `.dmg` 文件。

或从源码构建：

```bash
# 克隆仓库
git clone https://github.com/whaler2030/fastlaunch.git
cd fastlaunch

# 安装依赖
pnpm install

# 开发模式运行
pnpm tauri dev

# 构建应用
pnpm tauri build
```

## 🎯 使用指南

### 添加程序

1. 点击侧边栏「添加程序」按钮
2. 选择 Python 脚本文件
3. 设置程序名称、描述、分类等
4. 选择图标（预设图标或自定义图片）
5. 点击「添加程序」

### 运行程序

- 在卡片上悬浮，点击「运行」按钮
- 或进入详情页，点击「运行程序」
- 输出结果实时显示在界面中

### 管理分类

1. 点击侧边栏底部的「管理分类」
2. 添加、编辑或删除分类
3. 选择图标和名称

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Tauri 2.x |
| 前端 | React 18 + TypeScript |
| UI | Tailwind CSS + Shadcn UI |
| 图标 | Lucide React |
| 后端 | Rust |
| 存储 | JSON 文件 |

## 📁 项目结构

```
fastlaunch/
├── src/                    # 前端源码
│   ├── app/
│   │   ├── components/     # UI 组件
│   │   ├── pages/          # 页面
│   │   ├── hooks/          # React Hooks
│   │   └── types/          # TypeScript 类型
│   └── api/                # API 接口
├── src-tauri/              # Rust 后端
│   ├── src/
│   │   ├── programs.rs     # 程序数据管理
│   │   ├── categories.rs   # 分类管理
│   │   ├── icons.rs        # 图标管理
│   │   └ executor.rs     # Python 执行
│   └ capabilities/       # 权限配置
└── README.md
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

Made with ❤️ by whaler2030