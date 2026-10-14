import type { TraceEvent } from './types';

export function generateExplanation(event: TraceEvent, prevEvent?: TraceEvent, algorithmId?: string, code?: string): string {
  if (!event) return '';
  
  if (algorithmId === 'binary-search') {
    const c = event.compareInfo;
    if (c?.left === 'arr[mid]' && c.right === 'target') {
      if (c.operator === '==' && c.result) return `arr[mid] = ${c.leftValue} bằng target = ${c.rightValue}: đã tìm thấy tại chỉ số ${event.variables.mid}.`;
      if (c.operator === '<') return c.result
        ? `arr[mid] = ${c.leftValue} < target = ${c.rightValue}. Vì mảng tăng dần, loại được đoạn left..mid; bước tiếp theo sẽ tăng left.`
        : `arr[mid] = ${c.leftValue} > target = ${c.rightValue} (nhánh bằng đã bị loại). Vì mảng tăng dần, loại được đoạn mid..right; bước tiếp theo sẽ giảm right.`;
    }
  }
  switch (event.event) {
    case 'vardecl':
      return event.changed.map(name => `${name}: ${event.variables[name] === null ? 'chưa khởi tạo' : JSON.stringify(event.variables[name])}`).join('; ');
    case 'assign': {
      if (event.changed && event.changed.length > 0) {
        const varName = event.changed[0];
        const val = event.variables[varName];
        const prevVal = prevEvent?.variables[varName];
        if (prevVal !== undefined) {
          return `Gán ${varName} = ${val} (trước đó: ${prevVal})`;
        }
        return `Gán ${varName} = ${val}`;
      }
      return 'Thực hiện phép gán.';
    }
    case 'compare':
      if (event.compareInfo) {
        const { left, right, leftValue, rightValue, operator, result } = event.compareInfo;
        return `So sánh ${left} (${leftValue}) ${operator} ${right} (${rightValue}): ${result ? 'đúng' : 'sai'}`;
      }
      return 'Thực hiện phép so sánh.';
    case 'swap':
      if (event.swapInfo) {
        return `Hoán đổi vị trí ${event.swapInfo.index1} và ${event.swapInfo.index2} của mảng ${event.swapInfo.array}`;
      }
      return 'Hoán đổi hai biến.';
    case 'call':
      if (event.callStack.length > 0) {
        const curr = event.callStack[event.callStack.length - 1];
        const params = curr.params ? JSON.stringify(curr.params) : '';
        return `Gọi hàm ${curr.func}(${params.replace(/[{}]/g, '')})`;
      }
      return 'Gọi hàm.';
    case 'return':
      if (event.callStack.length > 0) {
        const curr = event.callStack[event.callStack.length - 1];
        if (curr.returnValue !== undefined) {
          return `Trả về giá trị ${curr.returnValue} từ hàm ${curr.func}`;
        }
        return `Kết thúc hàm ${curr.func}`;
      }
      return 'Trả về từ hàm.';
    case 'read':
      if (event.arrayAccess) {
        return `Đọc phần tử ${event.arrayAccess.array}[${event.arrayAccess.index}] = ${event.arrayAccess.value}`;
      }
      return 'Đọc dữ liệu.';
    case 'write':
      if (event.arrayAccess) {
        return `Ghi ${event.arrayAccess.array}[${event.arrayAccess.index}] = ${event.arrayAccess.value}`;
      }
      return 'Ghi dữ liệu.';
    case 'stdout':
      return `In ra màn hình: ${event.detail || (event.stdout || '').slice((prevEvent?.stdout || '').length)}`;
    case 'stdin':
      return `Đọc dữ liệu từ input: ${event.detail || event.changed.map(name => `${name} = ${event.variables[name]}`).join(', ')}`;
    case 'branch':
      return `Kiểm tra điều kiện rẽ nhánh (if/else).`;
    case 'loop_start':
      return `Bắt đầu vòng lặp.`;
    case 'loop_end':
      return `Kết thúc một bước lặp.`;
    case 'line':
      return explainLine(event, prevEvent, code);
    default:
      return `Thực thi dòng ${event.line}`;
  }
}


// Debugger snapshots are BEFORE the highlighted line. Never evaluate C++ here or
// infer branch outcomes from a source-text pattern: macros/overloads can change them.
function display(value: unknown): string {
  if (value === null) return 'chưa có giá trị xác định';
  if (value === '<unavailable>') return 'không đọc được';
  const text = JSON.stringify(value) ?? 'không đọc được';
  return text.length > 180 ? text.slice(0, 177) + '…' : text;
}

