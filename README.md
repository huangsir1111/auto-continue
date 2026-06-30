# Claude Auto Continue

Claude Auto Continue is a SillyTavern third-party extension plus a required SillyTavern core patch.

It continues Claude/OpenAI-compatible streaming replies in the background when the stream ends before a configurable end marker appears. It is mainly built for Claude models behind OpenAI-compatible gateways that stop around an output limit.

## Install

In SillyTavern, open the third-party extension installer and enter:

```text
https://github.com/huangsir1111/auto-continue
```

Then install it for yourself or all users.

## Required Core Patch

The extension UI alone is not enough. The background continuation runs inside SillyTavern's backend stream forwarding code, so the core patch must also be applied.

From your SillyTavern root folder, run:

```powershell
git apply --check "public/scripts/extensions/third-party/auto-continue/patches/sillytavern-core-auto-continue.patch"
git apply "public/scripts/extensions/third-party/auto-continue/patches/sillytavern-core-auto-continue.patch"
```

If your extension folder has a different name, adjust the path to the patch file.

Restart SillyTavern after applying the patch.

## Settings

- Enable auto continue for Claude streaming: turns the feature on.
- Show popup while continuing: shows a toast when a background continuation call starts.
- End marker: generation stops continuing once this text appears. Example: `正文结束`.
- Continue trigger:
  - Missing end marker: continue after a non-manual stream end if the marker is missing.
  - Token limit / likely Kiro 8k cut: only continue when the stream reports or strongly looks like a token-limit stop.
- Max API calls per reply: safety cap for one reply.
- Continuation prompt: prompt used for follow-up calls. Use `{{endMarker}}` to include the configured marker.

Manual user stop is not treated as truncation.

## Supported Routes

- Native SillyTavern Claude streaming.
- OpenAI-compatible `/v1/chat/completions` streaming routes.
- Several SillyTavern provider wrappers that use OpenAI-compatible chat completions.

Gemini/Cohere-style non-OpenAI stream formats are not fully covered by this patch.

## Version

Current version: `1.0.10`
