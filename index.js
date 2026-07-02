import {
    eventSource,
    event_types,
    saveSettingsDebounced,
} from '../../../../script.js';
import {
    extension_settings,
} from '../../../extensions.js';

const MODULE_NAME = 'claude_auto_continue';
const SETTINGS_VERSION = '1.0.19';
const FLOATING_TOGGLE_ID = 'claude_auto_continue_floating_toggle';
const FLOATING_TOGGLE_STYLE_ID = 'claude_auto_continue_floating_toggle_style';

const defaultSettings = {
    enabled: false,
    show_popup: true,
    show_floating_toggle: true,
    floating_toggle_position: null,
    end_marker: '[[[ST_AUTO_CONTINUE_END_9QK7V2]]]',
    continue_trigger: 'missing_marker',
    max_calls: 6,
    continuation_prompt: 'Continue exactly from where you stopped. Do not repeat any previous text. Keep writing until you output the ending marker: {{endMarker}}',
};

const continueTriggers = new Set(['token_limit', 'missing_marker']);

function cloneDefaultValue(value) {
    if (Array.isArray(value)) {
        return [...value];
    }

    if (value && typeof value === 'object') {
        return { ...value };
    }

    return value;
}

function getSettings() {
    extension_settings[MODULE_NAME] ||= {};
    const settings = extension_settings[MODULE_NAME];
    const previousSettingsVersion = settings.settings_version;
    let changed = false;

    for (const [key, value] of Object.entries(defaultSettings)) {
        if (settings[key] === undefined) {
            settings[key] = cloneDefaultValue(value);
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
    $('#claude_auto_continue_show_floating_toggle').prop('checked', settings.show_floating_toggle !== false);
    $('#claude_auto_continue_end_marker').val(settings.end_marker);
    $('#claude_auto_continue_trigger').val(continueTriggers.has(settings.continue_trigger) ? settings.continue_trigger : defaultSettings.continue_trigger);
    $('#claude_auto_continue_max_calls').val(settings.max_calls);
    $('#claude_auto_continue_prompt').val(settings.continuation_prompt);
    updateFloatingToggle();
}

function saveSettingsFromUi() {
    const settings = getSettings();
    settings.enabled = !!$('#claude_auto_continue_enabled').prop('checked');
    settings.show_popup = !!$('#claude_auto_continue_show_popup').prop('checked');
    settings.show_floating_toggle = !!$('#claude_auto_continue_show_floating_toggle').prop('checked');
    settings.end_marker = String($('#claude_auto_continue_end_marker').val() || '').trim() || defaultSettings.end_marker;
    const continueTrigger = String($('#claude_auto_continue_trigger').val() || defaultSettings.continue_trigger);
    settings.continue_trigger = continueTriggers.has(continueTrigger) ? continueTrigger : defaultSettings.continue_trigger;
    settings.max_calls = clampMaxCalls($('#claude_auto_continue_max_calls').val());
    settings.continuation_prompt = String($('#claude_auto_continue_prompt').val() || '').trim() || defaultSettings.continuation_prompt;

    $('#claude_auto_continue_trigger').val(settings.continue_trigger);
    $('#claude_auto_continue_max_calls').val(settings.max_calls);
    updateFloatingToggle();
    saveSettingsDebounced();
}

function setEnabledState(enabled) {
    const settings = getSettings();
    settings.enabled = Boolean(enabled);
    $('#claude_auto_continue_enabled').prop('checked', settings.enabled);
    updateFloatingToggle();
    saveSettingsDebounced();
}

function injectFloatingToggleStyles() {
    if (document.getElementById(FLOATING_TOGGLE_STYLE_ID)) {
        return;
    }

    const style = document.createElement('style');
    style.id = FLOATING_TOGGLE_STYLE_ID;
    style.textContent = `
        #${FLOATING_TOGGLE_ID} {
            position: fixed;
            right: 18px;
            bottom: 92px;
            width: 34px;
            height: 34px;
            border: 1px solid rgba(255, 241, 181, 0.72);
            border-radius: 50%;
            background: rgba(38, 35, 31, 0.78);
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
            cursor: pointer;
            opacity: 0.46;
            padding: 0;
            z-index: 9999;
            touch-action: none;
            transition: opacity 120ms ease, box-shadow 120ms ease, background 120ms ease, transform 120ms ease;
        }

        #${FLOATING_TOGGLE_ID}::before {
            content: '';
            position: absolute;
            inset: 9px;
            border-radius: 50%;
            background: rgba(255, 241, 181, 0.82);
            box-shadow: 0 0 0 rgba(255, 241, 181, 0);
        }

        #${FLOATING_TOGGLE_ID}.enabled {
            opacity: 0.95;
            background: rgba(87, 78, 42, 0.9);
            box-shadow: 0 0 14px rgba(255, 221, 112, 0.48), 0 4px 14px rgba(0, 0, 0, 0.35);
        }

        #${FLOATING_TOGGLE_ID}.enabled::before {
            background: rgb(255, 238, 150);
            box-shadow: 0 0 10px rgba(255, 229, 122, 0.75);
        }

        #${FLOATING_TOGGLE_ID}.dragging {
            transition: none;
            transform: scale(1.04);
        }
    `;
    document.head.appendChild(style);
}

function getClampedFloatingPosition(left, top) {
    const size = 34;
    const margin = 6;
    return {
        left: Math.min(Math.max(Number(left) || margin, margin), Math.max(window.innerWidth - size - margin, margin)),
        top: Math.min(Math.max(Number(top) || margin, margin), Math.max(window.innerHeight - size - margin, margin)),
    };
}

function applyFloatingTogglePosition(toggle, position) {
    if (!position || !Number.isFinite(Number(position.left)) || !Number.isFinite(Number(position.top))) {
        toggle.style.left = '';
        toggle.style.top = '';
        toggle.style.right = '18px';
        toggle.style.bottom = '92px';
        return;
    }

    const clamped = getClampedFloatingPosition(position.left, position.top);
    toggle.style.left = `${clamped.left}px`;
    toggle.style.top = `${clamped.top}px`;
    toggle.style.right = 'auto';
    toggle.style.bottom = 'auto';
}

function createFloatingToggle() {
    injectFloatingToggleStyles();

    let toggle = document.getElementById(FLOATING_TOGGLE_ID);
    if (toggle) {
        return toggle;
    }

    toggle = document.createElement('button');
    toggle.id = FLOATING_TOGGLE_ID;
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Toggle Claude Auto Continue');
    toggle.title = 'Claude Auto Continue';

    let dragState = null;
    let lastTouchTime = 0;

    const getPointerPoint = (event) => {
        const source = event.touches?.[0] || event.changedTouches?.[0] || event;
        return { x: source.clientX, y: source.clientY };
    };

    const onPointerMove = (event) => {
        if (!dragState) {
            return;
        }

        const point = getPointerPoint(event);
        const dx = point.x - dragState.startX;
        const dy = point.y - dragState.startY;

        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
            dragState.moved = true;
            toggle.classList.add('dragging');
        }

        if (dragState.moved) {
            event.preventDefault();
            const position = getClampedFloatingPosition(dragState.left + dx, dragState.top + dy);
            toggle.style.left = `${position.left}px`;
            toggle.style.top = `${position.top}px`;
            toggle.style.right = 'auto';
            toggle.style.bottom = 'auto';
        }
    };

    const onPointerEnd = (event) => {
        if (!dragState) {
            return;
        }

        const moved = dragState.moved;
        dragState = null;
        toggle.classList.remove('dragging');
        window.removeEventListener('mousemove', onPointerMove);
        window.removeEventListener('mouseup', onPointerEnd);
        window.removeEventListener('touchmove', onPointerMove);
        window.removeEventListener('touchend', onPointerEnd);
        window.removeEventListener('touchcancel', onPointerEnd);

        if (moved) {
            event.preventDefault();
            const settings = getSettings();
            const rect = toggle.getBoundingClientRect();
            settings.floating_toggle_position = getClampedFloatingPosition(rect.left, rect.top);
            saveSettingsDebounced();
            return;
        }

        setEnabledState(!getSettings().enabled);
    };

    const onPointerStart = (event) => {
        if (event.type === 'touchstart') {
            lastTouchTime = Date.now();
        } else if (event.type === 'mousedown' && Date.now() - lastTouchTime < 700) {
            return;
        }

        const point = getPointerPoint(event);
        const rect = toggle.getBoundingClientRect();
        dragState = {
            startX: point.x,
            startY: point.y,
            left: rect.left,
            top: rect.top,
            moved: false,
        };

        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerEnd);
        window.addEventListener('touchmove', onPointerMove, { passive: false });
        window.addEventListener('touchend', onPointerEnd);
        window.addEventListener('touchcancel', onPointerEnd);
    };

    toggle.addEventListener('mousedown', onPointerStart);
    toggle.addEventListener('touchstart', onPointerStart, { passive: true });
    document.body.appendChild(toggle);
    return toggle;
}

function updateFloatingToggle() {
    const settings = getSettings();
    const toggle = createFloatingToggle();

    if (settings.show_floating_toggle === false) {
        toggle.style.display = 'none';
        return;
    }

    toggle.style.display = '';
    toggle.classList.toggle('enabled', !!settings.enabled);
    toggle.setAttribute('aria-pressed', settings.enabled ? 'true' : 'false');
    toggle.title = settings.enabled ? 'Claude Auto Continue: ON' : 'Claude Auto Continue: OFF';
    applyFloatingTogglePosition(toggle, settings.floating_toggle_position);
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
    $('#claude_auto_continue_show_floating_toggle').on('input', saveSettingsFromUi);
    $('#claude_auto_continue_end_marker').on('input', saveSettingsFromUi);
    $('#claude_auto_continue_trigger').on('change', saveSettingsFromUi);
    $('#claude_auto_continue_max_calls').on('input', saveSettingsFromUi);
    $('#claude_auto_continue_prompt').on('input', saveSettingsFromUi);
    window.addEventListener('resize', updateFloatingToggle);
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
