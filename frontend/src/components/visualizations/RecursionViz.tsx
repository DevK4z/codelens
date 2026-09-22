import { TraceEvent } from '../../engine/types';

interface RecursionVizProps {
  event: TraceEvent | null;
}

export function RecursionViz({ event }: RecursionVizProps) {
  if (!event || event.callStack.length === 0) return null;

  return (
    <div className="p-8 flex flex-col items-center min-h-[300px] w-full">
      <h3 className="mb-4 text-lg font-semibold">Ngăn xếp lời gọi hàm</h3>
      <div className="flex flex-col items-center gap-4">
        {event.callStack.map((frame, idx) => {
          const isActive = idx === event.callStack.length - 1;
          const isReturned = frame.returnValue !== undefined;
          
          return (
            <div key={frame.id ?? idx} className="flex flex-col items-center">
              {idx > 0 && <div className="h-6 border-l-2 border-[var(--border)]"></div>}
              <div 
                className={`px-4 py-2 border rounded-lg min-w-[150px] text-center transition-all ${
                  isActive 
                    ? 'border-[var(--color-active)] bg-[var(--color-active)] bg-opacity-10 shadow-[0_0_10px_rgba(34,197,94,0.3)]' 
                    : isReturned 
                      ? 'border-[var(--text-secondary)] opacity-70'
                      : 'border-[var(--border)] bg-[var(--bg-panel)]'
                }`}
              >
                <div className="font-mono font-semibold">{frame.func}</div>
                {frame.params && (
                  <div className="text-xs text-[var(--text-secondary)] mt-1">
                    {Object.entries(frame.params).map(([k, v]) => `${k}=${v}`).join(', ')}
                  </div>
                )}
                {isReturned && (
                  <div className="text-xs font-bold text-[var(--accent)] mt-1">
                    ↳ Trả về: {frame.returnValue}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

