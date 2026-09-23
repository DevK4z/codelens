import { Token } from './lexer.js';
import * as AST from './ast.js';

export class ParseError extends Error {
  line: number;
  col: number;
  constructor(message: string, line: number, col: number) {
    super(`Lỗi cú pháp tại dòng ${line}: ${message}`);
    this.name = 'ParseError';
    this.line = line;
    this.col = col;
  }
}

export function parse(tokens: Token[]): AST.Program {
  let current = 0;

  // Filter out newlines to simplify parsing, although maintaining them might be useful for exact locations
  // We'll keep line/col from tokens
  const tokensNoNewline = tokens.filter(t => t.type !== 'newline');

  function peek(): Token {
    return tokensNoNewline[current] || tokensNoNewline[tokensNoNewline.length - 1];
  }

  function advance(): Token {
    const t = peek();
    if (t.type !== 'eof') current++;
    return t;
  }

  function match(value: string): boolean {
    if (peek().value === value) {
      advance();
      return true;
    }
    return false;
  }

  function matchType(type: string): boolean {
    if (peek().type === type) {
      advance();
      return true;
    }
    return false;
  }

  function expect(value: string, errMessage?: string): Token {
    const t = peek();
    if (t.value === value) {
      return advance();
    }
    throw new ParseError(errMessage || `Mong đợi '${value}', nhưng tìm thấy '${t.value}'`, t.line, t.col);
  }

  function parseProgram(): AST.Program {
    const includes: AST.IncludeDirective[] = [];
    const usings: AST.UsingDirective[] = [];
    const functions: AST.FunctionDecl[] = [];
    const globalStatements: AST.Statement[] = [];
    const t = peek();

    while (peek().type !== 'eof') {
      if (peek().value === '#include') {
        includes.push(parseInclude());
      } else if (peek().value === 'using') {
        usings.push(parseUsing());
      } else {
        // Simple heuristic to differentiate function vs global statement
        // Look ahead for '(' after an identifier following a type
        let isFunc = false;
        let p = current;
        if (tokensNoNewline[p].type === 'keyword' || tokensNoNewline[p].type === 'identifier') {
          p++;
          if (tokensNoNewline[p].value === '<') {
            while (tokensNoNewline[p].value !== '>' && tokensNoNewline[p].type !== 'eof') p++;
            p++;
          }
          if (tokensNoNewline[p].type === 'identifier') {
            p++;
            if (tokensNoNewline[p].value === '(') {
              isFunc = true;
            }
          }
        }
        
        if (isFunc) {
          functions.push(parseFunction());
        } else {
          globalStatements.push(parseStatement());
        }
      }
    }

    return {
      type: 'Program',
      line: t.line,
      col: t.col,
      includes,
      usings,
      functions,
      globalStatements
    };
  }

  function parseInclude(): AST.IncludeDirective {
    const t = advance(); // #include
    let header = '';
    expect('<');
    const headerName = advance(); // assume single identifier or multiple due to lexer
    header = headerName.value;
    while (peek().value === '/' || peek().value === '.' || peek().type === 'identifier') {
        header += advance().value;
    }
    expect('>');
    return { type: 'IncludeDirective', header, line: t.line, col: t.col };
  }

  function parseUsing(): AST.UsingDirective {
    const t = advance(); // using
    expect('namespace');
    const ns = advance();
    expect(';');
    return { type: 'UsingDirective', namespace: ns.value, line: t.line, col: t.col };
  }

  function parseType(): AST.TypeNode {
    const t = peek();
    const typeNames = ['int', 'double', 'char', 'bool', 'string', 'void', 'vector'];
    if (typeNames.includes(t.value)) {
      advance();
      const node: AST.TypeNode = {
        type: 'TypeNode',
        base: t.value as any,
        line: t.line,
        col: t.col
      };
      if (t.value === 'vector') {
        expect('<');
        node.templateArg = parseType();
        expect('>');
      }
      return node;
    }
    throw new ParseError(`Kiểu dữ liệu '${t.value}' chưa được hỗ trợ trong CodeLens v1. Hỗ trợ: int, double, char, bool, string, vector<T>.`, t.line, t.col);
  }

  function parseFunction(): AST.FunctionDecl {
    const t = peek();
    const returnType = parseType();
    const nameToken = advance();
    expect('(');
    const params: AST.ParamDecl[] = [];
    if (peek().value !== ')') {
      do {
        const paramLine = peek().line;
        const paramCol = peek().col;
        const pType = parseType();
        const isRef = match('&');
        const pName = advance().value;
        params.push({
          type: 'ParamDecl',
          line: paramLine,
          col: paramCol,
          name: pName,
          paramType: pType,
          isReference: isRef
        });
      } while (match(','));
    }
    expect(')');
    const body = parseBlock();
    return {
      type: 'FunctionDecl',
      line: t.line, col: t.col,
      name: nameToken.value,
      returnType,
      params,
      body
    };
  }

  function parseBlock(): AST.BlockStmt {
    const t = expect('{');
    const statements: AST.Statement[] = [];
    while (peek().value !== '}' && peek().type !== 'eof') {
      statements.push(...parseStatements());
    }
    expect('}');
    return { type: 'BlockStmt', statements, line: t.line, col: t.col };
  }

  function parseStatements(): AST.Statement[] {
    // If it's a type, it's a declaration which might be multiple. We'll simplify to returning one for now,
    // but a real implementation would handle multi-declarations properly.
    // We'll wrap multi-declarations in block statements or return arrays if we change the signature.
    // For simplicity of ast nodes, we return an array of statements here.
    const typeNames = ['int', 'double', 'char', 'bool', 'string', 'vector'];
    if (typeNames.includes(peek().value)) {
        return parseVarDecls();
    }
    return [parseStatement()];
  }

  function parseVarDecls(): AST.VarDecl[] {
    const t = peek();
    const baseType = parseType();
    const decls: AST.VarDecl[] = [];
    
    do {
      const nameT = expect(peek().value, 'Expected identifier'); // simple expect
      let isArray = false;
      let arraySize: AST.Expression | undefined;
      let initializer: AST.Expression | undefined;
      
      if (match('[')) {
        isArray = true;
        arraySize = parseExpression();
        expect(']');
      } else if (match('(')) {
        // vector<int> a(10)
        initializer = parseExpression();
        expect(')');
      }
      
      if (match('=')) {
        initializer = parseExpression();
      }
      
      decls.push({
        type: 'VarDecl',
        line: t.line,
        col: t.col,
        name: nameT.value,
        varType: baseType,
        isArray,
        arraySize,
        initializer
      });
      
    } while (match(','));
    
    expect(';');
    return decls;
  }

  function parseStatement(): AST.Statement {
    const t = peek();
    if (t.value === 'if') return parseIfStmt();
    if (t.value === 'for') return parseForStmt();
    if (t.value === 'while') return parseWhileStmt();
    if (t.value === 'return') return parseReturnStmt();
    if (t.value === 'cin') return parseCinStmt();
    if (t.value === 'cout') return parseCoutStmt();
    if (t.value === 'break') { advance(); expect(';'); return { type: 'BreakStmt', line: t.line, col: t.col }; }
    if (t.value === 'continue') { advance(); expect(';'); return { type: 'ContinueStmt', line: t.line, col: t.col }; }
    if (t.value === '{') return parseBlock();
    
    // assign_or_expr
    const expr = parseExpression();
    if (['=', '+=', '-=', '*=', '/=', '%='].includes(peek().value)) {
      const op = advance().value as any;
      const value = parseExpression();
      expect(';');
      // ensure expr is LValue
      let lval: AST.LValue;
      if (expr.type === 'Identifier') {
        lval = { type: 'LValue', name: expr.name, line: expr.line, col: expr.col };
      } else if (expr.type === 'IndexExpr') {
        lval = { type: 'LValue', name: expr.object, index: expr.index, line: expr.line, col: expr.col };
      } else {
        throw new ParseError(`Biểu thức không hợp lệ ở vế trái phép gán.`, t.line, t.col);
      }
      return { type: 'Assignment', target: lval, operator: op, value, line: t.line, col: t.col };
    }
    
    expect(';');
    return { type: 'ExpressionStmt', expression: expr, line: t.line, col: t.col };
  }

  function parseIfStmt(): AST.IfStmt {
    const t = advance();
    expect('(');
    const cond = parseExpression();
    expect(')');
    const thenB = parseStatement();
    let elseB: AST.Statement | undefined;
    if (match('else')) {
      elseB = parseStatement();
    }
    return { type: 'IfStmt', condition: cond, thenBranch: thenB, elseBranch: elseB, line: t.line, col: t.col };
  }

  function parseForStmt(): AST.ForStmt {
    const t = advance();
    expect('(');
    let init: AST.Statement | undefined;
    const typeNames = ['int', 'double', 'char', 'bool', 'string', 'vector'];
    if (typeNames.includes(peek().value)) {
      init = parseVarDecls()[0]; // Just take first for simplicity in AST if multi
    } else if (peek().value !== ';') {
      init = parseStatement(); // Statement parses expr_stmt or assignment with ;
    } else {
      expect(';');
    }
    
    let cond: AST.Expression | undefined;
    if (peek().value !== ';') {
      cond = parseExpression();
    }
    expect(';');
    
    let update: AST.Expression | undefined;
    if (peek().value !== ')') {
      update = parseExpression();
    }
    expect(')');
    const body = parseStatement();
    
    return { type: 'ForStmt', init, condition: cond, update, body, line: t.line, col: t.col };
  }

  function parseWhileStmt(): AST.WhileStmt {
    const t = advance();
    expect('(');
    const cond = parseExpression();
    expect(')');
    const body = parseStatement();
    return { type: 'WhileStmt', condition: cond, body, line: t.line, col: t.col };
  }

  function parseReturnStmt(): AST.ReturnStmt {
    const t = advance();
    let val: AST.Expression | undefined;
    if (peek().value !== ';') {
      val = parseExpression();
    }
    expect(';');
    return { type: 'ReturnStmt', value: val, line: t.line, col: t.col };
  }

  function parseCinStmt(): AST.CinStmt {
    const t = advance();
    const targets: AST.LValue[] = [];
    while (match('>>')) {
      const expr = parseExpression();
      if (expr.type === 'Identifier') {
        targets.push({ type: 'LValue', name: expr.name, line: expr.line, col: expr.col });
      } else if (expr.type === 'IndexExpr') {
        targets.push({ type: 'LValue', name: expr.object, index: expr.index, line: expr.line, col: expr.col });
      }
    }
    expect(';');
    return { type: 'CinStmt', targets, line: t.line, col: t.col };
  }

  function parseCoutStmt(): AST.CoutStmt {
    const t = advance();
    const exprs: AST.Expression[] = [];
    while (match('<<')) {
      if (peek().value === 'endl') {
        exprs.push({ type: 'Identifier', name: advance().value, line: peek().line, col: peek().col });
      } else {
        exprs.push(parseExpression());
      }
    }
    expect(';');
    return { type: 'CoutStmt', expressions: exprs, line: t.line, col: t.col };
  }

  function parseExpression(): AST.Expression {
    return parseLogicalOr();
  }

  function parseLogicalOr(): AST.Expression {
    let expr = parseLogicalAnd();
    while (match('||')) {
      const right = parseLogicalAnd();
      expr = { type: 'BinaryExpr', left: expr, operator: '||', right, line: expr.line, col: expr.col };
    }
    return expr;
  }

  function parseLogicalAnd(): AST.Expression {
    let expr = parseEquality();
    while (match('&&')) {
      const right = parseEquality();
      expr = { type: 'BinaryExpr', left: expr, operator: '&&', right, line: expr.line, col: expr.col };
    }
    return expr;
  }

  function parseEquality(): AST.Expression {
    let expr = parseComparison();
    while (peek().value === '==' || peek().value === '!=') {
      const op = advance().value;
      const right = parseComparison();
      expr = { type: 'BinaryExpr', left: expr, operator: op, right, line: expr.line, col: expr.col };
    }
    return expr;
  }

  function parseComparison(): AST.Expression {
    let expr = parseAddition();
    while (['<', '>', '<=', '>='].includes(peek().value)) {
      const op = advance().value;
      const right = parseAddition();
      expr = { type: 'BinaryExpr', left: expr, operator: op, right, line: expr.line, col: expr.col };
    }
    return expr;
  }

  function parseAddition(): AST.Expression {
    let expr = parseMultiplication();
    while (peek().value === '+' || peek().value === '-') {
      const op = advance().value;
      const right = parseMultiplication();
      expr = { type: 'BinaryExpr', left: expr, operator: op, right, line: expr.line, col: expr.col };
    }
    return expr;
  }

  function parseMultiplication(): AST.Expression {
    let expr = parseUnary();
    while (peek().value === '*' || peek().value === '/' || peek().value === '%') {
      const op = advance().value;
      const right = parseUnary();
      expr = { type: 'BinaryExpr', left: expr, operator: op, right, line: expr.line, col: expr.col };
    }
    return expr;
  }

  function parseUnary(): AST.Expression {
    if (['!', '-', '++', '--'].includes(peek().value)) {
      const t = advance();
      const op = t.value as any;
      const operand = parseUnary();
      return { type: 'UnaryExpr', operator: op, operand, prefix: true, line: t.line, col: t.col };
    }
    return parsePostfix();
  }

  function parsePostfix(): AST.Expression {
    let expr = parsePrimary();
    while (true) {
      if (match('[')) {
        const index = parseExpression();
        expect(']');
        if (expr.type !== 'Identifier') throw new ParseError('Invalid index expression target', expr.line, expr.col);
        expr = { type: 'IndexExpr', object: expr.name, index, line: expr.line, col: expr.col };
      } else if (match('(')) {
        const args: AST.Expression[] = [];
        if (peek().value !== ')') {
          do {
            args.push(parseExpression());
          } while (match(','));
        }
        expect(')');
        if (expr.type !== 'Identifier') throw new ParseError('Invalid call target', expr.line, expr.col);
        expr = { type: 'CallExpr', callee: expr.name, args, line: expr.line, col: expr.col };
      } else if (match('.')) {
        const method = advance().value;
        expect('('); expect(')');
        if (method === 'size') {
          if (expr.type !== 'Identifier') throw new ParseError('Invalid size target', expr.line, expr.col);
          expr = { type: 'SizeExpr', object: expr.name, line: expr.line, col: expr.col };
        } else {
            throw new ParseError(`Phương thức '${method}' chưa được hỗ trợ`, expr.line, expr.col);
        }
      } else if (peek().value === '++' || peek().value === '--') {
        const op = advance().value as any;
        expr = { type: 'UnaryExpr', operator: op, operand: expr, prefix: false, line: expr.line, col: expr.col };
      } else {
        break;
      }
    }
    return expr;
  }

  function parsePrimary(): AST.Expression {
    const t = advance();
    if (t.type === 'number') return { type: 'NumberLiteral', value: parseFloat(t.value), line: t.line, col: t.col };
    if (t.type === 'string') return { type: 'StringLiteral', value: t.value, line: t.line, col: t.col };
    if (t.type === 'char') return { type: 'CharLiteral', value: t.value, line: t.line, col: t.col };
    if (t.value === 'true') return { type: 'BoolLiteral', value: true, line: t.line, col: t.col };
    if (t.value === 'false') return { type: 'BoolLiteral', value: false, line: t.line, col: t.col };
    if (t.type === 'identifier') return { type: 'Identifier', name: t.value, line: t.line, col: t.col };
    if (t.value === '(') {
      const expr = parseExpression();
      expect(')');
      return expr;
    }
    throw new ParseError(`Không thể parse biểu thức bắt đầu bằng '${t.value}'`, t.line, t.col);
  }

  return parseProgram();
}
