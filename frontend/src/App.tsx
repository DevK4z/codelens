import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CodeEditor } from './components/CodeEditor';
import { StdinInput } from './components/StdinInput';
import { ControlBar } from './components/ControlBar';
import { VisualizationPanel } from './components/VisualizationPanel';
import { BottomTabs } from './components/BottomTabs';
import { executeCode, healthCheck } from './engine/api';
import { useTracePlayer } from './engine/tracePlayer';
import { TraceEvent, VariableRoleMap, ThemeMode } from './engine/types';
import { SAMPLES } from './data/samples';

function App() {
  const [code, setCode] = useState(SAMPLES[0].code);
  const [stdin, setStdin] = useState(SAMPLES[0].stdin);
  const [trace, setTrace] = useState<TraceEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [_error, setError] = useState<string | null>(null);
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
  const [backendAvailable, setBackendAvailable] = useState(true);

  const {
    currentStep, currentEvent, isPlaying, speed, totalSteps,
    next, prev, reset, goToStep, togglePlay, setSpeed
  } = useTracePlayer(trace);

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    healthCheck().then(setBackendAvailable);
  }, []);

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
    setCode(sample.code);
    setStdin(sample.stdin);
    setVariableRoles(sample.suggestedRoles);
    setTrace([]);
    setError(null);
    setCompilationError(undefined);
    setRuntimeError(undefined);
    setStdout('');
  };

  const handleRoleChange = (varName: string, role: string) => {
    setVariableRoles(prev => ({ ...prev, [varName]: role as any }));
  };

  const handleRun = async () => {
    setIsLoading(true);
    setError(null);
    setCompilationError(undefined);
    setRuntimeError(undefined);
    setSandboxWarning(undefined);
    setStdout('');
    
    try {
      if (!backendAvailable) {
        throw new Error('Backend not available');
      }
      const response = await executeCode(code, stdin);
      
      setTrace(response.trace || []);
      setCompilationError(response.compilationError);
      setRuntimeError(response.runtimeError);
      setSandboxWarning(response.sandboxWarning);
      setIsDemo(response.isDemo || false);
      reset();
      
      if (!response.success && !response.trace?.length) {
        setError(response.compilationError || response.runtimeError || 'Execution failed');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to backend. Please check if the server is running.');
      // In a real app we might load demo trace data here
    } finally {
      setIsLoading(false);
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
      />
      
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <div className="w-full md:w-[40%] flex flex-col h-full border-r border-[var(--border)] relative z-10 shadow-[2px_0_10px_rgba(0,0,0,0.05)]">
          <div className="flex-1 min-h-[50%]">
            <CodeEditor 
              code={code} 
              onChange={setCode} 
              theme={theme}
              currentLine={currentEvent?.line}
              error={compilationError}
            />
          </div>
          <div className="h-[150px] border-t border-[var(--border)] shrink-0 bg-[var(--bg-panel)]">
            <StdinInput value={stdin} onChange={setStdin} />
          </div>
        </div>
        
        <div className="w-full md:w-[60%] flex flex-col h-full relative z-0">
          <div className="flex-1 min-h-0">
            <VisualizationPanel 
              event={currentEvent} 
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
        hasTrace={trace.length > 0}
      />
      
      <BottomTabs 
        event={currentEvent}
        prevEvent={prevEvent}
        variableRoles={variableRoles}
        onRoleChange={handleRoleChange}
        stdout={stdout}
        compilationError={compilationError}
        runtimeError={runtimeError}
        sandboxWarning={sandboxWarning}
      />
    </div>
  );
}

export default App;

