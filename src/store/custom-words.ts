import { signal } from '@preact/signals';

const STORAGE_KEY = 'm4rkdown_custom_words';

function load(): string[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as string[] : null;
  } catch { return null; }
}

export const customWordList = signal<string[] | null>(load());

export function setCustomWords(words: string[]) {
  customWordList.value = words;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(words)); } catch {}
}

export function clearCustomWords() {
  customWordList.value = null;
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}
