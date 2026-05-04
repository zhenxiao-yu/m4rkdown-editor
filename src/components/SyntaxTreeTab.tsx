import { markdownSource } from '@/store/editor';
import Markdown from '@/core';

export function SyntaxTreeTab() {
    let tree = '';
    try {
        tree = new Markdown(markdownSource.value).getSyntaxTree();
    } catch {
        tree = '// Error building syntax tree';
    }

    return (
        <pre style={{
            margin: 0,
            padding: '16px',
            color: 'var(--c-text)',
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: '13px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflow: 'auto',
            height: '100%',
            backgroundColor: 'transparent',
        }}>
            {tree}
        </pre>
    );
}
