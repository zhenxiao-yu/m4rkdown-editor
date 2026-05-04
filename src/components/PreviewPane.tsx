import '@/styles/preview.css';
import 'highlight.js/styles/github-dark.css';
import { useRef, useEffect, useState } from 'preact/hooks';
import { effect } from '@preact/signals';
import { parsedHtml, activeTab, markdownSource } from '@/store/editor';
import { TabBar } from './TabBar';
import { SyntaxTreeTab } from './SyntaxTreeTab';
import { SourceCodeTab } from './SourceCodeTab';
import { highlightCodeBlocks } from '@/lib/highlight';
import { parseAsync } from '@/lib/worker-bridge';

function RenderedPreview() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [html, setHtml] = useState(() => parsedHtml.value);

    useEffect(() => {
        const stopEffect = effect(() => {
            const src = markdownSource.value;
            parseAsync(src).then((result) => {
                setHtml(result || parsedHtml.value);
            }).catch(() => {
                setHtml(parsedHtml.value);
            });
        });
        return stopEffect;
    }, []);

    useEffect(() => {
        if (containerRef.current) {
            highlightCodeBlocks(containerRef.current);
        }
    }, [html]);

    return (
        <div
            ref={containerRef}
            class="prose"
            style={{ padding: '24px 28px', minHeight: '100%' }}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

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
