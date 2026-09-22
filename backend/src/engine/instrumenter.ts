import * as AST from './ast';
import { TRACE_HEADER } from './traceHeader';

export function instrument(ast: AST.Program, originalSource: string): string {
  let output = '';
  const scopes: { name: string; type: AST.TypeNode }[][] = [[]]; // Global scope
  
  function pushScope() {
    scopes.push([]);
  }
  
  function popScope() {
    scopes.pop();
  }
  
  function addVar(name: string, type: AST.TypeNode) {
    scopes[scopes.length - 1].push({ name, type });
  }

  function getAllVisibleVars() {
    const vars: { name: string; type: AST.TypeNode }[] = [];
    const seen = new Set<string>();
    for (let i = scopes.length - 1; i >= 0; i--) {
      for (const v of scopes[i]) {
        if (!seen.has(v.name)) {
          seen.add(v.name);
          vars.push(v);
        }
      }
    }
    return vars;
  }

  function genType(t: AST.TypeNode): string {
    if (t.base === 'vector' && t.templateArg) {
      return `vector<${genType(t.templateArg)}>`;
    }
    return t.base;
  }

  function emitVarSnapshot() {
    let out = '';
    const vars = getAllVisibleVars();
    for (const v of vars) {
      if (v.type.isArray && v.type.arraySize) {
          out += `__cl_sb.var_arr("${v.name}", ${v.name}, ${genExpr(v.type.arraySize)}); `;
      } else if (v.type.base === 'vector') {
          out += `__cl_sb.var_vec("${v.name}", ${v.name}); `;
      } else if (v.type.base === 'string') {
          out += `__cl_sb.var_str("${v.name}", ${v.name}); `;
      } else if (v.type.base === 'char') {
          out += `__cl_sb.var_char("${v.name}", ${v.name}); `;
      } else if (v.type.base === 'bool') {
          out += `__cl_sb.var_bool("${v.name}", ${v.name}); `;
      } else if (v.type.base === 'double') {
          out += `__cl_sb.var_double("${v.name}", ${v.name}); `;
      } else {
          out += `__cl_sb.var_int("${v.name}", ${v.name}); `;
      }
    }
    return out;
  }

  function genExpr(expr: AST.Expression): string {
    switch (expr.type) {
      case 'BinaryExpr': return `(${genExpr(expr.left)} ${expr.operator} ${genExpr(expr.right)})`;
      case 'UnaryExpr': return expr.prefix ? `${expr.operator}${genExpr(expr.operand)}` : `${genExpr(expr.operand)}${expr.operator}`;
      case 'CallExpr': return `${expr.callee}(${expr.args.map(genExpr).join(', ')})`;
      case 'IndexExpr': return `${expr.object}[${genExpr(expr.index)}]`;
      case 'Identifier': return expr.name;
      case 'NumberLiteral': return expr.value.toString();
      case 'StringLiteral': return `"${expr.value}"`;
      case 'CharLiteral': return `'${expr.value}'`;
      case 'BoolLiteral': return expr.value ? 'true' : 'false';
      case 'SizeExpr': return `${expr.object}.size()`;
      case 'CastExpr': return `(${genType(expr.targetType)})${genExpr(expr.expression)}`;
    }
  }

  function genStatement(stmt: AST.Statement): string {
    let out = '';
    
    // Add step instrumentation for statements that don't have custom trace handling
    if (
      stmt.type !== 'BlockStmt' && 
      stmt.type !== 'VarDecl' && 
      stmt.type !== 'Assignment' &&
      stmt.type !== 'CinStmt' &&
      stmt.type !== 'CoutStmt' &&
      stmt.type !== 'IfStmt' &&
      stmt.type !== 'WhileStmt' &&
      stmt.type !== 'BreakStmt' && 
      stmt.type !== 'ContinueStmt'
    ) {
        out += `__cl_begin(${stmt.line}, "line"); ${emitVarSnapshot()} __cl_end();\n`;
    }

    switch (stmt.type) {
      case 'VarDecl':
        // Copy isArray info to TypeNode for scope tracking
        const varType = { ...stmt.varType, line: stmt.varType.line, col: stmt.varType.col } as AST.TypeNode;
        if (stmt.isArray) {
            varType.isArray = true;
            varType.arraySize = stmt.arraySize;
        }
        // Build declaration string
        let declStr = `${genType(stmt.varType)} ${stmt.name}`;
        if (stmt.isArray) {
            declStr += `[${genExpr(stmt.arraySize!)}]`;
            if (!stmt.initializer) declStr += ` = {0}`;
        }
        if (stmt.initializer) {
          if (stmt.varType.base === 'vector' && !stmt.isArray) {
            declStr += `(${genExpr(stmt.initializer)})`;
          } else {
            declStr += ` = ${genExpr(stmt.initializer)}`;
          }
        } else if (!stmt.isArray && stmt.varType.base !== 'vector' && stmt.varType.base !== 'string') {
            declStr += ` = 0`; // init to 0 safely for C++
        }
        declStr += ';';
        // IMPORTANT: Emit declaration FIRST so variable is in scope for trace
        out += declStr + '\n';
        addVar(stmt.name, varType);
        if (!stmt.initializer) {
            out += `__cl_sb.set_uninit("${stmt.name}");\n`;
        }
        out += `__cl_begin(${stmt.line}, "vardecl"); ${emitVarSnapshot()} __cl_sb.mark_changed("${stmt.name}"); __cl_end();\n`;
        break;

      case 'Assignment':
        const targetStr = stmt.target.index ? `${stmt.target.name}[${genExpr(stmt.target.index)}]` : stmt.target.name;
        out += `${targetStr} ${stmt.operator} ${genExpr(stmt.value)};\n`;
        if (stmt.target.index) {
          out += `__cl_sb.set_arr_init("${stmt.target.name}", ${genExpr(stmt.target.index)});\n`;
          out += `__cl_begin(${stmt.line}, "write"); ${emitVarSnapshot()} __cl_sb.mark_changed("${stmt.target.name}"); __cl_sb.set_access("${stmt.target.name}", ${genExpr(stmt.target.index)}, "write", ${targetStr}); __cl_end();\n`;
        } else {
          out += `__cl_sb.set_init("${stmt.target.name}");\n`;
          out += `__cl_begin(${stmt.line}, "assign"); ${emitVarSnapshot()} __cl_sb.mark_changed("${stmt.target.name}"); __cl_end();\n`;
        }
        break;

      case 'IfStmt':
        if (stmt.condition.type === 'BinaryExpr' && ['<', '>', '<=', '>=', '==', '!='].includes(stmt.condition.operator)) {
          const c = stmt.condition;
          out += `__cl_begin(${stmt.line}, "compare"); ${emitVarSnapshot()} __cl_sb.set_compare("${genExpr(c.left)}", "${genExpr(c.right)}", ${genExpr(c.left)}, ${genExpr(c.right)}, "${c.operator}", (${genExpr(stmt.condition)})); __cl_end();\n`;
        } else {
          out += `__cl_begin(${stmt.line}, "branch"); ${emitVarSnapshot()} __cl_end();\n`;
        }
        out += `if (${genExpr(stmt.condition)}) `;
        if (stmt.thenBranch.type === 'BlockStmt') out += genStatement(stmt.thenBranch);
        else { pushScope(); out += `{\n${genStatement(stmt.thenBranch)}\n}`; popScope(); }
        
        if (stmt.elseBranch) {
          out += ` else `;
          if (stmt.elseBranch.type === 'BlockStmt') out += genStatement(stmt.elseBranch);
          else { pushScope(); out += `{\n${genStatement(stmt.elseBranch)}\n}`; popScope(); }
        }
        out += '\n';
        break;

      case 'ForStmt':
        pushScope();
        let initStr = '';
        if (stmt.init) {
            if (stmt.init.type === 'VarDecl') {
               addVar(stmt.init.name, stmt.init.varType);
               initStr = `${genType(stmt.init.varType)} ${stmt.init.name} = ${stmt.init.initializer ? genExpr(stmt.init.initializer) : ''}`;
            } else if (stmt.init.type === 'Assignment') {
               const tgt = stmt.init.target.index ? `${stmt.init.target.name}[${genExpr(stmt.init.target.index)}]` : stmt.init.target.name;
               initStr = `${tgt} ${stmt.init.operator} ${genExpr(stmt.init.value)}`;
            }
        }
        out += `for (${initStr}; ${stmt.condition ? genExpr(stmt.condition) : ''}; ${stmt.update ? genExpr(stmt.update) : ''}) `;
        if (stmt.body.type === 'BlockStmt') out += genStatement(stmt.body);
        else { pushScope(); out += `{\n${genStatement(stmt.body)}\n}`; popScope(); }
        popScope();
        out += '\n';
        break;

      case 'WhileStmt':
        if (stmt.condition.type === 'BinaryExpr' && ['<', '>', '<=', '>=', '==', '!='].includes(stmt.condition.operator)) {
          const c = stmt.condition;
          out += `__cl_begin(${stmt.line}, "compare"); ${emitVarSnapshot()} __cl_sb.set_compare("${genExpr(c.left)}", "${genExpr(c.right)}", ${genExpr(c.left)}, ${genExpr(c.right)}, "${c.operator}", (${genExpr(stmt.condition)})); __cl_end();\n`;
        } else {
          out += `__cl_begin(${stmt.line}, "loop_start"); ${emitVarSnapshot()} __cl_end();\n`;
        }
        out += `while (${genExpr(stmt.condition)}) `;
        if (stmt.body.type === 'BlockStmt') out += genStatement(stmt.body);
        else { pushScope(); out += `{\n${genStatement(stmt.body)}\n}`; popScope(); }
        out += '\n';
        break;

      case 'ReturnStmt':
        if (stmt.value) {
            out += `__cl_begin(${stmt.line}, "return"); ${emitVarSnapshot()} __cl_end();\n`;
            out += `auto __cl_ret = ${genExpr(stmt.value)};\n`;
            out += `__cl_sb.set_return(__cl_ret);\n`;
            out += `__cl_leave();\n`;
            out += `return __cl_ret;\n`;
        } else {
            out += `__cl_begin(${stmt.line}, "return"); ${emitVarSnapshot()} __cl_end();\n`;
            out += `__cl_leave();\n`;
            out += `return;\n`;
        }
        break;

      case 'ExpressionStmt':
        if (stmt.expression.type === 'CallExpr' && stmt.expression.callee === 'swap') {
          out += `${genExpr(stmt.expression)};\n`;
          if (stmt.expression.args.length >= 2 && stmt.expression.args[0].type === 'IndexExpr' && stmt.expression.args[1].type === 'IndexExpr') {
            const a1 = stmt.expression.args[0] as AST.IndexExpr;
            const a2 = stmt.expression.args[1] as AST.IndexExpr;
            out += `__cl_sb.set_arr_init("${a1.object}", ${genExpr(a1.index)});\n`;
            out += `__cl_sb.set_arr_init("${a2.object}", ${genExpr(a2.index)});\n`;
            out += `__cl_begin(${stmt.line}, "swap"); ${emitVarSnapshot()} __cl_sb.mark_changed("${a1.object}"); __cl_sb.set_swap("${a1.object}", ${genExpr(a1.index)}, ${genExpr(a2.index)}); __cl_end();\n`;
          } else {
            out += `__cl_begin(${stmt.line}, "line"); ${emitVarSnapshot()} __cl_end();\n`;
          }
        } else {
          out += `${genExpr(stmt.expression)};\n`;
        }
        break;

      case 'BlockStmt':
        pushScope();
        out += `{\n`;
        for (const s of stmt.statements) {
          out += genStatement(s);
        }
        out += `}\n`;
        popScope();
        break;

      case 'CinStmt':
        out += `cin >> ${stmt.targets.map(t => t.index ? `${t.name}[${genExpr(t.index)}]` : t.name).join(' >> ')};\n`;
        for (const t of stmt.targets) {
            if (t.index) {
              out += `__cl_sb.set_arr_init("${t.name}", ${genExpr(t.index)});\n`;
              out += `__cl_begin(${stmt.line}, "write"); ${emitVarSnapshot()} __cl_sb.mark_changed("${t.name}"); __cl_sb.set_access("${t.name}", ${genExpr(t.index)}, "write", ${t.name}[${genExpr(t.index)}]); __cl_end();\n`;
            } else {
              out += `__cl_sb.set_init("${t.name}");\n`;
              out += `__cl_begin(${stmt.line}, "stdin"); ${emitVarSnapshot()} __cl_sb.mark_changed("${t.name}"); __cl_end();\n`;
            }
        }
        break;

      case 'CoutStmt':
        out += `cout << ${stmt.expressions.map(genExpr).join(' << ')};\n`;
        out += `__cl_cum_stdout << ${stmt.expressions.map(genExpr).join(' << ')};\n`;
        out += `__cl_begin(${stmt.line}, "stdout"); ${emitVarSnapshot()} __cl_end();\n`;
        break;

      case 'BreakStmt':
        out += `__cl_begin(${stmt.line}, "line"); ${emitVarSnapshot()} __cl_end();\n`;
        out += `break;\n`;
        break;

      case 'ContinueStmt':
        out += `__cl_begin(${stmt.line}, "line"); ${emitVarSnapshot()} __cl_end();\n`;
        out += `continue;\n`;
        break;
    }
    return out;
  }

  // Prepend TRACE_HEADER
  output += TRACE_HEADER + '\n';
  
  for (const inc of ast.includes) {
    output += `#include <${inc.header}>\n`;
  }
  for (const us of ast.usings) {
    output += `using namespace ${us.namespace};\n`;
  }
  for (const stmt of ast.globalStatements) {
    output += genStatement(stmt);
  }
  
  for (const func of ast.functions) {
    pushScope();
    output += `${genType(func.returnType)} ${func.name}(`;
    const pStrs = func.params.map(p => {
        addVar(p.name, p.paramType);
        return `${genType(p.paramType)}${p.isReference ? '&' : ''} ${p.name}`;
    });
    output += pStrs.join(', ') + `) {\n`;
    output += `  __cl_enter("${func.name}", ${func.line});\n`;
    
    // Gen body statements manually to insert __cl_leave before closing
    pushScope(); // block scope
    for (const s of func.body.statements) {
        output += genStatement(s);
    }
    popScope();
    
    output += `  __cl_leave();\n`;
    output += `}\n`;
    popScope();
  }

  return output;
}
