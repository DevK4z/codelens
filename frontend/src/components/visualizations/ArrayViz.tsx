import { TraceEvent, VariableRoleMap } from '../../engine/types';
import { activeRange, indexable, indexVariables, type LineFocus } from '../../engine/lineFocus';
import { changedArrayIndices } from '../../engine/arrayChanges';
import { formatObserved } from '../../engine/stepState';

interface ArrayVizProps {
  event: TraceEvent | null;
  variableRoles: VariableRoleMap;
  prevEvent?: TraceEvent | null;
  arrayName?: string;
  code?: string;
  focus?: LineFocus;
}

const MIN_CELL = 56, MAX_CELL = 136, GAP = 12, POINTER_ROW = 34;
const PALETTE = ['#10b981', '#f43f5e', '#0ea5e9', '#a855f7', '#f59e0b', '#14b8a6', '#ec4899', '#84cc16'];
const ROLE_COLOR: Record<string, string> = { 'left-pointer': '#10b981', 'right-pointer': '#f43f5e', 'mid-pointer': '#0ea5e9' };
const READ = '#3b82f6', WRITE = '#f59e0b', SWAP = '#a855f7', COMPARE = '#eab308', CHANGED = '#f97316';

type Mark = { index: number; kind: 'read' | 'write'; label: string };
type Arc = { from: number; to: number; kind: 'copy' | 'swap' | 'compare'; label: string };

const short = (value: unknown) => {
  const text = value === null ? '?' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  return text.length > 14 ? text.slice(0, 13) + '…' : text;
};

// What the highlighted line does to this array: cells it reads or writes, and copy/swap/compare arrows between them.
function lineMarks(event: TraceEvent, name: string, focus?: LineFocus): { marks: Mark[]; arcs: Arc[] } {
  const marks: Mark[] = [], arcs: Arc[] = [];
  const refs = (focus?.refs ?? []).filter(r => r.array === name && r.indices.length === 1 && r.inRange);
  for (const r of refs) if (!marks.some(m => m.index === r.indices[0] && m.label === r.text)) marks.push({ index: r.indices[0], kind: r.access, label: r.text });
  const writes = refs.filter(r => r.access === 'write'), reads = refs.filter(r => r.access === 'read');
  if (focus?.kind === 'swap' && refs.length === 2 && refs[0].indices[0] !== refs[1].indices[0])
    arcs.push({ from: refs[0].indices[0], to: refs[1].indices[0], kind: 'swap', label: 'đổi chỗ' });
  else if ((focus?.kind === 'assign' || focus?.kind === 'declare') && writes.length === 1 && reads.length === 1 && reads[0].indices[0] !== writes[0].indices[0])
    arcs.push({ from: reads[0].indices[0], to: writes[0].indices[0], kind: 'copy', label: 'chép sang' });
  else if ((focus?.kind === 'if' || focus?.kind === 'while') && reads.length === 2 && reads[0].indices[0] !== reads[1].indices[0])
    arcs.push({ from: reads[0].indices[0], to: reads[1].indices[0], kind: 'compare', label: 'so sánh' });

  // Hand-written demo traces describe the operation directly.
  const access = event.arrayAccess;
  if (access?.array === name && !marks.some(m => m.index === access.index)) marks.push({ index: access.index, kind: access.mode, label: access.mode === 'read' ? 'đọc' : 'ghi' });
  if (event.swapInfo?.array === name && !arcs.length) arcs.push({ from: event.swapInfo.index1, to: event.swapInfo.index2, kind: 'swap', label: 'đổi chỗ' });
  const compared = (event.compareAccesses ?? []).filter(c => c.array === name);
  if (compared.length === 2 && !arcs.length) arcs.push({ from: compared[0].index, to: compared[1].index, kind: 'compare', label: 'so sánh' });
  return { marks, arcs };
}

