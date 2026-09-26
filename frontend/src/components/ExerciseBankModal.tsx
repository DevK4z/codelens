import { X, BookOpen, CheckCircle, Circle } from 'lucide-react';
import { ExerciseItem, EXERCISES } from '../data/exercises';
import { useState, useEffect } from 'react';

interface ExerciseBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: ExerciseItem) => void;
}

export function ExerciseBankModal({ isOpen, onClose, onSelect }: ExerciseBankModalProps) {
  const [selectedChapter, setSelectedChapter] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Progress tracking via localStorage
  const [progress, setProgress] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = localStorage.getItem('codelens_progress');
    if (saved) {
      try { setProgress(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  if (!isOpen) return null;

  const chapters = ['All', ...Array.from(new Set(EXERCISES.map(e => e.chapter)))];
  
  const filtered = EXERCISES.filter(e => {
    if (selectedChapter !== 'All' && e.chapter !== selectedChapter) return false;
    if (selectedType !== 'All' && e.kind !== selectedType) return false;
    if (searchQuery && !e.title.toLowerCase().includes(searchQuery.toLowerCase()) && !e.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[var(--bg-primary)] w-full max-w-6xl h-[85vh] rounded-xl flex flex-col border border-[var(--border)] shadow-2xl overflow-hidden">
        
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-2">
            <BookOpen className="text-[var(--accent)]" />
            <h2 className="text-xl font-bold">Ngân hàng bài tập DSA</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-panel)] rounded-md">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-[var(--border)] bg-[var(--bg-panel)] flex flex-col p-4 gap-4 overflow-y-auto">
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
                {chapters.map(c => <option key={c} value={c}>{c === 'All' ? 'Tất cả chương' : `Chương ${c}`}</option>)}
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

            <div className="mt-auto pt-4 border-t border-[var(--border)]">
              <div className="text-sm text-[var(--text-secondary)]">
                Tiến độ: {Object.keys(progress).length} / {EXERCISES.length}
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
          <div className="flex-1 p-6 overflow-y-auto bg-[var(--bg-primary)]">
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
                  
                  <div className="text-sm text-[var(--text-secondary)] line-clamp-3">
                    {ex.statement}
                  </div>
                  
                  {ex.source_data && (
                    <div className="text-xs bg-[var(--bg-panel)] p-2 rounded border border-[var(--border)] font-mono text-[var(--text-primary)]">
                      {ex.source_data}
                    </div>
                  )}

                  <div className="mt-auto pt-3 flex gap-2">
                    <button 
                      onClick={() => {
                        onSelect(ex);
                        onClose();
                      }}
                      className="px-4 py-2 bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] font-medium text-sm flex-1"
                    >
                      {ex.kind === 'R' ? 'Xem tài liệu' : 'Mở bài này'}
                    </button>
                    <button
                      onClick={() => {
                        const newP = { ...progress };
                        if (newP[ex.id]) delete newP[ex.id];
                        else newP[ex.id] = true;
                        setProgress(newP);
                        localStorage.setItem('codelens_progress', JSON.stringify(newP));
                      }}
                      className="px-3 py-2 border border-[var(--border)] bg-[var(--bg-panel)] rounded hover:bg-[var(--bg-primary)]"
                      title="Đánh dấu hoàn thành"
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
    </div>
  );
}
