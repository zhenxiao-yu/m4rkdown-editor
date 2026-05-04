import { parsedHtml } from '@/store/editor';
import beautify from 'js-beautify';

export function SourceCodeTab() {
    let source = '';
    try {
        source = beautify.html(parsedHtml.value, { indent_size: 2 });
    } catch {
        source = parsedHtml.value;
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
            {source}
        </pre>
    );
}
