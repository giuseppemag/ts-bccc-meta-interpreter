import { Unit } from "ts-bccc";
export declare type LineIndentationStep = {
    kind: "indent";
} | {
    kind: "line";
    v: string;
} | {
    kind: "deindent";
};
export declare let line: (l: string) => LineIndentationStep;
export declare let INDENT: LineIndentationStep;
export declare let DEINDENT: LineIndentationStep;
export declare let pre_process_indentation: (s: string) => LineIndentationStep[];
export declare let tokenize: <Token>(lines: LineIndentationStep[], newline: (_: Unit) => Token, indent: (_: Unit) => Token, deindent: (_: Unit) => Token, parse_token: (_: string) => {
    kind: "right";
    value: Unit;
} | {
    kind: "left";
    value: Token;
}) => {
    kind: "right";
    value: Unit;
} | {
    kind: "left";
    value: Token[];
};
