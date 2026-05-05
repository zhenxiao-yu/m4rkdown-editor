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

const STORAGE_KEY = 'm4rkdown_v1';

export function loadStorage(): StorageSchema | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as StorageSchema;
        if (parsed.version !== 1) return null;
        return parsed;
    } catch {
        return null;
    }
}

export function saveStorage(schema: StorageSchema): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(schema));
    } catch {
        // localStorage quota exceeded — silently drop the save
    }
}
