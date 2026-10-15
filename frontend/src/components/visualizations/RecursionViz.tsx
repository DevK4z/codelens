import type { TraceEvent } from '../../engine/types';
import { formatObserved } from '../../engine/stepState';

export function RecursionViz({ event }: {event: TraceEvent | null}) {
  if (!event?.callStack.length) return null;
  return <section className="p-4 w-full" aria-label="Chuỗi lời gọi đang hoạt động">
    <h3 className="font-semibold mb-2">Chuỗi lời gọi · {event.callStack.length} frame</h3>
    <p className="text-xs text-[var(--text-secondary)] mb-3">Thứ tự #1 → #{event.callStack.length}: hàm gọi → hàm hiện tại. Chỉ hiển thị các lời gọi còn trong ngăn xếp.</p>
    <ol className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2">
      {event.callStack.map((frame, index) => {
        const active = index === event.callStack.length - 1;
        return <li key={frame.id ?? index} className={`rounded-lg border p-3 min-w-0 ${active ? 'border-emerald-400 bg-emerald-500/10' : 'border-[var(--border)] bg-[var(--bg-panel)]'}`}>
          <div className="flex flex-wrap gap-2 justify-between text-xs mb-1">
            <span>#{index + 1} · Dòng {frame.line}</span>
            <span className={active ? 'text-emerald-400' : 'text-[var(--text-secondary)]'}>{active ? 'ĐANG Ở ĐÂY' : 'CHỜ LỜI GỌI CON'}</span>
          </div>
          <div className="font-mono text-sm break-words font-semibold">{frame.func}</div>
          <div className="font-mono text-xs break-words mt-1">
            {frame.params === undefined ? 'Bản ghi chưa cung cấp tham số của frame này.' : Object.keys(frame.params).length ? Object.entries(frame.params).map(([key,value]) => `${key} = ${formatObserved(value)}`).join('; ') : 'Không có tham số được ghi nhận.'}
          </div>
          {frame.returnValue !== undefined && <p className="text-xs mt-1">Giá trị trả về được ghi nhận: {formatObserved(frame.returnValue)}</p>}
        </li>;
      })}
    </ol>
  </section>;
}
