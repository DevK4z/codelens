import { TraceEvent, VariableRoleMap } from '../../engine/types';

interface ArrayVizProps {
  event: TraceEvent | null;
  variableRoles: VariableRoleMap;
}

export function ArrayViz({ event, variableRoles }: ArrayVizProps) {
  if (!event) return null;
  
  // Find array variable
  const arrayVar = Object.keys(variableRoles).find(k => variableRoles[k] === 'array');
  if (!arrayVar || event.variables[arrayVar] === undefined || !Array.isArray(event.variables[arrayVar])) {
    return (
      <div className="p-8 text-center text-[var(--text-secondary)]">
        Chưa chọn hoặc không tìm thấy biến mảng để hiển thị.<br/>
        <span className="text-xs">Hãy đảm bảo gán vai trò &quot;Mảng&quot; cho biến ở bảng Biến phía dưới.</span>
      </div>
    );
  }
  
  const rawArr = event.variables[arrayVar] as any[];
  // Limit display to 'n' if present in variables, otherwise max 25 elements
  const displayLength = (typeof event.variables.n === 'number' && event.variables.n > 0 && event.variables.n <= rawArr.length)
    ? event.variables.n
    : Math.min(rawArr.length, 25);
  const arr = rawArr.slice(0, displayLength);
  
  // Find pointers
  const pointers = Object.keys(variableRoles).filter(k => 
    variableRoles[k].includes('pointer') && typeof event.variables[k] === 'number'
  );

  const isCompared = (idx: number) => {
    if (!event.compareInfo) return false;
    const { left, right } = event.compareInfo;
    
    // Direct index match e.g. arr[0]
    if (left.includes(`${arrayVar}[${idx}]`) || right.includes(`${arrayVar}[${idx}]`)) return true;

    // Variable index match e.g. arr[mid], arr[j], arr[j + 1]
    for (const [varName, varVal] of Object.entries(event.variables)) {
      if (typeof varVal === 'number') {
        if (varVal === idx && (left.includes(`${arrayVar}[${varName}]`) || right.includes(`${arrayVar}[${varName}]`))) {
          return true;
        }
        if (varVal + 1 === idx && (left.includes(`${arrayVar}[${varName} + 1]`) || right.includes(`${arrayVar}[${varName} + 1]`))) {
          return true;
        }
        if (varVal - 1 === idx && (left.includes(`${arrayVar}[${varName} - 1]`) || right.includes(`${arrayVar}[${varName} - 1]`))) {
          return true;
        }
      }
    }
    return false;
  };
  
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[320px] overflow-x-auto w-full">
      {/* Compare Info Banner */}
      {event.compareInfo && (
        <div className="mb-6 px-4 py-2 rounded-full text-xs font-mono font-medium border border-yellow-500/30 bg-yellow-500/10 text-yellow-500 flex items-center gap-2 shadow-sm animate-pulse">
          <span className="font-bold uppercase tracking-wider">So sánh:</span>
          <span>{event.compareInfo.left} ({event.compareInfo.leftValue})</span>
          <span className="font-bold">{event.compareInfo.operator}</span>
          <span>{event.compareInfo.right} ({event.compareInfo.rightValue})</span>
          <span>→</span>
          <span className={`font-bold px-1.5 py-0.5 rounded ${event.compareInfo.result ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {event.compareInfo.result ? 'ĐÚNG' : 'SAI'}
          </span>
        </div>
      )}

      {/* Array Name and Size */}
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">Mảng: <span className="font-mono text-[var(--accent)]">{arrayVar}</span></h3>
        <span className="text-xs text-[var(--text-secondary)] px-2 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border)] font-mono">
          {displayLength} phần tử
        </span>
      </div>

      {/* Array Elements Grid */}
      <div className="flex gap-2.5 relative px-4 pb-14 pt-2">
        {arr.map((val, idx) => {
          let bgColor = 'bg-[var(--bg-panel)]';
          let borderColor = 'border-[var(--border)]';
          let textColor = 'text-[var(--text-primary)]';
          let label = '';
          let badgeColor = 'text-[var(--text-secondary)]';
          const isNull = val === null;
          
          const isAccessed = event.arrayAccess?.array === arrayVar && event.arrayAccess?.index === idx;
          const isWritten = isAccessed && event.arrayAccess?.mode === 'write';
          const isRead = isAccessed && event.arrayAccess?.mode === 'read';
          const isSwapped = event.swapInfo?.array === arrayVar && 
                           (event.swapInfo?.index1 === idx || event.swapInfo?.index2 === idx);

          if (isRead) {
            bgColor = 'bg-blue-600/20';
            borderColor = 'border-blue-500 shadow-lg shadow-blue-500/20';
            textColor = 'text-blue-400 font-extrabold';
            label = 'ĐỌC';
            badgeColor = 'text-blue-400';
          } else if (isWritten) {
            bgColor = 'bg-amber-600/20';
            borderColor = 'border-amber-500 shadow-lg shadow-amber-500/20';
            textColor = 'text-amber-400 font-extrabold';
            label = 'GHI';
            badgeColor = 'text-amber-400';
          } else if (isCompared(idx)) {
            bgColor = 'bg-yellow-500/20';
            borderColor = 'border-yellow-400 shadow-lg shadow-yellow-500/20';
            textColor = 'text-yellow-400 font-extrabold';
            label = 'SO SÁNH';
            badgeColor = 'text-yellow-400';
          } else if (isSwapped) {
            bgColor = 'bg-purple-600/20';
            borderColor = 'border-purple-500 shadow-lg shadow-purple-500/20';
            textColor = 'text-purple-400 font-extrabold';
            label = 'HOÁN ĐỔI';
            badgeColor = 'text-purple-400';
          }
          
          return (
            <div key={idx} className="flex flex-col items-center min-w-[58px]">
              {/* Index number on top */}
              <span className="text-[11px] font-mono text-[var(--text-secondary)] mb-1">[{idx}]</span>
              
              {/* Array Box */}
              <div 
                className={`w-14 h-14 flex items-center justify-center border-2 rounded-xl text-lg transition-all duration-300 transform select-none ${bgColor} ${borderColor} ${textColor} ${isNull ? 'opacity-50' : ''}`}
                title={isNull ? 'Chưa khởi tạo' : ''}
              >
                {isNull ? '?' : val}
              </div>
              
              {/* Operation label */}
              <span className={`text-[10px] h-4 font-bold tracking-tight mt-1 uppercase ${badgeColor}`}>
                {label}
              </span>
              
              {/* Pointer arrows & labels */}
              <div className="flex flex-col items-center h-14 w-full mt-1">
                {pointers.map(ptr => {
                  if (event.variables[ptr] === idx) {
                    const role = variableRoles[ptr];
                    let ptrColor = 'text-[var(--accent)]';
                    if (role === 'left-pointer') ptrColor = 'text-emerald-400';
                    else if (role === 'right-pointer') ptrColor = 'text-rose-400';
                    else if (role === 'mid-pointer') ptrColor = 'text-sky-400';

                    return (
                      <div key={ptr} className={`text-xs font-mono font-bold flex flex-col items-center leading-tight animate-bounce ${ptrColor}`}>
                        <span>↑</span>
                        <span className="text-[10px] uppercase">{ptr}</span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
