import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { Bot, Send, X } from 'lucide-react';
import { reply, suggestions, type TutorContext, type TutorMode, type TutorTurn } from '../tutor/tutor';

interface Message extends TutorTurn { step?: number; chips?: string[] }

// `code` and **bold** inside a line, rendered as elements (never as HTML).
function inline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean).map((part, i) =>
    part.startsWith('`') ? <code key={i}>{part.slice(1, -1)}</code>
      : part.startsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <Fragment key={i}>{part}</Fragment>);
}

// Paragraphs, "- " bullet lists and ``` blocks.
function render(text: string): ReactNode[] {
  return text.split(/```\n?([\s\S]*?)```/g).flatMap((chunk, i) => i % 2
    ? [<pre key={`pre${i}`}>{chunk.replace(/\n$/, '')}</pre>]
    : chunk.split(/\n{2,}/).filter(p => p.trim()).map((para, j) => {
      const lines = para.split('\n').filter(l => l.trim());
      const withBreaks = (ls: string[]) => ls.map((l, k) => <Fragment key={k}>{k > 0 && <br />}{inline(l)}</Fragment>);
      // A paragraph whose tail is all "- " lines is a lead-in followed by a list.
      const first = lines.findIndex(l => l.startsWith('- '));
      if (first >= 0 && lines.slice(first).every(l => l.startsWith('- ')))
        return <div key={`${i}-${j}`}>{first > 0 && <p>{withBreaks(lines.slice(0, first))}</p>}<ul>{lines.slice(first).map((l, k) => <li key={k}>{inline(l.slice(2))}</li>)}</ul></div>;
      return <p key={`${i}-${j}`}>{withBreaks(lines)}</p>;
    }));
}

export function TutorPanel({ context, onClose }: { context: TutorContext; onClose: () => void }) {
  const [mode, setMode] = useState<TutorMode>('hint');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(() => [{
    role: 'tutor',
    text: 'Chào bạn! Mình là trợ lý DSA của CodeLens, chạy ngay trong trình duyệt và trả lời dựa trên đúng lần chạy của bạn. Hỏi mình về bước đang xem, một biến, độ phức tạp, lỗi trong code hoặc một khái niệm của học phần nhé.',
    chips: suggestions(context, 'hint'),
  }]);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [messages]);

  const ask = (question: string) => {
    const q = question.trim();
    if (!q) return;
    const answer = reply(q, context, mode, messages);
    setMessages(list => [...list,
      { role: 'user', text: q, step: context.trace.length ? context.step : undefined },
      { role: 'tutor', text: answer.text, intent: answer.intent === 'unknown' ? undefined : answer.intent, level: answer.level, topic: answer.topic, mode: answer.mode, chips: answer.suggestions }]);
    setInput('');
  };
  const chips = messages[messages.length - 1]?.chips ?? [];
  const event = context.trace[context.step];

  return <section className="tutor-panel" aria-label="Trợ lý DSA">
    <header>
      <Bot size={18} aria-hidden="true" />
      <div><strong>Trợ lý DSA</strong><span>{event ? `Đang xem bước ${context.step + 1} · dòng ${event.line}` : 'Chưa có bản ghi chạy từng bước'}</span></div>
      <div className="tutor-mode" role="group" aria-label="Phong cách trả lời">
        <button aria-pressed={mode === 'hint'} onClick={() => setMode('hint')}>Gợi mở</button>
        <button aria-pressed={mode === 'explain'} onClick={() => setMode('explain')}>Giải thích thẳng</button>
      </div>
      <button className="tutor-close" onClick={onClose} aria-label="Đóng trợ lý"><X size={16} /></button>
    </header>
    <div className="tutor-messages" aria-live="polite">
      {messages.map((m, i) => <div key={i} className={`tutor-msg ${m.role}`}>
        {m.role === 'user' && m.step !== undefined && <span className="tutor-at">bước {m.step + 1}</span>}
        {m.role === 'user' ? <p>{m.text}</p> : render(m.text)}
      </div>)}
      <div ref={end} />
    </div>
    {chips.length > 0 && <div className="tutor-chips">{chips.map(c => <button key={c} onClick={() => ask(c)}>{c}</button>)}</div>}
    <form onSubmit={e => { e.preventDefault(); ask(input); }}>
      <input aria-label="Câu hỏi cho trợ lý" value={input} onChange={e => setInput(e.target.value)} placeholder="Hỏi về bước này, một biến, một khái niệm…" />
      <button type="submit" disabled={!input.trim()} aria-label="Gửi"><Send size={16} /></button>
    </form>
  </section>;
}
