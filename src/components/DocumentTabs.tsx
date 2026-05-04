import { useState, useEffect, useRef } from 'preact/hooks';
import { Plus, X } from 'lucide-react';
import autoAnimate from '@formkit/auto-animate';
import { docList, activeDocId, setActiveDoc, createDoc, deleteDoc, updateDocTitle } from '@/store/documents';
import { showToast } from '@/store/toast';

export function DocumentTabs() {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const tabListRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (tabListRef.current) {
            autoAnimate(tabListRef.current, { duration: 150, easing: 'ease-out' });
        }
    }, []);

    const docs = docList.value;
    const activeid = activeDocId.value;

    function startRename(id: string, title: string) { setEditingId(id); setEditTitle(title); }
    function commitRename(id: string) { updateDocTitle(id, editTitle); setEditingId(null); }

    function handleDelete(e: MouseEvent, id: string, title: string) {
        e.stopPropagation();
        if (confirm(`Delete "${title}"?`)) {
            deleteDoc(id);
            showToast(`"${title}" deleted`, 'info');
        }
    }

    return (
        <div
            ref={tabListRef}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                padding: '0 8px',
                backgroundColor: 'var(--c-surface-alt)',
                borderBottom: '1px solid var(--c-border)',
                overflowX: 'auto',
                flexShrink: 0,
                height: '36px',
            }}
        >
            {docs.map((doc) => {
                const isActive = doc.id === activeid;
                return (
                    <div
                        key={doc.id}
                        class={`doc-tab${isActive ? ' doc-tab--active' : ''}`}
                        onClick={() => setActiveDoc(doc.id)}
                        role="tab"
                        aria-selected={isActive}
                    >
                        {editingId === doc.id ? (
                            <input
                                autoFocus
                                value={editTitle}
                                onInput={(e) => setEditTitle((e.target as HTMLInputElement).value)}
                                onBlur={() => commitRename(doc.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') commitRename(doc.id);
                                    if (e.key === 'Escape') setEditingId(null);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: '100px',
                                    backgroundColor: 'var(--c-btn)',
                                    color: 'var(--c-text)',
                                    border: '1px solid var(--c-accent)',
                                    borderRadius: '3px',
                                    padding: '1px 4px',
                                    fontSize: '12px',
                                    fontFamily: 'var(--font-ui)',
                                    outline: 'none',
                                }}
                            />
                        ) : (
                            <span
                                style={{
                                    fontSize: '12px',
                                    color: isActive ? 'var(--c-text)' : 'var(--c-muted)',
                                    maxWidth: '120px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    userSelect: 'none',
                                }}
                                onDblClick={(e) => { e.stopPropagation(); startRename(doc.id, doc.title); }}
                                title={`${doc.title} — double-click to rename`}
                            >
                                {doc.title}
                            </span>
                        )}
                        {docs.length > 1 && (
                            <button
                                class="doc-tab__close"
                                title={`Close "${doc.title}"`}
                                aria-label={`Close ${doc.title}`}
                                onClick={(e) => handleDelete(e as unknown as MouseEvent, doc.id, doc.title)}
                            >
                                <X size={11} strokeWidth={2.5} />
                            </button>
                        )}
                    </div>
                );
            })}
            <button
                class="btn-icon"
                data-tooltip="New document"
                data-tooltip-shortcut="Ctrl+N"
                aria-label="New document"
                onClick={createDoc}
                style={{ marginLeft: '4px', padding: '3px 6px', flexShrink: 0, color: 'var(--c-muted)', borderColor: 'var(--c-border)' }}
            >
                <Plus size={13} strokeWidth={2.5} />
            </button>
        </div>
    );
}
