import { useState, useEffect } from 'react';
import { TraceEvent } from './types';

export function useTracePlayer(trace: TraceEvent[]) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 0.25, 0.5, 1, 2, 4
  
  useEffect(() => {
    if (!isPlaying || trace.length === 0) return;
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= trace.length - 1) { 
          setIsPlaying(false); 
          return prev; 
        }
        return prev + 1;
      });
    }, 1000 / speed);
    return () => clearInterval(interval);
  }, [isPlaying, speed, trace.length]);
  
  const next = () => setCurrentStep(s => Math.min(s + 1, trace.length - 1));
  const prev = () => setCurrentStep(s => Math.max(s - 1, 0));
  const reset = () => { setCurrentStep(0); setIsPlaying(false); };
  const goToStep = (n: number) => setCurrentStep(Math.max(0, Math.min(n, trace.length - 1)));
  const togglePlay = () => setIsPlaying(p => !p);
  
  const currentEvent = trace[currentStep] || null;
  
  return { 
    currentStep, 
    currentEvent, 
    isPlaying, 
    speed, 
    totalSteps: trace.length,
    next, 
    prev, 
    reset, 
    goToStep, 
    togglePlay, 
    setSpeed, 
    setIsPlaying 
  };
}

