const fs = require('fs');
let code = fs.readFileSync('frontend/src/data/exercises.ts', 'utf8');
code = code.replace(/\\n/g, '\n'); // Fix previous mistakes
fs.writeFileSync('frontend/src/data/exercises.ts', code);
