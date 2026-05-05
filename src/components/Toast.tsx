import { useEffect, useRef } from 'preact/hooks';
import autoAnimate from '@formkit/auto-animate';
import { Check, AlertCircle, Info } from 'lucide-react';
import { toasts } from '@/store/toast';

export function ToastStack() {
    const items = toasts.value;
    const stackRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (stackRef.current) autoAnimate(stackRef.current, { duration: 200 });
    }, []);

    return (
        <div class="toast-stack" ref={stackRef} aria-live="polite" aria-label="Notifications">
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
