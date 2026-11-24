// Module này chỉ được nạp động (import()) khi xem lại bài, nên lời giải nằm trong một chunk riêng,
// không có trong trang lúc đang thi.
import { SOLUTION_NOTES } from './examSolutions.ts';
import type { SolutionNote } from './examSolutions.ts';

const SOURCES = import.meta.glob('./solutions/*.cpp', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export interface Solution extends SolutionNote {
  code: string;
}

export function getSolution(problemId: string): Solution | null {
  const code = SOURCES[`./solutions/${problemId}.cpp`];
  const note = SOLUTION_NOTES[problemId];
  return code && note ? { ...note, code } : null;
}
