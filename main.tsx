import { render } from 'preact';
import { App } from './src/app';
import './src/styles/main.css';

// Handle shared document via URL hash
import { readShareHash, clearShareHash } from './src/lib/share';
import { createDoc, setActiveDoc, updateDocContent, documentsMap, activeDocId } from './src/store/documents';

const sharedContent = readShareHash();
if (sharedContent) {
    const id = createDoc();
    // createDoc sets activeDocId to the new doc and defaults content to ''
    updateDocContent(id, sharedContent);
    setActiveDoc(id);
    clearShareHash();
}

render(<App />, document.getElementById('app')!);
