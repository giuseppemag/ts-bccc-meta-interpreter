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
export declare type AST = StringAST | IntAST | IdAST | AssignAST | FieldRefAST | DeclAST | SemicolonAST | FunDefAST | PlusAST | TimesAST | DebuggerAST | TCDebuggerAST;
export interface ParserRes {
    range: SourceRange;
    ast: AST;
}
export declare type ParserError = string;
export declare type ParserState = Immutable.List<Token>;
export declare type Parser = Coroutine<ParserState, ParserError, ParserRes>;
export declare let parse_program: () => Parser;
