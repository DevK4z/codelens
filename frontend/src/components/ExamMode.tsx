import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, BookOpen, ClipboardList, Clock, Dices, Flag, History, LoaderCircle, Maximize, Play, RotateCcw, Send, ShieldAlert,
  Sparkles, Trash2, TriangleAlert,
} from 'lucide-react';
import { CodeEditor } from './CodeEditor';
import {
  EXAM_CHAPTERS, PRESET_EXAMS, PRESET_SPECS, availableProblems, chapterTitle, examTotalPoints, generateExamSpec, resolveExam,
  suggestDuration,
} from '../data/exams';
import type { CodeProblem, Exam, ExamSpec } from '../data/exams';
import { executeCode } from '../engine/api';
import {
  chapterBreakdown, clearHistory, clearSession, createSession, formatClock, formatPoints, historyEntry, loadHistory, loadSession,
  outputsMatch, problemScore, recordHistory, saveSession, scoreProblem, totalScore,
} from '../engine/examGrading';
import type { ChapterScore, ExamHistoryEntry, ExamSession, ProblemResult, TestVerdict } from '../engine/examGrading';
import type { ThemeMode } from '../engine/types';

interface ExamModeProps {
  theme: ThemeMode;
  onExit: () => void;
}

type FsDoc = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> };
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };

const fullscreenElement = () => document.fullscreenElement ?? (document as FsDoc).webkitFullscreenElement ?? null;

async function enterFullscreen(): Promise<boolean> {
  const el = document.documentElement as FsEl;
  try {
    if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' });
    else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    else return false;
    // Chromium: giữ phím Esc để thoát thay vì nhấn một lần (giảm thoát nhầm).
    try { await (navigator as Navigator & { keyboard?: { lock: (k: string[]) => Promise<void> } }).keyboard?.lock(['Escape']); } catch { /* optional */ }
    return !!fullscreenElement();
  } catch { return false; }
}

async function leaveFullscreen() {
  try {
    if (!fullscreenElement()) return;
    if (document.exitFullscreen) await document.exitFullscreen();
    else await (document as FsDoc).webkitExitFullscreen?.();
  } catch { /* already left */ }
}

const VERDICT_LABEL: Record<TestVerdict, string> = {
  AC: 'Đúng', WA: 'Sai kết quả', CE: 'Lỗi biên dịch', RE: 'Lỗi khi chạy', ERR: 'Không chấm được',
};

async function gradeProblem(problem: CodeProblem, code: string, onProgress?: (done: number) => void): Promise<ProblemResult> {
  const verdicts: TestVerdict[] = [];
  let message: string | undefined;
  for (let i = 0; i < problem.tests.length; i++) {
    const test = problem.tests[i];
    try {
      const res = await executeCode(code, test.input, 'run', 'gnu++17');
      if (!res.success && res.compilationError) {
        message = res.compilationError;
        while (verdicts.length < problem.tests.length) verdicts.push('CE');
        break;
      }
      if (!res.success) verdicts.push('RE');
      else verdicts.push(outputsMatch(res.stdout || '', test.output) ? 'AC' : 'WA');
    } catch (err) {
      message = err instanceof Error ? err.message : String(err);
      while (verdicts.length < problem.tests.length) verdicts.push('ERR');
      break;
    }
    onProgress?.(i + 1);
  }
  return { code, verdicts, score: scoreProblem(problem, verdicts), message };
}

