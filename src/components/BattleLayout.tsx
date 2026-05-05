import '@/styles/arena.css';
import { ArrowLeft } from 'lucide-react';
import { arenaView, arenaReconnecting, arenaReconnectAttempt } from '@/store/arena';
import { playerLevel } from '@/store/arena-stats';
import { returnToMenu } from '@/store/appMode';
import { HomeView } from './arena/HomeView';
import { LobbyView } from './arena/LobbyView';
import { CountdownView } from './arena/CountdownView';
import { GameView } from './arena/GameView';
import { ResultsView } from './arena/ResultsView';

const SHOW_BACK = new Set(['home', 'lobby', 'results']);

function PlayerLevelBadge() {
    const level = playerLevel.value;
    return (
        <div class="battle-level-badge">
            <div class="battle-level-dot" style={{ background: level.color }} />
            {level.title}
        </div>
    );
}

export function BattleLayout() {
    const view             = arenaView.value;
    const reconnecting     = arenaReconnecting.value;
    const reconnectAttempt = arenaReconnectAttempt.value;

    if (view === 'closed') {
        returnToMenu();
        return null;
    }

    function handleBack() { returnToMenu(); }

    function handleCancelReconnect() {
        import('@/lib/partykit-client').then(({ disconnectFromRoom }) => disconnectFromRoom());
        returnToMenu();
    }

    return (
        <div class="battle-layout">
            <div class="battle-aurora-layer" aria-hidden="true" />

            <header class="battle-header">
                <div class="battle-header-left">
                    {SHOW_BACK.has(view) && (
                        <button
                            class="btn-icon"
                            onClick={handleBack}
                            data-tooltip="Back to Menu"
                            aria-label="Back to main menu"
                        >
                            <ArrowLeft size={15} strokeWidth={1.75} />
                        </button>
                    )}
                </div>
                <div class="battle-header-center">⚡ Arena</div>
                <div class="battle-header-right">
                    <PlayerLevelBadge />
                </div>
            </header>

            {view === 'home'      && <HomeView />}
            {view === 'lobby'     && <LobbyView />}
            {view === 'countdown' && <CountdownView />}
            {view === 'game'      && <GameView />}
            {view === 'results'   && <ResultsView />}

            {reconnecting && (
                <div class="arena-reconnect-overlay">
                    <div class="arena-reconnect-spinner" />
                    <div style={{ color: 'var(--c-text)', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 600 }}>
                        Reconnecting… ({reconnectAttempt}/3)
                    </div>
                    <button class="btn-icon" onClick={handleCancelReconnect} style={{ marginTop: 8 }}>
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
}
