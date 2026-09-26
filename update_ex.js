const fs = require('fs');
let code = fs.readFileSync('frontend/src/data/exercises.ts', 'utf8');

const updates = {
  'L2-06': {
    constraints: 'n <= 20',
    proposed_input: '3',
    proposed_output: '000\\n001\\n010\\n011\\n100\\n101\\n110\\n111',
    solution_stdin: '3',
    solution_code: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nvoid gen(int n, vector<int>& a, int i) {\n    if (i == n) {\n        for (int x : a) cout << x;\n        cout << "\\n";\n        return;\n    }\n    a[i] = 0;\n    gen(n, a, i + 1);\n    a[i] = 1;\n    gen(n, a, i + 1);\n}\n\nint main() {\n    int n;\n    if (cin >> n) {\n        vector<int> a(n);\n        gen(n, a, 0);\n    }\n    return 0;\n}`
  },
  'L2-07': {
    constraints: 'n <= 10',
    proposed_input: '3',
    proposed_output: '123\\n132\\n213\\n231\\n312\\n321',
    solution_stdin: '3',
    solution_code: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nvoid gen(int n, vector<int>& a, vector<bool>& used, int i) {\n    if (i == n) {\n        for (int x : a) cout << x;\n        cout << "\\n";\n        return;\n    }\n    for (int v = 1; v <= n; v++) {\n        if (!used[v]) {\n            used[v] = true;\n            a[i] = v;\n            gen(n, a, used, i + 1);\n            used[v] = false;\n        }\n    }\n}\n\nint main() {\n    int n;\n    if (cin >> n) {\n        vector<int> a(n);\n        vector<bool> used(n + 1, false);\n        gen(n, a, used, 0);\n    }\n    return 0;\n}`
  },
  'L2-08': {
    constraints: 'k <= n <= 20',
    proposed_input: '5 3',
    proposed_output: '123\\n124\\n125\\n134\\n135\\n145\\n234\\n235\\n245\\n345',
    solution_stdin: '5 3',
    solution_code: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nvoid gen(int n, int k, vector<int>& a, int i) {\n    if (i > k) {\n        for (int j = 1; j <= k; j++) cout << a[j];\n        cout << "\\n";\n        return;\n    }\n    for (int v = a[i-1] + 1; v <= n - k + i; v++) {\n        a[i] = v;\n        gen(n, k, a, i + 1);\n    }\n}\n\nint main() {\n    int n, k;\n    if (cin >> n >> k) {\n        vector<int> a(k + 1);\n        a[0] = 0;\n        gen(n, k, a, 1);\n    }\n    return 0;\n}`
  }
};

for (const [id, data] of Object.entries(updates)) {
  const regex = new RegExp('(\\{\\s*"id":\\s*"' + id + '"[^\\}]*?)(\\n\\s*\\})', 's');
  code = code.replace(regex, (match, p1, p2) => {
    let add = '';
    for (const [k, v] of Object.entries(data)) {
      add += ',\\n    "' + k + '": ' + JSON.stringify(v);
    }
    return p1 + add + p2;
  });
}

fs.writeFileSync('frontend/src/data/exercises.ts', code);
console.log('Exercises updated!');
