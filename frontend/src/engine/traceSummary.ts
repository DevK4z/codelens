import type { TraceEvent } from './types';

// Count recorded observations, never infer algorithmic complexity from input size.
export function summarizeTrace(trace: TraceEvent[]) {
  const visits = new Map<number, number>();
  let sourceStops = 0;
  let outputRecords = 0;
  for (const event of trace) {
    if (event.event === 'line') {
      sourceStops++;
      visits.set(event.line, (visits.get(event.line) || 0) + 1);
    } else if (event.event === 'stdout') outputRecords++;
  }
  return {
    total: trace.length,
    sourceStops,
    uniqueLines: visits.size,
    outputRecords,
    otherRecords: trace.length - sourceStops - outputRecords,
    frequentLines: [...visits.entries()].filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, 5),
  };
}
