import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    loadStorageSafe,
    saveStorage,
    isValidBackup,
    getStorageBytes,
    type StorageSchema,
    type DocEntry,
    type BackupSchema,
} from '@/lib/storage';

// ── localStorage mock ────────────────────────────────────────────────
const store: Record<string, string> = {};
const localStorageMock = {
    getItem:    (k: string) => store[k] ?? null,
    setItem:    (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear:      () => { for (const k in store) delete store[k]; },
};
vi.stubGlobal('localStorage', localStorageMock);

const STORAGE_KEY = 'm4rkdown_v1';

function makeDoc(overrides: Partial<DocEntry> = {}): DocEntry {
    return {
        id: 'test-id',
        title: 'Test',
        content: '# Hello',
        createdAt: 1000,
        updatedAt: 2000,
        ...overrides,
    };
}

function makeSchema(overrides: Partial<StorageSchema> = {}): StorageSchema {
    const doc = makeDoc();
    return {
        version: 1,
        activeDocId: doc.id,
        theme: 'dark',
        splitRatio: 0.5,
        documents: { [doc.id]: doc },
        ...overrides,
    };
}

beforeEach(() => {
    localStorageMock.clear();
});

// ── loadStorageSafe ───────────────────────────────────────────────────

describe('loadStorageSafe', () => {
    it('returns null + wasCorrupted=false when key absent', () => {
        const { schema, wasCorrupted } = loadStorageSafe();
        expect(schema).toBeNull();
        expect(wasCorrupted).toBe(false);
    });

    it('returns valid schema when stored data is well-formed', () => {
        const data = makeSchema();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        const { schema, wasCorrupted } = loadStorageSafe();
        expect(wasCorrupted).toBe(false);
        expect(schema).not.toBeNull();
        expect(schema?.version).toBe(1);
        expect(schema?.activeDocId).toBe('test-id');
    });

    it('returns wasCorrupted=true on invalid JSON', () => {
        localStorage.setItem(STORAGE_KEY, '{ not valid json ~~~');
        const { schema, wasCorrupted } = loadStorageSafe();
        expect(schema).toBeNull();
        expect(wasCorrupted).toBe(true);
    });

    it('returns wasCorrupted=true on valid JSON with wrong shape', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, junk: true }));
        const { schema, wasCorrupted } = loadStorageSafe();
        expect(schema).toBeNull();
        expect(wasCorrupted).toBe(true);
    });

    it('returns wasCorrupted=true when a document entry is missing fields', () => {
        const data = makeSchema();
        // Corrupt one doc entry
        (data.documents['test-id'] as unknown as Record<string, unknown>).content = undefined;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        const { schema, wasCorrupted } = loadStorageSafe();
        expect(schema).toBeNull();
        expect(wasCorrupted).toBe(true);
    });

    it('accepts both light and dark themes', () => {
        for (const t of ['light', 'dark'] as const) {
            const data = makeSchema({ theme: t });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            const { schema } = loadStorageSafe();
            expect(schema?.theme).toBe(t);
        }
    });
});

// ── saveStorage ───────────────────────────────────────────────────────

describe('saveStorage', () => {
    it('returns true and persists the schema', () => {
        const data = makeSchema();
        const ok = saveStorage(data);
        expect(ok).toBe(true);
        const raw = localStorage.getItem(STORAGE_KEY);
        expect(raw).not.toBeNull();
        const parsed = JSON.parse(raw!);
        expect(parsed.activeDocId).toBe('test-id');
    });

    it('returns false when localStorage.setItem throws (quota exceeded)', () => {
        const throwing = {
            ...localStorageMock,
            setItem: () => { throw new DOMException('QuotaExceededError'); },
        };
        vi.stubGlobal('localStorage', throwing);
        const ok = saveStorage(makeSchema());
        expect(ok).toBe(false);
        vi.stubGlobal('localStorage', localStorageMock);
    });
});

// ── isValidBackup ─────────────────────────────────────────────────────

describe('isValidBackup', () => {
    function makeBackup(overrides: Partial<BackupSchema> = {}): BackupSchema {
        return {
            type: 'backup',
            version: 1,
            appVersion: '3.1.0',
            exportedAt: Date.now(),
            documentCount: 1,
            documents: [makeDoc()],
            ...overrides,
        };
    }

    it('accepts a well-formed backup', () => {
        expect(isValidBackup(makeBackup())).toBe(true);
    });

    it('rejects null', () => {
        expect(isValidBackup(null)).toBe(false);
    });

    it('rejects wrong type field', () => {
        expect(isValidBackup(makeBackup({ type: 'other' as 'backup' }))).toBe(false);
    });

    it('rejects wrong version', () => {
        expect(isValidBackup(makeBackup({ version: 2 as 1 }))).toBe(false);
    });

    it('rejects non-array documents', () => {
        expect(isValidBackup({ ...makeBackup(), documents: {} })).toBe(false);
    });

    it('rejects backup with a malformed doc entry', () => {
        const bad = makeBackup();
        (bad.documents[0] as unknown as Record<string, unknown>).id = undefined;
        expect(isValidBackup(bad)).toBe(false);
    });

    it('accepts backup with zero documents', () => {
        expect(isValidBackup(makeBackup({ documents: [], documentCount: 0 }))).toBe(true);
    });
});

// ── getStorageBytes ───────────────────────────────────────────────────

describe('getStorageBytes', () => {
    it('returns 0 when no data stored', () => {
        expect(getStorageBytes()).toBe(0);
    });

    it('returns positive byte count when data is stored', () => {
        saveStorage(makeSchema());
        expect(getStorageBytes()).toBeGreaterThan(0);
    });
});
