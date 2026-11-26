// Module này chỉ được nạp động (import()) khi xem lại bài, nên lời giải nằm trong một chunk riêng,
// không có trong trang lúc đang thi.
import { SOLUTION_NOTES } from './examSolutions.ts';
import type { SolutionNote } from './examSolutions.ts';

const SOURCES = import.meta.glob('./solutions/*.{cpp,py}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export interface Solution extends SolutionNote {
  /** Lời giải C++. */
  code: string;
  /** Lời giải Python cùng ý tưởng (nếu có). */
  python?: string;
}

export function getSolution(problemId: string): Solution | null {
  const code = SOURCES[`./solutions/${problemId}.cpp`];
  const python = SOURCES[`./solutions/${problemId}.py`];
  const note = SOLUTION_NOTES[problemId];
  if (!code || !note) return null;
  return python ? { ...note, code, python } : { ...note, code };
}