export function ArrayViz({ event, variableRoles, prevEvent, arrayName, code = '', focus }: ArrayVizProps) {
  if (!event) return null;
  const name = arrayName ?? Object.keys(variableRoles).find(k => variableRoles[k] === 'array');
  const raw = name ? indexable(event.variables[name]) : undefined;
  if (!name || !raw) {
    return <div className="p-8 text-center text-[var(--text-secondary)]">Chưa chọn hoặc không tìm thấy biến mảng để hiển thị.</div>;
  }
  const items = raw.slice(0, 100);
  // Cells grow with their longest value, so numbers like 1000000007 are not cut.
  const CELL = Math.min(MAX_CELL, Math.max(MIN_CELL, Math.max(0, ...items.map(v => short(v).length)) * 9 + 18));
  const STEP = CELL + GAP;
  const vars = event.variables;

  // Index variables: those the code writes inside name[...], plus any the learner marked as pointers.
  const roleNames = Object.keys(variableRoles).filter(k => variableRoles[k].includes('pointer'));
  const names = [...new Set([...indexVariables(code, name).rows, ...roleNames])].filter(n => Number.isInteger(vars[n]));
  const colorOf = (n: string, i: number) => ROLE_COLOR[variableRoles[n]] ?? PALETTE[i % PALETTE.length];
  const pointers = names.map((n, i) => ({ name: n, index: vars[n] as number, color: colorOf(n, i) }));
  const leading = pointers.some(p => p.index === -1) ? 1 : 0;
  const trailing = pointers.some(p => p.index === items.length && items.length === raw.length) ? 1 : 0;
  const slots = items.length + leading + trailing;
  const x = (i: number) => (i + leading) * STEP + CELL / 2;
  const placed = pointers.filter(p => p.index >= -leading && p.index < items.length + trailing);
  const elsewhere = pointers.filter(p => !placed.includes(p));
  const stack = new Map<number, number>();
  const rows = placed.map(p => { const level = stack.get(p.index) ?? 0; stack.set(p.index, level + 1); return { ...p, level }; });
  const depth = Math.max(1, ...[...stack.values()]);

  const range = activeRange(vars, [...new Set([...names, ...Object.keys(vars)])]);
  const from = range ? vars[range.from] as number : 0, to = range ? vars[range.to] as number : -1;
  const inRange = (i: number) => !range || (i >= from && i <= to);
  const { marks, arcs } = lineMarks(event, name, focus);
  const changed = changedArrayIndices(event, prevEvent, name);
  const previous = indexable(prevEvent?.variables[name]);
  const width = slots * STEP;
  // Room above the cells only for what this line draws there.
  const ARC_TOP = arcs.length ? 70 : marks.length ? 30 : 4;

  return (
    <div className="p-4 flex flex-col items-start w-full min-w-0">
      {event.compareInfo && (
        <div className="mb-3 px-3 py-1.5 rounded-full text-xs font-mono border border-yellow-500/40 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex flex-wrap items-center gap-2">
          <span className="font-bold">So sánh:</span>
          <span>{event.compareInfo.left} ({event.compareInfo.leftValue}) {event.compareInfo.operator} {event.compareInfo.right} ({event.compareInfo.rightValue})</span>
          <span>→ <b className={event.compareInfo.result ? 'text-green-500' : 'text-red-500'}>{event.compareInfo.result ? 'ĐÚNG' : 'SAI'}</b></span>
        </div>
      )}

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
        <h3 className="text-base font-semibold">Mảng <span className="font-mono text-[var(--accent)]">{name}</span></h3>
        <span className="text-xs text-[var(--text-secondary)] font-mono">{raw.length} phần tử{items.length < raw.length ? `, hiển thị ${items.length}` : ''}</span>
      </div>
      {range && <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
        {from <= to
          ? <>Vùng đang xét: <b className="font-mono">{range.from}..{range.to} = [{from}..{to}]</b>, còn {to - from + 1} phần tử. Phần mờ đã bị loại.</>
          : <>Vùng đang xét rỗng (<span className="font-mono">{range.from} = {from} &gt; {range.to} = {to}</span>): không còn phần tử nào để xét.</>}
      </p>}

      <div className="w-full overflow-x-auto pb-1">
        <div className="relative mx-auto" style={{ width, minWidth: width }}>
          {/* Arrows between cells for what the current line does. */}
          <svg width={width} height={ARC_TOP} className="block overflow-visible" aria-hidden="true">
            <defs>
              {[['copy', READ], ['swap', SWAP], ['compare', COMPARE]].map(([id, color]) => (
                <marker key={id} id={`head-${id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 z" fill={color} />
                </marker>
              ))}
              {[['read', READ], ['write', WRITE]].map(([id, color]) => (
                <marker key={id} id={`tag-${id}`} viewBox="0 0 10 10" refX="5" refY="8" markerWidth="7" markerHeight="7" orient="auto">
                  <path d="M0,0 L10,5 L0,10 z" fill={color} />
                </marker>
              ))}
            </defs>
            {arcs.map((arc, k) => {
              const x1 = x(arc.from), x2 = x(arc.to), lift = Math.min(40, 14 + Math.abs(x2 - x1) / 5);
              const color = arc.kind === 'swap' ? SWAP : arc.kind === 'compare' ? COMPARE : READ;
              return <g key={k}>
                <path d={`M${x1},${ARC_TOP - 22} Q${(x1 + x2) / 2},${ARC_TOP - 22 - lift * 2} ${x2},${ARC_TOP - 22}`} fill="none" stroke={color} strokeWidth="2.5"
                  strokeDasharray={arc.kind === 'compare' ? '5 4' : undefined} markerEnd={arc.kind === 'compare' ? undefined : `url(#head-${arc.kind})`}
                  markerStart={arc.kind === 'swap' ? `url(#head-${arc.kind})` : undefined} />
                <text x={(x1 + x2) / 2} y={ARC_TOP - 26 - lift} textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>{arc.label}</text>
              </g>;
            })}
            {marks.map((mark, k) => {
              const color = mark.kind === 'write' ? WRITE : READ;
              return <g key={k}>
                <text x={x(mark.index)} y={ARC_TOP - 12} textAnchor="middle" fontSize="11" fontFamily="ui-monospace,monospace" fontWeight="700" fill={color}>{mark.label}</text>
                <line x1={x(mark.index)} y1={ARC_TOP - 9} x2={x(mark.index)} y2={ARC_TOP - 1} stroke={color} strokeWidth="2" markerEnd={`url(#tag-${mark.kind})`} />
              </g>;
            })}
          </svg>

          {/* The cells. */}
          <div className="flex" style={{ gap: GAP }}>
            {leading > 0 && <div className="shrink-0 rounded-xl border-2 border-dashed border-[var(--border)] text-[10px] text-[var(--text-secondary)] flex items-center justify-center" style={{ width: CELL, height: CELL }}>ngoài</div>}
            {items.map((value, i) => {
              const mark = marks.find(m => m.index === i);
              const old = changed.has(i) ? previous?.[i] : undefined;
              const color = mark ? (mark.kind === 'write' ? WRITE : READ) : changed.has(i) ? CHANGED : undefined;
              const swapped = arcs.some(a => a.kind === 'swap' && (a.from === i || a.to === i));
              return <div key={i} className="shrink-0 flex flex-col items-center" style={{ width: CELL }}>
                <div title={value === null ? 'Chưa có giá trị xác định' : formatObserved(value)}
                  className={`relative w-full flex items-center justify-center rounded-xl border-2 font-mono text-sm font-semibold transition-all duration-300 ${inRange(i) ? '' : 'opacity-35'}`}
                  style={{ height: CELL, borderColor: swapped ? SWAP : color ?? 'var(--border)', background: color ? `color-mix(in srgb, ${swapped ? SWAP : color} 16%, var(--bg-panel))` : range && inRange(i) ? 'color-mix(in srgb, var(--accent) 7%, var(--bg-panel))' : 'var(--bg-panel)' }}>
                  {old !== undefined && old !== null && <span className="absolute top-0.5 right-1 text-[10px] line-through text-[var(--text-secondary)]">{short(old)}</span>}
                  <span className={value === null ? 'opacity-50' : ''}>{short(value)}</span>
                </div>
                <span className="text-[11px] font-mono text-[var(--text-secondary)] mt-1">{i}</span>
              </div>;
            })}
            {trailing > 0 && <div className="shrink-0 rounded-xl border-2 border-dashed border-[var(--border)] text-[10px] text-[var(--text-secondary)] flex items-center justify-center" style={{ width: CELL, height: CELL }}>ngoài</div>}
          </div>

          {/* Index variables point up at the cell they hold; they glide as the value changes. */}
          {rows.length > 0 && <div className="relative mt-1" style={{ height: depth * POINTER_ROW }}>
            {rows.map(p => (
              <div key={p.name} className="absolute flex flex-col items-center transition-[left] duration-300 ease-out"
                style={{ left: x(p.index) - 40, width: 80, top: p.level * POINTER_ROW, color: p.color }}>
                <svg width="12" height="10" viewBox="0 0 12 10" aria-hidden="true"><path d="M6,0 L12,10 L0,10 z" fill={p.color} /></svg>
                <span className="text-[11px] font-mono font-bold whitespace-nowrap leading-tight">{p.name} = {p.index}</span>
              </div>
            ))}
          </div>}
        </div>
      </div>

      {elsewhere.length > 0 && <p className="text-xs mt-1 text-[var(--text-secondary)]">
        Ngoài phần hiển thị: {elsewhere.map(p => <span key={p.name} className="font-mono mr-2" style={{ color: p.color }}>{p.name} = {p.index}</span>)}
      </p>}
      {pointers.some(p => p.index === items.length || p.index === -1) && <p className="text-xs mt-1 text-[var(--text-secondary)]">
        Ô viền đứt là vị trí ngay ngoài mảng: chỉ số này không được đọc/ghi, thường là lúc vòng lặp vừa kết thúc.
      </p>}

      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[11px] text-[var(--text-secondary)]" aria-label="Chú thích màu">
        <span><b style={{ color: READ }}>■</b> dòng này đọc</span>
        <span><b style={{ color: WRITE }}>■</b> dòng này ghi</span>
        <span><b style={{ color: CHANGED }}>■</b> vừa đổi ở bước trước (số gạch = giá trị cũ)</span>
        {pointers.length > 0 && <span>▲ biến chỉ số đang trỏ tới ô</span>}
      </div>
    </div>
  );
}
