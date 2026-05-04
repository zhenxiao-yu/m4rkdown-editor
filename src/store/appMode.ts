import { signal } from '@preact/signals';

export type AppMode = 'menu' | 'writer' | 'battle';
const MODE_KEY = 'm4rkdown_mode';

function loadMode(): AppMode {
    try {
        const v = localStorage.getItem(MODE_KEY);
        if (v === 'writer' || v === 'battle') return v;
    } catch { /* ignore */ }
    return 'menu';
}

export const appMode = signal<AppMode>(loadMode());

export function enterWriterMode() { appMode.value = 'writer'; try { localStorage.setItem(MODE_KEY, 'writer'); } catch {} }
export function enterBattleMode() { appMode.value = 'battle'; try { localStorage.setItem(MODE_KEY, 'battle'); } catch {} }
export function returnToMenu()    { appMode.value = 'menu';   try { localStorage.setItem(MODE_KEY, 'menu'); } catch {} }
