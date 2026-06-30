# Claude Auto Continue

这是一个 SillyTavern 第三方扩展，用来处理 Claude / OpenAI-compatible 渠道流式输出被中途截断的问题。

它的核心逻辑是：如果一条回复结束时还没有出现你设置的“结尾词”，并且不是你手动点了停止，就在后台继续调用 API，把后续内容接到同一条回复里；只要检测到结尾词，就停止继续调用。

> 注意：这个扩展不是纯前端插件。真正的后台续写发生在 SillyTavern 后端流式转发代码里，所以除了导入第三方扩展，还必须应用本仓库里的核心补丁。

## 安装

这个扩展需要做两件事：

1. 在 SillyTavern 前端导入第三方扩展。
2. 在 SillyTavern 后端应用核心补丁。

只做第 1 步，只会看到设置面板；真正的后台自动续写不会生效。必须两步都做完，并且重启 SillyTavern 后端。

### 第一步：在酒馆前端导入扩展

在 SillyTavern 里打开第三方扩展安装器，输入这个 GitHub 地址：

```text
https://github.com/huangsir1111/auto-continue
```

安装完成后，先不要急着使用，还需要应用下面的核心补丁。

### 第二步：打开 cmd

1. 按键盘上的 `Win + R`。
2. 输入：

```text
cmd
```

3. 按回车，会打开一个黑色命令行窗口。

### 第三步：进入 SillyTavern 根目录

进入你的 SillyTavern 根目录，比如你的酒馆在：

```text
D:\MySpecialFolder\SillyTavern-Launcher\SillyTavern
```

就在 cmd 里输入：

```cmd
cd /d "D:\MySpecialFolder\SillyTavern-Launcher\SillyTavern"
```

如果你的 SillyTavern 在别的位置，把上面的路径换成你自己的路径。进对目录后，输入：

```cmd
dir
```

如果你能看到 `public`、`data`、`src`、`package.json` 这些文件或文件夹，说明位置基本对了。

### 第四步：检查核心补丁能不能应用

```cmd
git apply --check "public\scripts\extensions\third-party\auto-continue\patches\sillytavern-core-auto-continue.patch"
```

如果没有报错，再执行下一步。

如果你的扩展目录名字不是 `auto-continue`，请把命令里的路径改成你实际的扩展目录名。例如：

```cmd
git apply --check "public\scripts\extensions\third-party\claude-auto-continue\patches\sillytavern-core-auto-continue.patch"
```

### 第五步：正式应用核心补丁

```cmd
git apply "public\scripts\extensions\third-party\auto-continue\patches\sillytavern-core-auto-continue.patch"
```

然后重启 SillyTavern 后端。

如果你的扩展目录名字不是 `auto-continue`，同样把命令里的路径改成你实际的扩展目录名。例如：

```cmd
git apply "public\scripts\extensions\third-party\claude-auto-continue\patches\sillytavern-core-auto-continue.patch"
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

请先确认扩展已经更新到 `1.0.17` 或更高版本，然后刷新浏览器页面。

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

这个扩展分成两部分：前端第三方扩展 + 后端核心补丁。卸载时要看你到底装了哪一部分。

### 情况一：只导入了前端第三方扩展，没有应用后端补丁

这种情况最简单，不需要执行任何 `git apply --reverse`。

优先在 SillyTavern 前端删除：

1. 打开 SillyTavern 的扩展管理 / 第三方扩展列表。
2. 找到 `Claude Auto Continue`。
3. 点击垃圾桶删除。
4. 刷新页面或重启 SillyTavern。

如果酒馆界面删不掉，可以手动删除扩展目录。先进入你的 SillyTavern 根目录，例如：

1. 按 `Win + R`。
2. 输入：

```text
cmd
```

3. 按回车。
4. 在打开的黑色命令行窗口里输入你的 SillyTavern 路径，例如：

```cmd
cd /d "D:\MySpecialFolder\SillyTavern-Launcher\SillyTavern"
```

然后删除对应目录，例如：

```cmd
rmdir /s /q "public\scripts\extensions\third-party\auto-continue"
```

如果你的扩展目录名字不是 `auto-continue`，把命令里的目录名改成你实际看到的名字。例如：

```cmd
rmdir /s /q "public\scripts\extensions\third-party\claude-auto-continue"
```

注意：这里的本地目录是 `public\scripts\extensions\third-party`，不是 `data\default-user\extensions`。

### 情况二：已经应用过后端核心补丁

如果你应用过本 README 里的核心补丁，完整卸载要先撤销后端补丁，再删除前端扩展。

1. 先停止 SillyTavern 后端。

2. 按 `Win + R`，输入 `cmd`，按回车。

3. 进入 SillyTavern 根目录：

```cmd
cd /d "D:\MySpecialFolder\SillyTavern-Launcher\SillyTavern"
```

4. 先检查核心补丁是否可以反向撤销：

```cmd
git apply --check --reverse "public\scripts\extensions\third-party\auto-continue\patches\sillytavern-core-auto-continue.patch"
```

5. 如果没有报错，正式撤销核心补丁：

```cmd
git apply --reverse "public\scripts\extensions\third-party\auto-continue\patches\sillytavern-core-auto-continue.patch"
```

6. 删除第三方扩展目录，例如：

```cmd
rmdir /s /q "public\scripts\extensions\third-party\auto-continue"
```

如果你的扩展目录名字不是 `auto-continue`，把命令里的目录名改成你实际看到的名字。例如：

```cmd
rmdir /s /q "public\scripts\extensions\third-party\claude-auto-continue"
```

7. 重启 SillyTavern。

如果第 4 步提示找不到 patch 文件，通常是你已经先删除了扩展目录。重新下载本仓库，或重新安装一次扩展后，再执行反向补丁命令即可。

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

`1.0.17`
