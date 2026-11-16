import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EXAMS, examTotalPoints } from './src/data/exams.ts';
import { EXERCISES } from './src/data/exercises.ts';
import { SAMPLES } from './src/data/samples.ts';
import { normalizeOutput, outputsMatch, scoreProblem, totalScore, createSession, formatClock } from './src/engine/examGrading.ts';

// Lời giải tham khảo chỉ nằm trong test, không đóng gói vào web.
const REFERENCE: Record<string, string> = {
  'A-P1': `#include <iostream>
#include <string>
#include <stack>
#include <queue>
#include <vector>
#include <algorithm>
#include <climits>
using namespace std;
long long f(unsigned long long n) { return n < 10 ? n : n % 10 + f(n / 10); }
int main() { unsigned long long n; cin >> n; cout << f(n) << "\\n"; }`,
  'A-P2': `#include <iostream>
#include <string>
#include <stack>
#include <queue>
#include <vector>
#include <algorithm>
#include <climits>
using namespace std;
int main() { string s; cin >> s; stack<char> st; bool ok = true;
  for (char c : s) { if (c=='('||c=='['||c=='{') st.push(c);
    else { char o = c==')'?'(':c==']'?'[':'{'; if (st.empty()||st.top()!=o) { ok=false; break; } st.pop(); } }
  cout << (ok && st.empty() ? "YES" : "NO") << "\\n"; }`,
  'A-P3': `#include <iostream>
#include <string>
#include <stack>
#include <queue>
#include <vector>
#include <algorithm>
#include <climits>
using namespace std;
struct Node { long long v; Node* next; };
int main() { int n; cin >> n; Node *head = nullptr, *tail = nullptr;
  for (int i = 0; i < n; i++) { long long x; cin >> x; Node* p = new Node{x, nullptr}; if (!head) head = tail = p; else { tail->next = p; tail = p; } }
  Node* prev = nullptr; while (head) { Node* nx = head->next; head->next = prev; prev = head; head = nx; }
  for (Node* p = prev; p; p = p->next) cout << p->v << (p->next ? " " : "\\n"); }`,
  'B-P1': `#include <iostream>
#include <string>
#include <stack>
#include <queue>
#include <vector>
#include <algorithm>
#include <climits>
using namespace std;
int main() { int n; cin >> n; long long best = LLONG_MIN, cur = 0;
  for (int i = 0; i < n; i++) { long long x; cin >> x; cur = max(x, cur + x); best = max(best, cur); }
  cout << best << "\\n"; }`,
  'B-P2': `#include <iostream>
#include <string>
#include <stack>
#include <queue>
#include <vector>
#include <algorithm>
#include <climits>
using namespace std;
int main() { int n, q; cin >> n >> q; vector<long long> a(n); for (auto& x : a) cin >> x;
  while (q--) { long long x; cin >> x; cout << upper_bound(a.begin(), a.end(), x) - lower_bound(a.begin(), a.end(), x) << "\\n"; } }`,
  'B-P3': `#include <iostream>
#include <string>
#include <stack>
#include <queue>
#include <vector>
#include <algorithm>
#include <climits>
using namespace std;
int main() { int n, m; cin >> n >> m; vector<string> g(n); for (auto& r : g) cin >> r; int cnt = 0;
  for (int i = 0; i < n; i++) for (int j = 0; j < m; j++) if (g[i][j] == '1') { cnt++; queue<pair<int,int>> qu; qu.push({i,j}); g[i][j] = '0';
    while (!qu.empty()) { auto [x, y] = qu.front(); qu.pop(); int dx[] = {1,-1,0,0}, dy[] = {0,0,1,-1};
      for (int d = 0; d < 4; d++) { int u = x + dx[d], v = y + dy[d]; if (u>=0&&u<n&&v>=0&&v<m&&g[u][v]=='1') { g[u][v]='0'; qu.push({u,v}); } } } }
  cout << cnt << "\\n"; }`,
};

test('exams are well-formed, worth 10 points, and distinct from the exercise bank', () => {
  assert.ok(EXAMS.length >= 2);
  const existing = new Set([...EXERCISES.map(e => e.title.toLowerCase()), ...SAMPLES.map(s => s.name.toLowerCase())]);
  const ids = new Set<string>();
  for (const exam of EXAMS) {
    assert.equal(examTotalPoints(exam), 10, exam.id);
    assert.ok(exam.durationMinutes > 0 && exam.maxViolations > 0);
    for (const q of exam.questions) {
      assert.ok(!ids.has(q.id)); ids.add(q.id);
      assert.ok(q.answer >= 0 && q.answer < q.options.length, q.id);
      assert.equal(new Set(q.options).size, q.options.length, q.id);
      assert.ok(q.explanation.length > 10, q.id);
    }
    for (const p of exam.problems) {
      assert.ok(!ids.has(p.id)); ids.add(p.id);
      assert.ok(!existing.has(p.title.toLowerCase()), `${p.id} trùng bài đã có`);
      assert.ok(p.tests.some(t => !t.hidden) && p.tests.some(t => t.hidden), p.id);
      assert.ok(REFERENCE[p.id], `missing reference for ${p.id}`);
    }
  }
});

test('grading helpers', () => {
  assert.equal(normalizeOutput('1 2 \r\n3\n\n'), '1 2\n3');
  assert.ok(outputsMatch('YES\n', 'YES'));
  assert.ok(!outputsMatch('YES NO', 'YES\nNO'));
  const exam = EXAMS[0];
  const p = exam.problems[0];
  assert.equal(scoreProblem(p, p.tests.map(() => 'AC')), p.points);
  assert.equal(scoreProblem(p, p.tests.map((_, i) => i === 0 ? 'AC' : 'WA')), Math.round(p.points / p.tests.length * 100) / 100);
  const s = createSession(exam, 0);
  assert.equal(s.endsAt, exam.durationMinutes * 60_000);
  s.answers[exam.questions[0].id] = exam.questions[0].answer;
  s.answers[exam.questions[1].id] = (exam.questions[1].answer + 1) % exam.questions[1].options.length;
  s.codes[p.id] = 'solved';
  s.results[p.id] = { code: 'solved', verdicts: p.tests.map(() => 'AC'), score: p.points };
  assert.equal(totalScore(exam, s), exam.questions[0].points + p.points);
  s.codes[p.id] = 'edited after grading';
  assert.equal(totalScore(exam, s), exam.questions[0].points, 'stale results do not count');
  assert.equal(formatClock(61_000), '01:01');
  assert.equal(formatClock(-5), '00:00');
});

const hasGpp = spawnSync('g++', ['--version']).status === 0;
test('reference solutions pass every exam test case', { skip: !hasGpp && 'g++ not available' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'codelens-exam-'));
  try {
    for (const exam of EXAMS) for (const p of exam.problems) {
      const src = join(dir, `${p.id}.cpp`), bin = join(dir, p.id);
      writeFileSync(src, REFERENCE[p.id]);
      execFileSync('g++', ['-std=gnu++17', '-O2', '-o', bin, src]);
      p.tests.forEach((t, i) => {
        const out = execFileSync(bin, { input: t.input }).toString();
        assert.ok(outputsMatch(out, t.output), `${p.id} test ${i + 1}: got ${JSON.stringify(out)} want ${JSON.stringify(t.output)}`);
      });
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
