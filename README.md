# Claude Auto Continue

这是一个 SillyTavern 第三方扩展，用来处理 Claude / OpenAI-compatible 渠道流式输出被中途截断的问题。

它的核心逻辑是：如果一条回复结束时还没有出现你设置的“结尾词”，并且不是你手动点了停止，就在后台继续调用 API，把后续内容接到同一条回复里；只要检测到结尾词，就停止继续调用。

> 注意：这个扩展不是纯前端插件。真正的后台续写发生在 SillyTavern 后端流式转发代码里，所以除了导入第三方扩展，还必须应用本仓库里的核心补丁。

## 安装说明（零基础版）

这个扩展需要做两件事：

1. 在 SillyTavern 前端导入第三方扩展。
2. 在 SillyTavern 后端应用核心补丁。

只做第 1 步，只会看到设置面板；真正的后台自动续写不会生效。必须两步都做完，并且重启 SillyTavern 后端。

### 第一步：在酒馆前端导入扩展

1. 打开 SillyTavern 网页。
2. 打开“扩展”或“第三方扩展”管理页面。
3. 找到“导入扩展 / Install extension / Import extension”之类的输入框。
4. 输入这个 GitHub 地址：

```text
https://github.com/huangsir1111/auto-continue
```

5. 确认安装。
6. 安装完成后，刷新一次 SillyTavern 网页。
7. 在扩展列表里确认能看到 `Claude Auto Continue`。

### 第二步：打开命令行

1. 按键盘上的 `Win + R`。
2. 弹出“运行”窗口后，输入：

```text
cmd
```

3. 按回车，会打开一个黑色命令行窗口。

### 第三步：进入 SillyTavern 根目录

你需要进入自己的 SillyTavern 文件夹。

如果你的 SillyTavern 在这个位置：

```text
D:\MySpecialFolder\SillyTavern-Launcher\SillyTavern
```

就在 cmd 里复制粘贴这一行，然后按回车：

```cmd
cd /d "D:\MySpecialFolder\SillyTavern-Launcher\SillyTavern"
```

如果你的 SillyTavern 在别的位置，把上面的路径换成你自己的路径。

判断有没有进对目录：输入下面这行，然后按回车：

```cmd
dir
```

如果你能看到 `public`、`data`、`src`、`package.json` 这些文件或文件夹，说明位置基本对了。

### 第四步：找到扩展安装目录

不同 SillyTavern 版本、不同用户配置下，GitHub 导入的扩展目录可能不一样。

在 cmd 里复制粘贴下面这行，然后按回车：

```cmd
for /d %G in ("data\default-user\extensions\*auto*" "data\default-user\extensions\*continue*" "data\default-user\extensions\*claude*" "public\scripts\extensions\third-party\*auto*" "public\scripts\extensions\third-party\*continue*" "public\scripts\extensions\third-party\*claude*") do @echo %G
```

你可能会看到类似：

```text
data\default-user\extensions\auto-continue
```

或者：

```text
public\scripts\extensions\third-party\auto-continue
```

后面应用补丁时，要用你自己实际显示出来的目录。

如果什么都没显示，说明扩展可能没有导入成功。请先回到酒馆前端重新导入 GitHub 地址。

### 第五步：检查核心补丁能不能应用

如果你的扩展目录是：

```text
data\default-user\extensions\auto-continue
```

就输入：

```cmd
git apply --check "data\default-user\extensions\auto-continue\patches\sillytavern-core-auto-continue.patch"
```

如果你的扩展目录是：

```text
public\scripts\extensions\third-party\auto-continue
```

就输入：

```cmd
git apply --check "public\scripts\extensions\third-party\auto-continue\patches\sillytavern-core-auto-continue.patch"
```

如果执行后没有任何输出，直接回到下一行命令提示符，说明检查通过。

如果显示 `error`，不要继续执行正式应用命令。常见原因：

- 你没有进入 SillyTavern 根目录。
- 你填错了扩展目录。
- 你的 SillyTavern 版本和补丁不兼容。
- 你已经应用过这个补丁了。

### 第六步：正式应用核心补丁

