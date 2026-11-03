import { Code, RefreshCw, BookOpen, Bot } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Sample } from '../data/samples';
import { useState } from 'react';

interface HeaderProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onSelectSample: (sample: Sample) => void;
  onOpenExerciseBank: () => void;
  isBackendAvailable: boolean;
  onCheckConnection: () => Promise<boolean>;
  currentCode: string;
  onOpenTutor?: () => void;
}

export function Header({ theme, toggleTheme, onOpenExerciseBank, isBackendAvailable, onCheckConnection, onOpenTutor }: HeaderProps) {
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    setChecking(true);
    await onCheckConnection();
    setChecking(false);
  };

  return (
    <header className="app-header">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[var(--accent)] rounded-lg text-white">
          <Code size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold">CodeLens</h1>
          <p className="text-sm text-[var(--text-secondary)]">Không gian học thuật toán</p>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-4">
        <button 
          onClick={onOpenExerciseBank}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border border-blue-500/30 rounded-md font-medium text-sm transition-colors"
        >
          <BookOpen size={18} />
          Ngân hàng bài tập
        </button>
        {onOpenTutor && <button
          onClick={onOpenTutor}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 border border-[var(--accent)]/40 rounded-md font-medium text-sm transition-colors"
        >
          <Bot size={18} />
          Trợ lý DSA
        </button>}

        <div className="flex items-center gap-2 bg-[var(--bg-card)] px-3 py-1.5 rounded-full border border-[var(--border)] shadow-sm">
          <div className={`w-2.5 h-2.5 rounded-full ${isBackendAvailable ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></div>
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            {isBackendAvailable ? 'Trực tuyến' : 'Chưa kết nối backend'}
          </span>
          {!isBackendAvailable && (
            <button 
              onClick={handleCheck}
              disabled={checking}
              className="ml-2 text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors disabled:opacity-50"
              title="Thử kết nối lại"
            >
              <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
            </button>
          )}
        </div>

        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </div>
    </header>
  );
}
