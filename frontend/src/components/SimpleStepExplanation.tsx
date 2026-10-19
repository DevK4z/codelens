import { useEffect, useRef, useState } from 'react';
import type { TraceEvent } from '../engine/types';
import { simpleExplanation } from '../engine/simpleExplanation';
import { generateExplanation } from '../engine/explanations';
import { explainStepWithAI, type AIExplanationResult } from '../engine/ai';

export function SimpleStepExplanation({event, previous, nextEvent, code}: {event: TraceEvent; previous?: TraceEvent | null; nextEvent?: TraceEvent | null; code: string}) {
  const brief = simpleExplanation(event, previous, code, nextEvent);
  const context = JSON.stringify({ source: code.split(/\r?\n/).slice(Math.max(0,event.line-4),event.line+3).join('\n').slice(0,4000), line: event.line, beforeLine: event.detail?.startsWith('GCC/GDB:') || false, observed: brief });
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
  return <div>
    {rows(brief)}
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
