import { useEffect, useState } from 'react';
import { CircleCheck, CircleX, Code2, Lightbulb, LoaderCircle } from 'lucide-react';
import { DifficultyBadge } from './DifficultyBadge';
import { isStarterCode, languageInfo } from '../data/languages';
import type { ExamLanguage } from '../data/languages';
import { HighlightedCode } from './HighlightedCode';
import { chapterTitle } from '../data/exams';
import type { CodeProblem } from '../data/exams';
import type { Solution } from '../data/examSolutionLoader';
import type { TestVerdict } from '../engine/examGrading';
import { formatPoints } from '../engine/examGrading';

const VERDICT_LABEL: Record<TestVerdict, string> = {
  AC: 'Đúng', WA: 'Sai kết quả', TLE: 'Quá thời gian', CE: 'Lỗi biên dịch', RE: 'Lỗi khi chạy', ERR: 'Không chấm được',
};

type Loader = (id: string) => Solution | null;
let loaderPromise: Promise<Loader> | null = null;

/** Lời giải chỉ được tải khi có người mở phần xem lại (chunk riêng, không có trong trang lúc thi). */
function loadSolutions(): Promise<Loader> {
  loaderPromise ??= import('../data/examSolutionLoader').then(m => m.getSolution).catch(error => {
    loaderPromise = null;
    throw error;
  });
  return loaderPromise;
}

export interface ReviewItem {
  problem: CodeProblem;
  code?: string; // undefined: lần làm cũ chưa lưu code
  verdicts?: TestVerdict[];
  score?: number;
  message?: string; // lỗi biên dịch / lỗi chạy đầu tiên
  language?: ExamLanguage; // không có = C++
}

export function ExamReview({ items }: { items: ReviewItem[] }) {
  const [getSolution, setGetSolution] = useState<Loader | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadSolutions()
      .then(fn => { if (alive) setGetSolution(() => fn); })
      .catch(() => { if (alive) setLoadError('Không tải được lời giải. Kiểm tra kết nối mạng rồi mở lại.'); });
    return () => { alive = false; };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {items.map((item, i) => (
        <ReviewCard key={item.problem.id} index={i} item={item}
          solution={getSolution ? getSolution(item.problem.id) : undefined} loadError={loadError} />
      ))}
    </div>
  );
}

function ReviewCard({ index, item, solution, loadError }: {
  index: number; item: ReviewItem; solution: Solution | null | undefined; loadError: string | null;
}) {
  const { problem, code, verdicts, score, message, language } = item;
  const untouched = code !== undefined && isStarterCode(code);
  const passed = verdicts?.filter(v => v === 'AC').length ?? 0;
  const allPassed = !!verdicts && verdicts.length > 0 && passed === verdicts.length;

  return (
    <article className="rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] p-4 flex flex-col gap-3 text-sm" aria-label={`Xem lại bài ${index + 1}`}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold flex items-center gap-2">
            {verdicts && (allPassed ? <CircleCheck size={18} className="text-green-500" /> : <CircleX size={18} className="text-red-500" />)}
            Bài {index + 1}. {problem.title}
          </h4>
          <p className="text-xs text-[var(--text-secondary)] flex flex-wrap items-center gap-1.5">
            <DifficultyBadge level={problem.difficulty} /> {problem.chapter} · {chapterTitle(problem.chapter)}
          </p>
        </div>
        <div className="text-right text-xs text-[var(--text-secondary)]">
          {score !== undefined && <div className="text-base font-semibold text-[var(--text-primary)]">{formatPoints(score)}/{formatPoints(problem.points)} điểm</div>}
          {verdicts && <div>{passed}/{verdicts.length} test đúng</div>}
        </div>
      </header>

      {verdicts && (
        <div className="flex flex-wrap gap-1.5">
          {verdicts.map((v, j) => (
            <span key={j} className={`px-2 py-0.5 rounded text-xs ${v === 'AC' ? 'bg-green-500/15 text-green-600 dark:text-green-400' : 'bg-red-500/15 text-red-600 dark:text-red-400'}`}>
              {problem.tests[j]?.hidden ? 'Test ẩn' : 'Test ví dụ'} {j + 1}: {VERDICT_LABEL[v]}
            </span>
          ))}
        </div>
      )}

      {message && <pre className="whitespace-pre-wrap break-words text-xs text-[var(--text-secondary)] max-h-40 overflow-auto rounded bg-[var(--bg-secondary)] p-2">{message}</pre>}

      <div className="grid lg:grid-cols-2 gap-3">
        <section className="flex flex-col gap-2 min-w-0" aria-label="Code của bạn">
          <h5 className="font-medium flex items-center gap-1.5"><Code2 size={15} /> Code của bạn <span className="text-xs font-normal text-[var(--text-secondary)]">({languageInfo(language).label})</span></h5>
          {code === undefined
            ? <p className="text-xs text-[var(--text-secondary)] rounded border border-dashed border-[var(--border)] p-3">Lần làm này được lưu trước khi có tính năng xem lại nên không có code.</p>
            : untouched
              ? <p className="text-xs text-[var(--text-secondary)] rounded border border-dashed border-[var(--border)] p-3">Bạn chưa viết bài này.</p>
              : <HighlightedCode code={code} label={`Code của bạn cho bài ${index + 1}`} />}
        </section>

        <section className="flex flex-col gap-2 min-w-0" aria-label="Lời giải tối ưu">
          <h5 className="font-medium flex items-center gap-1.5"><Lightbulb size={15} className="text-yellow-500" /> Lời giải tối ưu</h5>
          {loadError
            ? <p className="text-xs text-red-500">{loadError}</p>
            : solution === undefined
              ? <p className="text-xs flex items-center gap-2 text-[var(--text-secondary)]"><LoaderCircle size={14} className="animate-spin" /> Đang tải lời giải…</p>
              : solution === null
                ? <p className="text-xs text-[var(--text-secondary)]">Chưa có lời giải cho bài này.</p>
                : <>
                    <p className="text-xs leading-relaxed">{solution.idea}</p>
                    <p className="text-xs flex flex-wrap gap-x-4 gap-y-1">
                      <span><strong>Thời gian:</strong> {solution.time}</span>
                      <span><strong>Bộ nhớ:</strong> {solution.space}</span>
                    </p>
                    <HighlightedCode code={solution.code} label={`Lời giải tối ưu cho bài ${index + 1}`} />
                  </>}
        </section>
      </div>
    </article>
  );
}
