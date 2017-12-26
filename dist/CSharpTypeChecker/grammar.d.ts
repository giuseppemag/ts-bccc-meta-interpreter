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
};
export declare module GrammarBasics {
    let tokenize: (source: string) => Token[];
}
export interface int {
    kind: "int";
    value: number;
}
export interface id {
    kind: "id";
    value: string;
}
export interface decl {
    kind: "decl";
    l: Node;
    r: Node;
}
export interface assign {
    kind: "=";
    l: Node;
    r: Node;
}
export interface field_ref {
    kind: ".";
    l: Node;
    r: Node;
}
export interface semicolon {
    kind: ";";
    l: Node;
    r: Node;
}
export interface plus {
    kind: "+";
    l: Node;
    r: Node;
}
export interface times {
    kind: "*";
    l: Node;
    r: Node;
}
export interface fun_def {
    kind: "fun";
    n: id;
    args: Array<Node>;
    body: Node;
}
export declare type Node = int | id | assign | field_ref | decl | semicolon | fun_def | plus | times;
export declare type Error = string;
export declare type State = Immutable.List<Token>;
export declare type Parser = Coroutine<State, Error, Node>;
export declare let program: () => Parser;
