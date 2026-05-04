import { theme, toggleTheme } from '@/store/theme';

export function ThemeToggle() {
    const isDark = theme.value === 'dark';
    return (
        <button
            class="btn-icon"
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            onClick={toggleTheme}
        >
            {isDark ? '☀️' : '🌙'}
        </button>
    );
}
