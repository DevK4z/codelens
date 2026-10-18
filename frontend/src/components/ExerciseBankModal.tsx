import { X, BookOpen, CheckCircle, Circle } from 'lucide-react';
import { ExerciseItem, EXERCISES } from '../data/exercises';
import { useState, useEffect, useRef } from 'react';
import { EXERCISE_SOLUTIONS } from '../data/exerciseSolutions';

interface ExerciseBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: ExerciseItem) => void;
  onPreview: (exercise: ExerciseItem) => void;
}

export function ExerciseBankModal({ isOpen, onClose, onSelect, onPreview }: ExerciseBankModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (isOpen) dialog.current?.showModal(); else dialog.current?.close(); }, [isOpen]);
  const [selectedChapter, setSelectedChapter] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [completion, setCompletion] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Progress tracking via localStorage
  const [progress, setProgress] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try { const saved = localStorage.getItem('codelens_progress'); if (saved) setProgress(JSON.parse(saved)); } catch { /* Optional progress. */ }
  }, []);



  const chapterNames: Record<string, string> = { L1: 'Độ phức tạp', L2: 'Đệ quy', 'L3.1': 'Quy hoạch động', 'L3.2': 'Tham lam', L4: 'Danh sách liên kết', L5: 'Stack & Queue', L6: 'Cây', L7: 'Sắp xếp', L8: 'Merge & Quick Sort', L9: 'Tìm kiếm & Băm' };
  const chapters = ['All', ...Array.from(new Set(EXERCISES.map(e => e.chapter)))];
  
  const filtered = EXERCISES.filter(e => {
    if (completion === 'done' && !progress[e.id]) return false;
    if (completion === 'todo' && progress[e.id]) return false;
    if (selectedChapter !== 'All' && e.chapter !== selectedChapter) return false;
    if (selectedType !== 'All' && e.kind !== selectedType) return false;
    if (searchQuery && !e.title.toLowerCase().includes(searchQuery.toLowerCase()) && !e.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <dialog ref={dialog} onCancel={onClose} onClose={onClose} aria-label="Ngân hàng bài tập DSA" className="m-auto p-0 rounded-xl w-[96vw] max-w-6xl bg-[var(--bg-primary)] text-[var(--text-primary)] backdrop:bg-black/60">
      <div className="bg-[var(--bg-primary)] w-full max-w-6xl h-[85dvh] rounded-xl flex flex-col border border-[var(--border)] shadow-2xl overflow-hidden">
        
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-2">
            <BookOpen className="text-[var(--accent)]" />
            <h2 className="text-xl font-bold">Ngân hàng bài tập DSA</h2>
          </div>
          <button aria-label="Đóng ngân hàng bài tập" onClick={onClose} className="p-2 hover:bg-[var(--bg-panel)] rounded-md">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0 max-h-[30vh] md:max-h-none border-r border-[var(--border)] bg-[var(--bg-panel)] flex flex-col p-4 gap-4 overflow-y-auto">
            <div>
              <label className="text-sm font-semibold mb-2 block">Tìm kiếm</label>
              <input 
                type="text" 
                placeholder="ID hoặc tên bài..." 
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-semibold mb-2 block">Chương</label>
              <select 
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                value={selectedChapter}
                onChange={e => setSelectedChapter(e.target.value)}
              >
                {chapters.map(c => <option key={c} value={c}>{c === 'All' ? 'Tất cả chương' : `${chapterNames[c] || "Chương"} · ${c}`}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Loại</label>
              <select 
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
              >
                <option value="All">Tất cả</option>
                <option value="G">G - Bài tập / Yêu cầu</option>
                <option value="V">V - Ví dụ / Thao tác</option>
                <option value="R">R - Chỉ nhắc tên</option>
              </select>
            </div>

            <label className="text-sm font-semibold">Trạng thái
              <select aria-label="Trạng thái học" value={completion} onChange={e => setCompletion(e.target.value)} className="w-full mt-2 p-2 rounded border border-[var(--border)] bg-[var(--bg-primary)]">
                <option value="all">Tất cả bài</option><option value="todo">Chưa hoàn thành</option><option value="done">Đã tự đánh dấu hoàn thành</option>
              </select>
            </label>
            <div className="mt-auto pt-4 border-t border-[var(--border)]">
              <div className="text-sm text-[var(--text-secondary)]">
                Tự đánh dấu: {Object.values(progress).filter(Boolean).length} / {EXERCISES.length}
              </div>
              <div className="w-full bg-[var(--bg-primary)] h-2 rounded-full mt-2 overflow-hidden border border-[var(--border)]">
                <div 
                  className="bg-green-500 h-full" 
                  style={{ width: `${(Object.keys(progress).length / EXERCISES.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 p-4 overflow-y-auto bg-[var(--bg-primary)]">
            <p className="text-sm text-[var(--text-secondary)] mb-4">{filtered.length} bài · Xem đề hoặc code mẫu không thay đổi code chính.</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map(ex => (
                <div key={ex.id} className="border border-[var(--border)] rounded-lg p-4 bg-[var(--bg-secondary)] flex flex-col gap-3 hover:border-[var(--accent)] transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono bg-[var(--bg-panel)] px-2 py-1 rounded border border-[var(--border)]">{ex.id}</span>
                        <span className={`text-xs px-2 py-1 rounded font-bold ${ex.kind === 'G' ? 'bg-blue-500/20 text-blue-400' : ex.kind === 'V' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                          {ex.kind === 'G' ? 'BÀI TẬP' : ex.kind === 'V' ? 'VÍ DỤ' : 'LÝ THUYẾT'}
                        </span>
                        {progress[ex.id] && <CheckCircle size={16} className="text-green-500" />}
                      </div>
                      <h3 className="font-bold text-lg">{ex.title}</h3>
                    </div>
                  </div>
                  
                  <div className="text-sm text-[var(--text-secondary)] line-clamp-2">
                    {ex.statement}
                  </div>
                  
                  <div className="mt-auto pt-3 flex flex-wrap gap-2">
                    {EXERCISE_SOLUTIONS[ex.id] && <button onClick={() => { onClose(); onPreview(ex); }} className="px-3 py-2 border border-[var(--accent)] text-[var(--accent)] rounded text-sm">Xem code mẫu</button>}
                    <button 
                      onClick={() => {
                        onSelect(ex);
                        onClose();
                      }}
                      className="px-4 py-2 bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] font-medium text-sm flex-1"
                    >
                      Xem đề
                    </button>
                    <button
                      onClick={() => {
                        const newP = { ...progress };
                        if (newP[ex.id]) delete newP[ex.id];
                        else newP[ex.id] = true;
                        setProgress(newP);
                        try { localStorage.setItem('codelens_progress', JSON.stringify(newP)); } catch { /* Keep progress in memory. */ }
                      }}
                      className="px-3 py-2 border border-[var(--border)] bg-[var(--bg-panel)] rounded hover:bg-[var(--bg-primary)]"
                      title={progress[ex.id] ? "Bỏ đánh dấu hoàn thành" : "Đánh dấu hoàn thành"} aria-pressed={!!progress[ex.id]}
                    >
                      {progress[ex.id] ? <CheckCircle size={18} className="text-green-500" /> : <Circle size={18} />}
                    </button>
                  </div>
                </div>
              ))}
              
              {filtered.length === 0 && (
                <div className="col-span-full py-12 text-center text-[var(--text-secondary)]">
                  Không tìm thấy bài tập nào phù hợp.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