确认上一步没有报错后，再执行正式应用。

如果你的扩展目录是 `data\default-user\extensions\auto-continue`，输入：

```cmd
git apply "data\default-user\extensions\auto-continue\patches\sillytavern-core-auto-continue.patch"
```

如果你的扩展目录是 `public\scripts\extensions\third-party\auto-continue`，输入：

```cmd
git apply "public\scripts\extensions\third-party\auto-continue\patches\sillytavern-core-auto-continue.patch"
```

如果没有报错，说明后端补丁已经应用。

### 第七步：重启 SillyTavern 后端

1. 关闭正在运行的 SillyTavern 后端窗口。
2. 重新打开 SillyTavern 启动器或重新运行你的启动脚本。
3. 重新进入 SillyTavern 网页。
4. 打开 `Claude Auto Continue` 设置，勾选启用。

到这里才算安装完成。

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

5. 找一下扩展真实安装在哪个目录：

```cmd
for /d %G in ("data\default-user\extensions\*auto*" "data\default-user\extensions\*continue*" "data\default-user\extensions\*claude*" "public\scripts\extensions\third-party\*auto*" "public\scripts\extensions\third-party\*continue*" "public\scripts\extensions\third-party\*claude*") do @echo %G
```

找到后删除对应目录，例如：

```cmd
rmdir /s /q "data\default-user\extensions\auto-continue"
```

或者：

```cmd
rmdir /s /q "public\scripts\extensions\third-party\auto-continue"
```

注意：酒馆界面里会把它显示成 `third-party/...`，但真实目录不一定都在 `public\scripts\extensions\third-party`。通过 GitHub 导入的本地用户扩展，常见位置是 `data\default-user\extensions`。

### 情况二：已经应用过后端核心补丁

如果你应用过本 README 里的核心补丁，完整卸载要先撤销后端补丁，再删除前端扩展。

1. 先停止 SillyTavern 后端。

2. 按 `Win + R`，输入 `cmd`，按回车。

3. 进入 SillyTavern 根目录：

```cmd
cd /d "D:\MySpecialFolder\SillyTavern-Launcher\SillyTavern"
```

4. 先找一下扩展真实安装目录：

```cmd
for /d %G in ("data\default-user\extensions\*auto*" "data\default-user\extensions\*continue*" "data\default-user\extensions\*claude*" "public\scripts\extensions\third-party\*auto*" "public\scripts\extensions\third-party\*continue*" "public\scripts\extensions\third-party\*claude*") do @echo %G
```

5. 先检查核心补丁是否可以反向撤销。

如果你的扩展目录是 `data\default-user\extensions\auto-continue`，输入：

```cmd
git apply --check --reverse "data\default-user\extensions\auto-continue\patches\sillytavern-core-auto-continue.patch"
```

如果你的扩展目录是 `public\scripts\extensions\third-party\auto-continue`，输入：

```cmd
git apply --check --reverse "public\scripts\extensions\third-party\auto-continue\patches\sillytavern-core-auto-continue.patch"
```

如果没有报错，再正式撤销核心补丁。

如果你的扩展目录是 `data\default-user\extensions\auto-continue`，输入：

```cmd
git apply --reverse "data\default-user\extensions\auto-continue\patches\sillytavern-core-auto-continue.patch"
```

如果你的扩展目录是 `public\scripts\extensions\third-party\auto-continue`，输入：

```cmd
git apply --reverse "public\scripts\extensions\third-party\auto-continue\patches\sillytavern-core-auto-continue.patch"
```

6. 删除第三方扩展目录。

如果你的扩展目录是 `data\default-user\extensions\auto-continue`，输入：

```cmd
rmdir /s /q "data\default-user\extensions\auto-continue"
```

如果你的扩展目录是 `public\scripts\extensions\third-party\auto-continue`，输入：

```cmd
rmdir /s /q "public\scripts\extensions\third-party\auto-continue"
```

7. 重启 SillyTavern。

如果第 5 步提示找不到 patch 文件，通常是你已经先删除了扩展目录。重新下载本仓库，或重新安装一次扩展后，再执行反向补丁命令即可。

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
