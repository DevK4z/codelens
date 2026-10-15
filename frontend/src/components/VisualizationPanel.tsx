import { useState } from 'react';
import { TraceEvent, VariableRoleMap } from '../engine/types';
import { ArrayViz } from './visualizations/ArrayViz';
import { StepStatePanel } from './StepStatePanel';
import { RecursionViz } from './visualizations/RecursionViz';

interface VisualizationPanelProps {
  event: TraceEvent | null;
  variableRoles: VariableRoleMap;
  isDemo?: boolean;
  prevEvent?: TraceEvent | null;
}

export function VisualizationPanel({ event, variableRoles, isDemo, prevEvent }: VisualizationPanelProps) {
  const [selectedArray, setSelectedArray] = useState('');
  const arrays = Object.keys(event?.variables ?? {}).filter(name => Array.isArray(event?.variables[name]));
  const arrayName = arrays.includes(selectedArray) ? selectedArray : arrays[0];
  const hasArray = arrays.length > 0;
  const hasRecursion = event && event.callStack.length > 0;

  return (
    <div className="h-full w-full panel rounded-none border-none border-l border-b border-[var(--border)] flex flex-col relative bg-[var(--bg-panel)] overflow-hidden">
      <div className="p-2 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-secondary)]">
        <h2 className="font-semibold text-sm">Trực quan hóa</h2>
        {isDemo && <span className="bg-amber-500 text-white text-[10px] px-2 py-1 rounded font-bold uppercase">Bản ghi bài mẫu</span>}
      </div>
      <div className="flex-1 min-h-0 overflow-auto bg-[var(--bg-primary)]">
        {!event ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[var(--text-secondary)]">
            <h3 className="text-xl font-bold mb-2">Chào mừng đến với CodeLens</h3>
            <p className="max-w-md">
              Viết mã C++ ở trình soạn thảo bên trái, nhập dữ liệu đầu vào và nhấn <strong>Chạy</strong> để xem quá trình thực thi từng bước.
            </p>
          </div>
        ) : event.event === 'stdout' && event.callStack.length === 0 ? (
          <div className="p-4">
            <h3 className="font-semibold mb-2">Đầu ra chương trình (stdout)</h3>
            <pre className="whitespace-pre-wrap break-words font-mono text-sm">{event.stdout || '(Không có đầu ra)'}</pre>
            <p className="text-sm text-[var(--text-secondary)] mt-3">Bước này ghi nhận đầu ra cuối bản ghi, không phải một dòng code đang chạy. Nhấn “Bước trước” để xem trạng thái biến cuối cùng đã quan sát.</p>
          </div>
        ) : (
          <div className="flex flex-col min-h-full">
            <StepStatePanel event={event} previous={prevEvent} />
            {hasArray && <div className="border-b border-[var(--border)]">
              {arrays.length > 1 && <label className="flex gap-2 items-center px-4 pt-3 text-sm">Mảng đang xem
                <select aria-label="Mảng đang xem" value={arrayName} onChange={e => setSelectedArray(e.target.value)} className="rounded p-1 border border-[var(--border)] bg-[var(--bg-panel)]">
                  {arrays.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </label>}
              <ArrayViz arrayName={arrayName} prevEvent={prevEvent} event={event} variableRoles={variableRoles} /></div>}
            {hasRecursion && <div><RecursionViz event={event} /></div>}
            {!hasArray && !hasRecursion && (
              <div className="h-full flex flex-col items-center justify-center p-8 text-[var(--text-secondary)]">
                <p>Không có cấu trúc dữ liệu đặc biệt nào được thiết lập.</p>
                <p className="text-sm mt-2">Chỉ định vai trò "Mảng" cho biến trong tab <strong>Biến</strong> để xem trực quan hóa.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

