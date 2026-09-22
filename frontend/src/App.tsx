import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { CodeEditor } from './components/CodeEditor';
import { StdinInput } from './components/StdinInput';
import { ControlBar } from './components/ControlBar';
import { VisualizationPanel } from './components/VisualizationPanel';
import { BottomTabs } from './components/BottomTabs';
import { generateExplanation } from './engine/explanations';
import { executeCode, healthCheck } from './engine/api';
import { useTracePlayer } from './engine/tracePlayer';
import { TraceEvent, VariableRoleMap, ThemeMode } from './engine/types';
import { SAMPLES } from './data/samples';
import { getFallbackDemoTrace } from './data/demoTraces';

function App() {
  const [code, setCode] = useState(SAMPLES[0].code);
  const [stdin, setStdin] = useState(SAMPLES[0].stdin);
  const [trace, setTrace] = useState<TraceEvent[]>([]);
  const [traceCode, setTraceCode] = useState(SAMPLES[0].code);
  const [traceStdin, setTraceStdin] = useState(SAMPLES[0].stdin);
  const runIdRef = useRef<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compilationError, setCompilationError] = useState<string | undefined>();
  const [runtimeError, setRuntimeError] = useState<string | undefined>();
  const [sandboxWarning, setSandboxWarning] = useState<string | undefined>();
  const [isDemo, setIsDemo] = useState(false);
  const [stdout, setStdout] = useState('');

  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as ThemeMode) || 'dark';
  });

  const [variableRoles, setVariableRoles] = useState<VariableRoleMap>(SAMPLES[0].suggestedRoles);
  const [backendAvailable, setBackendAvailable] = useState(false);

  const isStale = trace.length > 0 && (code !== traceCode || stdin !== traceStdin);

  const {
    currentStep, currentEvent, isPlaying, speed, totalSteps,
    next, prev, reset, goToStep, togglePlay, setSpeed, setIsPlaying
  } = useTracePlayer(trace);

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const checkConnection = async () => {
    const available = await healthCheck();
    setBackendAvailable(available);
    return available;
  };

  useEffect(() => { void checkConnection(); }, []);
  useEffect(() => { if (isStale) setIsPlaying(false); }, [isStale, setIsPlaying]);

  const invalidateRun = () => {
    runIdRef.current += 1;
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

  const handleSelectSample = (sample: any) => {
    invalidateRun();
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
        return;
      }
    }
    setTrace([]);
    setTraceCode(sample.code);
    setTraceStdin(sample.stdin);
    reset();
  };

  const handleRoleChange = (varName: string, role: string) => {
    setVariableRoles(prev => ({ ...prev, [varName]: role as any }));
  };

  const handleRun = async () => {
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
      const response = await executeCode(code, stdin);

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
      setBackendAvailable(true);
      setTrace(response.trace);
      setTraceCode(code);
      setTraceStdin(stdin);
      setStdout(response.stdout || '');
      setSandboxWarning(response.sandboxWarning || undefined);

      // Auto-assign roles for custom code
      if (response.trace.length > 0) {
        const lastVars = response.trace[response.trace.length - 1].variables;
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

  return (
    <div className="h-screen w-full flex flex-col bg-[var(--bg-primary)] overflow-hidden text-[var(--text-primary)]">
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        onSelectSample={handleSelectSample}
        isBackendAvailable={backendAvailable}
        onCheckConnection={checkConnection}
        currentCode={code}
      />

      {error && <div role="alert" className="p-3 bg-red-500/15 text-red-500">{error}</div>}
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
              currentLine={isStale ? undefined : currentEvent?.line}
              error={compilationError}
            />
          </div>
          <div className="h-[150px] border-t border-[var(--border)] shrink-0 bg-[var(--bg-panel)]">
            <StdinInput value={stdin} onChange={editInput} />
          </div>
        </div>

        <div className="w-full md:w-[60%] flex flex-col h-full relative z-0">
          {currentEvent && !isStale && <div className="p-3 border-b border-[var(--border)] bg-[var(--bg-panel)]" aria-live="polite">
            <strong>Dòng {currentEvent.line} · Bước {currentStep + 1}/{totalSteps}</strong>
            <p>{generateExplanation(currentEvent, prevEvent || undefined)}</p>
          </div>}
          <div className="flex-1 min-h-0">
            <VisualizationPanel
              event={isStale ? null : currentEvent}
              variableRoles={variableRoles}
              isDemo={isDemo}
            />
          </div>
        </div>
      </div>

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
      />
    </div>
  );
}

export default App;

