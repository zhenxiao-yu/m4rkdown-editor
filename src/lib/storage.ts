export interface DocEntry {
    id: string;
    title: string;
    content: string;
    createdAt: number;
    updatedAt: number;
}

export interface StorageSchema {
    version: 1;
    activeDocId: string;
    theme: 'dark' | 'light';
    splitRatio: number;
    documents: Record<string, DocEntry>;
}

export interface BackupSchema {
    type: 'backup';
    version: 1;
    appVersion: string;
    exportedAt: number;
    documentCount: number;
    documents: DocEntry[];
}

const STORAGE_KEY = 'm4rkdown_v1';
export const APP_VERSION = '3.1.0';

// ── Validation helpers ────────────────────────────────────────────────

function isDocEntry(v: unknown): v is DocEntry {
    if (typeof v !== 'object' || v === null) return false;
    const d = v as Record<string, unknown>;
    return (
        typeof d.id === 'string' &&
        typeof d.title === 'string' &&
        typeof d.content === 'string' &&
        typeof d.createdAt === 'number' &&
        typeof d.updatedAt === 'number'
    );
}

function isValidSchema(v: unknown): v is StorageSchema {
    if (typeof v !== 'object' || v === null) return false;
    const s = v as Record<string, unknown>;
    return (
        s.version === 1 &&
        typeof s.activeDocId === 'string' &&
        typeof s.documents === 'object' &&
        s.documents !== null &&
        Object.values(s.documents as object).every(isDocEntry)
    );
}

export function isValidBackup(v: unknown): v is BackupSchema {
    if (typeof v !== 'object' || v === null) return false;
    const b = v as Record<string, unknown>;
    return (
        b.type === 'backup' &&
        b.version === 1 &&
        Array.isArray(b.documents) &&
        (b.documents as unknown[]).every(isDocEntry)
    );
}

// ── Load ──────────────────────────────────────────────────────────────

/** Returns the stored schema, or null if absent. `wasCorrupted` is true
 *  when data existed but could not be parsed — this means the user's docs
 *  are unreadable and they should be informed. */
export function loadStorageSafe(): { schema: StorageSchema | null; wasCorrupted: boolean } {
    let raw: string | null = null;
    try {
        raw = localStorage.getItem(STORAGE_KEY);
    } catch {
        return { schema: null, wasCorrupted: false };
    }

    if (raw === null) return { schema: null, wasCorrupted: false };

    try {
        const parsed = JSON.parse(raw);
        if (isValidSchema(parsed)) return { schema: parsed, wasCorrupted: false };
        // Parseable JSON but wrong shape (e.g. old version) — treat as corruption
        return { schema: null, wasCorrupted: true };
    } catch {
        // Unparseable JSON
        return { schema: null, wasCorrupted: true };
    }
}

/** Legacy helper kept for compatibility — callers that don't care about
 *  the wasCorrupted flag. */
export function loadStorage(): StorageSchema | null {
    return loadStorageSafe().schema;
}

// ── Save ──────────────────────────────────────────────────────────────

/** Returns true on success, false when quota is exceeded or storage is unavailable. */
export function saveStorage(schema: StorageSchema): boolean {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(schema));
        return true;
    } catch {
        return false;
    }
}

// ── Quota estimate ────────────────────────────────────────────────────

/** Rough estimate of bytes used under the m4rkdown key. */
export function getStorageBytes(): number {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? new Blob([raw]).size : 0;
    } catch {
        return 0;
    }
}
