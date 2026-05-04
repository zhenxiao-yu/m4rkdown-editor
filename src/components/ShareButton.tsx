import { useState } from 'preact/hooks';
import { markdownSource } from '@/store/editor';
import { buildShareUrl } from '@/lib/share';

export function ShareButton() {
    const [copied, setCopied] = useState(false);

    function handleShare() {
        const url = buildShareUrl(markdownSource.value);
        if (!url) {
            alert('Document is too large to share via URL (max ~60KB).');
            return;
        }
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    return (
        <button
            title="Share document via URL"
            aria-label="Share document via URL"
            onClick={handleShare}
            style={{
                padding: '4px 12px',
                borderRadius: '6px',
                border: `1px solid var(--c-border)`,
                backgroundColor: copied ? 'var(--c-surface)' : 'var(--c-btn)',
                color: copied ? 'var(--c-success)' : 'var(--c-text)',
                fontFamily: 'inherit',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s',
            }}
        >
            {copied ? '✓ Copied' : 'Share'}
        </button>
    );
}
