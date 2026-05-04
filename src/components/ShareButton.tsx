import { useState } from 'preact/hooks';
import { Share2, Check } from 'lucide-react';
import { markdownSource } from '@/store/editor';
import { buildShareUrl } from '@/lib/share';
import { showToast } from '@/store/toast';

export function ShareButton() {
    const [copied, setCopied] = useState(false);

    function handleShare() {
        const url = buildShareUrl(markdownSource.value);
        if (!url) {
            showToast('Document is too large to share via URL (max ~60KB).', 'error');
            return;
        }
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            showToast('Share URL copied!', 'success');
            setTimeout(() => setCopied(false), 2000);
        });
    }

    return (
        <button
            class="btn-icon"
            data-tooltip="Share via URL"
            aria-label="Share document via URL"
            onClick={handleShare}
            style={{
                color: copied ? 'var(--c-success)' : undefined,
                borderColor: copied ? 'var(--c-success)' : undefined,
                gap: '4px',
                padding: '4px 10px',
                fontSize: '13px',
                fontFamily: 'var(--font-ui)',
            }}
        >
            {copied
                ? <><Check size={13} strokeWidth={2.5} /> Copied</>
                : <><Share2 size={13} strokeWidth={2} /> Share</>}
        </button>
    );
}
