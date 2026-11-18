// Lightweight read-only coloring: rendering tokens as text keeps user code inert.
export function HighlightedCode({ code }: { code: string }) {
  const tokens = code.split(/(\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:int|long|double|float|bool|char|void|auto|const|return|if|else|for|while|do|switch|case|break|continue|using|namespace|class|struct|public|private|template|typename|unsigned|signed|true|false|nullptr|new|delete)\b|\b\d+(?:\.\d+)?\b)/g);
  const lines: { text: string; kind: string }[][] = [[]];
  for (const token of tokens) {
    const kind = token.startsWith('//') || token.startsWith('/*') ? 'comment' : /^["']/.test(token) ? 'string' : /^\d/.test(token) ? 'number' : /^(int|long|double|float|bool|char|void|auto|const|return|if|else|for|while|do|switch|case|break|continue|using|namespace|class|struct|public|private|template|typename|unsigned|signed|true|false|nullptr|new|delete)$/.test(token) ? 'keyword' : '';
    token.split('\n').forEach((text, i) => { if (i) lines.push([]); lines[lines.length - 1].push({ text, kind }); });
  }
  return <pre tabIndex={0} aria-label="Code mẫu chỉ đọc" className="sample-source"><code>{lines.map((line, i) => <span className="sample-line" key={i}>{line.map((part, j) => <span className={part.kind ? `token-${part.kind}` : undefined} key={j}>{part.text}</span>)}{i < lines.length - 1 ? '\n' : ''}</span>)}</code></pre>;
}
