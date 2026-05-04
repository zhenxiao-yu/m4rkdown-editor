import { useEffect, useState } from 'preact/hooks';
import { effect } from '@preact/signals';
import { parsedHtml } from '@/store/editor';

interface Heading { id: string; text: string; level: number; }

export function OutlineSidebar() {
    const [headings, setHeadings] = useState<Heading[]>([]);
    const [active, setActive] = useState('');

    useEffect(() => {
        const stop = effect(() => {
            const html = parsedHtml.value;
            const div = document.createElement('div');
            div.innerHTML = html;
            const found: Heading[] = [];
            div.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach((el) => {
                if (el.id) found.push({ id: el.id, text: el.textContent?.trim() ?? '', level: parseInt(el.tagName[1]) });
            });
            setHeadings(found);
        });
        return stop;
    }, []);

    function scrollTo(id: string) {
        const el = document.getElementById(id);
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActive(id);
    }

    if (headings.length === 0) {
        return (
            <div style={sidebarStyle}>
                <div style={headerStyle}>Outline</div>
                <div style={{ padding: '12px 16px', color: 'var(--c-muted)', fontSize: '12px' }}>
                    No headings found.<br />Add # headings to see an outline.
                </div>
            </div>
        );
    }

    return (
        <div style={sidebarStyle}>
            <div style={headerStyle}>Outline</div>
            <div style={{ overflow: 'auto', flex: 1, padding: '8px 0' }}>
                {headings.map((h) => (
                    <button
                        key={h.id}
                        onClick={() => scrollTo(h.id)}
                        title={h.text}
                        style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            background: active === h.id ? 'var(--c-btn)' : 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: `4px 16px 4px ${8 + (h.level - 1) * 12}px`,
                            fontSize: '12px',
                            color: h.level === 1 ? 'var(--c-text)' : h.level === 2 ? 'var(--c-muted)' : 'var(--c-muted)',
                            fontWeight: h.level <= 2 ? 600 : 400,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            opacity: h.level >= 3 ? 0.8 : 1,
                            transition: 'background 0.1s, color 0.1s',
                            lineHeight: '1.5',
                            borderLeft: active === h.id ? '2px solid var(--c-accent)' : '2px solid transparent',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--c-accent)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = h.level <= 2 ? 'var(--c-text)' : 'var(--c-muted)'; }}
                    >
                        {h.text}
                    </button>
                ))}
            </div>
        </div>
    );
}

const sidebarStyle: Record<string, string> = {
    display: 'flex',
    flexDirection: 'column',
    width: '200px',
    minWidth: '200px',
    height: '100%',
    backgroundColor: 'var(--c-surface-alt)',
    borderLeft: '1px solid var(--c-border)',
    overflow: 'hidden',
    flexShrink: '0',
};

const headerStyle: Record<string, string> = {
    padding: '8px 16px',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--c-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    borderBottom: '1px solid var(--c-border)',
    flexShrink: '0',
};
