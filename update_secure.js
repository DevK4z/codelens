const fs = require('fs');
let code = fs.readFileSync('frontend/src/data/exercises.ts', 'utf8');

const updates = {
  'L2-06': {
    constraints: 'n <= 20',
    proposed_input: '3',
    proposed_output: '000\\n001\\n010\\n011\\n100\\n101\\n110\\n111',
    solution_stdin: '3',
    solution_code: '#include <iostream>\\n#include <vector>\\nusing namespace std;\\n\\nvoid gen(int n, vector<int>& a, int i) {\\n    if (i == n) {\\n        for (int x : a) cout << x;\\n        cout << "\\\\n";\\n        return;\\n    }\\n    a[i] = 0;\\n    gen(n, a, i + 1);\\n    a[i] = 1;\\n    gen(n, a, i + 1);\\n}\\n\\nint main() {\\n    int n;\\n    if (cin >> n) {\\n        vector<int> a(n);\\n        gen(n, a, 0);\\n    }\\n    return 0;\\n}'
  },
  'L2-07': {
    constraints: 'n <= 10',
    proposed_input: '3',
    proposed_output: '123\\n132\\n213\\n231\\n312\\n321',
    solution_stdin: '3',
    solution_code: '#include <iostream>\\n#include <vector>\\nusing namespace std;\\n\\nvoid gen(int n, vector<int>& a, vector<bool>& used, int i) {\\n    if (i == n) {\\n        for (int x : a) cout << x;\\n        cout << "\\\\n";\\n        return;\\n    }\\n    for (int v = 1; v <= n; v++) {\\n        if (!used[v]) {\\n            used[v] = true;\\n            a[i] = v;\\n            gen(n, a, used, i + 1);\\n            used[v] = false;\\n        }\\n    }\\n}\\n\\nint main() {\\n    int n;\\n    if (cin >> n) {\\n        vector<int> a(n);\\n        vector<bool> used(n + 1, false);\\n        gen(n, a, used, 0);\\n    }\\n    return 0;\\n}'
  },
  'L2-08': {
    constraints: 'k <= n <= 20',
    proposed_input: '5 3',
    proposed_output: '123\\n124\\n125\\n134\\n135\\n145\\n234\\n235\\n245\\n345',
    solution_stdin: '5 3',
    solution_code: '#include <iostream>\\n#include <vector>\\nusing namespace std;\\n\\nvoid gen(int n, int k, vector<int>& a, int i) {\\n    if (i > k) {\\n        for (int j = 1; j <= k; j++) cout << a[j];\\n        cout << "\\\\n";\\n        return;\\n    }\\n    for (int v = a[i-1] + 1; v <= n - k + i; v++) {\\n        a[i] = v;\\n        gen(n, k, a, i + 1);\\n    }\\n}\\n\\nint main() {\\n    int n, k;\\n    if (cin >> n >> k) {\\n        vector<int> a(k + 1);\\n        a[0] = 0;\\n        gen(n, k, a, 1);\\n    }\\n    return 0;\\n}'
  }
};

let obj = JSON.parse(code.replace(/.*?export const EXERCISES:\s*ExerciseItem\[\]\s*=\s*/s, '').replace(/;\s*$/, ''));

for (let item of obj) {
  if (updates[item.id]) {
    Object.assign(item, updates[item.id]);
  }
}

const fileContent = "export interface ExerciseSource {\n" +
"  filename: string;\n" +
"  sha256: string;\n" +
"}\n\n" +
"export interface ExerciseItem {\n" +
"  id: string;\n" +
"  chapter: string;\n" +
"  title: string;\n" +
"  source_file: string;\n" +
"  pdf_pages: number[];\n" +
"  kind: 'G' | 'V' | 'R';\n" +
"  statement: string;\n" +
"  source_data: string;\n" +
"  notes: string;\n" +
"  constraints?: string;\n" +
"  proposed_input?: string;\n" +
"  proposed_output?: string;\n" +
"  hints?: string[];\n" +
"  solution_code?: string;\n" +
"  solution_stdin?: string;\n" +
"  suggestedRoles?: Record<string, string>;\n" +
"}\n\n" +
"export const EXERCISES: ExerciseItem[] = " + JSON.stringify(obj, null, 2) + ";\n";

fs.writeFileSync('frontend/src/data/exercises.ts', fileContent);
console.log('Exercises updated securely!');
