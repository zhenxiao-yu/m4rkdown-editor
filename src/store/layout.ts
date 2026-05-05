import { signal } from '@preact/signals';
import { loadStorage, saveStorage } from '@/lib/storage';

const _saved = loadStorage();
export const splitRatio = signal<number>(_saved?.splitRatio ?? 0.5);

export function persistSplitRatio(r: number) {
    splitRatio.value = r;
    const s = loadStorage();
    if (s) saveStorage({ ...s, splitRatio: r });
}

export type LayoutMode = 'editor' | 'split' | 'preview';

function loadLayoutMode(): LayoutMode {
    try {
        const v = localStorage.getItem('m4rkdown_layout') as LayoutMode;
        if (v === 'editor' || v === 'split' || v === 'preview') return v;
    } catch {}
    return 'split';
}

export const layoutMode = signal<LayoutMode>(loadLayoutMode());
export const editorScrollFraction = signal<number>(0);

export function setLayoutMode(mode: LayoutMode) {
    layoutMode.value = mode;
    try { localStorage.setItem('m4rkdown_layout', mode); } catch {}
}
