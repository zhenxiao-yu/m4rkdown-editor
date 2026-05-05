import { TEMPLATES, type Template } from '@/lib/templates';
import { createDoc, updateDocContent, updateDocTitle } from '@/store/documents';

interface Props { onClose: () => void; }

export function TemplateModal({ onClose }: Props) {
    function useTemplate(tpl: Template) {
        const id = createDoc();
        updateDocContent(id, tpl.content);
        updateDocTitle(id, tpl.name);
        onClose();
    }

    return (
        <>
            <div
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 900, backdropFilter: 'blur(2px)' }}
                onClick={onClose}
            />
            <div class="template-modal" role="dialog" aria-label="Choose a template" aria-modal="true">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--c-border)', flexShrink: 0 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-ui)', color: 'var(--c-text)' }}>
                        New from Template
                    </span>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-muted)', fontSize: 16, lineHeight: 1, padding: '4px 8px' }}
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, padding: 20, overflowY: 'auto' }}>
                    {TEMPLATES.map(tpl => (
                        <button
                            key={tpl.id}
                            class="template-card"
                            onClick={() => useTemplate(tpl)}
                            aria-label={`Use ${tpl.name} template`}
                        >
                            <span style={{ fontSize: 28, lineHeight: 1 }}>{tpl.icon}</span>
                            <span style={{ fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-ui)', color: 'var(--c-text)', marginTop: 8 }}>
                                {tpl.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}
