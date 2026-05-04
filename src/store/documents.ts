import { signal, computed } from '@preact/signals';
import { loadStorage, saveStorage, type DocEntry, type StorageSchema } from '@/lib/storage';
import { DEFAULT_MARKDOWN } from '@/constants';

function createDefaultDoc(): DocEntry {
    return {
        id: crypto.randomUUID(),
        title: 'Untitled',
        content: DEFAULT_MARKDOWN,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
}

function buildInitialState(): StorageSchema {
    const saved = loadStorage();
    if (saved && Object.keys(saved.documents).length > 0) return saved;
    const doc = createDefaultDoc();
    return {
        version: 1,
        activeDocId: doc.id,
        theme: 'dark',
        splitRatio: 0.5,
        documents: { [doc.id]: doc },
    };
}

const _state = buildInitialState();

export const documentsMap = signal<Record<string, DocEntry>>(_state.documents);
export const activeDocId = signal<string>(_state.activeDocId);

export const activeDoc = computed(() => documentsMap.value[activeDocId.value]);
export const docList = computed(() =>
    Object.values(documentsMap.value).sort((a, b) => b.updatedAt - a.updatedAt)
);

function persist(): void {
    saveStorage({
        version: 1,
        activeDocId: activeDocId.value,
        theme: (document.documentElement.classList.contains('light') ? 'light' : 'dark'),
        splitRatio: 0.5,
        documents: documentsMap.value,
    });
}

export function setActiveDoc(id: string): void {
    if (documentsMap.value[id]) {
        activeDocId.value = id;
        persist();
    }
}

export function updateDocContent(id: string, content: string): void {
    const doc = documentsMap.value[id];
    if (!doc) return;
    documentsMap.value = {
        ...documentsMap.value,
        [id]: { ...doc, content, updatedAt: Date.now() },
    };
    persist();
}

export function updateDocTitle(id: string, title: string): void {
    const doc = documentsMap.value[id];
    if (!doc) return;
    documentsMap.value = {
        ...documentsMap.value,
        [id]: { ...doc, title: title.trim() || 'Untitled', updatedAt: Date.now() },
    };
    persist();
}

export function createDoc(): string {
    const entries = Object.keys(documentsMap.value);
    if (entries.length >= 20) {
        alert('Maximum 20 documents reached. Please delete one first.');
        return activeDocId.value;
    }
    const doc = createDefaultDoc();
    doc.title = `Document ${entries.length + 1}`;
    doc.content = '';
    documentsMap.value = { ...documentsMap.value, [doc.id]: doc };
    activeDocId.value = doc.id;
    persist();
    return doc.id;
}

export function deleteDoc(id: string): void {
    const entries = Object.keys(documentsMap.value);
    if (entries.length <= 1) return;
    const next = { ...documentsMap.value };
    delete next[id];
    documentsMap.value = next;
    if (activeDocId.value === id) {
        activeDocId.value = Object.keys(next)[0];
    }
    persist();
}
