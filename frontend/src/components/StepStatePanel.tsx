import type { TraceEvent } from '../engine/types';
import { formatObserved, observedScalars, sameCallContext } from '../engine/stepState';

export function StepStatePanel({event, previous}: {event: TraceEvent; previous?: TraceEvent | null}) {
  const values = observedScalars(event, previous);
  const frame = event.callStack[event.callStack.length - 1];
  const changedContext = previous && !sameCallContext(event, previous);
  return <section className="p-4 border-b border-[var(--border)]" aria-label="Trạng thái tại bước hiện tại">
    <div className="flex flex-wrap justify-between gap-2 mb-3 text-sm">
      <strong>{frame?.func || 'Trạng thái chương trình'}</strong>
      <span className="text-[var(--text-secondary)]">{event.detail?.startsWith('GCC/GDB:') ? 'Trước dòng ' : 'Dòng '}{event.line}</span>
    </div>
    {previous && <p className="text-xs mb-3 text-[var(--text-secondary)]">
      Điểm dừng: dòng {previous.line} → dòng {event.line}.
      {changedContext ? ' Đã đổi ngữ cảnh gọi hàm; không so sánh các biến khác frame.' : ' Mũi tên giá trị biểu thị thay đổi giữa hai điểm dừng.'}
    </p>}
    <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2">
      {values.slice(0,12).map(v => <div key={v.name} className={`min-w-0 rounded border p-2 ${v.changed ? 'border-orange-400 bg-orange-500/10' : 'border-[var(--border)] bg-[var(--bg-panel)]'}`}>
        <div className="text-xs text-[var(--text-secondary)] font-mono break-all">{v.name}</div>
        <div className="font-mono text-sm break-words mt-1" title={JSON.stringify(v.value)}>
          {v.changed && <span className="text-[var(--text-secondary)]">{formatObserved(v.before)} → </span>}{formatObserved(v.value)}
        </div>
      </div>)}
    </div>
    {values.length > 12 && <p className="text-xs mt-2">Đang hiển thị 12/{values.length} biến đơn. Xem toàn bộ trong tab Biến.</p>}
    {!values.length && <p className="text-xs text-[var(--text-secondary)]">Chưa có biến đơn trong phạm vi này. Mảng và lời gọi hiển thị bên dưới.</p>}
  </section>;
}
