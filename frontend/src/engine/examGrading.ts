import { PRESET_SPECS, chapterRank, resolveExam, roundPoints } from '../data/exams.ts';
import type { CodeProblem, Exam, ExamSpec } from '../data/exams.ts';

export type TestVerdict = 'AC' | 'WA' | 'CE' | 'RE' | 'ERR';

export interface ProblemResult {
  code: string; // code đã chấm, để biết có cần chấm lại không
  verdicts: TestVerdict[];
  score: number;
  message?: string;
}

export interface ExamSession {
  version: 3;
  spec: ExamSpec;
  startedAt: number;
  endsAt: number;
  codes: Record<string, string>;
  results: Record<string, ProblemResult>;
  violations: { at: number; reason: string }[];
  flags: string[]; // id bài được đánh dấu "xem lại"
  submittedAt?: number;
  submitReason?: 'manual' | 'timeout' | 'violations';
}

export const EXAM_SESSION_KEY = 'codelens.exam-session.v1';
export const EXAM_HISTORY_KEY = 'codelens.exam-history.v1';
export const EXAM_HISTORY_LIMIT = 30;

/** So sánh đầu ra kiểu chấm thi: bỏ khoảng trắng cuối dòng và dòng trống cuối. */
export function normalizeOutput(text: string): string {
  return text.replace(/\r\n?/g, '\n').split('\n').map(line => line.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '');
}

export function outputsMatch(actual: string, expected: string): boolean {
  return normalizeOutput(actual) === normalizeOutput(expected);
}

/** Điểm chính xác (không làm tròn) để tổng các bài vẫn đúng 10 khi chia lẻ, ví dụ 3 bài × 10/3. */
export function scoreProblem(problem: CodeProblem, verdicts: TestVerdict[]): number {
  const passed = verdicts.filter(v => v === 'AC').length;
  return problem.points * passed / problem.tests.length;
}

type Graded = Pick<ExamSession, 'results' | 'codes'>;

/** Điểm một bài chỉ tính khi kết quả chấm ứng với đúng code hiện tại. */
export function problemScore(p: CodeProblem, session: Graded): number {
  const r = session.results[p.id];
  return r && r.code === (session.codes[p.id] ?? p.starterCode) ? r.score : 0;
}

export function totalScore(exam: Exam, session: Graded): number {
  return roundPoints(exam.problems.reduce((sum, p) => sum + problemScore(p, session), 0));
}

export interface ChapterScore {
  chapter: string;
  got: number;
  max: number;
}

export function chapterBreakdown(exam: Exam, session: Graded): ChapterScore[] {
  const map = new Map<string, ChapterScore>();
  for (const p of exam.problems) {
    const row = map.get(p.chapter) ?? { chapter: p.chapter, got: 0, max: 0 };
    row.got += problemScore(p, session);
    row.max += p.points;
    map.set(p.chapter, row);
  }
  // Giữ giá trị chính xác (làm tròn khi hiển thị) để cộng dồn qua nhiều lần thi không lệch.
  return [...map.values()].sort((a, b) => chapterRank(a.chapter) - chapterRank(b.chapter));
}

export function createSession(spec: ExamSpec, now = Date.now()): ExamSession {
  const exam = resolveExam(spec);
  return {
    version: 3, spec, startedAt: now, endsAt: now + spec.durationMinutes * 60_000,
    codes: Object.fromEntries((exam?.problems ?? []).map(p => [p.id, p.starterCode])),
    results: {}, violations: [], flags: [],
  };
}

type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function storage(): KeyValueStore | null {
  try { return typeof window === 'undefined' ? null : window.localStorage; } catch { return null; }
}

/**
 * Kiểm tra và chuẩn hóa spec đọc từ storage. Đề của bản cũ có phần trắc nghiệm (questionIds):
 * bỏ trắc nghiệm và chia lại thang 10 cho các bài lập trình.
 */
export function normalizeSpec(raw: unknown): ExamSpec | null {
  const s = raw as Record<string, unknown> | null;
  if (!s || typeof s !== 'object' || typeof s.id !== 'string' || typeof s.title !== 'string' ||
    typeof s.durationMinutes !== 'number' || !Array.isArray(s.problemIds)) return null;
  const preset = PRESET_SPECS.find(p => p.id === s.id);
  if (preset) return preset;
  const problemIds = s.problemIds.filter((x): x is string => typeof x === 'string');
  if (!problemIds.length) return null;
  const legacy = 'questionIds' in s;
  return {
    id: s.id,
    title: s.title,
    description: typeof s.description === 'string' ? s.description : '',
    durationMinutes: s.durationMinutes,
    maxViolations: typeof s.maxViolations === 'number' ? s.maxViolations : 3,
    proctored: s.proctored !== false,
    problemIds,
    problemPoints: !legacy && typeof s.problemPoints === 'number' ? s.problemPoints : 10 / problemIds.length,
  };
}

