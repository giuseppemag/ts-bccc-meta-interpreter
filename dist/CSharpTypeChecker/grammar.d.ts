import * as Immutable from "immutable";
import { Option, Sum, Coroutine } from "ts-bccc";
import { SourceRange } from "../source_range";
import * as CSharp from "./csharp";
export declare type BinOpKind = "+" | "*" | "/" | "-" | "%" | ">" | "<" | "<=" | ">=" | "==" | "!=" | "&&" | "||" | "xor";
export declare type UnaryOpKind = "not";
export declare type Token = ({
    kind: "string";
    v: string;
} | {
    kind: "int";
    v: number;
} | {
    kind: "float";
    v: number;
} | {
    kind: "bool";
    v: boolean;
} | {
    kind: "while";
} | {
    kind: "if";
} | {
    kind: "then";
} | {
    kind: "else";
} | {
    kind: "id";
    v: string;
} | {
    kind: "=";
} | {
    kind: BinOpKind;
} | {
    kind: UnaryOpKind;
} | {
    kind: ";";
} | {
    kind: ".";
} | {
    kind: "dbg";
} | {
    kind: "tc-dbg";
} | {
    kind: "(";
} | {
    kind: ")";
} | {
    kind: "{";
} | {
    kind: "}";
} | {
    kind: "eof";
} | {
    kind: "nl";
} | {
    kind: " ";
} | {
    kind: ",";
} | {
    kind: "RenderGrid";
    v: number;
} | {
    kind: "mk_empty_render_grid";
} | {
    kind: "pixel";
} | {
    kind: "return";
}) & {
    range: SourceRange;
};
export declare module GrammarBasics {
    let tokenize: (source: string) => Sum<string, Token[]>;
}
export interface DebuggerAST {
    kind: "dbg";
}
export interface TCDebuggerAST {
    kind: "tc-dbg";
}
export interface StringAST {
    kind: "string";
    value: string;
}
export interface BoolAST {
    kind: "bool";
    value: boolean;
}
export interface IntAST {
    kind: "int";
    value: number;
}
export interface IdAST {
    kind: "id";
    value: string;
}
export interface WhileAST {
    kind: "while";
    c: ParserRes;
    b: ParserRes;
}
export interface IfAST {
    kind: "if";
    c: ParserRes;
    t: ParserRes;
    e: Option<ParserRes>;
}
export interface DeclAST {
    kind: "decl";
    l: ParserRes;
    r: ParserRes;
}
export interface AssignAST {
    kind: "=";
    l: ParserRes;
    r: ParserRes;
}
export interface FieldRefAST {
    kind: ".";
    l: ParserRes;
    r: ParserRes;
}
export interface SemicolonAST {
    kind: ";";
    l: ParserRes;
    r: ParserRes;
}
export interface ReturnAST {
    kind: "return";
    value: ParserRes;
}
export interface ArgsAST {
    kind: "args";
    value: Immutable.List<DeclAST>;
}
export interface BinOpAST {
    kind: BinOpKind;
    l: ParserRes;
    r: ParserRes;
}
export interface UnaryOpAST {
    kind: UnaryOpKind;
    e: ParserRes;
}
export interface FunDefAST {
    kind: "fun";
    n: IdAST;
    args: Array<AST>;
    body: AST;
}
export interface MkEmptyRenderGrid {
    kind: "mk-empty-render-grid";
    w: ParserRes;
    h: ParserRes;
}
export interface MkRenderGridPixel {
    kind: "mk-render-grid-pixel";
    w: ParserRes;
    h: ParserRes;
    status: ParserRes;
}
export interface FunctionDeclarationAST {
    kind: "func_decl";
    name: ParserRes;
    return_type: ParserRes;
    arg_decls: ParserRes;
    body: ParserRes;
}
export interface FunctionCallAST {
    kind: "func_call";
    name: ParserRes;
    actuals: Array<ParserRes>;
}
export declare type AST = StringAST | IntAST | BoolAST | IdAST | FieldRefAST | AssignAST | DeclAST | IfAST | WhileAST | SemicolonAST | FunDefAST | ReturnAST | ArgsAST | BinOpAST | UnaryOpAST | FunctionDeclarationAST | FunctionCallAST | DebuggerAST | TCDebuggerAST | MkEmptyRenderGrid | MkRenderGridPixel;
export interface ParserRes {
    range: SourceRange;
    ast: AST;
}
export declare type ParserError = string;
export declare type ParserState = Immutable.List<Token>;
export declare type Parser = Coroutine<ParserState, ParserError, ParserRes>;
export declare let program_prs: () => Parser;
export declare let ast_to_type_checker: (_: ParserRes) => CSharp.Stmt;
