import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  DIFFICULTIES, EXAM_CHAPTERS, EXTRA_CHAPTER_IDS, LECTURE_CHAPTER_IDS, PRESET_EXAMS, PRESET_SPECS, availableProblems, examTotalPoints,
  generateExamSpec, isDifficulty, resolveExam, suggestDuration,
} from './src/data/exams.ts';
import { PROBLEM_BANK } from './src/data/examBank.ts';
import { EXERCISES } from './src/data/exercises.ts';
import { SAMPLES } from './src/data/samples.ts';
import {
  EXAM_HISTORY_KEY, EXAM_HISTORY_LIMIT, EXAM_SESSION_KEY, chapterBreakdown, createSession, formatClock, formatPoints, historyEntry,
  loadHistory, loadSession, normalizeOutput, outputsMatch, problemLanguage, problemScore, recordHistory, saveSession, scoreProblem, totalScore,
} from './src/engine/examGrading.ts';
import type { TestVerdict } from './src/engine/examGrading.ts';
import { SOLUTION_NOTES } from './src/data/examSolutions.ts';
import { LANGUAGES, isStarterCode, starterFor } from './src/data/languages.ts';

const solutionFile = (id: string) => join(import.meta.dirname, 'src/data/solutions', `${id}.cpp`);

function memoryStore() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => { data.set(k, v); },
    removeItem: (k: string) => { data.delete(k); },
  };
}

const allChapters = EXAM_CHAPTERS.map(c => c.id);

test('problem bank is well-formed, covers every chapter and is distinct from existing exercises', () => {
  const existing = new Set([...EXERCISES.map(e => e.title.toLowerCase()), ...SAMPLES.map(s => s.name.toLowerCase())]);
  const ids = new Set<string>();
  for (const p of PROBLEM_BANK) {
    assert.ok(!ids.has(p.id), `duplicate id ${p.id}`); ids.add(p.id);
    assert.ok(allChapters.includes(p.chapter), p.id);
    assert.ok(isDifficulty(p.difficulty), `${p.id} cần độ khó hợp lệ`);
    assert.ok(!existing.has(p.title.toLowerCase()), `${p.id} trùng bài đã có`);
    assert.ok(p.tests.some(t => !t.hidden) && p.tests.some(t => t.hidden), p.id);
    assert.ok(existsSync(solutionFile(p.id)), `missing solution file for ${p.id}`);
    const note = SOLUTION_NOTES[p.id];
    assert.ok(note && note.idea.length > 20 && note.time.startsWith('O(') && note.space.startsWith('O('), `missing solution note for ${p.id}`);
  }
  for (const ch of allChapters) assert.ok(availableProblems([ch]) >= 7, `${ch} cần ít nhất 7 bài`);
  for (const ch of LECTURE_CHAPTER_IDS) assert.ok(availableProblems([ch]) >= 10, `${ch} cần ít nhất 10 bài`);
  assert.deepEqual(EXTRA_CHAPTER_IDS, ['MR1', 'MR2', 'MR3']);
  // Mỗi chương có cả bài dễ và bài trung bình; toàn ngân hàng có đủ bài khó để ra đề toàn bài khó.
  for (const ch of allChapters) for (const d of ['easy', 'medium'] as const) {
    assert.ok(availableProblems([ch], [d]) >= 1, `${ch} cần ít nhất một bài ${d}`);
  }
  assert.ok(availableProblems(allChapters, ['hard']) >= 15, 'cần ít nhất 15 bài khó');
  assert.equal(PROBLEM_BANK.length, 159);
});

