import { Option } from "ts-bccc";
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
    kind: "identifier";
    v: string;
} | {
    kind: "=";
};
export declare let newline: Token;
export declare let indent: Token;
export declare let deindent: Token;
export declare let int: (_: string) => Option<Token>;
export declare let float: (_: string) => Option<Token>;
export declare let _if: (_: string) => Option<Token>;
export declare let _eq: (_: string) => Option<Token>;
export declare let _then: (_: string) => Option<Token>;
export declare let _else: (_: string) => Option<Token>;
export declare let identifier: (_: string) => Option<Token>;
