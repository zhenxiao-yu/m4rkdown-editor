type PendingResolve = (html: string) => void;

const pending = new Map<string, PendingResolve>();

let worker: Worker | null = null;

function getWorker(): Worker {
    if (!worker) {
        worker = new Worker(new URL('../workers/parser.worker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = (e: MessageEvent<{ id: string; html: string; error: string | null }>) => {
            const resolve = pending.get(e.data.id);
            if (resolve) {
                resolve(e.data.error ? '' : e.data.html);
                pending.delete(e.data.id);
            }
        };
        worker.onerror = (err) => {
            console.error('Parser worker error:', err);
        };
    }
    return worker;
}

export function parseAsync(source: string): Promise<string> {
    return new Promise<string>((resolve) => {
        const id = crypto.randomUUID();
        pending.set(id, resolve);
        getWorker().postMessage({ id, source });
    });
}
