export interface DebouncedFn<T extends (...args: any[]) => void> {
    (...args: Parameters<T>): void;
    /** Fire immediately if a call is pending; clears the timer. */
    flush(): void;
    /** Cancel a pending call without firing. */
    cancel(): void;
}

export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): DebouncedFn<T> {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let pendingArgs: Parameters<T> | null = null;

    const wrapped = function (...args: Parameters<T>) {
        pendingArgs = args;
        if (timer !== null) clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            const a = pendingArgs;
            pendingArgs = null;
            if (a) fn(...a);
        }, ms);
    } as DebouncedFn<T>;

    wrapped.flush = function () {
        if (timer !== null && pendingArgs !== null) {
            clearTimeout(timer);
            timer = null;
            const a = pendingArgs;
            pendingArgs = null;
            fn(...a);
        }
    };

    wrapped.cancel = function () {
        if (timer !== null) { clearTimeout(timer); timer = null; }
        pendingArgs = null;
    };

    return wrapped;
}
