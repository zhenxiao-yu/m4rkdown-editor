import { signal } from '@preact/signals';
import { loadStorage, saveStorage } from '@/lib/storage';

const saved = loadStorage();
const initial: 'dark' | 'light' = saved?.theme ?? 'dark';

export const theme = signal<'dark' | 'light'>(initial);

function applyTheme(t: 'dark' | 'light'): void {
    document.documentElement.classList.toggle('light', t === 'light');
    document.documentElement.classList.toggle('dark', t === 'dark');
}

applyTheme(initial);

export function toggleTheme(): void {
    const next = theme.value === 'dark' ? 'light' : 'dark';
    theme.value = next;
    applyTheme(next);
    const state = loadStorage();
    if (state) {
        saveStorage({ ...state, theme: next });
    }
}
