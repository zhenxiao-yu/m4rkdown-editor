import { useState } from 'preact/hooks';
import { Share2, Check } from 'lucide-react';
import { markdownSource } from '@/store/editor';
import { buildShareUrl, collabRoomIdFromUrl } from '@/lib/share';
import { showToast } from '@/store/toast';
import { connectToCollab } from '@/lib/partykit-client';
import { collabConnected } from '@/store/collab';

export function ShareButton() {
    const [copied, setCopied] = useState(false);
    const isCollab = collabConnected.value;

    function handleShare() {
        const url = buildShareUrl(markdownSource.value);
        if (!url) {
            showToast('Document is too large to share via URL (max ~60KB).', 'error');
            return;
        }
        const roomId = collabRoomIdFromUrl(url);
        if (!isCollab && roomId) connectToCollab(roomId);
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            showToast('Share URL copied! Others can join your session.', 'success');
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
