import { signal } from '@preact/signals';
import { loadStorage, saveStorage } from '@/lib/storage';

const _saved = loadStorage();
export const splitRatio = signal<number>(_saved?.splitRatio ?? 0.5);

export function persistSplitRatio(r: number) {
    splitRatio.value = r;
    const s = loadStorage();
    if (s) saveStorage({ ...s, splitRatio: r });
}
