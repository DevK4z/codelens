fetch('https://emkc.org/api/v2/piston/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    language: 'cpp',
    version: '10.2.0',
    files: [{ name: 'main.cpp', content: '#include <iostream>\nint main() { std::cout << "Hello"; return 0; }' }]
  })
}).then(r => r.json()).then(console.log);
