import { Play, Pause, SkipBack, SkipForward, RotateCcw, Loader2 } from 'lucide-react';

interface ControlBarProps {
  onRun: () => void;
  isLoading: boolean;
  isPlaying: boolean;
  togglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
  currentStep: number;
  totalSteps: number;
  onSeek: (step: number) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  hasTrace: boolean;
}

export function ControlBar({ 
  onRun, isLoading, isPlaying, togglePlay, onNext, onPrev, onReset,
  currentStep, totalSteps, onSeek, speed, onSpeedChange, hasTrace
}: ControlBarProps) {
  const speeds = [0.25, 0.5, 1, 2, 4];
  
  return (
    <div className="flex flex-wrap items-center gap-4 p-3 bg-[var(--bg-panel)] border-b border-[var(--border)] relative z-10">
      <button
        onClick={onRun}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-md font-medium hover:bg-opacity-90 disabled:opacity-50"
      >
        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
        Chạy
      </button>
      
      <div className="h-8 w-px bg-[var(--border)]"></div>
      
      <div className="flex items-center gap-1">
        <button 
          onClick={onReset} disabled={!hasTrace}
          className="p-2 rounded hover:bg-[var(--bg-secondary)] disabled:opacity-30" title="Đặt lại"
        ><RotateCcw size={20} /></button>
        <button 
          onClick={onPrev} disabled={!hasTrace || currentStep === 0}
          className="p-2 rounded hover:bg-[var(--bg-secondary)] disabled:opacity-30" title="Bước trước"
        ><SkipBack size={20} /></button>
        <button 
          onClick={togglePlay} disabled={!hasTrace || currentStep === totalSteps - 1}
          className="p-2 rounded hover:bg-[var(--bg-secondary)] disabled:opacity-30 text-[var(--accent)]" title={isPlaying ? "Tạm dừng" : "Phát"}
        >
          {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
        </button>
        <button 
          onClick={onNext} disabled={!hasTrace || currentStep === totalSteps - 1}
          className="p-2 rounded hover:bg-[var(--bg-secondary)] disabled:opacity-30" title="Bước tiếp"
        ><SkipForward size={20} /></button>
      </div>
      
      <div className="flex-1 min-w-[180px] flex items-center gap-3 px-4">
        <span className="text-sm font-medium whitespace-nowrap w-24">
          Bước {hasTrace ? currentStep + 1 : 0} / {totalSteps}
        </span>
        <input
          aria-label="Bước thực thi"
          type="range"
          min={0}
          max={Math.max(0, totalSteps - 1)}
          value={currentStep}
          onChange={(e) => onSeek(parseInt(e.target.value))}
          disabled={!hasTrace}
          className="w-full cursor-pointer accent-[var(--accent)]"
        />
      </div>
      
      <div className="h-8 w-px bg-[var(--border)]"></div>
      
      <div className="flex items-center gap-1">
        <span className="text-xs text-[var(--text-secondary)] mr-2">Tốc độ:</span>
        {speeds.map(s => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            disabled={!hasTrace}
            className={`px-2 py-1 text-xs rounded border ${speed === s ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'border-[var(--border)] hover:bg-[var(--bg-secondary)]'} disabled:opacity-30`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}

