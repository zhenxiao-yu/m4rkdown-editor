import { useEffect } from 'preact/hooks';
import { PenLine, Swords } from 'lucide-react';
import { enterWriterMode, enterBattleMode } from '@/store/appMode';
import { ThemeToggle } from './ThemeToggle';

export function MainMenu() {
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'w' || e.key === 'W') enterWriterMode();
            if (e.key === 'b' || e.key === 'B') enterBattleMode();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    return (
        <div
            class="menu-bg"
            style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <div style={{ position: 'absolute', top: 16, right: 16 }}>
                <ThemeToggle />
            </div>

            <h1 class="menu-title">M4rkdown</h1>
            <p class="menu-subtitle">Choose your mode</p>

            <div style={{ display: 'flex', gap: 24, marginTop: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button class="mode-card mode-card--writer" onClick={enterWriterMode}>
                    <PenLine size={32} strokeWidth={1.5} />
                    <span class="mode-card__title">Writer</span>
                    <span class="mode-card__desc">Your markdown, beautifully rendered</span>
                    <kbd class="mode-card__key">W</kbd>
                </button>

                <button class="mode-card mode-card--battle" onClick={enterBattleMode}>
                    <Swords size={32} strokeWidth={1.5} />
                    <span class="mode-card__title">Battle</span>
                    <span class="mode-card__desc">Type fast. Beat everyone.</span>
                    <span class="menu-live-badge">
                        <span class="menu-live-dot" />
                        LIVE
                    </span>
                    <kbd class="mode-card__key">B</kbd>
                </button>
            </div>

            <p style={{ position: 'absolute', bottom: 20, color: 'var(--c-muted)', fontSize: '12px', fontFamily: 'var(--font-ui)' }}>
                Press <kbd style={{ background: 'var(--c-surface-raised)', border: '1px solid var(--c-border-strong)', borderRadius: 3, padding: '1px 5px', fontFamily: 'var(--font-mono)', fontSize: 11 }}>W</kbd>{' '}
                or <kbd style={{ background: 'var(--c-surface-raised)', border: '1px solid var(--c-border-strong)', borderRadius: 3, padding: '1px 5px', fontFamily: 'var(--font-mono)', fontSize: 11 }}>B</kbd>{' '}
                to jump in
            </p>
        </div>
    );
}
