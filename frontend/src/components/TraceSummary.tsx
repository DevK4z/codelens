import { useMemo } from 'react';
import type { TraceEvent } from '../engine/types';
import { summarizeTrace } from '../engine/traceSummary';

export function TraceSummary({ trace }: { trace: TraceEvent[] }) {
  const summary = useMemo(() => summarizeTrace(trace), [trace]);
  if (!trace.length) return null;
  return <details className="px-3 py-2 text-xs border-b border-[var(--border)] bg-[var(--bg-panel)] shrink-0">
    <summary className="cursor-pointer text-[var(--accent)]">Vì sao có {summary.total} bước?</summary>
    <div className="mt-2 max-h-28 overflow-auto text-[var(--text-secondary)] space-y-1">
      <p>{summary.sourceStops} điểm dừng trên {summary.uniqueLines} dòng code khác nhau; {summary.outputRecords} bản ghi đầu ra{summary.otherRecords > 0 ? `; ${summary.otherRecords} sự kiện khác` : ''}.</p>
      <p>Mỗi lần quay lại dòng trong vòng lặp hoặc đệ quy có thể tạo thêm điểm dừng. Số bước này không phải số phần tử input, số phép toán hay độ phức tạp thuật toán.</p>
      {summary.frequentLines.length > 0 && <p>Các dòng được ghi nhận nhiều nhất: {summary.frequentLines.map(([line, count]) => `dòng ${line}: ${count} lần`).join('; ')}.</p>}
      <p>Bản ghi giữ các lần lặp kể cả khi biến hiển thị chưa đổi. Nếu có thông báo giới hạn hoặc lỗi, đây chỉ là phần đã thu thập.</p>
    </div>
  </details>;
}
