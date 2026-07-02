# Changelog

## Unreleased

- 暂无。

## 1.0.22

- 新增 `update-core.cjs` 覆盖更新脚本。
- 第一次安装和旧版本更新现在都可以使用同一条 `node ...update-core.cjs` 命令。
- 脚本会先备份核心文件，再覆盖回 SillyTavern 原版核心文件并应用最新版补丁；如果失败，会尽量恢复更新前文件。
- README 更新为更简单的覆盖安装 / 更新说明，避免旧版用户直接 `git apply` 新补丁时出现 `patch does not apply`。
- 文档补充前端第三方扩展和后端核心补丁的分别卸载方式。
- 文档简化安装和卸载说明，保留 `Win + R` 打开 `cmd` 的步骤，去掉容易复制出错的复杂目录搜索命令。

## 1.0.21

- 新增 `最大卡住重试次数` 设置，范围 0-10 次，默认推荐 2 次。
- `无正文超时秒数` 的界面说明补充范围 15-600 秒，默认推荐 120 秒。
- 后端现在会按最大卡住重试次数停止无正文超时重试，避免某个渠道持续不可用时一直占用调用次数。

## 1.0.20

- 插件显示名和设置面板改为中文显示，内部配置字段保持不变，兼容已有设置。
- 新增 `后台续写卡住自动重试` 和 `无正文超时秒数` 设置。
- 后台续写请求发出后，如果在用户设定时间内没有任何可见正文，会自动中断并重新调用；已经开始出字后不会因为中途停顿而重试。
- 原生 Claude streaming 和 OpenAI-compatible streaming 都接入同一套无正文超时重试逻辑。

## 1.0.19

- 修复手机端点击小圆形快速开关后，触摸事件和模拟鼠标事件连续触发，导致开关状态看起来没有变化的问题。
- 调整小圆形快速开关的拖动阈值，减少手机轻点时被误判为拖动的情况。

## 1.0.18

- 新增可拖动的小圆形快速开关，亮起表示自动续写开启，变暗表示关闭。
- 扩展设置里新增 `Show floating toggle`，可以控制是否显示小圆形开关。
- 默认结尾词改为 `[[[ST_AUTO_CONTINUE_END_9QK7V2]]]`，降低和正文、思维链内容撞词的概率。

## 1.0.17

- 修复部分 OpenAI-compatible API 把流式正文放在 `delta.content` 数组、`delta.text` 或文本块对象里时，后端仍在接收但酒馆前端看不到后续正文的问题。
- 转发给 SillyTavern 前端前会把可识别文本统一规范成 `choices[].delta.content` 字符串，提升换 API 后的兼容性。

## 1.0.16

- 修复模型在同一次流式输出里写出结尾词后仍继续吐正文的问题。
- 现在检测到结尾词会立刻截断后续 chunk，并停止后台续写。

## 1.0.15

- 修复 GitHub 安装包里的核心补丁文件格式问题，确保 `git apply --check` 可以正常通过。
- 补丁内容重新从当前可用的 SillyTavern 后端改动生成。

## 1.0.14

- 修复结尾词在 reasoning、提示格式、隐藏块或正文中途出现时可能误判为完成的问题。
- 现在结尾词必须出现在最终输出末尾才会停止后台续写。

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
