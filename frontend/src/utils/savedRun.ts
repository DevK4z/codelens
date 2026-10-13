export const SAVED_RUN_KEY = 'codelens.saved-run.v1';

export interface SavedRun {
  version: 1;
  code: string;
  stdin: string;
  mode: 'run' | 'visualize';
  standard: 'gnu++17' | 'gnu++20';
  savedAt: number;
}

type RunDraft = Omit<SavedRun, 'version' | 'savedAt'>;
type DraftStorage = Pick<Storage, 'getItem' | 'setItem'>;

function browserStorage(): DraftStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readSavedRun(storage = browserStorage()): SavedRun | null {
  try {
    const raw = storage?.getItem(SAVED_RUN_KEY);
    if (!raw) return null;
    const saved: unknown = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return null;
    const record = saved as Partial<SavedRun>;
    if (record.version !== 1 || typeof record.code !== 'string' || typeof record.stdin !== 'string' ||
        !['run', 'visualize'].includes(record.mode || '') ||
        !['gnu++17', 'gnu++20'].includes(record.standard || '') ||
        typeof record.savedAt !== 'number' || !Number.isFinite(record.savedAt) || record.savedAt <= 0) return null;
    return record as SavedRun;
  } catch {
    // Invalid or inaccessible storage must not stop the editor from opening.
    return null;
  }
}

export function saveRun(draft: RunDraft, storage = browserStorage()): SavedRun | null {
  if (!storage) return null;
  const saved: SavedRun = { ...draft, version: 1, savedAt: Date.now() };
  try {
    storage.setItem(SAVED_RUN_KEY, JSON.stringify(saved));
    return saved;
  } catch {
    // Quota/privacy failures should never prevent running the code.
    return null;
  }
}
