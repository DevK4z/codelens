import { TraceEvent, VariableRoleMap, VariableRole } from '../engine/types';

interface VariablePanelProps {
  event: TraceEvent | null;
  variableRoles: VariableRoleMap;
  onRoleChange: (varName: string, role: VariableRole) => void;
}

const ROLES: { value: VariableRole; label: string }[] = [
  { value: 'none', label: 'Không' },
  { value: 'array', label: 'Mảng' },
  { value: 'left-pointer', label: 'Con trỏ trái' },
  { value: 'right-pointer', label: 'Con trỏ phải' },
  { value: 'mid-pointer', label: 'Con trỏ giữa' },
  { value: 'dp-table', label: 'Bảng DP' },
  { value: 'counter', label: 'Biến đếm' },
  { value: 'target', label: 'Mục tiêu' },
  { value: 'result', label: 'Kết quả' },
];

export function VariablePanel({ event, variableRoles, onRoleChange }: VariablePanelProps) {
  if (!event) return <div className="p-4 text-[var(--text-secondary)]">Chưa có dữ liệu. Hãy chạy chương trình.</div>;

  const vars = Object.entries(event.variables);
  if (vars.length === 0) return <div className="p-4 text-[var(--text-secondary)]">Không có biến nào trong phạm vi hiện tại.</div>;

  // Sort: changed vars first
  const sortedVars = [...vars].sort(([a], [b]) => {
    const aChanged = event.changed.includes(a);
    const bChanged = event.changed.includes(b);
    if (aChanged && !bChanged) return -1;
    if (!aChanged && bChanged) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="overflow-auto h-full p-0">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase bg-[var(--bg-secondary)] sticky top-0 border-b border-[var(--border)] shadow-sm">
          <tr>
            <th className="px-4 py-2 font-medium">Tên biến</th>
            <th className="px-4 py-2 font-medium">Giá trị</th>
            <th className="px-4 py-2 font-medium">Vai trò</th>
          </tr>
        </thead>
        <tbody>
          {sortedVars.map(([name, val]) => {
            const isChanged = event.changed.includes(name);
            const role = variableRoles[name] || 'none';
            
            let displayVal = String(val);
            if (Array.isArray(val)) {
              displayVal = `[${val.length <= 10 ? val.join(', ') : val.slice(0, 10).join(', ') + ', ...'}]`;
            }

            return (
              <tr key={name} className={`border-b border-[var(--border)] ${isChanged ? 'flash-changed border-l-4 border-l-orange-500 bg-orange-500 bg-opacity-10' : ''}`}>
                <td className="px-4 py-2 font-mono font-medium">{name}</td>
                <td className="px-4 py-2 font-mono break-all">{displayVal}</td>
                <td className="px-4 py-2">
                  <select 
                    className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-2 py-1 text-xs outline-none focus:border-[var(--accent)]"
                    value={role}
                    onChange={(e) => onRoleChange(name, e.target.value as VariableRole)}
                  >
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

