import { difficultyLabel } from '../data/exams';
import type { Difficulty } from '../data/exams';

const TONE: Record<Difficulty, string> = {
  easy: 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  hard: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
};

export function DifficultyBadge({ level }: { level: Difficulty }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-px rounded border text-[11px] font-medium leading-4 whitespace-nowrap ${TONE[level]}`}>
      {difficultyLabel(level)}
    </span>
  );
}
