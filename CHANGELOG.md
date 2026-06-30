# Changelog

## 1.0.13

- 修复部分用户通过 GitHub 导入后，因为扩展目录名不同导致设置面板不显示的问题。
- 设置面板现在会从当前插件文件旁边加载 `settings.html`，不再依赖固定目录名。

## 1.0.12

- 修复部分 OpenAI-compatible API 会提前向前端发送 `finish_reason`，导致前端关闭连接、后台续写无法继续的问题。

## 1.0.11

- README 改为中文，并补充完整卸载说明。
- 修复从 GitHub 仓库 `auto-continue` 导入后设置面板模板路径不匹配的问题。

## 1.0.10

- Added MiniMax OpenAI-compatible stream coverage.
- Kept default continuation trigger on missing end marker instead of token estimation.
- Packaged the extension with a required SillyTavern core patch.

## 1.0.0

- Initial Claude/OpenAI-compatible auto-continue extension.
