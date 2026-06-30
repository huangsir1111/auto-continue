import {
    eventSource,
    event_types,
    saveSettingsDebounced,
} from '../../../../script.js';
import {
    extension_settings,
} from '../../../extensions.js';

const MODULE_NAME = 'claude_auto_continue';
const SETTINGS_VERSION = '1.0.13';

const defaultSettings = {
    enabled: false,
    show_popup: true,
    end_marker: '<disclaimer></disclaimer>',
    continue_trigger: 'missing_marker',
    max_calls: 6,
    continuation_prompt: 'Continue exactly from where you stopped. Do not repeat any previous text. Keep writing until you output the ending marker: {{endMarker}}',
};

const continueTriggers = new Set(['token_limit', 'missing_marker']);

function getSettings() {
    extension_settings[MODULE_NAME] ||= {};
    const settings = extension_settings[MODULE_NAME];
    const previousSettingsVersion = settings.settings_version;
    let changed = false;

    for (const [key, value] of Object.entries(defaultSettings)) {
        if (settings[key] === undefined) {
            settings[key] = value;
            changed = true;
        }
    }

    if (previousSettingsVersion === undefined && settings.continue_trigger === 'token_limit') {
        settings.continue_trigger = defaultSettings.continue_trigger;
        changed = true;
    }

    if (settings.settings_version !== SETTINGS_VERSION) {
        settings.settings_version = SETTINGS_VERSION;
        changed = true;
    }

    if (changed) {
        saveSettingsDebounced();
    }

    return settings;
}

function clampMaxCalls(value) {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) {
        return defaultSettings.max_calls;
    }

    return Math.min(Math.max(Math.floor(numberValue), 1), 20);
}

function shouldAttachAutoContinue(generateData) {
    if (!generateData) {
        return false;
    }

    return typeof generateData.chat_completion_source === 'string' && generateData.chat_completion_source.length > 0;
}

function loadSettingsToUi() {
    const settings = getSettings();

    $('#claude_auto_continue_enabled').prop('checked', !!settings.enabled);
    $('#claude_auto_continue_show_popup').prop('checked', !!settings.show_popup);
    $('#claude_auto_continue_end_marker').val(settings.end_marker);
    $('#claude_auto_continue_trigger').val(continueTriggers.has(settings.continue_trigger) ? settings.continue_trigger : defaultSettings.continue_trigger);
    $('#claude_auto_continue_max_calls').val(settings.max_calls);
    $('#claude_auto_continue_prompt').val(settings.continuation_prompt);
}

function saveSettingsFromUi() {
    const settings = getSettings();
    settings.enabled = !!$('#claude_auto_continue_enabled').prop('checked');
    settings.show_popup = !!$('#claude_auto_continue_show_popup').prop('checked');
    settings.end_marker = String($('#claude_auto_continue_end_marker').val() || '').trim() || defaultSettings.end_marker;
    const continueTrigger = String($('#claude_auto_continue_trigger').val() || defaultSettings.continue_trigger);
    settings.continue_trigger = continueTriggers.has(continueTrigger) ? continueTrigger : defaultSettings.continue_trigger;
    settings.max_calls = clampMaxCalls($('#claude_auto_continue_max_calls').val());
    settings.continuation_prompt = String($('#claude_auto_continue_prompt').val() || '').trim() || defaultSettings.continuation_prompt;

    $('#claude_auto_continue_trigger').val(settings.continue_trigger);
    $('#claude_auto_continue_max_calls').val(settings.max_calls);
    saveSettingsDebounced();
}

function onChatCompletionSettingsReady(generateData) {
    const settings = getSettings();

    if (!settings.enabled || !shouldAttachAutoContinue(generateData)) {
        return;
    }

    generateData.claude_auto_continue = {
        enabled: true,
        end_marker: settings.end_marker,
        continue_trigger: continueTriggers.has(settings.continue_trigger) ? settings.continue_trigger : defaultSettings.continue_trigger,
        max_calls: clampMaxCalls(settings.max_calls),
        continuation_prompt: settings.continuation_prompt,
    };

    console.info('Claude Auto Continue: attached request settings', {
        source: generateData.chat_completion_source,
        model: generateData.model,
        end_marker: generateData.claude_auto_continue.end_marker,
        continue_trigger: generateData.claude_auto_continue.continue_trigger,
        max_calls: generateData.claude_auto_continue.max_calls,
    });
}

function onClaudeAutoContinueStatus(status) {
    const settings = getSettings();

    if (!settings.show_popup) {
        return;
    }

    const call = Number(status?.call || 0);
    const maxCalls = Number(status?.max_calls || settings.max_calls);
    toastr.info(
        call > 0 && maxCalls > 0
            ? `\u540e\u53f0\u6b63\u5728\u7ee7\u7eed\u8c03\u7528 Claude (${call}/${maxCalls})`
            : '\u540e\u53f0\u6b63\u5728\u7ee7\u7eed\u8c03\u7528 Claude',
        'Claude Auto Continue',
        { timeOut: 2500 },
    );
}

function bindSettingsListeners() {
    $('#claude_auto_continue_enabled').on('input', saveSettingsFromUi);
    $('#claude_auto_continue_show_popup').on('input', saveSettingsFromUi);
    $('#claude_auto_continue_end_marker').on('input', saveSettingsFromUi);
    $('#claude_auto_continue_trigger').on('change', saveSettingsFromUi);
    $('#claude_auto_continue_max_calls').on('input', saveSettingsFromUi);
    $('#claude_auto_continue_prompt').on('input', saveSettingsFromUi);
}

async function renderSettingsTemplate() {
    const response = await fetch(new URL('./settings.html', import.meta.url), { cache: 'no-cache' });

    if (!response.ok) {
        throw new Error(`Claude Auto Continue: failed to load settings template (${response.status})`);
    }

    return await response.text();
}

export async function init() {
    getSettings();

    const settingsHtml = await renderSettingsTemplate();
    $('#extensions_settings2').append(settingsHtml);
    loadSettingsToUi();
    bindSettingsListeners();

    eventSource.on(event_types.CHAT_COMPLETION_SETTINGS_READY, onChatCompletionSettingsReady);
    eventSource.on(event_types.CLAUDE_AUTO_CONTINUE_STATUS, onClaudeAutoContinueStatus);
}
