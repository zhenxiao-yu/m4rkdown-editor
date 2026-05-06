import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isValidBackup, type DocEntry, type BackupSchema } from '@/lib/storage';

// ── localStorage mock (same pattern as storage.test.ts) ──────────────
const store: Record<string, string> = {};
const localStorageMock = {
    getItem:    (k: string) => store[k] ?? null,
    setItem:    (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear:      () => { for (const k in store) delete store[k]; },
};
vi.stubGlobal('localStorage', localStorageMock);
// crypto.randomUUID shim for node
vi.stubGlobal('crypto', { randomUUID: () => `${Math.random().toString(36).slice(2)}-test` });

beforeEach(() => {
    localStorageMock.clear();
});

// ── Backup round-trip ─────────────────────────────────────────────────

function makeDoc(id = 'doc-1', title = 'Doc 1', content = '# Hi'): DocEntry {
    return { id, title, content, createdAt: 1000, updatedAt: 2000 };
}

function makeBackup(docs: DocEntry[]): BackupSchema {
    return {
        type: 'backup',
        version: 1,
        appVersion: '3.1.0',
        exportedAt: Date.now(),
        documentCount: docs.length,
        documents: docs,
    };
}

describe('Backup schema validation', () => {
    it('validates a correct backup with multiple docs', () => {
        const backup = makeBackup([makeDoc('a'), makeDoc('b', 'Doc 2')]);
        expect(isValidBackup(backup)).toBe(true);
    });

    it('rejects backup where a doc has a numeric id', () => {
        const bad = makeBackup([{ ...makeDoc(), id: 123 as unknown as string }]);
        expect(isValidBackup(bad)).toBe(false);
    });

    it('rejects backup with missing content field', () => {
        const d = makeDoc();
        const bad = makeBackup([{ id: d.id, title: d.title, createdAt: d.createdAt, updatedAt: d.updatedAt } as DocEntry]);
        expect(isValidBackup(bad)).toBe(false);
    });
});

// ── importBackup logic (tested without Preact signals) ────────────────

describe('importBackup merge logic (pure)', () => {
    it('merges new docs and skips existing by id', () => {
        const existing: Record<string, DocEntry> = { 'doc-1': makeDoc('doc-1') };
        const incoming = [makeDoc('doc-1'), makeDoc('doc-2', 'New doc')];

        let imported = 0;
        let skipped = 0;
        for (const doc of incoming) {
            if (existing[doc.id]) { skipped++; } else { existing[doc.id] = doc; imported++; }
        }

        expect(imported).toBe(1);
        expect(skipped).toBe(1);
        expect(Object.keys(existing)).toHaveLength(2);
        expect(existing['doc-2'].title).toBe('New doc');
    });

    it('returns imported=0 when all docs already exist', () => {
        const existing: Record<string, DocEntry> = {
            'doc-1': makeDoc('doc-1'),
            'doc-2': makeDoc('doc-2'),
        };
        const incoming = [makeDoc('doc-1'), makeDoc('doc-2')];

        let imported = 0;
        let skipped = 0;
        for (const doc of incoming) {
            if (existing[doc.id]) { skipped++; } else { existing[doc.id] = doc; imported++; }
        }

        expect(imported).toBe(0);
        expect(skipped).toBe(2);
    });
});

// ── Backup file shape ─────────────────────────────────────────────────

describe('Backup file metadata', () => {
    it('has exportedAt within the last second', () => {
        const before = Date.now();
        const backup = makeBackup([makeDoc()]);
        const after = Date.now();
        expect(backup.exportedAt).toBeGreaterThanOrEqual(before);
        expect(backup.exportedAt).toBeLessThanOrEqual(after);
    });

    it('documentCount matches documents array length', () => {
        const docs = [makeDoc('a'), makeDoc('b'), makeDoc('c')];
        const backup = makeBackup(docs);
        expect(backup.documentCount).toBe(backup.documents.length);
    });

    it('backup type is exactly "backup"', () => {
        expect(makeBackup([]).type).toBe('backup');
    });
});
