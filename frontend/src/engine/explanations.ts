import { TraceEvent } from './types';

export function generateExplanation(event: TraceEvent, prevEvent?: TraceEvent): string {
  if (!event) return '';
  
  switch (event.event) {
    case 'vardecl':
      return `Khai báo biến với giá trị khởi tạo.`;
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
      return `In ra màn hình: ${event.detail || ''}`;
    case 'stdin':
      return `Đọc dữ liệu từ input: ${event.detail || ''}`;
    case 'branch':
      return `Kiểm tra điều kiện rẽ nhánh (if/else).`;
    case 'loop_start':
      return `Bắt đầu vòng lặp.`;
    case 'loop_end':
      return `Kết thúc một bước lặp.`;
    case 'line':
    default:
      return `Thực thi dòng ${event.line}`;
  }
}

