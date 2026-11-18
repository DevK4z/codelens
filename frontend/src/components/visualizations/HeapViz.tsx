import type { HeapView, PlacedNode } from '../../engine/heap';

const NEW = '#22c55e', CHANGED = '#f97316';
const stateColor = (node: PlacedNode) => node.state === 'new' ? NEW : node.state === 'changed' ? CHANGED : undefined;

// Straight between neighbours; a curve when the arrow goes back or skips nodes (prev, circular lists).
function linkPath(view: HeapView, from: PlacedNode, to: PlacedNode): string {
  const { width, height } = view.box;
  if (view.shape === 'tree') {
    const toRight = to.x + width / 2 >= from.x + width / 2;
    return `M${from.x + width / 2 + (toRight ? 10 : -10)},${from.y + height} L${to.x + width / 2},${to.y}`;
  }
  const y = from.y + height / 2;
  if (from.y === to.y && to.x > from.x && to.x - from.x <= view.stepX) return `M${from.x + width},${y} L${to.x},${y}`;
  if (from.y === to.y && to.x < from.x && from.x - to.x <= view.stepX) return `M${from.x},${y + 12} L${to.x + width},${y + 12}`;
  const bottom = Math.max(from.y, to.y) + height;
  return `M${from.x + width / 2},${from.y + height} C${from.x + width / 2},${bottom + 26} ${to.x + width / 2},${bottom + 26} ${to.x + width / 2},${to.y + height}`;
}

export function HeapViz({ view }: { view: HeapView }) {
  const byAddress = new Map(view.nodes.map(node => [node.address, node]));
  const { width, height } = view.box;
  return <section className="p-4 w-full min-w-0" aria-label="Cấu trúc liên kết">
    <div className="flex flex-wrap items-baseline gap-x-3 mb-1">
      <h3 className="text-base font-semibold">{view.shape === 'tree' ? 'Cây' : 'Danh sách liên kết'} <span className="font-mono text-[var(--accent)]">{view.typeName}</span></h3>
      <span className="text-xs text-[var(--text-secondary)] font-mono">{view.nodes.length} nút{view.limited ? ' (chỉ đọc tối đa 64 nút)' : ''}</span>
    </div>
    {view.nullPointers.length > 0 && <p className="text-xs text-[var(--text-secondary)] mb-1">Đang là NULL: <span className="font-mono">{view.nullPointers.slice(0, 8).join(', ')}</span></p>}
    <div className="overflow-auto">
      <svg width={view.width} height={view.height} role="img" aria-label={`${view.nodes.length} nút và các liên kết`} className="block">
        <defs>
          <marker id="heap-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--text-secondary)" />
          </marker>
        </defs>
        {view.links.map(link => {
          const from = byAddress.get(link.from), to = byAddress.get(link.to);
          if (!from || !to) return null;
          return <path key={`${link.from}-${link.field}`} d={linkPath(view, from, to)} fill="none" stroke="var(--text-secondary)" strokeWidth={link.primary ? 1.8 : 1.2}
            strokeDasharray={link.primary ? undefined : '4 3'} markerEnd="url(#heap-arrow)"><title>{link.field}</title></path>;
        })}
        {view.ends.map(end => {
          const from = byAddress.get(end.from);
          if (!from) return null;
          const y = from.y + height / 2;
          return <g key={end.from}>
            <path d={`M${from.x + width},${y} L${end.x},${y}`} stroke="var(--text-secondary)" strokeWidth="1.2" strokeDasharray="4 3" markerEnd="url(#heap-arrow)" fill="none" />
            <text x={end.x + 4} y={y + 4} fontSize="11" fontFamily="ui-monospace,monospace" fill="var(--text-secondary)">NULL</text>
          </g>;
        })}
        {view.nodes.map(node => {
          const color = stateColor(node);
          return <g key={node.address}>
            <title>{node.title}</title>
            {node.labels.length > 0 && <>
              <text x={node.x + width / 2} y={node.y - 13} textAnchor="middle" fontSize="11" fontWeight="700" fontFamily="ui-monospace,monospace" fill="var(--accent)">{node.labels.slice(0, 3).join(', ')}{node.labels.length > 3 ? '…' : ''}</text>
              <path d={`M${node.x + width / 2},${node.y - 10} L${node.x + width / 2},${node.y - 1}`} stroke="var(--accent)" strokeWidth="1.6" markerEnd="url(#heap-arrow)" />
            </>}
            <rect x={node.x} y={node.y} width={width} height={height} rx="8" fill={color ? `color-mix(in srgb, ${color} 16%, var(--bg-panel))` : 'var(--bg-panel)'} stroke={color ?? 'var(--border)'} strokeWidth="2" />
            <text x={node.x + width / 2} y={node.y + height / 2 + 4} textAnchor="middle" fontSize="12" fontWeight="600" fontFamily="ui-monospace,monospace" fill="var(--text-primary)">{node.text}</text>
          </g>;
        })}
      </svg>
    </div>
    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-[var(--text-secondary)]" aria-label="Chú thích">
      <span><b style={{ color: 'var(--accent)' }}>tên ↓</b> biến con trỏ đang trỏ tới nút</span>
      <span><b style={{ color: NEW }}>■</b> nút vừa xuất hiện</span>
      <span><b style={{ color: CHANGED }}>■</b> nút vừa đổi ở bước trước</span>
      <span>Rê chuột lên nút để xem mọi trường. Nút đã delete vẫn hiện nếu còn con trỏ trỏ tới.</span>
    </div>
  </section>;
}
