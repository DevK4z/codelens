import { useState, useEffect, useRef } from 'react';
import { TraceEvent } from '../engine/types';
import { generateExplanation } from '../engine/explanations';
import { explainCodeWithAI, AIExplanationResult } from '../engine/ai';

interface ExplanationPanelProps {
  event: TraceEvent | null;
  prevEvent: TraceEvent | null;
  code: string;
  stdout: string;
}

export function ExplanationPanel({ event, prevEvent, code, stdout }: ExplanationPanelProps) {
  const [activeTab, setActiveTab] = useState<'current' | 'overview'>('current');
  const [apiKey, setApiKey] = useState('');
  const [saveKeyToStorage, setSaveKeyToStorage] = useState(false);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIExplanationResult | null>(null);
  const [error, setError] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load key from storage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setSaveKeyToStorage(true);
    }
  }, []);

  // Invalidate AI result if code or stdout changes
  useEffect(() => {
    setAiResult(null);
    setError('');
  }, [code, stdout]);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (saveKeyToStorage) {
      localStorage.setItem('gemini_api_key', apiKey);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
    setIsEditingKey(false);
  };

  const handleClearKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setSaveKeyToStorage(false);
    setIsEditingKey(true);
  };

  const handleCancelAI = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  };

  const handleAskAI = async () => {
    if (!apiKey) {
      setIsEditingKey(true);
      return;
    }
    if (!code.trim()) {
      setError('Vui lòng nhập code C++ trước khi hỏi AI.');
      return;
    }

    setLoading(true);
    setError('');
    
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    }, 20000); // 20s timeout

    try {
      const result = await explainCodeWithAI(code, stdout, apiKey, abortControllerRef.current.signal);
      setAiResult(result);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi gọi AI.');
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <button 
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'current' ? 'text-[var(--accent)] border-b-2 border-[var(--accent)] bg-[var(--bg-panel)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          onClick={() => setActiveTab('current')}
        >
          🤖 Quan sát
        </button>
        <button 
          className={`px-4 py-2 text-sm font-medium flex items-center gap-1 ${activeTab === 'overview' ? 'text-[var(--accent)] border-b-2 border-[var(--accent)] bg-[var(--bg-panel)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          onClick={() => setActiveTab('overview')}
        >
          ✨ AI Giải thích
        </button>
      </div>
      
      <div className="flex-1 p-4 overflow-auto">
        {activeTab === 'current' ? (
          <div>
            {!event ? (
              <p className="text-[var(--text-secondary)] italic">Chưa có dữ liệu. Hãy chạy chương trình.</p>
            ) : (
              <div className="fade-in space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-[var(--accent)] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {event.step + 1}
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Dòng {event.line}:</h3>
                    <p className="text-lg">{generateExplanation(event, prevEvent || undefined)}</p>
                    
                    {event.detail && (
                      <p className="mt-2 text-sm text-[var(--text-secondary)] bg-[var(--bg-secondary)] p-2 rounded">
                        Chi tiết: {event.detail}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {(!apiKey || isEditingKey) ? (
              <form onSubmit={handleSaveKey} className="mb-4 bg-[var(--bg-secondary)] p-4 rounded-md border border-[var(--border)]">
                <h4 className="font-medium mb-2">Cấu hình Google Gemini API</h4>
                <p className="text-sm text-[var(--text-secondary)] mb-3">
                  Nhập API Key miễn phí từ <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline">Google AI Studio</a> để phân tích code.
                </p>
                <div className="flex gap-2 mb-3">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="flex-1 bg-[var(--bg-panel)] border border-[var(--border)] rounded px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
                    required
                  />
                  <button type="submit" className="bg-[var(--accent)] text-white px-3 py-1.5 rounded text-sm hover:opacity-90 transition-opacity">
                    Lưu Key
                  </button>
                  {apiKey && (
                    <button type="button" onClick={handleClearKey} className="bg-red-500 text-white px-3 py-1.5 rounded text-sm hover:opacity-90">
                      Xóa
                    </button>
                  )}
                </div>
                <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer">
                  <input type="checkbox" checked={saveKeyToStorage} onChange={(e) => setSaveKeyToStorage(e.target.checked)} />
                  Lưu Key vào trình duyệt (Local Storage)
                </label>
                <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
                  Lưu ý: Mã nguồn của bạn sẽ được gửi tới Google Gemini API để phân tích.
                </p>
              </form>
            ) : (
              <div className="flex justify-between items-center mb-4">
                {loading ? (
                  <button onClick={handleCancelAI} className="bg-red-500 text-white px-4 py-2 rounded shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2">
                    ⏹ Hủy phân tích
                  </button>
                ) : (
                  <button 
                    onClick={handleAskAI}
                    className="bg-[var(--accent)] text-white px-4 py-2 rounded shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    ✨ Phân tích thuật toán và kết quả
                  </button>
                )}
                <button 
                  onClick={() => setIsEditingKey(true)}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline"
                >
                  Đổi API Key
                </button>
              </div>
            )}

            {error && (
              <div className="text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            {aiResult && (
              <div className="fade-in space-y-4">
                <div className="bg-[var(--bg-secondary)] p-4 rounded-md border border-[var(--border)]">
                  <h4 className="font-semibold text-[var(--accent)] mb-1">Tổng quan</h4>
                  <p className="text-sm">{aiResult.overview}</p>
                </div>
                
                <div className="bg-[var(--bg-secondary)] p-4 rounded-md border border-[var(--border)]">
                  <h4 className="font-semibold text-[var(--accent)] mb-1">Độ phức tạp</h4>
                  <p className="text-sm">{aiResult.complexity}</p>
                </div>
                
                <div className="bg-[var(--bg-secondary)] p-4 rounded-md border border-[var(--border)]">
                  <h4 className="font-semibold text-[var(--accent)] mb-2">Phân tích chi tiết</h4>
                  <div className="text-sm space-y-2 whitespace-pre-wrap">
                    {aiResult.details}
                  </div>
                </div>
              </div>
            )}
            
            {!aiResult && !loading && !error && !isEditingKey && apiKey && (
              <div className="text-[var(--text-secondary)] h-full flex flex-col items-center justify-center text-center mt-8">
                <span className="text-4xl mb-4">✨</span>
                <p>Sẵn sàng! Nhấn nút "Phân tích" để AI đọc code và kết quả chạy (stdout) của bạn.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
