import { render } from 'preact';
import { App } from './src/app';
import './src/styles/main.css';
import './src/styles/arena.css';
import { inject as injectAnalytics } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';

injectAnalytics();
injectSpeedInsights();

// Handle shared document via URL hash
import { readShareHash, clearShareHash, collabRoomIdFromUrl } from './src/lib/share';
import { createDoc, setActiveDoc, updateDocContent, documentsMap, activeDocId } from './src/store/documents';
import { connectToCollab } from './src/lib/partykit-client';

const sharedContent = readShareHash();
if (sharedContent) {
    const shareUrl = window.location.href;
    const id = createDoc();
    updateDocContent(id, sharedContent);
    setActiveDoc(id);
    const roomId = collabRoomIdFromUrl(shareUrl);
    if (roomId) connectToCollab(roomId);
    clearShareHash();
}

import { disconnectFromCollab } from './src/lib/partykit-client';
window.addEventListener('beforeunload', disconnectFromCollab);

render(<App />, document.getElementById('app')!);
