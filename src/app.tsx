import { lazy, Suspense } from 'preact/compat';
import { appMode } from '@/store/appMode';
import { AppLayout } from './components/AppLayout';

const MainMenu     = lazy(() => import('./components/MainMenu').then(m => ({ default: m.MainMenu })));
const BattleLayout = lazy(() => import('./components/BattleLayout').then(m => ({ default: m.BattleLayout })));

export function App() {
    const mode = appMode.value;
    return (
        <Suspense fallback={<div style={{ height: '100vh', background: 'var(--c-bg)' }} />}>
            {mode === 'menu'   && <MainMenu />}
            {mode === 'writer' && <AppLayout />}
            {mode === 'battle' && <BattleLayout />}
        </Suspense>
    );
}
