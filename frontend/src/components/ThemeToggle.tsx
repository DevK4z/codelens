import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export function ThemeToggle({ theme, toggleTheme }: ThemeToggleProps) {
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md hover:bg-[var(--bg-secondary)] border border-[var(--border)] transition-colors"
      title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

