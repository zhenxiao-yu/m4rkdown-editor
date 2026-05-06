import { signal, computed } from '@preact/signals';
import {
    loadStorageSafe, saveStorage, isValidBackup,
    type DocEntry, type StorageSchema, type BackupSchema,
    APP_VERSION,
} from '@/lib/storage';
import { DEFAULT_MARKDOWN } from '@/constants';
import { splitRatio } from './layout';

// ── Save status ───────────────────────────────────────────────────────

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
export const saveStatus = signal<SaveStatus>('idle');

let savedResetTimer: ReturnType<typeof setTimeout> | null = null;

function setSaved() {
    saveStatus.value = 'saved';
    if (savedResetTimer) clearTimeout(savedResetTimer);
    savedResetTimer = setTimeout(() => { saveStatus.value = 'idle'; }, 2000);
}

/** Call this immediately when a change is pending (before debounce fires). */
export function markSavePending(): void {
    if (savedResetTimer) { clearTimeout(savedResetTimer); savedResetTimer = null; }
    saveStatus.value = 'saving';
}

// ── Bootstrap ─────────────────────────────────────────────────────────

function createDefaultDoc(): DocEntry {
    return {
        id: crypto.randomUUID(),
        title: 'Untitled',
        content: DEFAULT_MARKDOWN,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
}

/** True if the previous session's storage was corrupted / unreadable.
 *  Read by AppLayout on mount to show a recovery toast. */
export let storageWasCorrupted = false;

function buildInitialState(): StorageSchema {
    const { schema, wasCorrupted } = loadStorageSafe();
    storageWasCorrupted = wasCorrupted;

    if (schema && Object.keys(schema.documents).length > 0) return schema;

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
export const activeDocId  = signal<string>(_state.activeDocId);

export const activeDoc = computed(() => documentsMap.value[activeDocId.value]);
export const docList   = computed(() =>
    Object.values(documentsMap.value).sort((a, b) => b.updatedAt - a.updatedAt)
);

// ── Persist ───────────────────────────────────────────────────────────

/** Lazy import avoids a circular dep (toast → signal → toast). */
async function notifyStorageError() {
    const { showToast } = await import('@/store/toast');
    showToast(
        'Storage full — could not save. Export a backup to avoid losing work.',
        'error',
        8000,
    );
}

function persist(): void {
    const ok = saveStorage({
        version: 1,
        activeDocId: activeDocId.value,
        theme: document.documentElement.classList.contains('light') ? 'light' : 'dark',
        splitRatio: splitRatio.value,
        documents: documentsMap.value,
    });

    if (!ok) {
        saveStatus.value = 'error';
        void notifyStorageError();
        return;
    }

    setSaved();
}

// ── Document CRUD ─────────────────────────────────────────────────────

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
        alert('Maximum 20 documents reached. Delete one first, or export a backup.');
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

// ── Backup / restore ──────────────────────────────────────────────────

export function buildBackup(): BackupSchema {
    const docs = Object.values(documentsMap.value);
    return {
        type: 'backup',
        version: 1,
        appVersion: APP_VERSION,
        exportedAt: Date.now(),
        documentCount: docs.length,
        documents: docs,
    };
}

/** Validate and merge a parsed backup into the document store.
 *  Returns { imported, skipped } counts on success, throws on invalid data. */
export function importBackup(raw: unknown): { imported: number; skipped: number } {
    if (!isValidBackup(raw)) throw new Error('Invalid backup file format.');

    const backup = raw as BackupSchema;
    const current = { ...documentsMap.value };
    let imported = 0;
    let skipped = 0;

    for (const doc of backup.documents) {
        if (current[doc.id]) {
            skipped++;
        } else {
            current[doc.id] = doc;
            imported++;
        }
    }

    if (imported === 0) return { imported: 0, skipped };

    documentsMap.value = current;
    persist();
    return { imported, skipped };
}