test('generator filters by difficulty and keeps the spread across chapters', () => {
  assert.equal(availableProblems(allChapters, []), PROBLEM_BANK.length, 'không lọc = mọi độ khó');
  assert.equal(availableProblems(allChapters, DIFFICULTIES.map(d => d.id)), PROBLEM_BANK.length);
  const hard = generateExamSpec({ chapters: allChapters, difficulties: ['hard'], problemCount: 5, proctored: true, seed: 11 });
  const exam = resolveExam(hard)!;
  assert.equal(exam.problems.length, 5);
  assert.ok(exam.problems.every(p => p.difficulty === 'hard'));
  assert.equal(new Set(exam.problems.map(p => p.chapter)).size, 5, '5 bài khó từ 5 chương khác nhau');
  assert.match(hard.title, /Khó$/);
  const all = generateExamSpec({ chapters: ['L1'], difficulties: ['easy', 'medium', 'hard'], problemCount: 2, proctored: false, seed: 1 });
  assert.doesNotMatch(all.title, /Dễ|Khó/, 'chọn cả ba độ khó thì tên đề không ghi độ khó');
  // L1 không có bài khó: lọc ra 0 bài.
  const none = generateExamSpec({ chapters: ['L1'], difficulties: ['hard'], problemCount: 3, proctored: true, seed: 2 });
  assert.equal(none.problemIds.length, availableProblems(['L1'], ['hard']));
  const easyMr = generateExamSpec({ chapters: EXTRA_CHAPTER_IDS, difficulties: ['easy'], problemCount: 99, proctored: true, seed: 4 });
  assert.equal(easyMr.problemIds.length, availableProblems(EXTRA_CHAPTER_IDS, ['easy']));
  assert.equal(generateExamSpec({ chapters: LECTURE_CHAPTER_IDS, problemCount: 3, proctored: true, seed: 5 }).title, 'Đề thi — tổng hợp L1–L9');
  assert.equal(generateExamSpec({ chapters: allChapters, problemCount: 3, proctored: true, seed: 5 }).title, 'Đề thi — tổng hợp');
});

test('preset exams resolve fully and are worth 10 points', () => {
  assert.equal(PRESET_EXAMS.length, PRESET_SPECS.length);
  for (const spec of PRESET_SPECS) {
    const exam = resolveExam(spec);
    assert.ok(exam, spec.id);
    assert.equal(exam.problems.length, spec.problemIds.length, spec.id);
    assert.equal(examTotalPoints(exam), 10, spec.id);
    assert.ok(exam.durationMinutes > 0 && exam.maxViolations > 0 && exam.proctored);
  }
});

test('generator picks only selected chapters, spreads across them and is reproducible', () => {
  const chapters = ['L2', 'L5', 'L6'];
  const opts = { chapters, problemCount: 6, proctored: true, seed: 42 };
  const spec = generateExamSpec(opts);
  assert.deepEqual(generateExamSpec(opts), spec, 'same seed → same exam');
  const exam = resolveExam(spec);
  assert.ok(exam);
  assert.equal(exam.problems.length, 6);
  assert.equal(new Set(spec.problemIds).size, 6, 'no duplicates');
  for (const ch of chapters) assert.equal(exam.problems.filter(p => p.chapter === ch).length, 2, `2 bài cho ${ch}`);
  assert.equal(examTotalPoints(exam), 10);
  assert.equal(spec.durationMinutes, suggestDuration(6));
  assert.deepEqual(exam.chapters, chapters);
  const seen = new Set<string>();
  for (let seed = 1; seed <= 30; seed++) generateExamSpec({ ...opts, problemCount: 3, seed }).problemIds.forEach(id => seen.add(id));
  assert.ok(seen.size > 6, 'different seeds give different exams');
});

test('generator clamps to what the chapters contain', () => {
  const spec = generateExamSpec({ chapters: ['L1'], problemCount: 999, proctored: false, seed: 7 });
  assert.equal(spec.problemIds.length, availableProblems(['L1']));
  assert.equal(spec.proctored, false);
  const all = generateExamSpec({ chapters: allChapters, problemCount: allChapters.length, proctored: true, seed: 3 });
  assert.equal(new Set(resolveExam(all)!.problems.map(p => p.chapter)).size, allChapters.length, 'mỗi chương một bài');
  assert.equal(resolveExam({ ...spec, problemIds: ['nope'] }), null);
});

