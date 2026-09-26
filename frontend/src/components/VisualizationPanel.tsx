import { TraceEvent, VariableRoleMap } from '../engine/types';
import { ArrayViz } from './visualizations/ArrayViz';
import { RecursionViz } from './visualizations/RecursionViz';

interface VisualizationPanelProps {
  event: TraceEvent | null;
  variableRoles: VariableRoleMap;
  isDemo?: boolean;
}

export function VisualizationPanel({ event, variableRoles, isDemo }: VisualizationPanelProps) {
  const hasArray = Object.values(variableRoles).includes('array');
  const hasRecursion = event && event.callStack.length > 1;

  return (
    <div className="h-full w-full panel rounded-none border-none border-l border-b border-[var(--border)] flex flex-col relative bg-[var(--bg-panel)] overflow-hidden">
      <div className="p-2 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-secondary)]">
        <h2 className="font-semibold text-sm">Trực quan hóa</h2>
        {isDemo && <span className="bg-amber-500 text-white text-[10px] px-2 py-1 rounded font-bold uppercase">Bản ghi bài mẫu</span>}
      </div>
      <div className="flex-1 overflow-auto bg-[var(--bg-primary)]">
        {!event ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[var(--text-secondary)]">
            <h3 className="text-xl font-bold mb-2">Chào mừng đến với CodeLens</h3>
            <p className="max-w-md">
              Viết mã C++ ở trình soạn thảo bên trái, nhập dữ liệu đầu vào và nhấn <strong>Chạy</strong> để xem quá trình thực thi từng bước.
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {hasArray && <div className="border-b border-[var(--border)]"><ArrayViz event={event} variableRoles={variableRoles} /></div>}
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

