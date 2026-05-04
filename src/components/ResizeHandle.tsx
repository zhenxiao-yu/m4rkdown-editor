import { useRef, useState } from 'preact/hooks';
import { splitRatio, persistSplitRatio } from '@/store/layout';

export function ResizeHandle() {
    const [dragging, setDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    function onPointerDown(e: PointerEvent) {
        e.preventDefault();
        setDragging(true);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
        if (!dragging) return;
        const handle = e.currentTarget as HTMLElement;
        const container = handle.parentElement;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        splitRatio.value = Math.max(0.20, Math.min(0.80, ratio));
    }

    function onPointerUp(e: PointerEvent) {
        if (!dragging) return;
        setDragging(false);
        persistSplitRatio(splitRatio.value);
    }

    return (
        <div
            ref={containerRef}
            class={`resize-handle${dragging ? ' resize-handle--dragging' : ''}`}
            onPointerDown={onPointerDown as unknown as (e: Event) => void}
            onPointerMove={onPointerMove as unknown as (e: Event) => void}
            onPointerUp={onPointerUp as unknown as (e: Event) => void}
            role="separator"
            aria-label="Resize editor/preview split"
            aria-orientation="vertical"
        />
    );
}