test('grading: exact per-problem scores add up to 10 and chapter breakdown matches', () => {
  assert.equal(normalizeOutput('1 2 \r\n3\n\n'), '1 2\n3');
  assert.ok(outputsMatch('YES\n', 'YES'));
  assert.ok(!outputsMatch('YES NO', 'YES\nNO'));
  const spec = PRESET_SPECS[0];
  const exam = resolveExam(spec)!;
  const s = createSession(spec, 0);
  assert.equal(s.endsAt, spec.durationMinutes * 60_000);
  for (const p of exam.problems) {
    assert.equal(s.codes[p.id], p.starterCode);
    s.codes[p.id] = `solved ${p.id}`;
    s.results[p.id] = { code: s.codes[p.id], verdicts: p.tests.map(() => 'AC'), score: scoreProblem(p, p.tests.map(() => 'AC')) };
  }
  assert.equal(totalScore(exam, s), 10, '3 × 10/3 phải đúng 10, không phải 9,99');
  const p = exam.problems[0];
  const partial: TestVerdict[] = p.tests.map((_, i) => (i === 0 ? 'AC' : 'WA'));
  s.results[p.id] = { code: s.codes[p.id], verdicts: partial, score: scoreProblem(p, partial) };
  const expected = Math.round((10 / 3 / p.tests.length + 20 / 3) * 100) / 100;
  assert.equal(totalScore(exam, s), expected);
  const breakdown = chapterBreakdown(exam, s);
  assert.equal(Math.round(breakdown.reduce((a, r) => a + r.got, 0) * 100) / 100, expected);
  assert.equal(Math.round(breakdown.reduce((a, r) => a + r.max, 0) * 100) / 100, 10);
  s.codes[p.id] = 'edited after grading';
  assert.equal(totalScore(exam, s), Math.round(20 / 3 * 100) / 100, 'stale results do not count');
  assert.equal(formatClock(61_000), '01:01');
  assert.equal(formatClock(-5), '00:00');
  assert.equal(formatPoints(10 / 3), '3,33');
});

test('sessions round-trip; sessions from older versions (with multiple choice) migrate to code-only', () => {
  const store = memoryStore();
  const spec = generateExamSpec({ chapters: ['L3.1'], problemCount: 2, proctored: false, seed: 5 });
  const s = createSession(spec, 1000);
  s.flags.push(spec.problemIds[0]);
  assert.ok(saveSession(s, store));
  assert.deepEqual(loadSession(store), s);

  store.setItem(EXAM_SESSION_KEY, JSON.stringify({
    version: 1, examId: 'exam-b', startedAt: 1, endsAt: 2, answers: { 'B-Q1': 1 }, codes: {}, results: {}, violations: [],
  }));
  const v1 = loadSession(store)!;
  assert.equal(v1.version, 3);
  assert.deepEqual(v1.spec, PRESET_SPECS[1]);
  assert.equal('answers' in v1, false);

  store.setItem(EXAM_SESSION_KEY, JSON.stringify({
    version: 2, startedAt: 1, endsAt: 2, answers: {}, codes: { 'P-L5-01': 'x' }, results: {}, violations: [], flags: ['Q-L5-01'], revealed: [],
    spec: { id: 'custom-1', title: 'Đề cũ', description: '', durationMinutes: 30, maxViolations: 3, proctored: true,
      questionIds: ['Q-L5-01'], problemIds: ['P-L5-01', 'P-L5-02'], choicePoints: 2, problemPoints: 3 },
  }));
  const v2 = loadSession(store)!;
  assert.equal(v2.spec.problemPoints, 5, 'thang 10 chia lại cho 2 bài');
  assert.equal(examTotalPoints(resolveExam(v2.spec)!), 10);
  assert.equal(v2.codes['P-L5-01'], 'x');

  store.setItem(EXAM_SESSION_KEY, JSON.stringify({ version: 1, examId: 'unknown', startedAt: 1, endsAt: 2, codes: {}, results: {}, violations: [] }));
  assert.equal(loadSession(store), null);
  store.setItem(EXAM_SESSION_KEY, '{broken');
  assert.equal(loadSession(store), null);
});

