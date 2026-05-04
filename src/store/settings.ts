import { signal } from '@preact/signals';

const KEY = 'm4rkdown_settings';

function load(): Record<string, unknown> {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

function save() {
    try {
        localStorage.setItem(KEY, JSON.stringify({
            focusMode: focusMode.value,
            typewriterMode: typewriterMode.value,
            showOutline: showOutline.value,
        }));
    } catch {}
}

const s = load();

export const focusMode = signal<boolean>((s.focusMode as boolean) ?? false);
export const typewriterMode = signal<boolean>((s.typewriterMode as boolean) ?? false);
export const showOutline = signal<boolean>((s.showOutline as boolean) ?? false);

export function toggleFocusMode() { focusMode.value = !focusMode.value; save(); }
export function toggleTypewriterMode() { typewriterMode.value = !typewriterMode.value; save(); }
export function toggleOutline() { showOutline.value = !showOutline.value; save(); }