export function ExamMode({ theme, onExit }: ExamModeProps) {
  const [session, setSession] = useState<ExamSession | null>(() => loadSession());
  const spec = session?.spec;
  const exam = useMemo(() => (spec ? resolveExam(spec) : null), [spec]);
  const proctored = !!exam?.proctored;
  const [startError, setStartError] = useState<string | null>(null);
  const [needFullscreen, setNeedFullscreen] = useState(() => {
    const s = loadSession();
    return !!s && !s.submittedAt && s.spec.proctored;
  });
  const [current, setCurrent] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [grading, setGrading] = useState<string | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [history, setHistory] = useState<ExamHistoryEntry[]>(() => loadHistory());

  const sessionRef = useRef(session);
  sessionRef.current = session;
  const submittingRef = useRef(false);
  const lastViolationRef = useRef(0);

  const running = !!session && !!exam && !session.submittedAt;

  useEffect(() => { if (session) saveSession(session); }, [session]);

  // Ghi lịch sử khi đã nộp và chấm xong (cập nhật lại nếu chấm lại).
  useEffect(() => {
    if (!session?.submittedAt || !exam || grading) return;
    setHistory(recordHistory(historyEntry(exam, session, examTotalPoints(exam))));
  }, [session, exam, grading]);

  const update = useCallback((fn: (s: ExamSession) => ExamSession) => {
    setSession(prev => (prev ? fn(prev) : prev));
  }, []);

  const submit = useCallback(async (reason: NonNullable<ExamSession['submitReason']>) => {
    const s = sessionRef.current;
    const ex = s && resolveExam(s.spec);
    if (!s || !ex || s.submittedAt || submittingRef.current) return;
    submittingRef.current = true;
    setConfirmSubmit(false);
    const results: Record<string, ProblemResult> = { ...s.results };
    for (const p of ex.problems) {
      const code = s.codes[p.id] ?? p.starterCode;
      if (code === p.starterCode) {
        results[p.id] = { code, verdicts: p.tests.map(() => 'WA'), score: 0, message: 'Chưa làm bài.' };
        continue;
      }
      if (results[p.id]?.code === code && !results[p.id].verdicts.includes('ERR')) continue;
      setGrading(`Đang chấm ${p.title}…`);
      results[p.id] = await gradeProblem(p, code, done => setGrading(`Đang chấm ${p.title}: ${done}/${p.tests.length} test`));
    }
    setGrading(null);
    setSession(prev => prev && { ...prev, results, submittedAt: Date.now(), submitReason: reason });
    setNeedFullscreen(false);
    submittingRef.current = false;
    await leaveFullscreen();
  }, []);

  const addViolation = useCallback((reason: string) => {
    const s = sessionRef.current;
    if (!s || s.submittedAt || !s.spec.proctored || submittingRef.current) return;
    const t = Date.now();
    if (t - lastViolationRef.current < 1500) return; // blur + visibilitychange cùng lúc chỉ tính 1 lần
    lastViolationRef.current = t;
    const violations = [...s.violations, { at: t, reason }];
    const next = { ...s, violations };
    sessionRef.current = next;
    setSession(next);
    const max = s.spec.maxViolations || 3;
    if (violations.length >= max) {
      setWarning(`Vi phạm ${violations.length}/${max}: ${reason}. Bài thi được nộp tự động.`);
      void submit('violations');
    } else {
      setWarning(`Cảnh báo vi phạm ${violations.length}/${max}: ${reason}. Đủ ${max} lần bài sẽ tự động nộp.`);
    }
  }, [submit]);

  // Tiếp tục phiên thi có giám sát sau khi tải lại trang: tính là rời trang thi.
  const resumedRef = useRef(false);
  useEffect(() => {
    if (resumedRef.current) return;
    resumedRef.current = true;
    if (session && !session.submittedAt && session.spec.proctored && !fullscreenElement()) addViolation('Tải lại hoặc rời trang thi');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Đồng hồ + tự nộp khi hết giờ.
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (sessionRef.current && t >= sessionRef.current.endsAt) void submit('timeout');
    }, 500);
    return () => window.clearInterval(id);
  }, [running, submit]);

  // Giám sát (chỉ khi thi có giám sát): thoát toàn màn hình, chuyển tab, rời cửa sổ, phím tắt, dán, chuột phải.
  useEffect(() => {
    if (!running || !proctored) return;
    const onFs = () => {
      if (!fullscreenElement() && !submittingRef.current) {
        setNeedFullscreen(true);
        addViolation('Thoát chế độ toàn màn hình');
      }
    };
    const onVisibility = () => { if (document.hidden) addViolation('Chuyển tab hoặc thu nhỏ cửa sổ'); };
    const onBlur = () => addViolation('Rời khỏi cửa sổ làm bài');
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      const blocked = k === 'f12' || (mod && e.shiftKey && ['i', 'j', 'c'].includes(k)) || (mod && e.altKey && ['i', 'j', 'c'].includes(k)) ||
        (mod && ['u', 'p', 's', 'o'].includes(k));
      if (blocked) { e.preventDefault(); e.stopPropagation(); setWarning('Phím tắt này bị khóa trong khi thi.'); }
    };
    const block = (e: Event) => { e.preventDefault(); e.stopPropagation(); setWarning('Không được dán hoặc kéo thả nội dung trong khi thi.'); };
    const noMenu = (e: Event) => e.preventDefault();
    const beforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('webkitfullscreenchange', onFs);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('paste', block, true);
    window.addEventListener('drop', block, true);
    window.addEventListener('contextmenu', noMenu, true);
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('webkitfullscreenchange', onFs);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('paste', block, true);
      window.removeEventListener('drop', block, true);
      window.removeEventListener('contextmenu', noMenu, true);
      window.removeEventListener('beforeunload', beforeUnload);
    };
  }, [running, proctored, addViolation]);

  useEffect(() => {
    if (!warning) return;
    const id = window.setTimeout(() => setWarning(null), 6000);
    return () => window.clearTimeout(id);
  }, [warning]);

  const start = async (nextSpec: ExamSpec) => {
    setStartError(null);
    if (!resolveExam(nextSpec)) {
      setStartError('Đề này không còn bài nào trong ngân hàng.');
      return;
    }
    if (nextSpec.proctored) {
      const ok = await enterFullscreen();
      if (!ok) {
        setStartError('Trình duyệt không cho phép bật toàn màn hình nên chưa thể bắt đầu bài thi có giám sát. Hãy dùng Chrome/Edge/Firefox trên máy tính và cho phép toàn màn hình, hoặc chọn chế độ Luyện tập.');
        return;
      }
      lastViolationRef.current = Date.now(); // bỏ qua blur do hộp thoại toàn màn hình
    }
    const s = createSession(nextSpec);
    sessionRef.current = s;
    setSession(s);
    setCurrent(0);
    setNow(Date.now());
    setWarning(null);
    setNeedFullscreen(false);
  };

  const backToFullscreen = async () => {
    lastViolationRef.current = Date.now();
    if (await enterFullscreen()) setNeedFullscreen(false);
  };

  const resetAll = () => { clearSession(); setSession(null); setCurrent(0); setWarning(null); };

  const regrade = async () => {
    const s = sessionRef.current;
    if (!s || !exam) return;
    const results = { ...s.results };
    for (const p of exam.problems) {
      const code = s.codes[p.id] ?? p.starterCode;
      if (code === p.starterCode || !results[p.id]?.verdicts.includes('ERR')) continue;
      setGrading(`Đang chấm lại ${p.title}…`);
      results[p.id] = await gradeProblem(p, code);
    }
    setGrading(null);
    setSession(prev => prev && { ...prev, results });
  };

  const shell = 'fixed inset-0 z-[100] flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]';

  // ---------- Chọn / tạo đề ----------
  if (!session || !exam) {
    return (
      <div className={`${shell} overflow-auto`} role="dialog" aria-label="Chọn đề thi">
        <ExamLobby onStart={start} onExit={onExit} startError={startError} history={history}
          onClearHistory={() => { clearHistory(); setHistory([]); }} />
      </div>
    );
  }

  // ---------- Kết quả ----------
  if (session.submittedAt) {
    return (
      <div className={`${shell} overflow-auto`} role="dialog" aria-label="Kết quả bài thi">
        <ResultsView exam={exam} session={session} grading={grading} onRegrade={regrade} startError={startError}
          onRetake={() => { void start(session.spec); }} onNew={resetAll} onExit={() => { if (!grading) onExit(); }} />
      </div>
    );
  }

  // ---------- Đang làm bài ----------
  const index = Math.min(current, exam.problems.length - 1);
  const problem = exam.problems[index];
  const remaining = session.endsAt - now;
  const touchedCount = exam.problems.filter(p => (session.codes[p.id] ?? p.starterCode) !== p.starterCode).length;
  const flags = new Set(session.flags);
  const toggleFlag = (id: string) => update(s => ({ ...s, flags: s.flags.includes(id) ? s.flags.filter(x => x !== id) : [...s.flags, id] }));

  return (
    <div className={shell} role="dialog" aria-label={`Đang thi: ${exam.title}`}
      onCopy={proctored ? e => { if (!(e.target as HTMLElement).closest?.('.monaco-editor')) e.preventDefault(); } : undefined}>
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-panel)]">
        <strong className="truncate">{exam.title}</strong>
        <div className="flex items-center gap-4 text-sm">
          <span className={`flex items-center gap-1 font-mono text-lg ${remaining < 5 * 60_000 ? 'text-red-500 animate-pulse' : ''}`} aria-label="Thời gian còn lại">
            <Clock size={18} /> {formatClock(remaining)}
          </span>
          {proctored
            ? <span className={`flex items-center gap-1 ${session.violations.length ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}>
                <ShieldAlert size={16} /> Vi phạm {session.violations.length}/{exam.maxViolations}
              </span>
            : <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/15 text-blue-500"><BookOpen size={14} /> Luyện tập</span>}
          <button onClick={() => setConfirmSubmit(true)} disabled={!!grading} className="flex items-center gap-1 px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
            <Send size={16} /> Nộp bài
          </button>
        </div>
      </header>

      {warning && <div role="alert" className="px-4 py-2 bg-red-500/15 text-red-500 text-sm flex items-center gap-2"><TriangleAlert size={16} /> {warning}</div>}

      <div className={`flex-1 flex flex-col md:flex-row min-h-0 ${needFullscreen || grading ? 'blur-sm pointer-events-none select-none' : ''}`} aria-hidden={needFullscreen || !!grading}>
        <nav className="md:w-60 shrink-0 border-b md:border-b-0 md:border-r border-[var(--border)] bg-[var(--bg-secondary)] p-3 flex flex-col gap-2 overflow-auto text-sm" aria-label="Danh sách bài">
          <p className="font-semibold">Bài lập trình ({touchedCount}/{exam.problems.length} đã viết)</p>
          <div className="flex md:flex-col gap-1.5 overflow-x-auto">
            {exam.problems.map((p, i) => {
              const touched = (session.codes[p.id] ?? p.starterCode) !== p.starterCode;
              return (
                <button key={p.id} onClick={() => setCurrent(i)} aria-current={index === i} title={`${p.chapter} · ${chapterTitle(p.chapter)}`}
                  className={`relative px-2 py-1.5 rounded border text-left text-xs whitespace-nowrap md:whitespace-normal ${index === i ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]' : 'border-[var(--border)]'} ${touched ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-panel)]'}`}>
                  Bài {i + 1}. {p.title}
                  {flags.has(p.id) && <Flag size={10} className="absolute -top-1 -right-1 text-orange-500 fill-orange-500" aria-label="đã đánh dấu" />}
                </button>
              );
            })}
          </div>
          {flags.size > 0 && <p className="text-xs text-orange-500 flex items-center gap-1"><Flag size={12} /> {flags.size} bài đánh dấu xem lại</p>}
        </nav>

        <main className="flex-1 min-h-0 overflow-auto">
          <ProblemView key={problem.id} problem={problem} index={index} theme={theme}
            flagged={flags.has(problem.id)} onToggleFlag={() => toggleFlag(problem.id)}
            code={session.codes[problem.id] ?? problem.starterCode}
            onChange={code => update(s => ({ ...s, codes: { ...s.codes, [problem.id]: code } }))} />
        </main>
      </div>

      {needFullscreen && !grading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 p-4" role="alertdialog" aria-label="Yêu cầu toàn màn hình">
          <div className="max-w-md w-full rounded-lg bg-[var(--bg-panel)] border border-red-500/50 p-6 flex flex-col gap-4 text-center">
            <ShieldAlert size={40} className="mx-auto text-red-500" />
            <h3 className="text-lg font-bold">Bạn đã rời chế độ toàn màn hình</h3>
            <p className="text-sm text-[var(--text-secondary)]">Đã ghi nhận vi phạm {session.violations.length}/{exam.maxViolations}. Đồng hồ vẫn đang chạy. Quay lại toàn màn hình để tiếp tục làm bài.</p>
            <button onClick={backToFullscreen} className="flex items-center justify-center gap-2 px-4 py-2 rounded bg-[var(--accent)] text-white font-medium">
              <Maximize size={16} /> Quay lại toàn màn hình
            </button>
          </div>
        </div>
      )}

      {grading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-4" role="status">
          <div className="rounded-lg bg-[var(--bg-panel)] p-6 flex items-center gap-3"><LoaderCircle className="animate-spin" /> {grading}</div>
        </div>
      )}

      {confirmSubmit && !grading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-4" role="alertdialog" aria-label="Xác nhận nộp bài">
          <div className="max-w-md w-full rounded-lg bg-[var(--bg-panel)] border border-[var(--border)] p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold">Nộp bài?</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Đã viết {touchedCount}/{exam.problems.length} bài. Bài làm sẽ được chấm bằng toàn bộ test (kể cả test ẩn) và không sửa được nữa.
            </p>
            {flags.size > 0 && (
              <p className="text-sm text-orange-500 flex items-center gap-2"><Flag size={14} /> Còn {flags.size} bài bạn đánh dấu xem lại.</p>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmSubmit(false)} className="px-4 py-2 rounded border border-[var(--border)]">Tiếp tục làm</button>
              <button onClick={() => submit('manual')} className="px-4 py-2 rounded bg-green-600 text-white">Nộp bài</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ======================= Sảnh chọn đề =======================

interface BuilderPrefs {
  chapters: string[];
  problemCount: number;
  proctored: boolean;
  durationMinutes: number | null; // null: dùng thời gian gợi ý
}

const PREFS_KEY = 'codelens.exam-builder.v2';
const DEFAULT_PREFS: BuilderPrefs = { chapters: EXAM_CHAPTERS.map(c => c.id), problemCount: 3, proctored: true, durationMinutes: null };

function loadPrefs(): BuilderPrefs {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const p = JSON.parse(raw) as Partial<BuilderPrefs>;
    return {
      chapters: Array.isArray(p.chapters) ? p.chapters.filter(id => EXAM_CHAPTERS.some(c => c.id === id)) : DEFAULT_PREFS.chapters,
      problemCount: typeof p.problemCount === 'number' ? p.problemCount : DEFAULT_PREFS.problemCount,
      proctored: typeof p.proctored === 'boolean' ? p.proctored : DEFAULT_PREFS.proctored,
      durationMinutes: typeof p.durationMinutes === 'number' ? p.durationMinutes : null,
    };
  } catch { return DEFAULT_PREFS; }
}

function savePrefs(p: BuilderPrefs) {
  try { window.localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch { /* optional */ }
}

const CHAPTER_GROUPS: { label: string; ids: string[] }[] = [
  { label: 'Tất cả', ids: EXAM_CHAPTERS.map(c => c.id) },
  { label: 'Giữa kỳ (L1–L5)', ids: ['L1', 'L2', 'L3.1', 'L3.2', 'L4', 'L5'] },
  { label: 'Cuối kỳ (L6–L9)', ids: ['L6', 'L7', 'L8', 'L9'] },
  { label: 'Bỏ chọn', ids: [] },
];

const clampInt = (v: string, min: number, max: number) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
};

function ExamLobby({ onStart, onExit, startError, history, onClearHistory }: {
  onStart: (spec: ExamSpec) => void; onExit: () => void; startError: string | null;
  history: ExamHistoryEntry[]; onClearHistory: () => void;
}) {
  const [prefs, setPrefs] = useState<BuilderPrefs>(() => loadPrefs());
  const [draft, setDraft] = useState<ExamSpec | null>(null);
  const draftExam = useMemo(() => (draft ? resolveExam(draft) : null), [draft]);

  const change = (patch: Partial<BuilderPrefs>) => {
    setPrefs(prev => { const next = { ...prev, ...patch }; savePrefs(next); return next; });
    setDraft(null);
  };

  const avail = availableProblems(prefs.chapters);
  const count = Math.min(prefs.problemCount, avail);
  const suggested = suggestDuration(count);
  const duration = prefs.durationMinutes ?? suggested;
  const canGenerate = prefs.chapters.length > 0 && count > 0;

  const generate = () => {
    if (!canGenerate) return;
    setDraft(generateExamSpec({ chapters: prefs.chapters, problemCount: count, durationMinutes: duration, proctored: prefs.proctored }));
  };

  const toggleChapter = (id: string) => change({
    chapters: prefs.chapters.includes(id) ? prefs.chapters.filter(c => c !== id) : [...prefs.chapters, id],
  });

  // Thống kê theo chương gộp từ lịch sử.
  const chapterStats = useMemo(() => {
    const map = new Map<string, { got: number; max: number }>();
    for (const h of history) for (const c of h.byChapter) {
      const row = map.get(c.chapter) ?? { got: 0, max: 0 };
      row.got += c.got; row.max += c.max;
      map.set(c.chapter, row);
    }
    return EXAM_CHAPTERS.flatMap(c => {
      const row = map.get(c.id);
      return row && row.max > 0 ? [{ chapter: c.id, got: row.got, max: row.max }] : [];
    });
  }, [history]);

  const card = 'rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] p-5 flex flex-col gap-4';
  const input = 'w-24 px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--bg-primary)]';

  return (
    <div className="max-w-5xl w-full mx-auto p-4 md:p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="text-[var(--accent)]" /> Làm bài thi</h2>
        <button onClick={onExit} className="flex items-center gap-1 px-3 py-2 rounded border border-[var(--border)] hover:bg-[var(--bg-secondary)] text-sm">
          <ArrowLeft size={16} /> Quay về CodeLens
        </button>
      </div>

      {startError && <p role="alert" className="p-3 rounded bg-red-500/15 text-red-500 text-sm">{startError}</p>}

      {/* ---- Tạo đề theo chương ---- */}
      <section className={card} aria-label="Tạo đề theo chương">
        <h3 className="text-lg font-semibold flex items-center gap-2"><Sparkles size={18} className="text-[var(--accent)]" /> Tạo đề theo chương</h3>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium mr-1">Chọn chương:</span>
            {CHAPTER_GROUPS.map(g => (
              <button key={g.label} onClick={() => change({ chapters: g.ids })}
                className="px-2.5 py-1 rounded-full border border-[var(--border)] hover:bg-[var(--bg-secondary)] text-xs">{g.label}</button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {EXAM_CHAPTERS.map(c => {
              const on = prefs.chapters.includes(c.id);
              return (
                <label key={c.id} className={`flex items-start gap-2 p-2.5 rounded border cursor-pointer text-sm ${on ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border)] hover:bg-[var(--bg-secondary)]'}`}>
                  <input type="checkbox" checked={on} onChange={() => toggleChapter(c.id)} className="mt-0.5 accent-[var(--accent)]" />
                  <span className="flex flex-col">
                    <span><strong>{c.id}</strong> · {c.title}</span>
                    <span className="text-xs text-[var(--text-secondary)]">{availableProblems([c.id])} bài</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
          <label className="flex flex-col gap-1">
            <span>Số bài <span className="text-[var(--text-secondary)]">(tối đa {avail})</span></span>
            <input type="number" min={1} max={Math.max(1, avail)} value={count} className={input}
              onChange={e => change({ problemCount: clampInt(e.target.value, 1, Math.max(1, avail)) })} />
          </label>
          <label className="flex flex-col gap-1">
            <span>Thời gian (phút)</span>
            <span className="flex items-center gap-2">
              <input type="number" min={1} max={300} value={duration} className={input}
                onChange={e => change({ durationMinutes: clampInt(e.target.value, 1, 300) })} />
              {prefs.durationMinutes !== null && prefs.durationMinutes !== suggested && (
                <button onClick={() => change({ durationMinutes: null })} className="text-xs underline text-[var(--accent)]">Dùng gợi ý ({suggested})</button>
              )}
            </span>
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 text-sm" role="radiogroup" aria-label="Chế độ">
          {[
            { v: true, title: 'Thi có giám sát', desc: 'Toàn màn hình, tính vi phạm, cấm dán code.', icon: <ShieldAlert size={16} /> },
            { v: false, title: 'Luyện tập', desc: 'Không giám sát, không tính vi phạm — vẫn có giờ và chấm test ẩn khi nộp.', icon: <BookOpen size={16} /> },
          ].map(m => (
            <label key={m.title} className={`flex-1 flex items-start gap-2 p-3 rounded border cursor-pointer ${prefs.proctored === m.v ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border)]'}`}>
              <input type="radio" name="exam-mode" checked={prefs.proctored === m.v} onChange={() => change({ proctored: m.v })} className="mt-0.5 accent-[var(--accent)]" />
              <span className="flex flex-col"><span className="font-medium flex items-center gap-1">{m.icon} {m.title}</span>
                <span className="text-xs text-[var(--text-secondary)]">{m.desc}</span></span>
            </label>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={generate} disabled={!canGenerate}
            className="flex items-center gap-2 px-4 py-2 rounded bg-[var(--accent)] text-white font-medium hover:opacity-90 disabled:opacity-40">
            <Dices size={16} /> {draft ? 'Đổi đề khác' : 'Tạo đề'}
          </button>
          {!canGenerate && <span className="text-xs text-[var(--text-secondary)]">Chọn ít nhất một chương.</span>}
        </div>

        {draft && draftExam && (
          <div className="rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/5 p-4 flex flex-col gap-3 text-sm" aria-label="Đề vừa tạo">
            <div className="flex flex-wrap justify-between gap-2">
              <strong>{draftExam.title}</strong>
              <span className="text-[var(--text-secondary)] flex items-center gap-3">
                <span className="flex items-center gap-1"><Clock size={14} /> {draftExam.durationMinutes} phút</span>
                <span>{draftExam.problems.length} bài · mỗi bài {formatPoints(draftExam.problems[0].points)} điểm</span>
              </span>
            </div>
            <ol className="list-decimal pl-5 flex flex-col gap-0.5">
              {draftExam.problems.map(p => (
                <li key={p.id}>{p.title} <span className="text-xs text-[var(--text-secondary)]">— {p.chapter} {chapterTitle(p.chapter)}</span></li>
              ))}
            </ol>
            {count < prefs.problemCount && (
              <p className="text-xs text-orange-500">Các chương đã chọn chỉ có {avail} bài nên đề được rút gọn.</p>
            )}
            {draftExam.proctored && <ProctorRules maxViolations={draftExam.maxViolations} />}
            <button onClick={() => onStart(draft)} className="self-start flex items-center gap-2 px-4 py-2 rounded bg-green-600 text-white font-medium hover:bg-green-700">
              {draftExam.proctored ? <><Maximize size={16} /> Bắt đầu (toàn màn hình)</> : <><Play size={16} /> Bắt đầu luyện tập</>}
            </button>
          </div>
        )}
      </section>

      {/* ---- Đề có sẵn ---- */}
      <section className="flex flex-col gap-3" aria-label="Đề có sẵn">
        <h3 className="text-lg font-semibold">Đề có sẵn</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {PRESET_EXAMS.map(ex => (
            <article key={ex.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] p-5 flex flex-col gap-3">
              <h4 className="font-semibold">{ex.title}</h4>
              <p className="text-sm text-[var(--text-secondary)] flex-1">{ex.description}</p>
              <div className="flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]">
                <span className="flex items-center gap-1"><Clock size={14} /> {ex.durationMinutes} phút</span>
                <span>{ex.problems.length} bài</span>
                <span>Chương {ex.chapters.join(', ')}</span>
              </div>
              <button onClick={() => { const preset = PRESET_SPECS.find(s => s.id === ex.id); if (preset) onStart(preset); }}
                className="mt-1 flex items-center justify-center gap-2 px-4 py-2 rounded bg-[var(--accent)] text-white font-medium hover:opacity-90">
                <Maximize size={16} /> Bắt đầu (toàn màn hình)
              </button>
            </article>
          ))}
        </div>
        <ProctorRules maxViolations={3} />
      </section>

      {/* ---- Lịch sử ---- */}
      {history.length > 0 && (
        <section className={card} aria-label="Lịch sử làm bài">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold flex items-center gap-2"><History size={18} /> Lịch sử làm bài</h3>
            <button onClick={() => { if (window.confirm('Xóa toàn bộ lịch sử làm bài?')) onClearHistory(); }}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--bg-secondary)]">
              <Trash2 size={14} /> Xóa lịch sử
            </button>
          </div>
          {chapterStats.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium">Tỉ lệ điểm theo chương (gộp mọi lần làm)</p>
              <ChapterBars rows={chapterStats} />
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-[var(--text-secondary)]">
                <tr><th className="py-1 pr-3">Thời điểm</th><th className="py-1 pr-3">Đề</th><th className="py-1 pr-3">Điểm</th><th className="py-1 pr-3">Thời gian</th><th /></tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id} className="border-t border-[var(--border)]">
                    <td className="py-1.5 pr-3 whitespace-nowrap">{new Date(h.at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="py-1.5 pr-3">{h.title}{!h.proctored && <span className="ml-1 text-xs text-blue-500">(luyện tập)</span>}</td>
                    <td className="py-1.5 pr-3 font-semibold whitespace-nowrap">{formatPoints(h.score)}/{formatPoints(h.max)}</td>
                    <td className="py-1.5 pr-3 whitespace-nowrap">{formatClock(h.durationMs)}</td>
                    <td className="py-1.5 text-right">
                      <button onClick={() => onStart(h.spec)} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--bg-secondary)]">
                        <RotateCcw size={12} /> Làm lại
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function ProctorRules({ maxViolations }: { maxViolations: number }) {
  return (
    <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm flex flex-col gap-2">
      <strong className="flex items-center gap-2"><ShieldAlert size={18} className="text-yellow-500" /> Quy chế thi có giám sát</strong>
      <ul className="list-disc pl-5 flex flex-col gap-1 text-[var(--text-secondary)]">
        <li>Bài thi chạy <strong>toàn màn hình</strong> suốt thời gian làm bài.</li>
        <li>Thoát toàn màn hình, chuyển tab, chuyển ứng dụng hoặc tải lại trang đều bị ghi nhận là <strong>vi phạm</strong>.</li>
        <li>Đủ {maxViolations} lần vi phạm, bài thi bị <strong>nộp tự động</strong>. Hết giờ cũng tự động nộp.</li>
        <li>Không được dán (paste), kéo thả nội dung, mở chuột phải hay công cụ nhà phát triển.</li>
        <li>Bài được chấm bằng test ẩn trên backend — cần kết nối backend khi nộp bài.</li>
      </ul>
    </div>
  );
}

function ChapterBars({ rows }: { rows: ChapterScore[] }) {
  return (
    <ul className="flex flex-col gap-1.5 text-xs">
      {rows.map(r => {
        const pct = r.max > 0 ? Math.round((r.got / r.max) * 100) : 0;
        const color = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';
        return (
          <li key={r.chapter} className="grid grid-cols-[minmax(0,11rem)_1fr_auto] items-center gap-2">
            <span className="truncate" title={chapterTitle(r.chapter)}><strong>{r.chapter}</strong> {chapterTitle(r.chapter)}</span>
            <span className="h-2 rounded bg-[var(--bg-secondary)] overflow-hidden" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={r.chapter}>
              <span className={`block h-full ${color}`} style={{ width: `${pct}%` }} />
            </span>
            <span className="tabular-nums w-24 text-right">{formatPoints(r.got)}/{formatPoints(r.max)} ({pct}%)</span>
          </li>
        );
      })}
    </ul>
  );
}

// ======================= Kết quả =======================

function ResultsView({ exam, session, grading, onRegrade, onRetake, onNew, onExit, startError }: {
  exam: Exam; session: ExamSession; grading: string | null; startError: string | null;
  onRegrade: () => void; onRetake: () => void; onNew: () => void; onExit: () => void;
}) {
  const total = totalScore(exam, session);
  const max = examTotalPoints(exam);
  const breakdown = chapterBreakdown(exam, session);
  const weak = breakdown.filter(r => r.max > 0 && r.got / r.max < 0.5);
  const hasErr = exam.problems.some(p => session.results[p.id]?.verdicts.includes('ERR'));
  const reasonText = session.submitReason === 'timeout' ? 'Hết giờ — hệ thống tự nộp.' :
    session.submitReason === 'violations' ? `Vi phạm quy chế ${session.violations.length} lần — hệ thống tự nộp.` : 'Bạn đã nộp bài.';

  return (
    <div className="max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{exam.title}</h2>
          <p className="text-sm text-[var(--text-secondary)]">{reasonText} Thời gian làm: {formatClock((session.submittedAt ?? session.startedAt) - session.startedAt)}</p>
        </div>
        <div className="text-4xl font-bold text-[var(--accent)]">{formatPoints(total)}<span className="text-lg text-[var(--text-secondary)]">/{formatPoints(max)}</span></div>
      </header>
      {startError && <p role="alert" className="p-3 rounded bg-red-500/15 text-red-500 text-sm">{startError}</p>}
      {grading && <p className="flex items-center gap-2 text-sm"><LoaderCircle className="animate-spin" size={16} /> {grading}</p>}
      {hasErr && !grading && (
        <div role="alert" className="p-3 rounded bg-red-500/15 text-sm flex flex-wrap items-center justify-between gap-3">
          <span>Một số bài chưa chấm được do lỗi kết nối backend. Bài làm đã được lưu.</span>
          <button onClick={onRegrade} className="px-3 py-1 rounded bg-red-500 text-white">Chấm lại</button>
        </div>
      )}

      {breakdown.length > 1 && (
        <section className="rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] p-4 flex flex-col gap-3">
          <h3 className="font-semibold">Điểm theo chương</h3>
          <ChapterBars rows={breakdown} />
        </section>
      )}
      {weak.length > 0 && (
        <p className="text-sm text-orange-500">Nên ôn lại: {weak.map(r => `${r.chapter} (${chapterTitle(r.chapter)})`).join(', ')} — có thể mở Ngân hàng bài tập của chương đó để luyện thêm.</p>
      )}

      <section className="flex flex-col gap-3">
        {exam.problems.map((p, i) => {
          const r = session.results[p.id];
          return (
            <div key={p.id} className="rounded border border-[var(--border)] p-3 text-sm flex flex-col gap-2">
              <div className="flex justify-between gap-2">
                <strong>Bài {i + 1}. {p.title} <span className="text-xs font-normal text-[var(--text-secondary)]">[{p.chapter}]</span></strong>
                <span className="whitespace-nowrap">{formatPoints(problemScore(p, session))}/{formatPoints(p.points)} điểm</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {p.tests.map((t, j) => {
                  const v = r?.verdicts[j];
                  return <span key={j} className={`px-2 py-0.5 rounded text-xs ${v === 'AC' ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500'}`}>
                    {t.hidden ? 'Test ẩn' : 'Test ví dụ'} {j + 1}: {v ? VERDICT_LABEL[v] : '—'}
                  </span>;
                })}
              </div>
              {r?.message && <pre className="whitespace-pre-wrap break-words text-xs text-[var(--text-secondary)] max-h-40 overflow-auto">{r.message}</pre>}
            </div>
          );
        })}
      </section>

      {session.violations.length > 0 && (
        <section className="text-sm">
          <h3 className="font-semibold mb-2">Nhật ký vi phạm</h3>
          <ul className="list-disc pl-5 text-[var(--text-secondary)]">
            {session.violations.map((v, i) => <li key={i}>{new Date(v.at).toLocaleTimeString('vi-VN')} — {v.reason}</li>)}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <button onClick={onRetake} disabled={!!grading} className="flex items-center gap-2 px-4 py-2 rounded border border-[var(--accent)] text-[var(--accent)] disabled:opacity-50">
          <RotateCcw size={16} /> Làm lại đề này
        </button>
        <button onClick={onNew} disabled={!!grading} className="flex items-center gap-2 px-4 py-2 rounded bg-[var(--accent)] text-white disabled:opacity-50">
          <Dices size={16} /> Tạo đề mới / chọn đề khác
        </button>
        <button onClick={onExit} disabled={!!grading} className="px-4 py-2 rounded border border-[var(--border)] disabled:opacity-50">Quay về CodeLens</button>
      </div>
    </div>
  );
}

// ======================= Làm bài =======================

function FlagButton({ flagged, onToggle }: { flagged: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} aria-pressed={flagged}
      className={`flex items-center gap-1 px-2 py-1 rounded border text-xs ${flagged ? 'border-orange-500 text-orange-500 bg-orange-500/10' : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}>
      <Flag size={12} className={flagged ? 'fill-orange-500' : ''} /> {flagged ? 'Đã đánh dấu' : 'Đánh dấu xem lại'}
    </button>
  );
}

function ProblemView({ problem, index, code, onChange, theme, flagged, onToggleFlag }: {
  problem: CodeProblem; index: number; code: string; onChange: (code: string) => void; theme: ThemeMode;
  flagged: boolean; onToggleFlag: () => void;
}) {
  const samples = problem.tests.filter(t => !t.hidden);
  const [running, setRunning] = useState(false);
  const [runResults, setRunResults] = useState<{ title: string; input: string; expected?: string; actual: string; ok?: boolean; error?: string }[]>([]);
  const [customInput, setCustomInput] = useState(samples[0]?.input ?? '');

  const runSamples = async () => {
    setRunning(true);
    const out: typeof runResults = [];
    for (let i = 0; i < samples.length; i++) {
      const t = samples[i];
      try {
        const res = await executeCode(code, t.input, 'run', 'gnu++17');
        const error = res.compilationError || (!res.success ? res.runtimeError || res.stderr || 'Lỗi khi chạy' : undefined);
        out.push({ title: `Ví dụ ${i + 1}`, input: t.input, expected: t.output, actual: res.stdout || '', ok: !error && outputsMatch(res.stdout || '', t.output), error });
        if (res.compilationError) break;
      } catch (err) {
        out.push({ title: `Ví dụ ${i + 1}`, input: t.input, expected: t.output, actual: '', ok: false, error: err instanceof Error ? err.message : String(err) });
        break;
      }
    }
    setRunResults(out);
    setRunning(false);
  };

  const runCustom = async () => {
    setRunning(true);
    try {
      const res = await executeCode(code, customInput, 'run', 'gnu++17');
      const error = res.compilationError || (!res.success ? res.runtimeError || res.stderr || 'Lỗi khi chạy' : undefined);
      setRunResults([{ title: 'Input tự nhập', input: customInput, actual: res.stdout || '', error }]);
    } catch (err) {
      setRunResults([{ title: 'Input tự nhập', input: customInput, actual: '', error: err instanceof Error ? err.message : String(err) }]);
    }
    setRunning(false);
  };

  return (
    <div className="h-full flex flex-col lg:flex-row min-h-0">
      <section className="lg:w-[42%] shrink-0 overflow-auto p-4 md:p-6 flex flex-col gap-3 text-sm border-b lg:border-b-0 lg:border-r border-[var(--border)] select-none">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[var(--text-secondary)]">Bài {index + 1} · {formatPoints(problem.points)} điểm · {problem.tests.length} test (có test ẩn) · {problem.chapter} {chapterTitle(problem.chapter)}</p>
          <FlagButton flagged={flagged} onToggle={onToggleFlag} />
        </div>
        <h3 className="text-lg font-semibold">{problem.title}</h3>
        <p className="whitespace-pre-wrap">{problem.statement}</p>
        <p><strong>Input:</strong> {problem.inputFormat}</p>
        <p><strong>Output:</strong> {problem.outputFormat}</p>
        <p><strong>Ràng buộc:</strong> {problem.constraints}</p>
        {samples.map((t, i) => (
          <div key={i} className="grid grid-cols-2 gap-2">
            <div><p className="text-xs font-semibold mb-1">Ví dụ {i + 1} — Input</p><pre className="rounded bg-[var(--bg-secondary)] border border-[var(--border)] p-2 font-mono text-xs whitespace-pre-wrap">{t.input}</pre></div>
            <div><p className="text-xs font-semibold mb-1">Output</p><pre className="rounded bg-[var(--bg-secondary)] border border-[var(--border)] p-2 font-mono text-xs whitespace-pre-wrap">{t.output}</pre></div>
          </div>
        ))}
      </section>
      <section className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-[300px]">
          <CodeEditor code={code} onChange={onChange} theme={theme} />
        </div>
        <div className="border-t border-[var(--border)] bg-[var(--bg-panel)] p-3 flex flex-col gap-2 max-h-[45%] overflow-auto text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={runSamples} disabled={running} className="flex items-center gap-1 px-3 py-1.5 rounded bg-[var(--accent)] text-white disabled:opacity-50">
              {running ? <LoaderCircle size={14} className="animate-spin" /> : <Play size={14} />} Chạy test ví dụ
            </button>
            <button onClick={runCustom} disabled={running} className="px-3 py-1.5 rounded border border-[var(--border)] disabled:opacity-50">Chạy với input tự nhập</button>
            <span className="text-xs text-[var(--text-secondary)]">Test ẩn chỉ chấm khi nộp bài.</span>
          </div>
          <textarea aria-label="Input tự nhập" value={customInput} onChange={e => setCustomInput(e.target.value)} rows={3}
            className="w-full font-mono text-xs bg-[var(--bg-primary)] border border-[var(--border)] rounded p-2" />
          {runResults.map((r, i) => (
            <div key={i} className={`rounded border p-2 ${r.ok === true ? 'border-green-500/40' : r.ok === false ? 'border-red-500/40' : 'border-[var(--border)]'}`}>
              <p className="font-semibold text-xs">{r.title}{r.ok === true ? ' — Đúng' : r.ok === false ? ' — Chưa đúng' : ''}</p>
              {r.error && <pre className="text-xs text-red-500 whitespace-pre-wrap break-words">{r.error}</pre>}
              <p className="text-xs mt-1">Output của bạn:</p>
              <pre className="font-mono text-xs whitespace-pre-wrap">{r.actual || '(trống)'}</pre>
              {r.expected !== undefined && <><p className="text-xs mt-1">Output mong đợi:</p><pre className="font-mono text-xs whitespace-pre-wrap">{r.expected}</pre></>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