test('history upserts by attempt, keeps the latest entries and drops unusable ones', () => {
  const store = memoryStore();
  const spec = PRESET_SPECS[1];
  const exam = resolveExam(spec)!;
  const p = exam.problems[0];
  const s = { ...createSession(spec, 0), submittedAt: 60_000 };
  recordHistory(historyEntry(exam, s, examTotalPoints(exam)), store);
  s.codes[p.id] = 'ok';
  s.results[p.id] = { code: 'ok', verdicts: p.tests.map(() => 'AC'), score: p.points };
  const list = recordHistory(historyEntry(exam, s, examTotalPoints(exam)), store);
  assert.equal(list.length, 1, 'same attempt is updated, not duplicated');
  assert.equal(list[0].score, Math.round(p.points * 100) / 100);
  assert.equal(list[0].durationMs, 60_000);
  assert.equal(list[0].codes?.[p.id], 'ok', 'submitted code is kept for review');
  assert.deepEqual(list[0].verdicts?.[p.id], p.tests.map(() => 'AC'));
  assert.equal(list[0].verdicts?.[exam.problems[1].id], undefined, 'ungraded problems have no verdicts');
  for (let i = 1; i <= EXAM_HISTORY_LIMIT + 5; i++) {
    recordHistory(historyEntry(exam, { ...createSession(spec, i * 1000), submittedAt: i * 1000 + 1 }, 10), store);
  }
  const all = loadHistory(store);
  assert.equal(all.length, EXAM_HISTORY_LIMIT);
  assert.ok(all.every((e, i) => i === 0 || all[i - 1].at >= e.at), 'newest first');
  store.setItem(EXAM_HISTORY_KEY, JSON.stringify([{ id: 'x', score: 1, at: 1, byChapter: [], spec: { id: 'q', title: 't', durationMinutes: 5, problemIds: [] } }, null]));
  assert.deepEqual(loadHistory(store), []);
});

