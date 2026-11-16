import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, CircleCheck, CircleX, ClipboardList, Clock, LoaderCircle, Maximize, Play, Send, ShieldAlert, TriangleAlert } from 'lucide-react';
import { CodeEditor } from './CodeEditor';
import { EXAMS, Exam, CodeProblem, examTotalPoints } from '../data/exams';
import { executeCode } from '../engine/api';
import {
  ExamSession, ProblemResult, TestVerdict, clearSession, createSession, formatClock, loadSession,
  outputsMatch, saveSession, scoreProblem, totalScore, choiceScore,
} from '../engine/examGrading';
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
  const exam = session ? EXAMS.find(e => e.id === session.examId) ?? null : null;
  const [startError, setStartError] = useState<string | null>(null);
  const [needFullscreen, setNeedFullscreen] = useState(() => {
    const s = loadSession();
    return !!s && !s.submittedAt;
  });
  const [current, setCurrent] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [grading, setGrading] = useState<string | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const sessionRef = useRef(session);
  sessionRef.current = session;
  const submittingRef = useRef(false);
  const lastViolationRef = useRef(0);

  const running = !!session && !!exam && !session.submittedAt;

  useEffect(() => { if (session) saveSession(session); }, [session]);

  const update = useCallback((fn: (s: ExamSession) => ExamSession) => {
    setSession(prev => (prev ? fn(prev) : prev));
  }, []);

  const submit = useCallback(async (reason: NonNullable<ExamSession['submitReason']>) => {
    const s = sessionRef.current;
    const ex = s && EXAMS.find(e => e.id === s.examId);
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
    if (!s || s.submittedAt || submittingRef.current) return;
    const t = Date.now();
    if (t - lastViolationRef.current < 1500) return; // blur + visibilitychange cùng lúc chỉ tính 1 lần
    lastViolationRef.current = t;
    const ex = EXAMS.find(e => e.id === s.examId);
    const violations = [...s.violations, { at: t, reason }];
    const next = { ...s, violations };
    sessionRef.current = next;
    setSession(next);
    const max = ex?.maxViolations ?? 3;
    if (violations.length >= max) {
      setWarning(`Vi phạm ${violations.length}/${max}: ${reason}. Bài thi được nộp tự động.`);
      void submit('violations');
    } else {
      setWarning(`Cảnh báo vi phạm ${violations.length}/${max}: ${reason}. Đủ ${max} lần bài sẽ tự động nộp.`);
    }
  }, [submit]);

  // Tiếp tục phiên dang dở sau khi tải lại trang: tính là rời trang thi.
  const resumedRef = useRef(false);
  useEffect(() => {
    if (resumedRef.current) return;
    resumedRef.current = true;
    if (session && !session.submittedAt && !fullscreenElement()) addViolation('Tải lại hoặc rời trang thi');
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

  // Giám sát: thoát toàn màn hình, chuyển tab, rời cửa sổ, phím tắt, dán, chuột phải.
  useEffect(() => {
    if (!running) return;
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
  }, [running, addViolation]);

  useEffect(() => {
    if (!warning) return;
    const id = window.setTimeout(() => setWarning(null), 6000);
    return () => window.clearTimeout(id);
  }, [warning]);

  const start = async (ex: Exam) => {
    setStartError(null);
    const ok = await enterFullscreen();
    if (!ok) {
      setStartError('Trình duyệt không cho phép bật toàn màn hình nên chưa thể bắt đầu. Hãy dùng Chrome/Edge/Firefox trên máy tính và cho phép toàn màn hình.');
      return;
    }
    lastViolationRef.current = Date.now(); // bỏ qua blur do hộp thoại toàn màn hình
    const s = createSession(ex);
    sessionRef.current = s;
    setSession(s);
    setCurrent(0);
    setNow(Date.now());
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

  // ---------- Chọn đề ----------
  if (!session || !exam) {
    return (
      <div className={`${shell} overflow-auto`} role="dialog" aria-label="Chọn đề thi">
        <div className="max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="text-[var(--accent)]" /> Làm bài thi</h2>
            <button onClick={onExit} className="flex items-center gap-1 px-3 py-2 rounded border border-[var(--border)] hover:bg-[var(--bg-secondary)] text-sm">
              <ArrowLeft size={16} /> Quay về CodeLens
            </button>
          </div>
          <section className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm flex flex-col gap-2">
            <strong className="flex items-center gap-2"><ShieldAlert size={18} className="text-yellow-500" /> Quy chế phòng thi</strong>
            <ul className="list-disc pl-5 flex flex-col gap-1 text-[var(--text-secondary)]">
              <li>Bài thi chạy <strong>toàn màn hình</strong> suốt thời gian làm bài.</li>
              <li>Thoát toàn màn hình, chuyển tab, chuyển ứng dụng hoặc tải lại trang đều bị ghi nhận là <strong>vi phạm</strong>.</li>
              <li>Đủ 3 lần vi phạm, bài thi bị <strong>nộp tự động</strong>. Hết giờ cũng tự động nộp.</li>
              <li>Không được dán (paste), kéo thả nội dung, mở chuột phải hay công cụ nhà phát triển.</li>
              <li>Bài lập trình được chấm bằng test ẩn trên backend — cần kết nối backend khi nộp bài.</li>
            </ul>
          </section>
          {startError && <p role="alert" className="p-3 rounded bg-red-500/15 text-red-500 text-sm">{startError}</p>}
          <div className="grid md:grid-cols-2 gap-4">
            {EXAMS.map(ex => (
              <article key={ex.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] p-5 flex flex-col gap-3">
                <h3 className="text-lg font-semibold">{ex.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] flex-1">{ex.description}</p>
                <div className="flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1"><Clock size={14} /> {ex.durationMinutes} phút</span>
                  <span>{ex.questions.length} câu trắc nghiệm</span>
                  <span>{ex.problems.length} bài lập trình</span>
                  <span>Thang {examTotalPoints(ex)} điểm</span>
                </div>
                <button onClick={() => start(ex)} className="mt-1 flex items-center justify-center gap-2 px-4 py-2 rounded bg-[var(--accent)] text-white font-medium hover:opacity-90">
                  <Maximize size={16} /> Bắt đầu (toàn màn hình)
                </button>
              </article>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---------- Kết quả ----------
  if (session.submittedAt) {
    const total = totalScore(exam, session);
    const max = examTotalPoints(exam);
    const hasErr = exam.problems.some(p => session.results[p.id]?.verdicts.includes('ERR'));
    const reasonText = session.submitReason === 'timeout' ? 'Hết giờ — hệ thống tự nộp.' :
      session.submitReason === 'violations' ? `Vi phạm quy chế ${session.violations.length} lần — hệ thống tự nộp.` : 'Bạn đã nộp bài.';
    return (
      <div className={`${shell} overflow-auto`} role="dialog" aria-label="Kết quả bài thi">
        <div className="max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col gap-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">{exam.title}</h2>
              <p className="text-sm text-[var(--text-secondary)]">{reasonText} Thời gian làm: {formatClock(session.submittedAt - session.startedAt)}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-[var(--accent)]">{total}<span className="text-lg text-[var(--text-secondary)]">/{max}</span></div>
              <div className="text-xs text-[var(--text-secondary)]">Trắc nghiệm {choiceScore(exam, session.answers)} · Lập trình {Math.round((total - choiceScore(exam, session.answers)) * 100) / 100}</div>
            </div>
          </header>
          {grading && <p className="flex items-center gap-2 text-sm"><LoaderCircle className="animate-spin" size={16} /> {grading}</p>}
          {hasErr && !grading && (
            <div role="alert" className="p-3 rounded bg-red-500/15 text-sm flex flex-wrap items-center justify-between gap-3">
              <span>Một số bài lập trình chưa chấm được do lỗi kết nối backend. Bài làm đã được lưu.</span>
              <button onClick={regrade} className="px-3 py-1 rounded bg-red-500 text-white">Chấm lại</button>
            </div>
          )}

          <section className="flex flex-col gap-3">
            <h3 className="font-semibold">Trắc nghiệm</h3>
            {exam.questions.map((q, i) => {
              const picked = session.answers[q.id];
              const ok = picked === q.answer;
              return (
                <div key={q.id} className={`rounded border p-3 text-sm ${ok ? 'border-green-500/40 bg-green-500/5' : 'border-red-500/40 bg-red-500/5'}`}>
                  <p className="flex items-start gap-2">{ok ? <CircleCheck size={18} className="text-green-500 shrink-0" /> : <CircleX size={18} className="text-red-500 shrink-0" />}
                    <span><strong>Câu {i + 1}.</strong> {q.prompt}</span></p>
                  <p className="mt-1 pl-6 text-[var(--text-secondary)]">Bạn chọn: {picked === undefined ? '(bỏ trống)' : q.options[picked]} · Đáp án: <strong>{q.options[q.answer]}</strong></p>
                  <p className="mt-1 pl-6 text-[var(--text-secondary)]">{q.explanation}</p>
                </div>
              );
            })}
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="font-semibold">Lập trình</h3>
            {exam.problems.map((p, i) => {
              const r = session.results[p.id];
              return (
                <div key={p.id} className="rounded border border-[var(--border)] p-3 text-sm flex flex-col gap-2">
                  <div className="flex justify-between gap-2"><strong>Bài {i + 1}. {p.title}</strong><span>{r?.score ?? 0}/{p.points} điểm</span></div>
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
            <button onClick={resetAll} disabled={!!grading} className="px-4 py-2 rounded bg-[var(--accent)] text-white disabled:opacity-50">Chọn đề khác / thi lại</button>
            <button onClick={() => { if (!grading) onExit(); }} disabled={!!grading} className="px-4 py-2 rounded border border-[var(--border)] disabled:opacity-50">Quay về CodeLens</button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Đang làm bài ----------
  const items = [...exam.questions.map(q => ({ kind: 'q' as const, id: q.id })), ...exam.problems.map(p => ({ kind: 'p' as const, id: p.id }))];
  const item = items[Math.min(current, items.length - 1)];
  const remaining = session.endsAt - now;
  const answeredCount = exam.questions.filter(q => session.answers[q.id] !== undefined).length;
  const touchedCount = exam.problems.filter(p => (session.codes[p.id] ?? p.starterCode) !== p.starterCode).length;

  return (
    <div className={shell} role="dialog" aria-label={`Đang thi: ${exam.title}`} onCopy={e => { if (!(e.target as HTMLElement).closest?.('.monaco-editor')) e.preventDefault(); }}>
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-panel)]">
        <strong className="truncate">{exam.title}</strong>
        <div className="flex items-center gap-4 text-sm">
          <span className={`flex items-center gap-1 font-mono text-lg ${remaining < 5 * 60_000 ? 'text-red-500 animate-pulse' : ''}`} aria-label="Thời gian còn lại">
            <Clock size={18} /> {formatClock(remaining)}
          </span>
          <span className={`flex items-center gap-1 ${session.violations.length ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}>
            <ShieldAlert size={16} /> Vi phạm {session.violations.length}/{exam.maxViolations}
          </span>
          <button onClick={() => setConfirmSubmit(true)} disabled={!!grading} className="flex items-center gap-1 px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
            <Send size={16} /> Nộp bài
          </button>
        </div>
      </header>

      {warning && <div role="alert" className="px-4 py-2 bg-red-500/15 text-red-500 text-sm flex items-center gap-2"><TriangleAlert size={16} /> {warning}</div>}

      <div className={`flex-1 flex flex-col md:flex-row min-h-0 ${needFullscreen || grading ? 'blur-sm pointer-events-none select-none' : ''}`} aria-hidden={needFullscreen || !!grading}>
        <nav className="md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-[var(--border)] bg-[var(--bg-secondary)] p-3 flex md:flex-col gap-3 overflow-auto text-sm" aria-label="Danh sách câu hỏi">
          <div>
            <p className="font-semibold mb-2">Trắc nghiệm ({answeredCount}/{exam.questions.length})</p>
            <div className="grid grid-cols-4 gap-1.5 min-w-[10rem]">
              {exam.questions.map((q, i) => (
                <button key={q.id} onClick={() => setCurrent(i)} aria-current={current === i}
                  className={`h-8 rounded border text-xs ${current === i ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]' : 'border-[var(--border)]'} ${session.answers[q.id] !== undefined ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-panel)]'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="font-semibold mb-2">Lập trình ({touchedCount}/{exam.problems.length})</p>
            <div className="flex md:flex-col gap-1.5">
              {exam.problems.map((p, i) => {
                const idx = exam.questions.length + i;
                const touched = (session.codes[p.id] ?? p.starterCode) !== p.starterCode;
                return (
                  <button key={p.id} onClick={() => setCurrent(idx)} aria-current={current === idx}
                    className={`px-2 py-1.5 rounded border text-left text-xs whitespace-nowrap ${current === idx ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]' : 'border-[var(--border)]'} ${touched ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-panel)]'}`}>
                    Bài {i + 1}. {p.title}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        <main className="flex-1 min-h-0 overflow-auto">
          {item.kind === 'q'
            ? <QuestionView exam={exam} index={current} session={session}
                onAnswer={(qid, idx) => update(s => ({ ...s, answers: { ...s.answers, [qid]: idx } }))}
                onNext={() => setCurrent(c => Math.min(c + 1, items.length - 1))}
                onPrev={() => setCurrent(c => Math.max(c - 1, 0))} />
            : <ProblemView key={item.id} problem={exam.problems.find(p => p.id === item.id)!} index={current - exam.questions.length} theme={theme}
                code={session.codes[item.id] ?? exam.problems.find(p => p.id === item.id)!.starterCode}
                onChange={code => update(s => ({ ...s, codes: { ...s.codes, [item.id]: code } }))} />}
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
              Đã trả lời {answeredCount}/{exam.questions.length} câu trắc nghiệm, đã viết {touchedCount}/{exam.problems.length} bài lập trình.
              Sau khi nộp sẽ không sửa được nữa.
            </p>
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

function QuestionView({ exam, index, session, onAnswer, onNext, onPrev }: {
  exam: Exam; index: number; session: ExamSession;
  onAnswer: (qid: string, idx: number) => void; onNext: () => void; onPrev: () => void;
}) {
  const q = exam.questions[index];
  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 flex flex-col gap-4">
      <p className="text-sm text-[var(--text-secondary)]">Câu {index + 1}/{exam.questions.length} · {q.points} điểm</p>
      <h3 className="text-lg font-medium">{q.prompt}</h3>
      {q.code && <pre className="rounded bg-[var(--bg-secondary)] border border-[var(--border)] p-3 text-sm font-mono overflow-auto select-none">{q.code}</pre>}
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Chọn một đáp án</legend>
        {q.options.map((opt, i) => {
          const checked = session.answers[q.id] === i;
          return (
            <label key={i} className={`flex items-center gap-3 p-3 rounded border cursor-pointer ${checked ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border)] hover:bg-[var(--bg-secondary)]'}`}>
              <input type="radio" name={q.id} checked={checked} onChange={() => onAnswer(q.id, i)} className="accent-[var(--accent)]" />
              <span className="font-semibold">{String.fromCharCode(65 + i)}.</span> <span>{opt}</span>
            </label>
          );
        })}
      </fieldset>
      <div className="flex justify-between">
        <button onClick={onPrev} disabled={index === 0} className="px-4 py-2 rounded border border-[var(--border)] disabled:opacity-40">← Câu trước</button>
        <button onClick={onNext} className="px-4 py-2 rounded border border-[var(--border)]">Câu tiếp →</button>
      </div>
    </div>
  );
}

function ProblemView({ problem, index, code, onChange, theme }: {
  problem: CodeProblem; index: number; code: string; onChange: (code: string) => void; theme: ThemeMode;
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
        <p className="text-[var(--text-secondary)]">Bài {index + 1} · {problem.points} điểm · {problem.tests.length} test (có test ẩn)</p>
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
