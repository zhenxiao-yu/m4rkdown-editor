import { Check, AlertCircle, Info } from 'lucide-react';
import { toasts } from '@/store/toast';

export function ToastStack() {
    const items = toasts.value;
    if (items.length === 0) return null;

    return (
        <div class="toast-stack" aria-live="polite" aria-label="Notifications">
            {items.map((t) => (
                <div key={t.id} class={`toast toast--${t.type}`} role="status">
                    {t.type === 'success' && <Check size={14} strokeWidth={2.5} color="var(--c-success)" />}
                    {t.type === 'error'   && <AlertCircle size={14} strokeWidth={2} color="var(--c-danger)" />}
                    {t.type === 'info'    && <Info size={14} strokeWidth={2} color="#4a9eff" />}
                    <span>{t.message}</span>
                </div>
            ))}
        </div>
    );
}
