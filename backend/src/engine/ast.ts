export interface ASTNode {
  type: string;
  line: number;
  col: number;
}

export interface Program extends ASTNode {
  type: 'Program';
  includes: IncludeDirective[];
  usings: UsingDirective[];
  functions: FunctionDecl[];
  globalStatements: Statement[];
}

export interface IncludeDirective extends ASTNode {
  type: 'IncludeDirective';
  header: string;
}

export interface UsingDirective extends ASTNode {
  type: 'UsingDirective';
  namespace: string;
}

export interface FunctionDecl extends ASTNode {
  type: 'FunctionDecl';
  name: string;
  returnType: TypeNode;
  params: ParamDecl[];
  body: BlockStmt;
}

export interface ParamDecl extends ASTNode {
  type: 'ParamDecl';
  name: string;
  paramType: TypeNode;
  isReference: boolean;
}

export interface TypeNode extends ASTNode {
  type: 'TypeNode';
  base: 'int' | 'double' | 'char' | 'bool' | 'string' | 'void' | 'vector';
  templateArg?: TypeNode;
  isArray?: boolean;
  arraySize?: Expression;
}

export interface BlockStmt extends ASTNode {
  type: 'BlockStmt';
  statements: Statement[];
}

export interface VarDecl extends ASTNode {
  type: 'VarDecl';
  name: string;
  varType: TypeNode;
  initializer?: Expression;
  isArray?: boolean;
  arraySize?: Expression;
}

export interface Assignment extends ASTNode {
  type: 'Assignment';
  target: LValue;
  operator: '=' | '+=' | '-=' | '*=' | '/=' | '%=';
  value: Expression;
}

export interface LValue extends ASTNode {
  type: 'LValue';
  name: string;
  index?: Expression;
}

export interface IfStmt extends ASTNode {
  type: 'IfStmt';
  condition: Expression;
  thenBranch: Statement;
  elseBranch?: Statement;
}

export interface ForStmt extends ASTNode {
  type: 'ForStmt';
  init?: Statement;
  condition?: Expression;
  update?: Expression;
  body: Statement;
}

export interface WhileStmt extends ASTNode {
  type: 'WhileStmt';
  condition: Expression;
  body: Statement;
}

export interface ReturnStmt extends ASTNode {
  type: 'ReturnStmt';
  value?: Expression;
}

export interface ExpressionStmt extends ASTNode {
  type: 'ExpressionStmt';
  expression: Expression;
}

export interface CinStmt extends ASTNode {
  type: 'CinStmt';
  targets: LValue[];
}

export interface CoutStmt extends ASTNode {
  type: 'CoutStmt';
  expressions: Expression[];
}

export interface BreakStmt extends ASTNode {
  type: 'BreakStmt';
}

export interface ContinueStmt extends ASTNode {
  type: 'ContinueStmt';
}

export type Statement = 
  | VarDecl 
  | Assignment 
  | IfStmt 
  | ForStmt 
  | WhileStmt 
  | ReturnStmt 
  | ExpressionStmt 
  | BlockStmt 
  | CinStmt 
  | CoutStmt 
  | BreakStmt 
  | ContinueStmt;

export interface BinaryExpr extends ASTNode {
  type: 'BinaryExpr';
  left: Expression;
  operator: string;
  right: Expression;
}

export interface UnaryExpr extends ASTNode {
  type: 'UnaryExpr';
  operator: '!' | '-' | '++' | '--';
  operand: Expression;
  prefix: boolean;
}

export interface CallExpr extends ASTNode {
  type: 'CallExpr';
  callee: string;
  args: Expression[];
}

export interface IndexExpr extends ASTNode {
  type: 'IndexExpr';
  object: string;
  index: Expression;
}

export interface Identifier extends ASTNode {
  type: 'Identifier';
  name: string;
}

export interface NumberLiteral extends ASTNode {
  type: 'NumberLiteral';
  value: number;
}

export interface StringLiteral extends ASTNode {
  type: 'StringLiteral';
  value: string;
}

export interface CharLiteral extends ASTNode {
  type: 'CharLiteral';
  value: string;
}

export interface BoolLiteral extends ASTNode {
  type: 'BoolLiteral';
  value: boolean;
}

export interface SizeExpr extends ASTNode {
  type: 'SizeExpr';
  object: string;
}

export interface CastExpr extends ASTNode {
  type: 'CastExpr';
  targetType: TypeNode;
  expression: Expression;
}

export type Expression = 
  | BinaryExpr 
  | UnaryExpr 
  | CallExpr 
  | IndexExpr 
  | Identifier 
  | NumberLiteral 
  | StringLiteral 
  | CharLiteral 
  | BoolLiteral 
  | SizeExpr 
  | CastExpr;