function explainLine(event: TraceEvent, prev: TraceEvent | undefined, code?: string): string {
  const source = code?.split(/\r?\n/)[event.line - 1]?.trim();
  const debuggerStep = event.detail?.startsWith('GCC/GDB:') ?? false;
  const parts = [debuggerStep
    ? `Đang dừng trước dòng ${event.line}${source ? `: ${source}` : '.'}`
    : `Dòng ${event.line}${source ? `: ${source}` : '.'}`];
  if (!debuggerStep && event.detail) parts.push(event.detail);

  if (debuggerStep && source) {
    if (/^(?:if|else\s+if)\s*\(/.test(source)) parts.push('Sắp kiểm tra điều kiện để chọn nhánh. Chưa kết luận đúng/sai ở điểm dừng này.');
    else if (/^(?:for|while)\s*\(/.test(source)) parts.push('Sắp xử lý điều khiển vòng lặp. Nhấn bước tiếp để quan sát dòng được chọn và biến thay đổi.');
    else if (/^return\b/.test(source)) parts.push('Sắp thực hiện lệnh trả về từ hàm hiện tại.');
    else if (/^(?:std::)?cout\s*<</.test(source)) parts.push('Sắp thực hiện câu lệnh xuất dữ liệu; stdout có thể xuất hiện muộn do bộ đệm.');
    else if (/^(?:std::)?cin\s*>>/.test(source)) parts.push('Sắp đọc dữ liệu từ input vào các biến.');
  }

  const frame = event.callStack[event.callStack.length - 1];
  // Caller locations distinguish many separate invocations. If context changed,
  // do not label same-named locals from different frames as assignments.
  const context = (e: TraceEvent) => JSON.stringify(e.callStack.map((f, i) =>
    [f.func, f.id, i < e.callStack.length - 1 ? f.line : null]));
  const sameContext = prev && context(event) === context(prev);
  if (frame) parts.push(`Hàm hiện tại: ${frame.func} (độ sâu ngăn xếp: ${event.callStack.length}).`);
  if (prev && !sameContext) {
    parts.push(event.callStack.length > prev.callStack.length
      ? 'Ngăn xếp tăng: đã đi vào lời gọi hàm.'
      : event.callStack.length < prev.callStack.length
        ? 'Ngăn xếp giảm: đã trở về hàm gọi.'
        : 'Ngữ cảnh hàm đã thay đổi; hiển thị giá trị tại điểm dừng mới.');
  }

  const changes: string[] = [];
  for (const [name, value] of Object.entries(event.variables)) {
    const existed = sameContext && Object.prototype.hasOwnProperty.call(prev!.variables, name);
    const old = existed ? prev!.variables[name] : undefined;
    if (existed && JSON.stringify(old) === JSON.stringify(value)) continue;
    if (existed && Array.isArray(old) && Array.isArray(value)) {
      if (old.length !== value.length) changes.push(`${name}.length: ${old.length} → ${value.length}`);
      for (let i = 0; i < Math.max(old.length, value.length) && changes.length < 12; i++) {
        if (JSON.stringify(old[i]) !== JSON.stringify(value[i]))
          changes.push(`${name}[${i}]: ${i < old.length ? display(old[i]) : 'chưa có'} → ${i < value.length ? display(value[i]) : 'đã bỏ'}`);
      }
    } else changes.push(existed ? `${name}: ${display(old)} → ${display(value)}` : `${name} = ${display(value)}`);
  }
  if (sameContext) {
    for (const name of Object.keys(prev!.variables)) {
      if (!Object.prototype.hasOwnProperty.call(event.variables, name)) changes.push(`${name}: không còn trong snapshot hiện tại`);
    }
  }
  if (changes.length) {
    parts.push(`${sameContext ? 'Thay đổi quan sát được từ điểm dừng trước' : 'Giá trị quan sát được'}: ${changes.slice(0, 12).join('; ')}${changes.length >= 12 ? '; … xem bảng biến để biết thêm' : ''}.`);
  } else parts.push('Chưa ghi nhận thay đổi ở các biến được theo dõi.');
  if (debuggerStep && sameContext && changes.length) parts.push('Các thay đổi trên xảy ra giữa hai điểm dừng, trước khi chạy dòng đang tô sáng.');
  const output = event.stdout ?? '';
  const previousOutput = prev?.stdout ?? '';
  if (output !== previousOutput) parts.push(`Stdout${output.startsWith(previousOutput) ? ' mới' : ' hiện tại'}: ${display(output.startsWith(previousOutput) ? output.slice(previousOutput.length) : output)}.`);
  return parts.join('\n');
}
