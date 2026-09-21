import { TraceEvent } from '../engine/types';

interface CallStackPanelProps {
  event: TraceEvent | null;
}

export function CallStackPanel({ event }: CallStackPanelProps) {
  if (!event) return <div className="p-4 text-[var(--text-secondary)]">Chưa có dữ liệu. Hãy chạy chương trình.</div>;
  if (event.callStack.length === 0) return <div className="p-4 text-[var(--text-secondary)]">Call stack rỗng.</div>;

  // Reverse so most recent is at top
  const reversedStack = [...event.callStack].reverse();

  return (
    <div className="overflow-auto h-full p-0">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase bg-[var(--bg-secondary)] sticky top-0 border-b border-[var(--border)] shadow-sm">
          <tr>
            <th className="px-4 py-2 font-medium">Hàm</th>
            <th className="px-4 py-2 font-medium">Tham số</th>
            <th className="px-4 py-2 font-medium">Dòng</th>
          </tr>
        </thead>
        <tbody>
          {reversedStack.map((frame, idx) => {
            const isTop = idx === 0;
            return (
              <tr key={idx} className={`border-b border-[var(--border)] ${isTop ? 'bg-[var(--accent)] bg-opacity-10 border-l-4 border-l-[var(--accent)]' : ''}`}>
                <td className="px-4 py-2 font-mono font-medium flex items-center gap-2">
                  {frame.func}
                  {isTop && <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--accent)] text-white">HIỆN TẠI</span>}
                </td>
                <td className="px-4 py-2 font-mono text-[var(--text-secondary)]">
                  {frame.params ? Object.entries(frame.params).map(([k, v]) => `${k}=${v}`).join(', ') : '-'}
                </td>
                <td className="px-4 py-2 font-mono text-[var(--text-secondary)]">{frame.line}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

