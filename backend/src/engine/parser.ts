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
  const aliases = new Map<string, AST.TypeNode>();
  const builtinTypes = new Set(['int', 'long', 'short', 'signed', 'unsigned', 'float', 'double', 'char', 'bool', 'string', 'void', 'vector', 'pair', 'auto', 'const', 'volatile']);
  function isTypeStart(): boolean {
    return builtinTypes.has(peek().value) || aliases.has(peek().value);
  }
  function identifier(): Token {
    const t = peek();
    if (t.type !== 'identifier') throw new ParseError(`Mong đợi tên biến hoặc hàm, nhưng tìm thấy '${t.value}'`, t.line, t.col);
    return advance();
  }
  function parseAlias(): AST.TypeAliasDecl {
    const start = peek();
    const isTypedef = match('typedef');
    let name: Token;
    let target: AST.TypeNode;
    if (isTypedef) {
      target = parseType();
      name = identifier();
    } else {
      expect('using');
      name = identifier();
      expect('=');
      target = parseType();
    }
    expect(';');
    aliases.set(name.value, target);
    return { type: 'TypeAliasDecl', name: name.value, targetType: target, line: start.line, col: start.col };
  }

  // Filter out newlines to simplify parsing
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
    const macros: AST.MacroDirective[] = [];
    const functions: AST.FunctionDecl[] = [];
    const globalStatements: AST.Statement[] = [];
    const t = peek();

    while (peek().type !== 'eof') {
      if (peek().value === '#include') {
        includes.push(parseInclude());
      } else if (peek().value === 'typedef' || (peek().value === 'using' && tokensNoNewline[current + 1]?.value !== 'namespace')) {
        globalStatements.push(parseAlias());
      } else if (peek().value === 'using') {
        usings.push(parseUsing());
      } else if (peek().value.startsWith('#define') || peek().value.startsWith('#pragma')) {
        macros.push({ type: 'MacroDirective', macro: advance().value, line: peek().line, col: peek().col });
      } else {
        // Consume the complete type for lookahead, including aliases/templates.
        const start = current;
        try {
          parseType();
          identifier();
          const isFunc = peek().value === '(' &&
            (tokensNoNewline[current + 1]?.value === ')' || builtinTypes.has(tokensNoNewline[current + 1]?.value) || aliases.has(tokensNoNewline[current + 1]?.value));
          current = start;
          
          if (isFunc) {
            functions.push(parseFunction());
          } else {
            globalStatements.push(...parseVarDecls());
          }
        } catch {
          current = start;
          globalStatements.push(...parseVarDecls());
        }
      }
    }

    return {
      type: 'Program',
      line: t.line,
      col: t.col,
      includes,
      usings,
      macros,
      functions,
      globalStatements
    };
  }

  function parseInclude(): AST.IncludeDirective {
    const t = advance(); // #include
    let header = '';
    expect('<');
    while (peek().value !== '>' && peek().type !== 'eof') {
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
    const qualifiers: string[] = [];
    while (['const', 'volatile'].includes(peek().value)) qualifiers.push(advance().value);
    let node: AST.TypeNode;
    const alias = aliases.get(peek().value);
    if (alias) {
      advance();
      node = { ...alias, line: t.line, col: t.col };
    } else {
      const words: string[] = [];
      while (['signed', 'unsigned', 'short', 'long', 'int', 'float', 'double', 'char', 'bool', 'void'].includes(peek().value)) {
        words.push(advance().value);
      }
      if (words.length) {
        node = { type: 'TypeNode', base: words.join(' '), line: t.line, col: t.col };
      } else if (['string', 'auto', 'vector', 'pair'].includes(peek().value)) {
        const base = advance().value;
        node = { type: 'TypeNode', base, line: t.line, col: t.col };
        if (base === 'vector' || base === 'pair') {
          expect('<');
          node.templateArg = parseType();
          if (base === 'pair') { expect(','); node.templateArg2 = parseType(); }
          // In a type, >> closes two nested templates; keep shifts elsewhere intact.
          if (peek().value === '>>') {
            const close = peek();
            tokensNoNewline.splice(current, 1, { ...close, value: '>' }, { ...close, value: '>', col: close.col + 1 });
          }
          expect('>');
        }
      } else {
        throw new ParseError(`Bộ trực quan hóa chưa hỗ trợ kiểu '${peek().value}'`, peek().line, peek().col);
      }
    }
    while (['const', 'volatile'].includes(peek().value)) qualifiers.push(advance().value);
    if (qualifiers.length) node.base = [...new Set(qualifiers)].join(' ') + ' ' + node.base;
    return node;
  }

  function parseFunction(): AST.FunctionDecl {
    const t = peek();
    const returnType = parseType();
    const nameToken = identifier();
    expect('(');
    const params: AST.ParamDecl[] = [];
    if (peek().value !== ')') {
      do {
        const paramLine = peek().line;
        const paramCol = peek().col;
        const pType = parseType();
        const isRef = match('&');
        const pName = identifier().value;
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
    const outerAliases = new Map(aliases);
    const statements: AST.Statement[] = [];
    while (peek().value !== '}' && peek().type !== 'eof') {
      statements.push(...parseStatements());
    }
    expect('}');
    aliases.clear();
    for (const [name, target] of outerAliases) aliases.set(name, target);
    return { type: 'BlockStmt', statements, line: t.line, col: t.col };
  }

  function parseStatements(): AST.Statement[] {
    if (peek().value === 'typedef' || (peek().value === 'using' && tokensNoNewline[current + 1]?.value !== 'namespace')) {
      return [parseAlias()];
    }
    if (isTypeStart()) return parseVarDecls();
    return [parseStatement()];
  }

  function parseVarDecls(): AST.VarDecl[] {
    const t = peek();
    const baseType = parseType();
    const decls: AST.VarDecl[] = [];
    
    do {
      const nameT = identifier();
      let isArray = false;
      let arraySize: AST.Expression | undefined;
      let initializer: AST.Expression | undefined;
      
      if (match('[')) {
        isArray = true;
        if (peek().value !== ']') {
          arraySize = parseExpression();
        }
        expect(']');
      } else if (match('(')) {
        // vector<int> a(10)
        initializer = parseExpression();
        expect(')');
      }
      
      if (match('=')) {
        if (peek().value === '{') {
          initializer = parseInitializerList();
        } else {
          initializer = parseExpression();
        }
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

  function parseInitializerList(): AST.InitializerListExpr {
    const t = expect('{');
    const elements: AST.Expression[] = [];
    if (peek().value !== '}') {
      do {
        if (peek().value === '{') {
          elements.push(parseInitializerList());
        } else {
          elements.push(parseExpression());
        }
      } while (match(','));
    }
    expect('}');
    return { type: 'InitializerListExpr', elements, line: t.line, col: t.col };
  }

  function parseStatement(): AST.Statement {
    const t = peek();
    if (t.value === 'if') return parseIfStmt();
    if (t.value === 'for') return parseForStmt();
    if (t.value === 'while') return parseWhileStmt();
    if (t.value === 'do') return parseDoWhileStmt();
    if (t.value === 'switch') return parseSwitchStmt();
    if (t.value === 'return') return parseReturnStmt();
    if (t.value === 'cin') return parseCinStmt();
    if (t.value === 'cout' || t.value === 'cerr') return parseCoutStmt();
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
      } else if (expr.type === 'MemberAccessExpr') {
        lval = { type: 'LValue', name: expr.object, member: expr.member, line: expr.line, col: expr.col };
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
    if (isTypeStart()) {
      init = parseVarDecls()[0];
    } else if (peek().value !== ';') {
      init = parseStatement();
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
      update = parseCommaExpression();
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

  function parseDoWhileStmt(): AST.DoWhileStmt {
    const t = advance(); // 'do'
    const body = parseStatement();
    expect('while');
    expect('(');
    const cond = parseExpression();
    expect(')');
    expect(';');
    return { type: 'DoWhileStmt', condition: cond, body, line: t.line, col: t.col };
  }

  function parseSwitchStmt(): AST.SwitchStmt {
    const t = advance(); // 'switch'
    expect('(');
    const expression = parseExpression();
    expect(')');
    expect('{');
    const cases: AST.CaseClause[] = [];
    while (peek().value !== '}' && peek().type !== 'eof') {
      if (peek().value === 'case') {
        const caseTok = advance();
        const test = parseExpression();
        expect(':');
        const body: AST.Statement[] = [];
        while (peek().value !== 'case' && peek().value !== 'default' && peek().value !== '}' && peek().type !== 'eof') {
          body.push(...parseStatements());
        }
        cases.push({ type: 'CaseClause', test, body, line: caseTok.line, col: caseTok.col });
      } else if (peek().value === 'default') {
        const defTok = advance();
        expect(':');
        const body: AST.Statement[] = [];
        while (peek().value !== 'case' && peek().value !== 'default' && peek().value !== '}' && peek().type !== 'eof') {
          body.push(...parseStatements());
        }
        cases.push({ type: 'CaseClause', body, line: defTok.line, col: defTok.col });
      } else {
        break;
      }
    }
    expect('}');
    return { type: 'SwitchStmt', expression, cases, line: t.line, col: t.col };
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

  function parseCommaExpression(): AST.Expression {
    let expr = parseExpression();
    while (match(',')) {
      const right = parseExpression();
      expr = { type: 'BinaryExpr', left: expr, operator: ',', right, line: expr.line, col: expr.col };
    }
    return expr;
  }

  function parseExpression(): AST.Expression {
    let expr = parseLogicalOr();
    if (match('?')) {
      const thenExpr = parseExpression();
      expect(':');
      const elseExpr = parseExpression();
      expr = { type: 'TernaryExpr', condition: expr, thenExpr, elseExpr, line: expr.line, col: expr.col };
    }
    return expr;
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
        const member = advance().value;
        if (peek().value === '(') {
          // Method call: obj.method(args...)
          expect('(');
          const mArgs: AST.Expression[] = [];
          if (peek().value !== ')') {
            do { mArgs.push(parseExpression()); } while (match(','));
          }
          expect(')');
          const objName = expr.type === 'Identifier' ? expr.name : (expr.type === 'IndexExpr' ? expr.object : 'unknown');
          expr = { type: 'MethodCallExpr', object: objName, method: member, args: mArgs, line: expr.line, col: expr.col };
        } else {
          // Member access: obj.first, obj.second
          const objName = expr.type === 'Identifier' ? expr.name : (expr.type === 'IndexExpr' ? expr.object : 'unknown');
          expr = { type: 'MemberAccessExpr', object: objName, member, line: expr.line, col: expr.col };
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
    if (t.type === 'number') return { type: 'NumberLiteral', value: parseFloat(t.value), raw: t.value, line: t.line, col: t.col };
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
