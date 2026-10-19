import type { TraceEvent } from './types.ts';
import { sameCallContext, formatObserved } from './stepState.ts';

export interface SimpleExplanation { action: string; change: string; next: string }
const short = (value: unknown) => { const s = formatObserved(value); return s.length > 50 ? s.slice(0, 47) + '…' : s; };
export function simpleExplanation(event: TraceEvent, previous: TraceEvent | null | undefined, code: string, nextEvent?: TraceEvent | null): SimpleExplanation {
  const source = code.split(/\r?\n/)[event.line - 1]?.trim() || '';
  const before = event.event === 'line' && !!event.detail?.startsWith('GCC/GDB:');
  const finalOutput = event.event === 'stdout' && event.callStack.length === 0;
  let action = finalOutput ? 'Đây là kết quả chương trình đã in ra.' : before ? `Sắp thực hiện dòng ${event.line}.` : `Đang xem kết quả của bước ở dòng ${event.line}.`;
  if (before) {
    if (/^(if|else\s+if)\s*\(/.test(source)) action = 'Sắp kiểm tra điều kiện để chọn việc cần làm.';
    else if (/^(for|while)\s*\(/.test(source)) action = 'Sắp kiểm tra hoặc cập nhật vòng lặp.';
    else if (/^return\b/.test(source)) action = 'Sắp kết thúc hàm và trả kết quả về nơi gọi.';
    else if (/^(std::)?cout\s*<</.test(source)) action = 'Sắp in dữ liệu ra màn hình.';
    else if (/^(std::)?cin\s*>>/.test(source)) action = 'Sắp lấy dữ liệu bạn đã nhập.';
    else if (/^[A-Za-z_]\w*\s*\+=/.test(source)) action = `Sắp cộng thêm vào ${source.match(/^[A-Za-z_]\w*/)?.[0]}.`;
    else if (/^(?:\+\+\s*[A-Za-z_]\w*|[A-Za-z_]\w*\s*\+\+)\s*;/.test(source)) action = 'Sắp tăng biến đếm thêm 1.';
    else if (/^[A-Za-z_]\w*\s*=(?!=)/.test(source)) action = `Sắp đặt giá trị mới cho ${source.match(/^[A-Za-z_]\w*/)?.[0]}.`;
    else if (/^(?:const\s+)?(?:int|long|double|float|char|bool|auto|std::string|string)\b/.test(source)) action = 'Dòng này khai báo biến hoặc hàm.';
  } else if (event.event === 'compare' && event.compareInfo) {
    const c = event.compareInfo; action = `Điều kiện ${c.left} ${c.operator} ${c.right}: ${c.result ? 'đúng' : 'sai'}.`;
  } else if (event.event === 'swap' && event.swapInfo) {
    action = `Đổi chỗ ${event.swapInfo.array}[${event.swapInfo.index1}] và ${event.swapInfo.array}[${event.swapInfo.index2}].`;
  } else if (event.event === 'call') action = `Đi vào hàm ${event.callStack[event.callStack.length - 1]?.func || 'được gọi'}.`;
  else if (event.event === 'return') action = 'Kết thúc lời gọi hàm này.';
  const changes: string[] = [];
  if (sameCallContext(event, previous)) {
    for (const [name, value] of Object.entries(event.variables)) {
      if (!Object.prototype.hasOwnProperty.call(previous!.variables, name)) continue;
      const old = previous!.variables[name];
      if (JSON.stringify(old) === JSON.stringify(value)) continue;
      if (Array.isArray(old) && Array.isArray(value)) {
        if (old.length !== value.length) changes.push(`${name}: ${old.length} → ${value.length} phần tử`);
        for (let i = 0; i < Math.min(old.length, value.length) && changes.length < 3; i++)
          if (JSON.stringify(old[i]) !== JSON.stringify(value[i])) changes.push(`${name}[${i}]: ${short(old[i])} → ${short(value[i])}`);
      } else changes.push(`${name}: ${short(old)} → ${short(value)}`);
      if (changes.length >= 3) break;
    }
  }
  const change = finalOutput ? (event.stdout ? `Kết quả: ${short(event.stdout)}` : 'Không có dữ liệu được in ra.') : changes.length
    ? changes.slice(0, 2).join(' · ') + (changes.length > 2 ? ' · Xem thêm ở bảng biến.' : '')
    : previous && !sameCallContext(event, previous) ? 'Đã chuyển lời gọi hàm; xem các biến của hàm hiện tại.'
    : previous ? 'Chưa thấy biến đang theo dõi thay đổi.' : 'Đây là trạng thái đầu tiên được ghi lại.';
  const next = nextEvent ? (nextEvent.event === 'stdout' && !nextEvent.callStack.length ? 'Bước tiếp theo hiển thị đầu ra.' : `Bước tiếp theo trong bản ghi: dòng ${nextEvent.line}.`) : 'Đã đến cuối bản ghi.';
  return { action, change, next };
}
