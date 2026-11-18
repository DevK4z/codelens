import type { TraceEvent } from '../engine/types';
import { SimpleStepExplanation } from './SimpleStepExplanation';
interface Props { event: TraceEvent | null; prevEvent: TraceEvent | null; nextEvent?: TraceEvent | null; code: string; stdout: string }
export function ExplanationPanel({event,prevEvent,nextEvent,code}: Props) {
  return <div className="h-full overflow-auto p-4">{event ? <SimpleStepExplanation event={event} previous={prevEvent} nextEvent={nextEvent} code={code} /> : <p className="text-sm text-[var(--text-secondary)]">Chạy trực quan hóa để xem giải thích từng bước.</p>}</div>;
}
