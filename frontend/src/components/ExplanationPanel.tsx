import { useState } from 'react';
import { TraceEvent } from '../engine/types';
import { generateExplanation } from '../engine/explanations';

interface ExplanationPanelProps {
  event: TraceEvent | null;
  prevEvent: TraceEvent | null;
}

export function ExplanationPanel({ event, prevEvent }: ExplanationPanelProps) {
  const [activeTab, setActiveTab] = useState<'current' | 'overview'>('current');

  return (
    <div className="h-full flex flex-col">
      <div className="flex border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <button 
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'current' ? 'text-[var(--accent)] border-b-2 border-[var(--accent)] bg-[var(--bg-panel)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          onClick={() => setActiveTab('current')}
        >
          🔍 Quan sát
        </button>
        <button 
          className={`px-4 py-2 text-sm font-medium flex items-center gap-1 ${activeTab === 'overview' ? 'text-[var(--accent)] border-b-2 border-[var(--accent)] bg-[var(--bg-panel)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          onClick={() => setActiveTab('overview')}
        >
          🤖 AI (chưa kích hoạt)
        </button>
      </div>
      
      <div className="flex-1 p-4 overflow-auto">
        {activeTab === 'current' ? (
          <div>
            {!event ? (
              <p className="text-[var(--text-secondary)] italic">Chưa có dữ liệu. Hãy chạy chương trình.</p>
            ) : (
              <div className="fade-in space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-[var(--accent)] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {event.step + 1}
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Dòng {event.line}:</h3>
                    <p className="text-lg">{generateExplanation(event, prevEvent || undefined)}</p>
                    
                    {event.detail && (
                      <p className="mt-2 text-sm text-[var(--text-secondary)] bg-[var(--bg-secondary)] p-2 rounded">
                        Chi tiết: {event.detail}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-[var(--text-secondary)] h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <span className="text-4xl mb-4">🤖</span>
            <p>Tính năng giải thích thuật toán bằng AI sẽ được bổ sung.</p>
            <p className="mt-2 text-sm">Hiện tại, hãy quan sát từng bước thực thi ở tab "Quan sát".</p>
          </div>
        )}
      </div>
    </div>
  );
}

