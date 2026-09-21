export type TokenType = 
  | 'keyword' 
  | 'identifier' 
  | 'number' 
  | 'string' 
  | 'char' 
  | 'operator' 
  | 'punctuation' 
  | 'preprocessor' 
  | 'eof' 
  | 'newline';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
}

const KEYWORDS = new Set([
  'int', 'double', 'char', 'bool', 'void', 'string', 'vector',
  'if', 'else', 'for', 'while', 'do', 'return', 'break', 'continue',
  'true', 'false', 'using', 'namespace', 'std', 'endl', 'swap',
  'cout', 'cin', 'push_back', 'size', 'include'
]);

const OPERATORS = new Set([
  '+', '-', '*', '/', '%', '=', '==', '!=', '<', '>', '<=', '>=', 
  '&&', '||', '!', '++', '--', '+=', '-=', '*=', '/=', '%=', '<<', '>>'
]);

const PUNCTUATION = new Set([
  '(', ')', '{', '}', '[', ']', ';', ',', '.', '#', '&'
]);

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let line = 1;
  let col = 1;
  let i = 0;

  function advance() {
    if (source[i] === '\n') {
      line++;
      col = 1;
    } else {
      col++;
    }
    i++;
  }

  while (i < source.length) {
    const char = source[i];

    if (char === '\n') {
      tokens.push({ type: 'newline', value: '\n', line, col });
      advance();
      continue;
    }

    if (char === ' ' || char === '\t' || char === '\r') {
      advance();
      continue;
    }

    // Multi-line comments
    if (char === '/' && source[i + 1] === '*') {
      const startCol = col;
      const startLine = line;
      advance();
      advance();
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) {
        advance();
      }
      if (i < source.length) {
        advance(); // *
        advance(); // /
      }
      continue;
    }

    // Single-line comments
    if (char === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') {
        advance();
      }
      continue;
    }

    // Preprocessor #include
    if (char === '#' && source.substr(i, 8) === '#include') {
      tokens.push({ type: 'preprocessor', value: '#include', line, col });
      i += 8; col += 8;
      continue;
    }

    // Strings
    if (char === '"') {
      let str = '';
      const startCol = col;
      const startLine = line;
      advance();
      while (i < source.length && source[i] !== '"') {
        if (source[i] === '\\\\' && i + 1 < source.length) {
          str += source[i + 1];
          advance();
          advance();
        } else {
          str += source[i];
          advance();
        }
      }
      if (i < source.length) advance(); // closing "
      tokens.push({ type: 'string', value: str, line: startLine, col: startCol });
      continue;
    }

    // Chars
    if (char === "'") {
      let c = '';
      const startCol = col;
      const startLine = line;
      advance();
      if (source[i] === '\\\\') {
        c = source[i + 1];
        advance(); advance();
      } else {
        c = source[i];
        advance();
      }
      if (source[i] === "'") advance();
      tokens.push({ type: 'char', value: c, line: startLine, col: startCol });
      continue;
    }

    // Numbers
    if (/[0-9]/.test(char)) {
      let num = '';
      const startCol = col;
      const startLine = line;
      while (i < source.length && /[0-9.]/.test(source[i])) {
        num += source[i];
        advance();
      }
      tokens.push({ type: 'number', value: num, line: startLine, col: startCol });
      continue;
    }

    // Identifiers and Keywords
    if (/[a-zA-Z_]/.test(char)) {
      let ident = '';
      const startCol = col;
      const startLine = line;
      while (i < source.length && /[a-zA-Z_0-9]/.test(source[i])) {
        ident += source[i];
        advance();
      }
      if (KEYWORDS.has(ident)) {
        tokens.push({ type: 'keyword', value: ident, line: startLine, col: startCol });
      } else {
        tokens.push({ type: 'identifier', value: ident, line: startLine, col: startCol });
      }
      continue;
    }

    // Multi-char operators
    const twoChar = source.substr(i, 2);
    if (OPERATORS.has(twoChar)) {
      tokens.push({ type: 'operator', value: twoChar, line, col });
      advance(); advance();
      continue;
    }

    // Single-char operators
    if (OPERATORS.has(char)) {
      tokens.push({ type: 'operator', value: char, line, col });
      advance();
      continue;
    }

    // Punctuation
    if (PUNCTUATION.has(char)) {
      tokens.push({ type: 'punctuation', value: char, line, col });
      advance();
      continue;
    }

    // Unknown character, just skip for now or we could throw
    advance();
  }

  tokens.push({ type: 'eof', value: '', line, col });
  return tokens;
}
