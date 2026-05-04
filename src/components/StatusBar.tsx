import { markdownSource } from '@/store/editor';

function countWords(text: string): number {
    return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

export function StatusBar() {
    const src = markdownSource.value;
    const words = countWords(src);
    const chars = src.length;
    const lines = src === '' ? 0 : src.split('\n').length;
    const readTime = Math.max(1, Math.ceil(words / 200));

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '0 16px',
            height: '28px',
            backgroundColor: 'var(--c-surface-alt)',
            borderTop: '1px solid var(--c-border)',
            flexShrink: 0,
            fontSize: '11px',
            color: 'var(--c-muted)',
            fontFamily: "'Courier New', Courier, monospace",
            userSelect: 'none',
        }}>
            <span title="Word count">{words.toLocaleString()} words</span>
            <span style={{ color: 'var(--c-border)' }}>|</span>
            <span title="Character count">{chars.toLocaleString()} chars</span>
            <span style={{ color: 'var(--c-border)' }}>|</span>
            <span title="Line count">{lines.toLocaleString()} lines</span>
            <span style={{ color: 'var(--c-border)' }}>|</span>
            <span title="Estimated read time">~{readTime} min read</span>
            <div style={{ flex: 1 }} />
            <span style={{ color: 'var(--c-border)' }}>M4rkdown v2.0</span>
        </div>
    );
}
