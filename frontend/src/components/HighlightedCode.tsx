// Lightweight read-only coloring: rendering tokens as text keeps user code inert.
const C_KEYWORDS = 'int|long|double|float|bool|char|void|auto|const|return|if|else|for|while|do|switch|case|break|continue|using|namespace|class|struct|public|private|template|typename|unsigned|signed|true|false|nullptr|new|delete|static|final|import|let|var|function|null|undefined|this';
const PY_KEYWORDS = 'def|return|if|elif|else|for|while|in|not|and|or|is|import|from|as|class|pass|break|continue|lambda|None|True|False|global|nonlocal|try|except|finally|raise|with|yield|del|assert';

const C_TOKENS = new RegExp(`(\\/\\*[\\s\\S]*?\\*\\/|\\/\\/[^\\n]*|"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'|\\b(?:${C_KEYWORDS})\\b|\\b\\d+(?:\\.\\d+)?\\b)`, 'g');
const PY_TOKENS = new RegExp(`("""[\\s\\S]*?"""|'''[\\s\\S]*?'''|#[^\\n]*|[rbf]?"(?:\\\\.|[^"\\\\\\n])*"|[rbf]?'(?:\\\\.|[^'\\\\\\n])*'|\\b(?:${PY_KEYWORDS})\\b|\\b\\d+(?:\\.\\d+)?\\b)`, 'g');
const C_KEYWORD = new RegExp(`^(?:${C_KEYWORDS})$`);
const PY_KEYWORD = new RegExp(`^(?:${PY_KEYWORDS})$`);

function kindOf(token: string, python: boolean): string {
  if (python ? token.startsWith('#') : token.startsWith('//') || token.startsWith('/*')) return 'comment';
  if (/^[rbf]?["']/.test(token)) return 'string';
  if (/^\d/.test(token)) return 'number';
  return (python ? PY_KEYWORD : C_KEYWORD).test(token) ? 'keyword' : '';
}

export function HighlightedCode({ code, label = 'Code mẫu chỉ đọc', language = 'cpp' }: { code: string; label?: string; language?: string }) {
  const python = language === 'python';
  const tokens = code.split(python ? PY_TOKENS : C_TOKENS);
  const lines: { text: string; kind: string }[][] = [[]];
  for (const token of tokens) {
    const kind = kindOf(token, python);
    token.split('\n').forEach((text, i) => { if (i) lines.push([]); lines[lines.length - 1].push({ text, kind }); });
  }
  return <pre tabIndex={0} aria-label={label} className="sample-source"><code>{lines.map((line, i) => <span className="sample-line" key={i}>{line.map((part, j) => <span className={part.kind ? `token-${part.kind}` : undefined} key={j}>{part.text}</span>)}{i < lines.length - 1 ? '\n' : ''}</span>)}</code></pre>;
}
