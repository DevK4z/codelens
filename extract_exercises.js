const fs = require('fs');

let content = fs.readFileSync('C:/Users/AD/.gemini/antigravity/brain/f388562f-c6f2-493b-80a2-77824d1f6624/.user_uploaded/media_1790406371129.json', 'utf8');

const matches = [];
const regex = /\{\s*"id":\s*"[L\d\.-]+",\s*"chapter":\s*"[^"]+",\s*"title":\s*"[^"]+",\s*"source_file":\s*"[^"]+",\s*"pdf_pages":\s*\[[\d,\s]*\],\s*"kind":\s*"[GVR]",\s*"statement":\s*"(?:[^"\\]|\\.)*",\s*"source_data":\s*"(?:[^"\\]|\\.)*",\s*"notes":\s*"(?:[^"\\]|\\.)*"\s*\}/g;

let match;
while ((match = regex.exec(content)) !== null) {
    try {
        const obj = JSON.parse(match[0]);
        matches.push(obj);
    } catch (e) {
        console.log("Failed to parse match:", match[0].substring(0, 50));
    }
}

console.log("Found " + matches.length + " exercises!");

if (matches.length > 0) {
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
"export const EXERCISES: ExerciseItem[] = " + JSON.stringify(matches, null, 2) + ";\n";

    fs.writeFileSync('frontend/src/data/exercises.ts', fileContent);
    console.log('Successfully wrote exercises.ts');
}
