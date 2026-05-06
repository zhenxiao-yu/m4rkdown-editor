import { signal } from '@preact/signals';

const KEY = 'm4rkdown_settings';

export type PreviewTheme = 'default' | 'github' | 'serif' | 'minimal' | 'terminal';

export const PREVIEW_THEMES: { id: PreviewTheme; label: string }[] = [
    { id: 'default',  label: 'Default'  },
    { id: 'github',   label: 'GitHub'   },
    { id: 'serif',    label: 'Serif'    },
    { id: 'minimal',  label: 'Minimal'  },
    { id: 'terminal', label: 'Terminal' },
];

function load(): Record<string, unknown> {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

function save() {
    try {
        localStorage.setItem(KEY, JSON.stringify({
            focusMode: focusMode.value,
            typewriterMode: typewriterMode.value,
            showOutline: showOutline.value,
            previewTheme: previewTheme.value,
        }));
    } catch {}
}

const s = load();

export const focusMode = signal<boolean>((s.focusMode as boolean) ?? false);
export const typewriterMode = signal<boolean>((s.typewriterMode as boolean) ?? false);
export const showOutline = signal<boolean>((s.showOutline as boolean) ?? false);
export const previewTheme = signal<PreviewTheme>((s.previewTheme as PreviewTheme) ?? 'default');
export const zenMode = signal<boolean>(false); // never persisted — always starts false
export const wordGoal = signal<number>(parseInt(localStorage.getItem('wg') ?? '0', 10) || 0);
export const vimMode = signal<boolean>(localStorage.getItem('m4rkdown_vim') === 'true');
export const vimModeLabel = signal<string>('');
export const isOffline = signal<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);

export function toggleFocusMode() { focusMode.value = !focusMode.value; save(); }
export function toggleTypewriterMode() { typewriterMode.value = !typewriterMode.value; save(); }
export function toggleOutline() { showOutline.value = !showOutline.value; save(); }
export function toggleZenMode() { zenMode.value = !zenMode.value; }
export function setPreviewTheme(t: PreviewTheme) { previewTheme.value = t; save(); }
export function setWordGoal(n: number) {
    wordGoal.value = n;
    try { localStorage.setItem('wg', String(n)); } catch {}
}
export function toggleVimMode() {
    vimMode.value = !vimMode.value;
    try { localStorage.setItem('m4rkdown_vim', String(vimMode.value)); } catch {}
    if (!vimMode.value) vimModeLabel.value = '';
}
