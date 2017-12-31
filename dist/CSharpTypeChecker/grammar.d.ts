import * as Immutable from "immutable";
import { Sum, Coroutine } from "ts-bccc";
import { SourceRange } from "../source_range";
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
    kind: "+";
} | {
    kind: "*";
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
    kind: "eof";
} | {
    kind: "nl";
} | {
    kind: " ";
} | {
    kind: "RenderGrid";
    v: number;
} | {
    kind: "mk_empty_render_grid";
} | {
    kind: "pixel";
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
export interface IntAST {
    kind: "int";
    value: number;
}
export interface IdAST {
    kind: "id";
    value: string;
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
export interface PlusAST {
    kind: "+";
    l: ParserRes;
    r: ParserRes;
}
export interface TimesAST {
    kind: "*";
    l: ParserRes;
    r: ParserRes;
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
export declare type AST = StringAST | IntAST | IdAST | FieldRefAST | AssignAST | DeclAST | SemicolonAST | FunDefAST | PlusAST | TimesAST | DebuggerAST | TCDebuggerAST | MkEmptyRenderGrid | MkRenderGridPixel;
export interface ParserRes {
    range: SourceRange;
    ast: AST;
}
export declare type ParserError = string;
export declare type ParserState = Immutable.List<Token>;
export declare type Parser = Coroutine<ParserState, ParserError, ParserRes>;
export declare let program_prs: () => Parser;
