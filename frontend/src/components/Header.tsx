import { Code } from 'lucide-react';
import { SampleSelector } from './SampleSelector';
import { ThemeToggle } from './ThemeToggle';
import { Sample } from '../data/samples';

interface HeaderProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onSelectSample: (sample: Sample) => void;
  isBackendAvailable: boolean;
}

export function Header({ theme, toggleTheme, onSelectSample, isBackendAvailable }: HeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--bg-panel)]">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[var(--accent)] rounded-lg text-white">
          <Code size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold">CodeLens</h1>
          <p className="text-sm text-[var(--text-secondary)]">Trực quan hóa thuật toán</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isBackendAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-[var(--text-secondary)]">
            {isBackendAvailable ? 'Trực tuyến' : 'Ngoại tuyến (Demo)'}
          </span>
        </div>
        <SampleSelector onSelect={onSelectSample} />
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </div>
    </header>
  );
}

