import { signal } from '@preact/signals';

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

export const toasts = signal<Toast[]>([]);

export function showToast(message: string, type: Toast['type'] = 'info', duration = 3000) {
    const id = crypto.randomUUID();
    toasts.value = [...toasts.value, { id, message, type }];
    setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id);
    }, duration);
}