const hasGpp = spawnSync('g++', ['--version']).status === 0;
test('the optimal solutions shown to learners compile cleanly and pass every test case', { skip: !hasGpp && 'g++ not available' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'codelens-exam-'));
  try {
    for (const p of PROBLEM_BANK) {
      const bin = join(dir, p.id);
      // -Werror on top of -Wall -Wextra: code we present as a model answer must not carry warnings.
      execFileSync('g++', ['-std=gnu++17', '-O2', '-Wall', '-Wextra', '-Werror', '-o', bin, solutionFile(p.id)]);
      assert.doesNotMatch(readFileSync(solutionFile(p.id), 'utf8'), /bits\/stdc\+\+/, `${p.id} should use standard headers`);
      p.tests.forEach((t, i) => {
        const out = execFileSync(bin, { input: t.input }).toString();
        assert.ok(outputsMatch(out, t.output), `${p.id} test ${i + 1}: got ${JSON.stringify(out)} want ${JSON.stringify(t.output)}`);
      });
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('history keeps code for review, sanitises stored data and survives a full storage', () => {
  const spec = PRESET_SPECS[0];
  const exam = resolveExam(spec)!;
  const s = { ...createSession(spec, 0), submittedAt: 1000 };
  s.codes[exam.problems[0].id] = 'x'.repeat(30_000);
  const entry = historyEntry(exam, s, 10);
  assert.equal(entry.codes?.[exam.problems[0].id].length, 20_000, 'long code is capped');
  assert.equal(entry.codes?.[exam.problems[1].id], exam.problems[1].starterCode);

  const store = memoryStore();
  store.setItem(EXAM_HISTORY_KEY, JSON.stringify([{ ...entry, codes: { a: 'ok', b: 42 }, verdicts: { a: ['AC', 'NOPE'], b: ['WA'] } }]));
  const [loaded] = loadHistory(store);
  assert.deepEqual(loaded.codes, { a: 'ok' });
  assert.deepEqual(loaded.verdicts, { b: ['WA'] });

  // A store that only accepts small payloads: older entries lose their code, scores are kept.
  const tight = memoryStore();
  const setItem = tight.setItem;
  tight.setItem = (k: string, v: string) => { if (v.length > 60_000) throw new Error('QuotaExceededError'); setItem(k, v); };
  for (let i = 0; i < 5; i++) recordHistory(historyEntry(exam, { ...s, startedAt: i, submittedAt: 10 + i }, 10), tight);
  const kept = loadHistory(tight);
  assert.equal(kept.length, 5, 'every attempt is still listed');
  assert.ok(kept[0].codes, 'the newest attempt keeps its code');
  assert.equal(kept[4].codes, undefined, 'the oldest attempt dropped its code');
});

test('each problem can be solved in another language; results only count for the language they were graded in', () => {
  assert.deepEqual(LANGUAGES.map(l => l.id), ['cpp', 'c', 'python', 'java', 'javascript']);
  for (const l of LANGUAGES) assert.ok(isStarterCode(l.starter) && isStarterCode(`\n${l.starter}  \n`), `${l.id} starter is recognised`);
  assert.ok(!isStarterCode(starterFor('python') + 'print(1)\n'));
  assert.ok(starterFor('java').includes('public class Main'), 'judge runs class Main');

  const exam = PRESET_EXAMS[0];
  const p = exam.problems[0];
  const session = createSession(PRESET_SPECS[0], 1000);
  assert.equal(problemLanguage(session, p.id), 'cpp', 'C++ by default');
  const code = 'print(42)\n';
  session.codes[p.id] = code;
  session.langs = { [p.id]: 'python' };
  session.results[p.id] = { code, verdicts: p.tests.map((): TestVerdict => 'AC'), score: p.points, language: 'python' };
  assert.equal(problemScore(p, session), p.points);
  // Same text graded as another language (or an old result without a language, i.e. C++) is stale.
  session.results[p.id] = { ...session.results[p.id], language: undefined };
  assert.equal(problemScore(p, session), 0);
  session.results[p.id] = { ...session.results[p.id], language: 'python' };

  const store = memoryStore();
  saveSession(session, store);
  const loaded = loadSession(store)!;
  assert.deepEqual(loaded.langs, { [p.id]: 'python' });
  store.setItem(EXAM_SESSION_KEY, JSON.stringify({ ...session, langs: { [p.id]: 'ruby' } }));
  assert.equal(loadSession(store)!.langs, undefined, 'unknown languages are dropped');

  const entry = historyEntry(exam, { ...session, submittedAt: 2000 }, examTotalPoints(exam));
  assert.deepEqual(entry.langs, { [p.id]: 'python' });
  assert.deepEqual(entry.verdicts?.[p.id], p.tests.map(() => 'AC'));
  recordHistory(entry, store);
  assert.deepEqual(loadHistory(store)[0].langs, { [p.id]: 'python' });
});

const hasPython = spawnSync('python3', ['--version']).status === 0;
test('every problem has a Python solution that passes every test case', { skip: !hasPython && 'python3 not available' }, () => {
  for (const p of PROBLEM_BANK) {
    const file = solutionFile(p.id).replace(/\.cpp$/, '.py');
    assert.ok(existsSync(file), `missing Python solution for ${p.id}`);
    p.tests.forEach((t, i) => {
      // -I: chế độ cô lập, không đọc biến môi trường hay thư mục hiện tại của người chạy test.
      const out = execFileSync('python3', ['-I', file], { input: t.input, timeout: 20_000 }).toString();
      assert.ok(outputsMatch(out, t.output), `${p.id}.py test ${i + 1}: got ${JSON.stringify(out.slice(0, 200))} want ${JSON.stringify(t.output.slice(0, 200))}`);
    });
  }
});
