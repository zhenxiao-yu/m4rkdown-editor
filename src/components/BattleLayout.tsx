import '@/styles/arena.css';
import { ArrowLeft } from 'lucide-react';
import { arenaView } from '@/store/arena';
import { returnToMenu } from '@/store/appMode';
import { HomeView } from './arena/HomeView';
import { LobbyView } from './arena/LobbyView';
import { CountdownView } from './arena/CountdownView';
import { GameView } from './arena/GameView';
import { ResultsView } from './arena/ResultsView';

const SHOW_BACK = new Set(['home', 'lobby', 'results']);

export function BattleLayout() {
    const view = arenaView.value;

    if (view === 'closed') {
        returnToMenu();
        return null;
    }

    function handleBack() { returnToMenu(); }

    return (
        <div class="battle-layout">
            {SHOW_BACK.has(view) && (
                <button
                    class="battle-back-btn btn-icon"
                    onClick={handleBack}
                    data-tooltip="Back to Menu"
                    aria-label="Back to main menu"
                >
                    <ArrowLeft size={15} strokeWidth={1.75} />
                </button>
            )}

            {view === 'home'      && <HomeView />}
            {view === 'lobby'     && <LobbyView />}
            {view === 'countdown' && <CountdownView />}
            {view === 'game'      && <GameView />}
            {view === 'results'   && <ResultsView />}
        </div>
    );
}
