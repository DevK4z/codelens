const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.tsx', 'utf8');

if (!code.includes('handleSelectExercise')) {
  code = code.replace(
    'const handleSelectSample = (sample: any) => {',
    `const handleSelectExercise = (ex: ExerciseItem) => {
    const generatedCode = ex.solution_code || \`#include <iostream>\\nusing namespace std;\\n\\nint main() {\\n    // [\${ex.id}] \${ex.title}\\n    // Viết code C++ của bạn ở đây\\n    \\n    return 0;\\n}\`;
    const simulatedSample = {
      id: ex.id,
      name: ex.title,
      description: ex.statement,
      code: generatedCode,
      stdin: ex.proposed_input || '',
      suggestedRoles: ex.suggestedRoles || {}
    };
    handleSelectSample(simulatedSample);
  };

  const handleSelectSample = (sample: any) => {`
  );
}

if (!code.includes('onOpenExerciseBank={() => setIsExerciseBankOpen(true)}')) {
  code = code.replace(
    '<Header\n        theme={theme}\n        toggleTheme={toggleTheme}\n        onSelectSample={handleSelectSample}',
    '<Header\n        theme={theme}\n        toggleTheme={toggleTheme}\n        onSelectSample={handleSelectSample}\n        onOpenExerciseBank={() => setIsExerciseBankOpen(true)}'
  );
}

fs.writeFileSync('frontend/src/App.tsx', code);
