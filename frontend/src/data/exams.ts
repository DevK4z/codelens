// Chế độ "Làm bài thi" (chỉ bài lập trình): kiểu dữ liệu, danh sách chương, đề có sẵn và trình tạo đề
// theo chương. Nội dung bài nằm trong examBank.ts.
import { PROBLEM_BANK } from './examBank.ts';

export interface ExamChapter {
  id: string;
  title: string;
}

/** Các chương khớp với bài giảng (cùng mã chương với ngân hàng bài tập). */
export const EXAM_CHAPTERS: ExamChapter[] = [
  { id: 'L1', title: 'Giới thiệu & độ phức tạp' },
  { id: 'L2', title: 'Đệ quy & quay lui' },
  { id: 'L3.1', title: 'Quy hoạch động' },
  { id: 'L3.2', title: 'Tham lam' },
  { id: 'L4', title: 'Danh sách liên kết' },
  { id: 'L5', title: 'Stack & Queue' },
  { id: 'L6', title: 'Cây' },
  { id: 'L7', title: 'Sắp xếp cơ bản' },
  { id: 'L8', title: 'Merge Sort & Quick Sort' },
  { id: 'L9', title: 'Tìm kiếm & bảng băm' },
];

export function chapterTitle(id: string): string {
  return EXAM_CHAPTERS.find(c => c.id === id)?.title ?? id;
}

export function chapterRank(id: string): number {
  const i = EXAM_CHAPTERS.findIndex(c => c.id === id);
  return i < 0 ? EXAM_CHAPTERS.length : i;
}

export interface ExamTestCase {
  input: string;
  output: string;
  hidden: boolean; // true: không hiển thị trong đề, chỉ dùng khi chấm
}

export interface BankProblem {
  id: string;
  chapter: string;
  title: string;
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  tests: ExamTestCase[];
}

export interface CodeProblem extends BankProblem {
  points: number;
  starterCode: string;
}

/** Mô tả một đề (lưu trong phiên thi) — chỉ chứa id bài, nội dung được tra từ ngân hàng. */
export interface ExamSpec {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  maxViolations: number;
  /** true: thi có giám sát (toàn màn hình, tính vi phạm). false: luyện tập. */
  proctored: boolean;
  problemIds: string[];
  problemPoints: number; // điểm mỗi bài
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  maxViolations: number;
  proctored: boolean;
  chapters: string[];
  problems: CodeProblem[];
}

export const STARTER = `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    // Viết lời giải ở đây

    return 0;
}`;

const PROBLEM_MAP = new Map(PROBLEM_BANK.map(p => [p.id, p]));

export const PRESET_SPECS: ExamSpec[] = [
  {
    id: 'exam-a',
    title: 'Đề A — Kiểm tra giữa kỳ CTDL & GT',
    description: '3 bài lập trình: đệ quy, ngăn xếp, danh sách liên kết.',
    durationMinutes: 60,
    maxViolations: 3,
    proctored: true,
    problemIds: ['A-P1', 'A-P2', 'A-P3'],
    problemPoints: 10 / 3,
  },
  {
    id: 'exam-b',
    title: 'Đề B — Kiểm tra cuối kỳ (nâng cao)',
    description: '3 bài lập trình: quy hoạch động, tìm kiếm nhị phân, duyệt đồ thị trên lưới.',
    durationMinutes: 75,
    maxViolations: 3,
    proctored: true,
    problemIds: ['B-P1', 'B-P2', 'B-P3'],
    problemPoints: 10 / 3,
  },
];

/** Dựng đề hoàn chỉnh từ spec. Bỏ qua id không còn trong ngân hàng; null nếu đề rỗng. */
export function resolveExam(spec: ExamSpec): Exam | null {
  const problems: CodeProblem[] = spec.problemIds.flatMap(id => {
    const p = PROBLEM_MAP.get(id);
    return p ? [{ ...p, points: spec.problemPoints, starterCode: STARTER }] : [];
  });
  if (!problems.length) return null;
  const chapters = [...new Set(problems.map(p => p.chapter))].sort((a, b) => chapterRank(a) - chapterRank(b));
  return {
    id: spec.id, title: spec.title, description: spec.description, durationMinutes: spec.durationMinutes,
    maxViolations: spec.maxViolations, proctored: spec.proctored, chapters, problems,
  };
}

export const PRESET_EXAMS: Exam[] = PRESET_SPECS.map(spec => resolveExam(spec)).filter((e): e is Exam => !!e);

export function roundPoints(n: number): number {
  return Math.round(n * 100) / 100;
}

export function examTotalPoints(exam: Exam): number {
  return roundPoints(exam.problems.reduce((sum, p) => sum + p.points, 0));
}

// ---------------- Trình tạo đề ----------------

export function availableProblems(chapters: string[]): number {
  const set = new Set(chapters);
  return PROBLEM_BANK.filter(p => set.has(p.chapter)).length;
}

/** Thời gian gợi ý: 20 phút/bài, tối thiểu 15 phút. */
export function suggestDuration(problemCount: number): number {
  return Math.max(15, problemCount * 20);
}

/** PRNG có seed (mulberry32) để đề tạo ra tái lập được trong test. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: T[], rnd: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Lấy count bài, chia đều lần lượt qua các chương (chương hết bài thì nhường cho chương khác). */
function pickSpread(chapters: string[], count: number, rnd: () => number): BankProblem[] {
  const groups = shuffled(chapters, rnd).map(ch => shuffled(PROBLEM_BANK.filter(p => p.chapter === ch), rnd)).filter(g => g.length > 0);
  const out: BankProblem[] = [];
  while (out.length < count && groups.some(g => g.length > 0)) {
    for (const g of groups) {
      if (out.length >= count) break;
      const x = g.shift();
      if (x) out.push(x);
    }
  }
  return out.sort((a, b) => chapterRank(a.chapter) - chapterRank(b.chapter));
}

export interface GenerateOptions {
  chapters: string[];
  problemCount: number;
  durationMinutes?: number;
  proctored: boolean;
  maxViolations?: number;
  seed?: number;
}

export function generateExamSpec(opts: GenerateOptions): ExamSpec {
  const seed = opts.seed ?? Math.floor(Math.random() * 2 ** 31);
  const rnd = seededRandom(seed);
  const chapters = [...new Set(opts.chapters)].filter(ch => EXAM_CHAPTERS.some(c => c.id === ch))
    .sort((a, b) => chapterRank(a) - chapterRank(b));
  const problems = pickSpread(chapters, Math.max(0, Math.floor(opts.problemCount)), rnd);
  const scope = chapters.length === EXAM_CHAPTERS.length ? 'tổng hợp L1–L9' : chapters.join(', ');
  return {
    id: `custom-${seed}`,
    title: `${opts.proctored ? 'Đề thi' : 'Luyện tập'} — ${scope}`,
    description: `${problems.length} bài lập trình · ${chapters.map(chapterTitle).join(', ')}`,
    durationMinutes: Math.max(1, Math.round(opts.durationMinutes ?? suggestDuration(problems.length))),
    maxViolations: opts.maxViolations ?? 3,
    proctored: opts.proctored,
    problemIds: problems.map(p => p.id),
    problemPoints: problems.length > 0 ? 10 / problems.length : 0,
  };
}
