import '@/styles/preview.css';
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';
import { useRef, useEffect, useState } from 'preact/hooks';
import { effect } from '@preact/signals';
import { parsedHtml, activeTab, markdownSource } from '@/store/editor';
import { TabBar } from './TabBar';
import { SyntaxTreeTab } from './SyntaxTreeTab';
import { SourceCodeTab } from './SourceCodeTab';
import { highlightCodeBlocks } from '@/lib/highlight';
import { parseAsync } from '@/lib/worker-bridge';
import matter from 'gray-matter';

// ── Mermaid lazy loader ───────────────────────────────────────────────

async function renderMermaid(divs: HTMLElement[]) {
    if (divs.length === 0) return;
    const { default: mermaid } = await import('mermaid');
    const isDark = !document.documentElement.classList.contains('light');
    mermaid.initialize({ startOnLoad: false, theme: isDark ? 'dark' : 'default', securityLevel: 'loose' });
    for (const div of divs) {
        const src = decodeURIComponent(div.getAttribute('data-src') || '');
        const id = `mermaid-${Math.random().toString(36).slice(2, 8)}`;
        try {
            const { svg } = await mermaid.render(id, src);
            div.innerHTML = svg;
            div.className = 'mermaid-rendered';
        } catch {
            div.textContent = src;
            div.style.cssText = 'color:var(--c-danger);font-family:monospace;white-space:pre;font-size:12px';
        }
    }
}

// ── Frontmatter panel ─────────────────────────────────────────────────

function FrontmatterPanel({ data }: { data: Record<string, unknown> }) {
    const [open, setOpen] = useState(true);
    return (
        <div style={{
            borderBottom: '1px solid var(--c-border)',
            fontSize: '12px',
            backgroundColor: 'var(--c-surface)',
        }}>
            <button
                onClick={() => setOpen(!open)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '6px 16px',
                    color: 'var(--c-muted)',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                }}
            >
                <span style={{ transform: open ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform 0.15s' }}>▶</span>
                Frontmatter
            </button>
            {open && (
                <table style={{ width: '100%', borderCollapse: 'collapse', padding: '0 16px 8px' }}>
                    <tbody>
                        {Object.entries(data).map(([k, v]) => (
                            <tr key={k}>
                                <td style={{ padding: '2px 16px 2px', color: 'var(--c-accent)', fontWeight: 600, whiteSpace: 'nowrap', width: 1 }}>{k}</td>
                                <td style={{ padding: '2px 16px 2px', color: 'var(--c-text)' }}>{String(v)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

// ── Rendered preview ─────────────────────────────────────────────────

function RenderedPreview() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [html, setHtml] = useState(() => parsedHtml.value);
    const [frontmatter, setFrontmatter] = useState<Record<string, unknown> | null>(null);

    useEffect(() => {
        const stop = effect(() => {
            const raw = markdownSource.value;
            let content = raw;
            let fm: Record<string, unknown> | null = null;

            try {
                const parsed = matter(raw);
                if (Object.keys(parsed.data).length > 0) {
                    content = parsed.content;
                    fm = parsed.data as Record<string, unknown>;
                }
            } catch { /* malformed YAML — render as-is */ }

            setFrontmatter(fm);
            parseAsync(content)
                .then((result) => setHtml(result || parsedHtml.value))
                .catch(() => setHtml(parsedHtml.value));
        });
        return stop;
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;
        highlightCodeBlocks(containerRef.current);
        const mermaidDivs = Array.from(
            containerRef.current.querySelectorAll<HTMLElement>('.mermaid-pending')
        );
        renderMermaid(mermaidDivs);
    }, [html]);

    return (
        <>
            {frontmatter && <FrontmatterPanel data={frontmatter} />}
            <div
                ref={containerRef}
                class="prose"
                style={{ padding: '24px 28px', minHeight: '100%' }}
                dangerouslySetInnerHTML={{ __html: html }}
            />
        </>
    );
}

// ── Preview pane ──────────────────────────────────────────────────────

export function PreviewPane() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            backgroundColor: 'var(--c-surface)',
            borderLeft: '1px solid var(--c-border)',
        }}>
            <TabBar />
            <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                {activeTab.value === 'preview' && <RenderedPreview />}
                {activeTab.value === 'tree'    && <SyntaxTreeTab />}
                {activeTab.value === 'source'  && <SourceCodeTab />}
            </div>
        </div>
    );
}