export function loadSession(store = storage()): ExamSession | null {
  try {
    const raw = store?.getItem(EXAM_SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Record<string, unknown>;
    if (typeof s.endsAt !== 'number' || typeof s.startedAt !== 'number' || !s.codes || typeof s.codes !== 'object' ||
      !s.results || typeof s.results !== 'object' || !Array.isArray(s.violations)) return null;
    const spec = s.version === 1 && typeof s.examId === 'string'
      ? PRESET_SPECS.find(p => p.id === s.examId) ?? null // phiên của bản đầu tiên
      : normalizeSpec(s.spec);
    if (!spec || !resolveExam(spec)) return null;
    const session: ExamSession = {
      version: 3, spec, startedAt: s.startedAt, endsAt: s.endsAt,
      codes: s.codes as ExamSession['codes'],
      results: s.results as ExamSession['results'],
      violations: s.violations as ExamSession['violations'],
      flags: Array.isArray(s.flags) ? s.flags.filter((x): x is string => typeof x === 'string') : [],
    };
    if (typeof s.submittedAt === 'number') session.submittedAt = s.submittedAt;
    if (s.submitReason === 'manual' || s.submitReason === 'timeout' || s.submitReason === 'violations') session.submitReason = s.submitReason;
    return session;
  } catch { return null; }
}

export function saveSession(session: ExamSession, store = storage()): boolean {
  try { store?.setItem(EXAM_SESSION_KEY, JSON.stringify(session)); return !!store; } catch { return false; }
}

export function clearSession(store = storage()): void {
  try { store?.removeItem(EXAM_SESSION_KEY); } catch { /* Storage may be blocked. */ }
}

// ---------------- Lịch sử làm bài ----------------

export interface ExamHistoryEntry {
  id: string; // `${spec.id}@${startedAt}`
  at: number; // thời điểm nộp
  title: string;
  proctored: boolean;
  score: number;
  max: number;
  durationMs: number;
  byChapter: ChapterScore[];
  spec: ExamSpec; // để "làm lại đề này"
}

export function historyEntry(exam: Exam, session: ExamSession, max: number): ExamHistoryEntry {
  const at = session.submittedAt ?? Date.now();
  return {
    id: `${session.spec.id}@${session.startedAt}`,
    at,
    title: exam.title,
    proctored: exam.proctored,
    score: totalScore(exam, session),
    max,
    durationMs: at - session.startedAt,
    byChapter: chapterBreakdown(exam, session),
    spec: session.spec,
  };
}

export function loadHistory(store = storage()): ExamHistoryEntry[] {
  try {
    const raw = store?.getItem(EXAM_HISTORY_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return [];
    return list.flatMap((e: Partial<ExamHistoryEntry> | null) => {
      const spec = e && normalizeSpec(e.spec);
      return e && spec && typeof e.id === 'string' && typeof e.score === 'number' && typeof e.at === 'number' && Array.isArray(e.byChapter)
        ? [{ ...(e as ExamHistoryEntry), spec }]
        : [];
    });
  } catch { return []; }
}

/** Thêm hoặc cập nhật (theo id) một lần làm bài; giữ tối đa EXAM_HISTORY_LIMIT lần gần nhất. */
export function recordHistory(entry: ExamHistoryEntry, store = storage()): ExamHistoryEntry[] {
  const list = [entry, ...loadHistory(store).filter(e => e.id !== entry.id)]
    .sort((a, b) => b.at - a.at)
    .slice(0, EXAM_HISTORY_LIMIT);
  try { store?.setItem(EXAM_HISTORY_KEY, JSON.stringify(list)); } catch { /* Storage may be blocked or full. */ }
  return list;
}

export function clearHistory(store = storage()): void {
  try { store?.removeItem(EXAM_HISTORY_KEY); } catch { /* Storage may be blocked. */ }
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60), s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatPoints(n: number): string {
  return String(roundPoints(n)).replace('.', ',');
}
