import type { CodeProblem, Exam } from '../data/exams';

export type TestVerdict = 'AC' | 'WA' | 'CE' | 'RE' | 'ERR';

export interface ProblemResult {
  code: string; // code đã chấm, để biết có cần chấm lại không
  verdicts: TestVerdict[];
  score: number;
  message?: string;
}

export interface ExamSession {
  version: 1;
  examId: string;
  startedAt: number;
  endsAt: number;
  answers: Record<string, number>;
  codes: Record<string, string>;
  results: Record<string, ProblemResult>;
  violations: { at: number; reason: string }[];
  submittedAt?: number;
  submitReason?: 'manual' | 'timeout' | 'violations';
}

export const EXAM_SESSION_KEY = 'codelens.exam-session.v1';

/** So sánh đầu ra kiểu chấm thi: bỏ khoảng trắng cuối dòng và dòng trống cuối. */
export function normalizeOutput(text: string): string {
  return text.replace(/\r\n?/g, '\n').split('\n').map(line => line.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '');
}

export function outputsMatch(actual: string, expected: string): boolean {
  return normalizeOutput(actual) === normalizeOutput(expected);
}

export function scoreProblem(problem: CodeProblem, verdicts: TestVerdict[]): number {
  const passed = verdicts.filter(v => v === 'AC').length;
  return Math.round((problem.points * passed / problem.tests.length) * 100) / 100;
}

export function choiceScore(exam: Exam, answers: Record<string, number>): number {
  return exam.questions.reduce((sum, q) => sum + (answers[q.id] === q.answer ? q.points : 0), 0);
}

export function totalScore(exam: Exam, session: Pick<ExamSession, 'answers' | 'results' | 'codes'>): number {
  const code = exam.problems.reduce((sum, p) => {
    const r = session.results[p.id];
    return sum + (r && r.code === (session.codes[p.id] ?? p.starterCode) ? r.score : 0);
  }, 0);
  return Math.round((choiceScore(exam, session.answers) + code) * 100) / 100;
}

export function createSession(exam: Exam, now = Date.now()): ExamSession {
  return {
    version: 1, examId: exam.id, startedAt: now, endsAt: now + exam.durationMinutes * 60_000,
    answers: {}, codes: Object.fromEntries(exam.problems.map(p => [p.id, p.starterCode])),
    results: {}, violations: [],
  };
}

type SessionStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function storage(): SessionStorage | null {
  try { return typeof window === 'undefined' ? null : window.localStorage; } catch { return null; }
}

export function loadSession(store = storage()): ExamSession | null {
  try {
    const raw = store?.getItem(EXAM_SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<ExamSession>;
    if (s.version !== 1 || typeof s.examId !== 'string' || typeof s.endsAt !== 'number' ||
      !s.answers || !s.codes || !s.results || !Array.isArray(s.violations)) return null;
    return s as ExamSession;
  } catch { return null; }
}

export function saveSession(session: ExamSession, store = storage()): boolean {
  try { store?.setItem(EXAM_SESSION_KEY, JSON.stringify(session)); return !!store; } catch { return false; }
}

export function clearSession(store = storage()): void {
  try { store?.removeItem(EXAM_SESSION_KEY); } catch { /* Storage may be blocked. */ }
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60), s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
