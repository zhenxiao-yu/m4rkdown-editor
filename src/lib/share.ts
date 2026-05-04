const HASH_PREFIX = '#doc=';
const MAX_SHARE_BYTES = 60_000;

export function encodeDoc(content: string): string {
    return btoa(encodeURIComponent(content));
}

export function decodeDoc(encoded: string): string {
    return decodeURIComponent(atob(encoded));
}

export function buildShareUrl(content: string): string | null {
    const encoded = encodeDoc(content);
    if (encoded.length > MAX_SHARE_BYTES) return null;
    const url = new URL(window.location.href);
    url.hash = `doc=${encoded}`;
    return url.toString();
}

export function readShareHash(): string | null {
    const hash = window.location.hash;
    if (!hash.startsWith(HASH_PREFIX)) return null;
    try {
        return decodeDoc(hash.slice(HASH_PREFIX.length));
    } catch {
        return null;
    }
}

export function clearShareHash(): void {
    history.replaceState(null, '', window.location.pathname);
}
