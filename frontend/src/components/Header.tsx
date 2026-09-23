import { Code, RefreshCw } from 'lucide-react';
import { SampleSelector } from './SampleSelector';
import { ThemeToggle } from './ThemeToggle';
import { Sample } from '../data/samples';
import { useState } from 'react';

interface HeaderProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onSelectSample: (sample: Sample) => void;
  isBackendAvailable: boolean;
  onCheckConnection: () => Promise<boolean>;
  currentCode: string;
}

export function Header({ theme, toggleTheme, onSelectSample, isBackendAvailable, onCheckConnection, currentCode }: HeaderProps) {
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    setChecking(true);
    await onCheckConnection();
    setChecking(false);
  };

  return (
    <header className="flex flex-wrap gap-3 items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--bg-panel)]">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[var(--accent)] rounded-lg text-white">
          <Code size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold">CodeLens</h1>
          <p className="text-sm text-[var(--text-secondary)]">Trực quan hóa thuật toán</p>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-4">
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
        <SampleSelector onSelect={onSelectSample} currentCode={currentCode} />
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </div>
    </header>
  );
}

