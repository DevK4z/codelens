const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.tsx', 'utf8');

// 1. Add imports
if (!code.includes('ExerciseBankModal')) {
  code = code.replace(
    "import { Header } from './components/Header';",
    "import { Header } from './components/Header';\nimport { ExerciseBankModal } from './components/ExerciseBankModal';\nimport { ExerciseItem } from './data/exercises';"
  );
}

// 2. Add state
if (!code.includes('isExerciseBankOpen')) {
  code = code.replace(
    'const [theme, setTheme] = useState',
    'const [isExerciseBankOpen, setIsExerciseBankOpen] = useState(false);\n  const [theme, setTheme] = useState'
  );
}

// 3. Handle exercise selection
if (!code.includes('handleSelectExercise')) {
  code = code.replace(
    'const handleSelectSample = (sample: Sample) => {',
    `const handleSelectExercise = (ex: ExerciseItem) => {
    const generatedCode = ex.solution_code || \`#include <iostream>\\nusing namespace std;\\n\\nint main() {\\n    // [\${ex.id}] \${ex.title}\\n    // Viết code C++ của bạn ở đây\\n    \\n    return 0;\\n}\`;
    const simulatedSample: Sample = {
      id: ex.id,
      name: ex.title,
      description: ex.statement,
      code: generatedCode,
      stdin: ex.proposed_input || '',
      suggestedRoles: ex.suggestedRoles || {}
    };
    handleSelectSample(simulatedSample);
  };

  const handleSelectSample = (sample: Sample) => {`
  );
}

// 4. Update Header props
if (!code.includes('onOpenExerciseBank=')) {
  code = code.replace(
    '<Header\n        theme={theme}',
    '<Header\n        theme={theme}\n        onOpenExerciseBank={() => setIsExerciseBankOpen(true)}'
  );
}

// 5. Add Modal to JSX
if (!code.includes('<ExerciseBankModal')) {
  code = code.replace(
    '<div className="h-screen w-full flex flex-col bg-[var(--bg-primary)] overflow-hidden text-[var(--text-primary)]">',
    '<div className="h-screen w-full flex flex-col bg-[var(--bg-primary)] overflow-hidden text-[var(--text-primary)]">\n      <ExerciseBankModal \n        isOpen={isExerciseBankOpen} \n        onClose={() => setIsExerciseBankOpen(false)} \n        onSelect={handleSelectExercise}\n      />'
  );
}

fs.writeFileSync('frontend/src/App.tsx', code);
console.log('App.tsx patched successfully');
