# Hermes Agent CN Desktop

Hermes Agent 中文社区桌面客户端，基于 [Tauri v2](https://v2.tauri.app/) + React 构建，用更轻量的原生桌面壳承载 [hermes-agent-cn](https://github.com/Eynzof/hermes-agent-cn) Dashboard。

> 当前版本是 `v0.1.0-alpha.1`。项目仍处于早期 alpha 阶段，API、打包流程和运行时分发策略可能继续调整。

## 特性

- **轻量桌面体验**：Tauri 使用系统 WebView，显著降低安装包体积。
- **托管运行时**：桌面端默认使用 managed runtime，并将 Dashboard 默认端口设为 `9120`，避免与用户全局 Hermes Agent 常用端口冲突。
- **完整 Agent 工作流**：支持多轮对话、流式输出、文件附件、MCP 工具、多 Profile、Memory、Skills 和运行时诊断。
- **生产级代理层**：生产模式下通过 Rust IPC 代理 REST 和 SSE，统一处理鉴权、CORS、上传和本地资源边界。
- **跨平台目标**：当前重点支持 macOS 和 Windows，发布包由 GitHub Actions 构建。

## 前置条件

- [Rust](https://rustup.rs/) stable
- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [hermes-agent-cn](https://github.com/Eynzof/hermes-agent-cn) 后端或已安装的 Hermes CLI

macOS 额外需要 Xcode Command Line Tools：

```bash
xcode-select --install
```

## 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 启动后端，另开一个终端执行
hermes dashboard --host 127.0.0.1 --port 9120 --no-open

# 3. 启动桌面端开发模式
pnpm web:dev
cargo run
```

也可以使用 Tauri dev 脚本自动启动 Vite：

```bash
pnpm tauri:dev
```

## 构建

```bash
# Release 构建，产出 .app / .dmg / .exe
pnpm tauri:build

# Debug 构建，带调试信息
pnpm tauri:build:debug
```

产物位于 `target/release/bundle/` 或 `target/debug/bundle/`。

## 项目结构

```text
├── src/                    Rust 后端：Tauri commands、进程管理、runtime 管理
├── web/                    React 前端：Vite、TanStack Query、Jotai
├── packages/
│   ├── protocol/           API schemas 与 IPC 类型定义
│   └── shared-ui/          设计 token 与共享 UI 组件
├── static/                 打包时注入的 dashboard、runtime、skills 静态资源
├── scripts/                本地开发、runtime staging、release staging 脚本
├── .github/workflows/      CI 与桌面端发布流水线
├── Cargo.toml              Rust crate 配置
├── tauri.conf.json         Tauri 窗口、权限和打包配置
└── package.json            pnpm workspace root
```

## 开发命令

| 命令 | 说明 |
|------|------|
| `pnpm web:dev` | 启动 Vite dev server，默认端口 `9545` |
| `cargo run` | 编译并启动 Tauri 窗口 |
| `pnpm typecheck` | TypeScript 类型检查 |
| `pnpm test:unit` | 运行 Vitest 单元测试 |
| `cargo check` | Rust 编译检查 |
| `cargo test --all-features` | Rust 测试 |
| `pnpm tauri:build` | 生产构建 |

## 质量检查

提交 PR 前建议至少运行：

```bash
pnpm typecheck
pnpm test:unit
cargo fmt --all -- --check
cargo clippy --all-targets -- -D warnings
cargo test --all-features --no-fail-fast
```

## 发布

正式版本使用 SemVer tag，例如：

```text
v0.1.0-alpha.1
v0.1.0-beta.1
v0.1.0
v0.1.1
```

推送 `v*` tag 后会触发 `.github/workflows/release-desktop.yml`，构建并上传桌面端安装包到 GitHub Release。

## 贡献

欢迎提交 Issue 和 Pull Request。请先阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)。安全问题请按 [SECURITY.md](./SECURITY.md) 里的方式报告。

## 许可

本项目使用 [MIT License](./LICENSE)。
