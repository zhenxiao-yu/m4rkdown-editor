import { activeTab, type TabId } from '@/store/editor';

const TABS: { id: TabId; label: string }[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'tree', label: 'Syntax Tree' },
    { id: 'source', label: 'Source HTML' },
];

export function TabBar() {
    return (
        <div style={{
            display: 'flex',
            gap: '6px',
            padding: '10px 12px',
            borderBottom: '1px solid var(--c-border)',
            backgroundColor: 'var(--c-surface)',
            flexShrink: 0,
        }}>
            {TABS.map((tab) => {
                const isActive = activeTab.value === tab.id;
                return (
                    <button
                        key={tab.id}
                        class={`tab-btn${isActive ? ' tab-btn--active' : ''}`}
                        onClick={() => { activeTab.value = tab.id; }}
                        aria-pressed={isActive}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
