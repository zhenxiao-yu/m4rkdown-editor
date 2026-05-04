import { Sun, Moon } from 'lucide-react';
import { theme, toggleTheme } from '@/store/theme';

export function ThemeToggle() {
    const isDark = theme.value === 'dark';
    return (
        <button
            class="btn-icon"
            data-tooltip={isDark ? 'Light Mode' : 'Dark Mode'}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            onClick={toggleTheme}
        >
            {isDark
                ? <Sun size={15} strokeWidth={1.75} />
                : <Moon size={15} strokeWidth={1.75} />}
        </button>
    );
}
