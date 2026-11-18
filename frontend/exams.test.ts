import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  EXAM_CHAPTERS, PRESET_EXAMS, PRESET_SPECS, availableProblems, examTotalPoints, generateExamSpec, resolveExam, suggestDuration,
} from './src/data/exams.ts';
import { PROBLEM_BANK } from './src/data/examBank.ts';
import { EXERCISES } from './src/data/exercises.ts';
import { SAMPLES } from './src/data/samples.ts';
import {
  EXAM_HISTORY_KEY, EXAM_HISTORY_LIMIT, EXAM_SESSION_KEY, chapterBreakdown, createSession, formatClock, formatPoints, historyEntry,
  loadHistory, loadSession, normalizeOutput, outputsMatch, recordHistory, saveSession, scoreProblem, totalScore,
} from './src/engine/examGrading.ts';
import type { TestVerdict } from './src/engine/examGrading.ts';
import { EXAM_REFERENCES } from './examReferences.ts';

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
    assert.ok(!existing.has(p.title.toLowerCase()), `${p.id} trùng bài đã có`);
    assert.ok(p.tests.some(t => !t.hidden) && p.tests.some(t => t.hidden), p.id);
    assert.ok(EXAM_REFERENCES[p.id], `missing reference for ${p.id}`);
  }
  for (const ch of allChapters) assert.ok(availableProblems([ch]) >= 4, `${ch} cần ít nhất 4 bài`);
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
  const all = generateExamSpec({ chapters: allChapters, problemCount: 10, proctored: true, seed: 3 });
  assert.equal(new Set(resolveExam(all)!.problems.map(p => p.chapter)).size, 10, '10 bài trải đủ 10 chương');
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
test('reference solutions pass every exam test case', { skip: !hasGpp && 'g++ not available' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'codelens-exam-'));
  try {
    for (const p of PROBLEM_BANK) {
      const src = join(dir, `${p.id}.cpp`), bin = join(dir, p.id);
      writeFileSync(src, EXAM_REFERENCES[p.id]);
      execFileSync('g++', ['-std=gnu++17', '-O2', '-o', bin, src]);
      p.tests.forEach((t, i) => {
        const out = execFileSync(bin, { input: t.input }).toString();
        assert.ok(outputsMatch(out, t.output), `${p.id} test ${i + 1}: got ${JSON.stringify(out)} want ${JSON.stringify(t.output)}`);
      });
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
