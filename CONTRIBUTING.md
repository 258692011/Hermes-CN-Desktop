# Contributing

感谢你愿意参与 Hermes Agent CN Desktop。这个项目仍处于 alpha 阶段，欢迎通过 Issue、Discussion 和 Pull Request 参与设计、修复和验证。

## 分支模型

- `main` 是唯一长期主干，应该始终保持可构建、可测试。
- 所有变更请从 `main` 拉短生命周期分支，例如 `feature/...`、`fix/...`、`docs/...`。
- PR 合并后请删除临时分支。
- 维护旧版本补丁时才创建 `release/vX.Y` 分支。

## 提交规范

提交信息使用 Conventional Commits：

```text
feat: add runtime diagnostics panel
fix: refresh stale session token
style: tune sidebar spacing
chore: update release workflow
```

标题请使用英文短句、命令式语气。正文可以中英混用，但应解释“为什么做这个变更”。

## 本地验证

提交 PR 前建议运行：

```bash
pnpm typecheck
pnpm test:unit
cargo fmt --all -- --check
cargo clippy --all-targets -- -D warnings
cargo test --all-features --no-fail-fast
```

如果你的变更涉及打包、runtime staging 或平台特定逻辑，请在 PR 中说明测试平台和手动验证步骤。

## Pull Request 要求

PR 描述应包含：

- 变更目的和背景。
- 主要实现点。
- 测试命令或手动验证步骤。
- 对用户可见行为、配置、数据迁移或发布流程的影响。

请避免把本地生成物、私有配置、日志、token、密钥、`.env`、打包产物和大体积依赖提交到仓库。
