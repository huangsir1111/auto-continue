#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const CORE_FILES = [
    'public/scripts/events.js',
    'public/scripts/openai.js',
    'src/endpoints/backends/chat-completions.js',
];

function log(message) {
    console.log(`[Claude 自动续写] ${message}`);
}

function fail(message, error) {
    console.error(`[Claude 自动续写] ${message}`);
    if (error) {
        console.error(error);
    }
    process.exit(1);
}

function findSillyTavernRoot(startDirectory) {
    let current = path.resolve(startDirectory);

    while (true) {
        const hasPackage = fs.existsSync(path.join(current, 'package.json'));
        const hasPublicScripts = fs.existsSync(path.join(current, 'public', 'scripts'));
        const hasChatCompletions = fs.existsSync(path.join(current, 'src', 'endpoints', 'backends', 'chat-completions.js'));

        if (hasPackage && hasPublicScripts && hasChatCompletions) {
            return current;
        }

        const parent = path.dirname(current);
        if (parent === current) {
            return null;
        }

        current = parent;
    }
}

function run(command, args, cwd) {
    const result = spawnSync(command, args, {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
    });

    return {
        ok: result.status === 0,
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        status: result.status,
        error: result.error,
    };
}

function restoreTrackedCoreFiles(rootDirectory) {
    const restoreResult = run('git', ['restore', '--', ...CORE_FILES], rootDirectory);

    if (restoreResult.ok) {
        return restoreResult;
    }

    const checkoutResult = run('git', ['checkout', '--', ...CORE_FILES], rootDirectory);

    if (checkoutResult.ok) {
        return checkoutResult;
    }

    return {
        ok: false,
        stderr: [restoreResult.stderr, checkoutResult.stderr].filter(Boolean).join('\n'),
    };
}

function copyFileWithParents(source, destination) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
}

function backupCoreFiles(rootDirectory) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDirectory = path.join(rootDirectory, 'data', 'claude-auto-continue-backups', stamp);

    for (const file of CORE_FILES) {
        const source = path.join(rootDirectory, file);
        const destination = path.join(backupDirectory, file);

        if (!fs.existsSync(source)) {
            fail(`找不到核心文件：${file}`);
        }

        copyFileWithParents(source, destination);
    }

    return backupDirectory;
}

function restoreBackup(rootDirectory, backupDirectory) {
    for (const file of CORE_FILES) {
        const source = path.join(backupDirectory, file);
        const destination = path.join(rootDirectory, file);
        copyFileWithParents(source, destination);
    }
}

const rootDirectory = findSillyTavernRoot(process.cwd()) || findSillyTavernRoot(__dirname);

if (!rootDirectory) {
    fail('没有找到 SillyTavern 根目录。请在 SillyTavern 根目录运行本脚本。');
}

const patchPath = path.join(__dirname, 'patches', 'sillytavern-core-auto-continue.patch');

if (!fs.existsSync(patchPath)) {
    fail(`找不到补丁文件：${patchPath}`);
}

log(`SillyTavern 根目录：${rootDirectory}`);

const backupDirectory = backupCoreFiles(rootDirectory);
log(`已备份核心文件到：${backupDirectory}`);

const restoreResult = restoreTrackedCoreFiles(rootDirectory);

if (!restoreResult.ok) {
    fail([
        '无法覆盖更新核心文件。',
        '这通常表示当前 SillyTavern 不是 git 版，或者 git restore 不可用。',
        `备份已保留在：${backupDirectory}`,
        restoreResult.stderr.trim(),
    ].filter(Boolean).join('\n'));
}

const applyResult = run('git', ['apply', patchPath], rootDirectory);

if (!applyResult.ok) {
    restoreBackup(rootDirectory, backupDirectory);
    fail([
        '新版核心补丁应用失败，已经自动恢复更新前的核心文件。',
        '请确认 SillyTavern 是插件说明支持的版本，或把报错截图发给作者。',
        `备份位置：${backupDirectory}`,
        applyResult.stderr.trim(),
    ].filter(Boolean).join('\n'));
}

log('核心补丁覆盖更新完成。请重启 SillyTavern 后端。');
