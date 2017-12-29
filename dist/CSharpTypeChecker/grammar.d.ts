import * as Immutable from "immutable";
import { Sum, Coroutine } from "ts-bccc";
import { SourceRange } from "../source_range";
export declare type Token = ({
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
    args: Array<ParserRes>;
    body: ParserRes;
}
export declare type ParserRes = IntAST | IdAST | AssignAST | FieldRefAST | DeclAST | SemicolonAST | FunDefAST | PlusAST | TimesAST;
export declare type ParserError = string;
export declare type ParserState = Immutable.List<Token>;
export declare type Parser = Coroutine<ParserState, ParserError, ParserRes>;
export declare let program: () => Parser;
