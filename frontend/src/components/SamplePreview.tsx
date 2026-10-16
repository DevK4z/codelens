import { useEffect, useRef, useState } from 'react';
import type { Sample } from '../data/samples';

export type PreviewSample = Sample & { note?: string; expectedOutput?: string };

interface Props {
  sample: PreviewSample | null;
  onClose: () => void;
  onTry: (sample: PreviewSample) => string | null;
}

export function SamplePreview({ sample, onClose, onTry }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState('');
  useEffect(() => {
    setMessage('');
    if (sample) dialog.current?.showModal();
    else dialog.current?.close();
  }, [sample]);

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setMessage('Đã sao chép. Code chính vẫn được giữ nguyên.'); }
    catch { setMessage('Không sao chép được. Bạn có thể chọn nội dung trong khung để sao chép thủ công.'); }
  };

  return <dialog ref={dialog} onCancel={onClose} onClose={onClose} aria-labelledby="sample-preview-title"
    className="m-auto w-[96vw] max-w-5xl max-h-[92dvh] rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] p-0 backdrop:bg-black/60">
    {sample && <div className="flex flex-col max-h-[90dvh]">
      <header className="p-4 border-b border-[var(--border)] flex items-start justify-between gap-3">
        <div><p className="text-xs text-[var(--accent)]">THƯ VIỆN CODE MẪU · CHỈ XEM</p>
          <h2 id="sample-preview-title" className="text-lg font-bold mt-1">{sample.name}</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Xem và sao chép không thay đổi code, input hay kết quả đang làm.</p></div>
        <button onClick={onClose} aria-label="Đóng xem trước" className="rounded border border-[var(--border)] px-3 py-2">✕</button>
      </header>
      <div className="overflow-auto p-4 space-y-4 min-h-0">
        <p className="text-sm whitespace-pre-wrap">{sample.description}</p>
        {sample.note && <p className="text-sm p-3 rounded bg-blue-500/10 border border-blue-500/30">{sample.note}</p>}
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4">
          <section className="min-w-0">
            <div className="flex justify-between items-center mb-2"><h3 className="font-semibold">C++ · {sample.code.split('\n').length} dòng</h3>
              <button onClick={() => copy(sample.code)} className="text-sm text-[var(--accent)] underline">Sao chép code</button></div>
            <pre tabIndex={0} aria-label="Code mẫu chỉ đọc" className="text-xs leading-6 overflow-auto max-h-[48dvh] p-3 rounded border border-[var(--border)] bg-[var(--bg-panel)] select-text"><code>{sample.code}</code></pre>
          </section>
          <div className="space-y-4 min-w-0">
            <section><div className="flex justify-between gap-2 mb-2"><h3 className="font-semibold">Input mẫu</h3>
              <button disabled={!sample.stdin} onClick={() => copy(sample.stdin)} className="text-sm text-[var(--accent)] underline disabled:opacity-40">Sao chép input</button></div>
              <pre tabIndex={0} className="text-xs whitespace-pre-wrap break-words p-3 rounded border border-[var(--border)] bg-[var(--bg-panel)]">{sample.stdin || '(Không cần nhập; dữ liệu có sẵn trong code)'}</pre></section>
            {sample.expectedOutput !== undefined && <section><h3 className="font-semibold mb-2">Output với input mẫu</h3><pre tabIndex={0} className="text-xs whitespace-pre-wrap break-words max-h-56 overflow-auto p-3 rounded border border-[var(--border)]">{sample.expectedOutput || '(Không có đầu ra)'}</pre></section>}
          </div>
        </div>
      </div>
      <footer className="p-4 border-t border-[var(--border)] space-y-2">
        <p role="status" className="text-sm text-[var(--accent)]">{message}</p>
        <p className="text-xs text-[var(--text-secondary)]">Thử mẫu sẽ mở vùng làm việc riêng. Code chính được lưu trước, và bạn có thể quay lại bất cứ lúc nào.</p>
        <div className="flex flex-wrap justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-[var(--border)] rounded">Đóng, giữ code chính</button>
          <button onClick={() => { const error = onTry(sample); if (error) setMessage(error); else onClose(); }} className="px-4 py-2 rounded bg-[var(--accent)] text-white">Thử mẫu riêng</button>
        </div>
      </footer>
    </div>}
  </dialog>;
}
