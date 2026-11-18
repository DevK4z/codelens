import { useEffect, useMemo, useRef, useState } from 'react';
import type { TraceEvent } from '../engine/types';
import { simpleExplanation } from '../engine/simpleExplanation';
import { generateExplanation } from '../engine/explanations';
import { lineFocus } from '../engine/lineFocus';
import { detectAlgorithm, lineInsight, loopContext, recursiveReturns } from '../engine/insight';
import { explainStepWithAI, type AIExplanationResult } from '../engine/ai';

export function SimpleStepExplanation({event, previous, nextEvent, code, trace}: {event: TraceEvent; previous?: TraceEvent | null; nextEvent?: TraceEvent | null; code: string; trace?: TraceEvent[]}) {
  const brief = simpleExplanation(event, previous, code, nextEvent);
  const algorithm = useMemo(() => detectAlgorithm(code), [code]);
  const returns = useMemo(() => trace ? recursiveReturns(trace, code) : undefined, [trace, code]);
  const focus = lineFocus(event, nextEvent, code);
  const returned = trace && returns?.get(trace.indexOf(event));
  const insights = lineInsight(event, nextEvent, code, focus, algorithm, returned);
  const loops = loopContext(event, code);
  const context = JSON.stringify({ source: code.split(/\r?\n/).slice(Math.max(0,event.line-4),event.line+3).join('\n').slice(0,4000), line: event.line, beforeLine: event.detail?.startsWith('GCC/GDB:') || false, observed: brief, algorithm: algorithm?.name, insight: insights });
  const [key, setKey] = useState('');
  const [model, setModel] = useState('gemini-3.8-flash');
  const [result, setResult] = useState<{context: string; text: AIExplanationResult} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  const latestContext = useRef(context); latestContext.current = context;
  useEffect(() => { controller.current?.abort(); setLoading(false); setError(''); setResult(null); return () => controller.current?.abort(); }, [context]);
  const ask = async () => {
    controller.current?.abort(); const pending = new AbortController(); controller.current = pending;
    setLoading(true); setError('');
    const timeout = window.setTimeout(() => pending.abort(), 25000);
    try {
      const text = await explainStepWithAI(context, key, pending.signal, model);
      if (!pending.signal.aborted && latestContext.current === context) setResult({context, text});
    } catch (e) {
      if (latestContext.current === context && controller.current === pending) setError(pending.signal.aborted ? 'AI chưa phản hồi. Bạn vẫn có thể xem giải thích bên trên.' : e instanceof Error ? e.message : 'Không gọi được AI.');
    } finally { window.clearTimeout(timeout); if (controller.current === pending) setLoading(false); }
  };
  const rows = (text: AIExplanationResult) => <div className="simple-step-rows">
    <p><strong>Đang làm gì?</strong><span>{text.action}</span></p>
    <p><strong>Vừa thay đổi</strong><span>{text.change}</span></p>
    <p><strong>Tiếp theo</strong><span>{text.next}</span></p>
  </div>;
  const hasResult = focus && (focus.outcome || focus.after.length > 0);
  const why = insights.length > 0 && <p><strong>Vì sao?</strong><span className="insight">{insights.map((s, i) => <span key={i} className="block">{s}</span>)}</span></p>;
  return <div>
    {(algorithm || loops.length > 0) && <div className="algo-strip">
      {algorithm && <details><summary>💡 {algorithm.name} <span>· {algorithm.complexity}</span></summary><p>{algorithm.idea}</p></details>}
      {loops.length > 0 && <span className="loop-chips" aria-label="Đang ở vòng lặp">{loops.map(l => <span key={l}>{l}</span>)}</span>}
    </div>}
    {focus ? <div className="simple-step-rows">
      <p><strong>Dòng này làm gì?</strong><span>
        {focus.summary}
        {focus.steps.length > 1 && <span className="focus-chain" aria-label="Thay giá trị vào biểu thức">
          {focus.steps.map((s, i) => <span key={i}>{i > 0 && <em aria-hidden="true">→</em>}<code>{s}</code></span>)}
        </span>}
      </span></p>
      {why}
      <p><strong>Kết quả</strong><span>
        {focus.outcome && <b className={focus.outcome.taken ? 'focus-yes' : 'focus-no'}>{focus.outcome.text}</b>}
        {focus.after.length > 0 && <span className="block">{focus.outcome ? 'Sau đó: ' : 'Sau dòng này: '}{focus.after.join(' · ')}</span>}
        {!hasResult && brief.next}
        {hasResult && nextEvent && <span className="block text-xs text-[var(--text-secondary)]">{brief.next}</span>}
      </span></p>
      <p><strong>Vừa thay đổi</strong><span>{brief.change}</span></p>
    </div> : returned ? <div className="simple-step-rows">
      <p><strong>Dòng này làm gì?</strong><span>Kết thúc {returned.call}{returned.value === undefined ? ', quay lại nơi đã gọi.' : ', trả kết quả về nơi đã gọi.'}</span></p>
      <p><strong>Kết quả</strong><span className="insight">{insights[0]}</span></p>
      <p><strong>Tiếp theo</strong><span>{brief.next}</span></p>
    </div> : <>{rows(brief)}{why && <div className="simple-step-rows">{why}</div>}</>}
    <details className="text-xs mt-3 text-[var(--text-secondary)]"><summary>Code và chi tiết kỹ thuật</summary><p className="mt-2 whitespace-pre-wrap break-words">{generateExplanation(event, previous || undefined, undefined, code)}</p></details>
    <details className="text-sm mt-3"><summary className="text-[var(--accent)]">✨ Giải thích dễ hơn bằng AI</summary>
      <p className="text-xs text-[var(--text-secondary)] my-2">Khi nhấn Hỏi AI, đoạn code quanh dòng hiện tại và tóm tắt bước sẽ gửi đến Google Gemini. API key chỉ giữ trong bộ nhớ của mục này, không lưu trên máy. Có thể phát sinh phí theo tài khoản Google của bạn.</p>
      <div className="flex flex-wrap gap-2"><input aria-label="Gemini API key" type="password" autoComplete="off" value={key} onChange={e=>setKey(e.target.value)} placeholder="Gemini API key" className="min-w-0 flex-1 p-2 rounded border border-[var(--border)] bg-[var(--bg-primary)]" />
        <button disabled={!key.trim() || loading} onClick={ask} className="run-button disabled:opacity-50">{loading ? 'Đang giải thích…' : 'Hỏi AI về bước này'}</button>
        {key && <button className="text-xs underline" onClick={()=>{controller.current?.abort();setKey('');setResult(null);setLoading(false);}}>Xóa key</button>}
      </div>
      <details className="text-xs my-2"><summary>Cài đặt model</summary><input aria-label="Gemini model" className="mt-2 p-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded" value={model} onChange={e=>setModel(e.target.value)} /></details>
      {error && <p role="alert" className="text-sm mt-2 text-orange-500">{error}</p>}
      {result?.context === context && <div className="mt-3 border-t border-[var(--border)] pt-3"><p className="text-xs text-[var(--text-secondary)] mb-2">AI diễn giải — đối chiếu với giá trị thực tế bên trên.</p>{rows(result.text)}</div>}
    </details>
  </div>;
}
