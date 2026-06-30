# Claude Auto Continue

这是一个 SillyTavern 第三方扩展，用来处理 Claude / OpenAI-compatible 渠道流式输出被中途截断的问题。

它的核心逻辑是：如果一条回复结束时还没有出现你设置的“结尾词”，并且不是你手动点了停止，就在后台继续调用 API，把后续内容接到同一条回复里；只要检测到结尾词，就停止继续调用。

> 注意：这个扩展不是纯前端插件。真正的后台续写发生在 SillyTavern 后端流式转发代码里，所以除了导入第三方扩展，还必须应用本仓库里的核心补丁。

## 安装

在 SillyTavern 里打开第三方扩展安装器，输入这个 GitHub 地址：

```text
https://github.com/huangsir1111/auto-continue
```

安装完成后，先不要急着使用，还需要应用下面的核心补丁。

## 必须应用核心补丁

进入你的 SillyTavern 根目录，比如：

```powershell
cd "D:\MySpecialFolder\SillyTavern-Launcher\SillyTavern"
```

先检查补丁能不能应用：

```powershell
git apply --check "public/scripts/extensions/third-party/auto-continue/patches/sillytavern-core-auto-continue.patch"
```

如果没有报错，再正式应用：

```powershell
git apply "public/scripts/extensions/third-party/auto-continue/patches/sillytavern-core-auto-continue.patch"
```

然后重启 SillyTavern 后端。

如果你的扩展目录名字不是 `auto-continue`，请把命令里的路径改成你实际的扩展目录名。例如：

```powershell
git apply "public/scripts/extensions/third-party/claude-auto-continue/patches/sillytavern-core-auto-continue.patch"
```

## 设置说明

- `Enable auto continue for Claude streaming`：开启自动续写。
- `Show popup while continuing`：后台继续调用 API 时弹出提示。
- `End marker`：结尾词。只有回复末尾出现这个文本，才会停止后台续写。默认是 `<disclaimer></disclaimer>`，你也可以改成 `正文结束`、`1 2 3 4 5` 等任意文本。
- `Continue trigger`：
  - `Missing end marker`：推荐模式。只要流式回复结束时没有结尾词，并且不是你手动停止，就继续调用。
  - `Token limit / likely Kiro 8k cut`：保守模式。只有明确像 token 上限截断时才继续。
- `Max API calls per reply`：单条回复最多允许后台续写几次，防止无限调用。
- `Continuation prompt`：后台续写时发送给模型的提示词。可以用 `{{endMarker}}` 插入你设置的结尾词。

## 行为说明

- 如果模型一次性输出到了结尾词，并且结尾词位于最终输出末尾，不管输出多少 token，都不会继续调用。
- 如果中途断流、回复结束时没有结尾词，并且你没有手动停止，就会继续调用。
- 如果你自己点了停止，不会被当成截断。
- 默认模式不靠估算 token 判断截断，而是看“回复结束时末尾有没有结尾词”。
- 只有选择 `Token limit / likely Kiro 8k cut` 时，才会使用 token 上限或疑似截断特征作为判断依据。

建议把结尾词设置成不容易在提示词或正文中自然出现的完整标记，例如 `<正文彻底结束></正文彻底结束>`。像 `正文结束` 这类常见短语也可以用，但必须真的出现在最终输出末尾才会停止。

## 安装后看不到设置面板怎么办

请先确认扩展已经更新到 `1.0.16` 或更高版本，然后刷新浏览器页面。

如果仍然不显示：

1. 打开浏览器开发者工具，查看 Console 是否有 `Claude Auto Continue: failed to load settings template`。
2. 确认扩展目录里存在 `index.js`、`manifest.json`、`settings.html` 三个文件。
3. 确认 SillyTavern 的第三方扩展列表里已经启用 `Claude Auto Continue`。
4. 如果之前安装过旧版本，删除旧扩展目录后重新用 GitHub 地址导入一次。

从 `1.0.13` 开始，设置面板不再依赖固定目录名，所以无论安装目录叫 `auto-continue`、`claude-auto-continue`，还是 GitHub 安装器生成的其他名字，都应该可以正常显示。

## 支持范围

目前主要支持：

- SillyTavern 原生 Claude streaming。
- OpenAI-compatible `/v1/chat/completions` streaming。
- 部分使用 OpenAI-compatible chat completions 的 SillyTavern 渠道包装器。

暂不完整支持：

- Gemini / Cohere 这类非 OpenAI-compatible SSE 格式的流式接口。

## 完全卸载

如果只是暂时不用，可以在扩展设置里关闭 `Enable auto continue for Claude streaming`，这样就不会再给请求附加自动续写参数。

如果想完全卸载，请按这个顺序来：

1. 先停止 SillyTavern 后端。

2. 进入 SillyTavern 根目录：

```powershell
cd "D:\MySpecialFolder\SillyTavern-Launcher\SillyTavern"
```

3. 先检查核心补丁是否可以反向撤销：

```powershell
git apply --check --reverse "public/scripts/extensions/third-party/auto-continue/patches/sillytavern-core-auto-continue.patch"
```

4. 如果没有报错，正式撤销核心补丁：

```powershell
git apply --reverse "public/scripts/extensions/third-party/auto-continue/patches/sillytavern-core-auto-continue.patch"
```

5. 删除第三方扩展目录：

```powershell
Remove-Item -LiteralPath "public/scripts/extensions/third-party/auto-continue" -Recurse -Force
```

6. 重启 SillyTavern。

如果第 3 步提示找不到 patch 文件，通常是你已经先删除了扩展目录。重新下载本仓库，或重新安装一次扩展后，再执行反向补丁命令即可。

如果你的扩展目录不是 `auto-continue`，同样把上面命令里的路径改成实际目录名。

## 可选：清理用户设置

扩展设置通常保存在用户的 SillyTavern 设置文件里。即使不清理，也不会影响使用；如果你想彻底清掉残留设置，可以在停止 SillyTavern 后编辑：

```text
data/default-user/settings.json
```

找到：

```json
"extension_settings": {
  "claude_auto_continue": {
  }
}
```

删除其中的 `claude_auto_continue` 这一项，然后保存并重启 SillyTavern。

多用户环境下，请到对应用户目录下处理对应的 `settings.json`。

## 当前版本

`1.0.16`
