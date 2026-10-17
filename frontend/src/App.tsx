import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ExerciseBankModal } from './components/ExerciseBankModal';
import { ExerciseItem } from './data/exercises';
import { CodeEditor } from './components/CodeEditor';
import { StdinInput } from './components/StdinInput';
import { TraceSummary } from './components/TraceSummary';
import { ControlBar } from './components/ControlBar';
import { VisualizationPanel } from './components/VisualizationPanel';
import { BottomTabs } from './components/BottomTabs';
import { generateExplanation } from './engine/explanations';
import { executeCode, healthCheck, API_BASE } from './engine/api';
import { useTracePlayer } from './engine/tracePlayer';
import { TraceEvent, VariableRoleMap, ThemeMode } from './engine/types';
import { SAMPLES } from './data/samples';
import { EXERCISE_SOLUTIONS } from './data/exerciseSolutions';
import { SamplePreview, PreviewSample } from './components/SamplePreview';
import { getFallbackDemoTrace } from './data/demoTraces';
import { readSavedRun, saveRun } from './utils/savedRun';

function App() {
  const [savedRun, setSavedRun] = useState(readSavedRun);
  const [saveFailed, setSaveFailed] = useState(false);
  const [previewSample, setPreviewSample] = useState<PreviewSample | null>(null);
  const [sampleWorkspace, setSampleWorkspace] = useState<string | null>(null);
  const mainDraft = useRef<{ code: string; stdin: string; mode: 'run' | 'visualize'; standard: 'gnu++17' | 'gnu++20'; roles: VariableRoleMap; exercise: ExerciseItem | null } | null>(null);
  const [executionMode, setExecutionMode] = useState<'run' | 'visualize'>(savedRun?.mode ?? 'run');
  const [standard, setStandard] = useState<'gnu++17' | 'gnu++20'>(savedRun?.standard ?? 'gnu++17');
  const [nativeResult, setNativeResult] = useState<{ stdout: string; stderr: string; success: boolean } | null>(null);

  const [code, setCode] = useState(savedRun?.code ?? SAMPLES[0].code);
  const [stdin, setStdin] = useState(savedRun?.stdin ?? SAMPLES[0].stdin);
  const [trace, setTrace] = useState<TraceEvent[]>([]);
  const [traceCode, setTraceCode] = useState(savedRun?.code ?? SAMPLES[0].code);
  const [traceStdin, setTraceStdin] = useState(savedRun?.stdin ?? SAMPLES[0].stdin);
  const runIdRef = useRef<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const connectionCheckId = useRef(0);
  const [compilationError, setCompilationError] = useState<string | undefined>();
  const [runtimeError, setRuntimeError] = useState<string | undefined>();
  const [sandboxWarning, setSandboxWarning] = useState<string | undefined>();
  const [isDemo, setIsDemo] = useState(false);
  const [stdout, setStdout] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseItem | null>(null);
  const [showHints, setShowHints] = useState(false);

  const [isExerciseBankOpen, setIsExerciseBankOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch { return 'dark'; }
  });

  const [variableRoles, setVariableRoles] = useState<VariableRoleMap>(SAMPLES[0].suggestedRoles);
  const [backendAvailable, setBackendAvailable] = useState(false);

  const isStale = trace.length > 0 && (code !== traceCode || stdin !== traceStdin);

  const {
    currentStep, currentEvent, isPlaying, speed, totalSteps,
    next, prev, reset, goToStep, togglePlay, setSpeed, setIsPlaying
  } = useTracePlayer(trace);

  // Stop playing if code becomes stale
  useEffect(() => {
    if (isStale && isPlaying) {
      togglePlay();
    }
  }, [isStale, isPlaying, togglePlay]);

  useEffect(() => {
    document.documentElement.className = theme;
    try { localStorage.setItem('theme', theme); } catch { /* Storage may be blocked. */ }
  }, [theme]);

  const checkConnection = async (): Promise<boolean> => {
    const checkId = ++connectionCheckId.current;
    try {
      await healthCheck();
      if (checkId !== connectionCheckId.current) return false;
      setBackendAvailable(true);
      setConnectionError(null);
      return true;
    } catch (err: any) {
      if (checkId !== connectionCheckId.current) return false;
      setBackendAvailable(false);
      setConnectionError(err.message);
      return false;
    }
  };

  useEffect(() => { void checkConnection(); }, []);
  useEffect(() => { if (isStale) setIsPlaying(false); }, [isStale, setIsPlaying]);

  const invalidateRun = () => {
    runIdRef.current += 1;
    setNativeResult(null);
    setIsLoading(false);
    setIsPlaying(false);
  };
  const editCode = (value: string) => { invalidateRun(); setCode(value); };
  const editInput = (value: string) => { invalidateRun(); setStdin(value); };

  // Update stdout up to current step
  useEffect(() => {
    if (trace.length > 0 && currentStep >= 0) {
      const currentEvt = trace[currentStep];
      if (currentEvt && currentEvt.stdout !== undefined) {
        setStdout(currentEvt.stdout);
      } else {
        // Fallback: find the last event with stdout
        let out = '';
        for (let i = 0; i <= currentStep; i++) {
          if (trace[i].event === 'stdout' && trace[i].detail) {
            out += trace[i].detail;
          }
        }
        setStdout(out);
      }
    }
  }, [currentStep, trace]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleSelectExercise = (ex: ExerciseItem) => {
    setSelectedExercise(ex);
    setShowHints(false);
  };

  const previewExercise = (ex: ExerciseItem) => {
    const solution = EXERCISE_SOLUTIONS[ex.id];
    if (!solution) return;
    setPreviewSample({ id: ex.id, name: `[${ex.id}] ${ex.title}`, description: ex.statement,
      code: solution.code, stdin: solution.stdin, suggestedRoles: ex.suggestedRoles as VariableRoleMap || {},
      note: solution.note, expectedOutput: solution.output });
  };

  const returnToMain = () => {
    const draft = mainDraft.current;
    if (!draft) return;
    invalidateRun();
    setCode(draft.code); setStdin(draft.stdin); setExecutionMode(draft.mode); setStandard(draft.standard);
    setVariableRoles(draft.roles); setSelectedExercise(draft.exercise);
    setTrace([]); setStdout(''); setIsDemo(false); setError(null);
    setCompilationError(undefined); setRuntimeError(undefined); setSandboxWarning(undefined);
    setSampleWorkspace(null); mainDraft.current = null; reset();
  };

  const handleSelectSample = (sample: PreviewSample): string | null => {
    if (!mainDraft.current) {
      const draft = { code, stdin, mode: executionMode, standard, roles: variableRoles, exercise: selectedExercise };
      const saved = saveRun(draft);
      if (!saved) return 'Không lưu được code chính trong trình duyệt nên chưa mở mẫu. Hãy sao chép mẫu hoặc sao lưu code chính trước.';
      mainDraft.current = draft;
      setSavedRun(saved); setSaveFailed(false);
    }
    setSampleWorkspace(sample.name);
    setSelectedExercise(null);
    invalidateRun();
    setExecutionMode('visualize');
    setSandboxWarning(undefined);
    setIsDemo(false);
    setCode(sample.code);
    setStdin(sample.stdin);
    setVariableRoles(sample.suggestedRoles);
    setError(null);
    setCompilationError(undefined);
    setRuntimeError(undefined);
    setStdout('');
    {
      const fallback = getFallbackDemoTrace(sample.code, sample.stdin);
      if (fallback && fallback.trace) {
        setTrace(fallback.trace as TraceEvent[]);
        setTraceCode(sample.code);
        setTraceStdin(sample.stdin);
        setIsDemo(true);
        setSandboxWarning('Bản ghi bài mẫu: đúng với code và input gốc. Nhấn Chạy để thực thi trên backend.');
        reset();
        return null;
      }
    }
    setTrace([]);
    setTraceCode(sample.code);
    setTraceStdin(sample.stdin);
    reset();
    return null;
  };

  const handleRoleChange = (varName: string, role: string) => {
    setVariableRoles(prev => ({ ...prev, [varName]: role as any }));
  };

  const handleRun = async () => {
    // Save synchronously before any backend request; failed runs are preserved too.
    if (!sampleWorkspace) {
      const saved = saveRun({ code, stdin, mode: executionMode, standard });
      if (saved) setSavedRun(saved);
      setSaveFailed(!saved);
    }
    setNativeResult(null);
    setIsLoading(true);
    setIsDemo(false);
    setError(null);
    setCompilationError(undefined);
    setRuntimeError(undefined);
    setSandboxWarning(undefined);
    setStdout('');
    setTrace([]);
    reset();

    // Tạo ID cho lần chạy này
    runIdRef.current += 1;
    const currentRunId = runIdRef.current;

    try {
      if (!API_BASE) {
        await checkConnection();
        return;
      }
      const response = await executeCode(code, stdin, executionMode, standard);

      // Bỏ qua kết quả nếu người dùng đã nhấn Chạy lần khác
      if (currentRunId !== runIdRef.current) return;

      if (!response.success && response.compilationError) {
        setCompilationError(response.compilationError);
        setTrace([]);
        return;
      }
      if (!response.success && response.runtimeError) {
        setRuntimeError(response.runtimeError);
      }

      setIsDemo(false);
      connectionCheckId.current += 1;
      setBackendAvailable(true);
      setConnectionError(null);
      setTrace(response.trace);
      setTraceCode(code);
      setTraceStdin(stdin);
      setStdout(response.stdout || '');
      if (response.executionMode === 'run') {
        setNativeResult({ stdout: response.stdout || '', stderr: response.stderr || '', success: response.success });
      }
      setSandboxWarning([response.sandboxWarning, response.visualizationWarning].filter(Boolean).join(" ") || undefined);

      // Auto-assign roles for custom code
      if (response.trace.length > 0) {
        const lastVars = [...response.trace].reverse().find(event => Object.keys(event.variables).length > 0)?.variables || {};
        const autoRoles: Record<string, string> = {};
        let hasArray = false;

        for (const [key, val] of Object.entries(lastVars)) {
          if (Array.isArray(val)) {
            if (!hasArray) {
              autoRoles[key] = 'array'; // Only assign one main array
              hasArray = true;
            }
          } else if (typeof val === 'number') {
            const lower = key.toLowerCase();
            if (lower === 'left' || lower === 'l' || lower === 'start') autoRoles[key] = 'left-pointer';
            else if (lower === 'right' || lower === 'r' || lower === 'end') autoRoles[key] = 'right-pointer';
            else if (lower === 'mid' || lower === 'm') autoRoles[key] = 'mid-pointer';
            else if (lower.includes('target') || lower === 'key' || lower === 'x') autoRoles[key] = 'target';
            else if (lower.includes('res') || lower === 'ans') autoRoles[key] = 'result';
          }
        }
        setVariableRoles(autoRoles as VariableRoleMap);
      }

      reset();
    } catch (err: any) {
      if (currentRunId !== runIdRef.current) return;

      setError(err.message || 'Không thể kết nối backend. Chọn bài mẫu để xem bản ghi có sẵn.');
      setTrace([]);
    } finally {
      if (currentRunId === runIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const prevEvent = currentStep > 0 ? trace[currentStep - 1] : null;
  const matchesSavedRun = savedRun && code === savedRun.code && stdin === savedRun.stdin &&
    executionMode === savedRun.mode && standard === savedRun.standard;

  return (
    <div className="h-screen w-full flex flex-col bg-[var(--bg-primary)] overflow-hidden text-[var(--text-primary)]">
      <SamplePreview sample={previewSample} onClose={() => setPreviewSample(null)} onTry={handleSelectSample} />
      <ExerciseBankModal 
        isOpen={isExerciseBankOpen} 
        onClose={() => setIsExerciseBankOpen(false)} 
        onSelect={handleSelectExercise}
        onPreview={previewExercise}
      />
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        onSelectSample={setPreviewSample}
        onOpenExerciseBank={() => setIsExerciseBankOpen(true)}
        isBackendAvailable={backendAvailable}
        onCheckConnection={checkConnection}
        currentCode={code}
      />

      <div className="flex flex-wrap items-center gap-3 p-3 border-b border-[var(--border)] text-sm">
        <label>Chế độ{' '}
          <select aria-label="Chế độ chạy" value={executionMode} disabled={isLoading}
            className="bg-[var(--bg-panel)] border border-[var(--border)] rounded p-2"
            onChange={e => { invalidateRun(); setExecutionMode(e.target.value as 'run' | 'visualize'); setTrace([]); setStdout(''); setIsDemo(false); }}>
            <option value="run">Chạy C++ / thi đấu</option>
            <option value="visualize">Trực quan hóa từng bước</option>
          </select>
        </label>
        <label>Chuẩn C++{' '}
          <select aria-label="Chuẩn C++" value={standard} disabled={isLoading}
            className="bg-[var(--bg-panel)] border border-[var(--border)] rounded p-2"
            onChange={e => { invalidateRun(); setStandard(e.target.value as 'gnu++17' | 'gnu++20'); setTrace([]); setStdout(''); }}>
            <option value="gnu++17">GNU++17</option>
            <option value="gnu++20">GNU++20</option>
          </select>
        </label>
        <span className="text-[var(--text-secondary)]">
          {executionMode === 'run'
            ? 'Chạy code gốc: macro, template, lambda, STL, PBDS. Xem kết quả STDOUT; không có bước trực quan hóa.'
            : 'Docker: GCC/GDB theo dõi code gốc theo dòng. Giá trị hiển thị ở trước dòng tô sáng; bản chạy local hỗ trợ tập cú pháp giới hạn.'}
        </span>
      </div>
      <div role="status" aria-live="polite" className="px-3 py-1 border-b border-[var(--border)] text-xs text-[var(--text-secondary)]">
        {sampleWorkspace
          ? 'Bạn đang thử mẫu riêng. Code chính được giữ và lưu trên trình duyệt; chạy mẫu không ghi đè bản lưu chính.'
          : saveFailed
          ? 'Không lưu được trong trình duyệt. Hãy sao chép code để giữ lại.'
          : matchesSavedRun
            ? `Đã lưu code và input trên trình duyệt lúc ${new Date(savedRun.savedAt).toLocaleTimeString('vi-VN')}. Mở lại web sẽ khôi phục bản này.`
            : savedRun
              ? 'Thay đổi chưa lưu — nhấn Chạy để lưu bản mới.'
              : 'Code và input sẽ tự động lưu trên trình duyệt khi bạn nhấn Chạy.'}
      </div>
      {sampleWorkspace && <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-blue-500/10 border-b border-blue-500/30 text-sm">
        <span><strong>Vùng thử mẫu:</strong> {sampleWorkspace} · Chỉnh sửa mẫu chỉ giữ trong phiên này.</span>
        <button onClick={returnToMain} className="px-3 py-2 rounded bg-[var(--accent)] text-white">Quay về code chính</button>
      </div>}
      {nativeResult && (
        <section aria-label="Kết quả chạy C++" className="p-3 border-b border-[var(--border)] text-sm max-h-64 overflow-auto">
          <strong>{nativeResult.success ? 'Chạy xong' : 'Chạy thất bại'} — STDOUT</strong>
          <pre className="whitespace-pre-wrap break-words">{nativeResult.stdout || '(Không có đầu ra)'}</pre>
          {nativeResult.stderr && <><strong>STDERR</strong><pre className="whitespace-pre-wrap break-words">{nativeResult.stderr}</pre></>}
        </section>
      )}

      {selectedExercise && (
        <div className="p-3 max-h-[25vh] overflow-auto shrink-0 bg-blue-500/10 border-l-4 border-blue-500 text-sm flex flex-col gap-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <strong className="text-blue-400">[{selectedExercise.id}] {selectedExercise.title}</strong>
              <p className="text-[var(--text-secondary)] mt-1 whitespace-pre-wrap">{selectedExercise.statement}</p>
              {selectedExercise.constraints && <p className="text-xs text-[var(--text-secondary)] mt-1">Ràng buộc: {selectedExercise.constraints}</p>}
            </div>
            <button onClick={() => setSelectedExercise(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] shrink-0" aria-label="Ẩn đề bài">✕</button>
          </div>
          
          <div className="flex gap-3 mt-1">
            {selectedExercise.hints && selectedExercise.hints.length > 0 && (
              <button onClick={() => setShowHints(!showHints)} className="text-[var(--accent)] hover:underline flex items-center gap-1">
                💡 {showHints ? 'Ẩn gợi ý' : `Xem gợi ý (${selectedExercise.hints.length})`}
              </button>
            )}
            {EXERCISE_SOLUTIONS[selectedExercise.id] && (
              <button onClick={() => previewExercise(selectedExercise)} className="text-green-500 hover:underline flex items-center gap-1">
                📜 Xem code mẫu
              </button>
            )}
          </div>
          
          {showHints && selectedExercise.hints && selectedExercise.hints.length > 0 && (
            <div className="mt-2 pl-4 border-l-2 border-[var(--accent)] text-xs text-[var(--text-primary)] flex flex-col gap-2">
              {selectedExercise.hints.map((hint, i) => (
                <p key={i}><strong>Gợi ý {i + 1}:</strong> {hint}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {(connectionError || error) && (
        <div role="alert" className="p-3 bg-red-500/15 border-l-4 border-red-500 text-red-100 flex items-center justify-between text-sm">
          <span><strong>Lỗi:</strong> {connectionError || error}</span>
          <button onClick={checkConnection} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition-colors ml-4 whitespace-nowrap">
            Kiểm tra lại kết nối
          </button>
        </div>
      )}
      {(compilationError || runtimeError) && <div role="alert" className="p-3 bg-red-500/15 text-red-500 whitespace-pre-wrap">{compilationError || runtimeError}</div>}
      {isStale && (
        <div className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-4 py-2 text-sm text-center border-b border-yellow-500/30 flex justify-center items-center gap-4">
          <span>Code hoặc input đã thay đổi. Kết quả đã cũ — cần chạy lại.</span>
          <button onClick={handleRun} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs transition-colors">
            Chạy lại để cập nhật
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <div className="w-full md:w-[40%] flex flex-col h-full border-r border-[var(--border)] relative z-10 shadow-[2px_0_10px_rgba(0,0,0,0.05)]">
          <div className="flex-1 min-h-[50%]">
            <CodeEditor
              code={code}
              onChange={editCode}
              theme={theme}
              executionStep={currentStep}
              currentLine={isStale || (currentEvent?.event === 'stdout' && currentEvent.callStack.length === 0) ? undefined : currentEvent?.line}
              error={compilationError}
            />
          </div>
          <div className="h-[150px] border-t border-[var(--border)] shrink-0 bg-[var(--bg-panel)]">
            <StdinInput value={stdin} onChange={editInput} />
          </div>
        </div>

        <div className="w-full md:w-[60%] flex flex-col h-full relative z-0">
          {currentEvent && !isStale && <div className="p-3 max-h-[35%] min-h-0 shrink-0 overflow-auto border-b border-[var(--border)] bg-[var(--bg-panel)]" aria-live="polite">
            <strong>{currentEvent.event === 'stdout' && currentEvent.callStack.length === 0 ? 'Đầu ra cuối bản ghi' : `Dòng ${currentEvent.line}`} · Bước {currentStep + 1}/{totalSteps}</strong>
            {currentStep === totalSteps - 1 && <p className="text-sm mt-1 text-[var(--accent)]">Đã đến cuối bản ghi{runtimeError ? ' — chương trình có lỗi, xem thông báo phía trên.' : '.'}</p>}
            <p className="text-xs text-[var(--text-secondary)] mt-1">Chỉ theo dõi các dòng thực sự được chạy; nhánh không được chọn và code sau break/return có thể được bỏ qua.</p>
            <p className="text-sm font-mono break-words mt-1">{currentEvent.event === 'stdout' && currentEvent.callStack.length === 0 ? '' : traceCode.split(/\r?\n/)[currentEvent.line - 1]?.trim()}</p>
            <p className="text-sm mt-1 text-[var(--text-secondary)]">{generateExplanation(currentEvent, prevEvent || undefined, SAMPLES.find(s => s.code === traceCode)?.id, traceCode).split('\n').find(text => /^(Sắp |Ngăn xếp |Gọi hàm|Trả về|So sánh|Hoán đổi)/.test(text))}</p>
            <details className="text-sm mt-1">
              <summary className="cursor-pointer text-[var(--accent)]">Giải thích bước hiện tại</summary>
              <p className="whitespace-pre-wrap break-words mt-2">{generateExplanation(currentEvent, prevEvent || undefined, SAMPLES.find(s => s.code === traceCode)?.id, traceCode)}</p>
            </details>
          </div>}
          <div className="flex-1 min-h-0">
            <VisualizationPanel
              prevEvent={isStale ? null : prevEvent}
              event={isStale ? null : currentEvent}
              variableRoles={variableRoles}
              isDemo={isDemo}
            />
          </div>
        </div>
      </div>

      {!isStale && <TraceSummary trace={trace} />}

      <ControlBar
        onRun={handleRun}
        isLoading={isLoading}
        isPlaying={isPlaying}
        togglePlay={togglePlay}
        onNext={next}
        onPrev={prev}
        onReset={reset}
        currentStep={currentStep}
        totalSteps={totalSteps}
        onSeek={goToStep}
        speed={speed}
        onSpeedChange={setSpeed}
        hasTrace={trace.length > 0 && !isStale}
      />

      <BottomTabs
        event={isStale ? null : currentEvent}
        prevEvent={prevEvent}
        variableRoles={variableRoles}
        onRoleChange={handleRoleChange}
        stdout={isStale ? "" : stdout}
        compilationError={compilationError}
        runtimeError={runtimeError}
        sandboxWarning={sandboxWarning}
        code={code}
      />
    </div>
  );
}

export default App;
