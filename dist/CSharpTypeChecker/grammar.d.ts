import * as Immutable from "immutable";
import { Coroutine } from "ts-bccc";
export declare type Token = {
    kind: "Newline";
} | {
    kind: "Indent";
} | {
    kind: "Deindent";
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
    kind: "(";
} | {
    kind: ")";
} | {
    kind: "eof";
} | {
    kind: "\n";
} | {
    kind: " ";
};
export declare module GrammarBasics {
    let tokenize: (source: string) => Token[];
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
    l: Node;
    r: Node;
}
export interface AssignAST {
    kind: "=";
    l: Node;
    r: Node;
}
export interface FieldRefAST {
    kind: ".";
    l: Node;
    r: Node;
}
export interface SemicolonAST {
    kind: ";";
    l: Node;
    r: Node;
}
export interface PlusAST {
    kind: "+";
    l: Node;
    r: Node;
}
export interface TimesAST {
    kind: "*";
    l: Node;
    r: Node;
}
export interface FunDefAST {
    kind: "fun";
    n: IdAST;
    args: Array<Node>;
    body: Node;
}
export declare type Node = IntAST | IdAST | AssignAST | FieldRefAST | DeclAST | SemicolonAST | FunDefAST | PlusAST | TimesAST;
export declare type Error = string;
export declare type Tokens = Immutable.List<Token>;
export declare type Parser = Coroutine<Tokens, Error, Node>;
export declare let program: () => Parser;
