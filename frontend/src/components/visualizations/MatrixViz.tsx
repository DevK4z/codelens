import type { TraceEvent } from '../../engine/types';
import { indexVariables, type LineFocus } from '../../engine/lineFocus';
import { sameCallContext, formatObserved } from '../../engine/stepState';

const READ = '#3b82f6', WRITE = '#f59e0b', CHANGED = '#f97316', ROW = '#10b981', COL = '#0ea5e9';
const MAX = 30;

const short = (value: unknown) => {
  const text = value === null ? '?' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  return text.length > 12 ? text.slice(0, 11) + '…' : text;
};

// A 2D array such as a DP table: the cells the line reads/writes, the row and column the index variables select.
export function MatrixViz({ event, prevEvent, name, code = '', focus }: { event: TraceEvent; prevEvent?: TraceEvent | null; name: string; code?: string; focus?: LineFocus }) {
  const grid = event.variables[name] as unknown[][];
  const rows = grid.slice(0, MAX).map(r => (Array.isArray(r) ? r : []).slice(0, MAX));
  const cols = Math.max(0, ...rows.map(r => r.length));
  const vars = event.variables;
  const index = indexVariables(code, name);
  const rowVars = index.rows.filter(n => Number.isInteger(vars[n]));
  const colVars = index.cols.filter(n => Number.isInteger(vars[n]));
  const refs = (focus?.refs ?? []).filter(r => r.array === name && r.indices.length === 2 && r.inRange);
  const markAt = (r: number, c: number) => refs.find(ref => ref.indices[0] === r && ref.indices[1] === c);
  const before = sameCallContext(event, prevEvent) ? prevEvent!.variables[name] as unknown[][] | undefined : undefined;
  const oldAt = (r: number, c: number) => {
    const old = Array.isArray(before?.[r]) ? before![r][c] : undefined;
    return old !== undefined && JSON.stringify(old) !== JSON.stringify(rows[r][c]) ? old : undefined;
  };

  return <div className="p-4 w-full min-w-0">
    <div className="flex flex-wrap items-baseline gap-x-3 mb-2">
      <h3 className="text-base font-semibold">Bảng 2 chiều <span className="font-mono text-[var(--accent)]">{name}</span></h3>
      <span className="text-xs text-[var(--text-secondary)] font-mono">{grid.length} hàng × {cols} cột{grid.length > MAX || cols >= MAX ? ` (hiển thị tối đa ${MAX})` : ''}</span>
    </div>
    {refs.length > 0 && <p className="text-xs mb-2 text-[var(--text-secondary)]">
      Dòng này dùng: {refs.map((r, k) => <span key={k} className="font-mono mr-2" style={{ color: r.access === 'write' ? WRITE : READ }}>{r.text} = {name}[{r.indices[0]}][{r.indices[1]}]{r.access === 'write' ? ' (ghi)' : ` = ${formatObserved(r.value)}`}</span>)}
    </p>}
    <div className="overflow-auto">
      <table className="border-separate font-mono text-xs" style={{ borderSpacing: 3 }}>
        <thead><tr>
          <th />
          {Array.from({ length: cols }, (_, c) => {
            const here = colVars.filter(n => vars[n] === c);
            return <th key={c} className="font-normal text-[var(--text-secondary)] px-1 align-bottom">
              {here.length > 0 && <div className="font-bold leading-tight" style={{ color: COL }}>{here.join(',')}<br />▼</div>}
              {c}
            </th>;
          })}
        </tr></thead>
        <tbody>{rows.map((row, r) => {
          const here = rowVars.filter(n => vars[n] === r);
          return <tr key={r}>
            <th className="font-normal text-[var(--text-secondary)] pr-1 text-right whitespace-nowrap">
              {here.length > 0 && <span className="font-bold mr-1" style={{ color: ROW }}>{here.join(',')} ▶</span>}{r}
            </th>
            {Array.from({ length: cols }, (_, c) => {
              const mark = markAt(r, c), old = oldAt(r, c);
              const active = here.length > 0 || colVars.some(n => vars[n] === c);
              const color = mark ? (mark.access === 'write' ? WRITE : READ) : old !== undefined ? CHANGED : undefined;
              return <td key={c} title={old !== undefined ? `trước: ${formatObserved(old)}` : formatObserved(row[c])}
                className="relative text-center rounded-md border-2 px-1.5 whitespace-nowrap transition-colors duration-300"
                style={{ minWidth: 38, height: 34, borderColor: color ?? 'var(--border)', background: color ? `color-mix(in srgb, ${color} 18%, var(--bg-panel))` : active ? 'color-mix(in srgb, var(--accent) 6%, var(--bg-panel))' : 'var(--bg-panel)' }}>
                {row[c] === undefined ? '' : short(row[c])}
              </td>;
            })}
          </tr>;
        })}</tbody>
      </table>
    </div>
    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-[var(--text-secondary)]">
      <span><b style={{ color: READ }}>■</b> dòng này đọc</span>
      <span><b style={{ color: WRITE }}>■</b> dòng này ghi</span>
      <span><b style={{ color: CHANGED }}>■</b> vừa đổi ở bước trước</span>
      {(rowVars.length > 0 || colVars.length > 0) && <span><b style={{ color: ROW }}>▶</b> hàng / <b style={{ color: COL }}>▼</b> cột mà biến chỉ số đang chọn</span>}
    </div>
  </div>;
}
