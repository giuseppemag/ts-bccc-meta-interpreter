import { Unit } from "ts-bccc";
import * as CCC from "ts-bccc";
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
export declare let tokenize: <Token>(lines: LineIndentationStep[], newline: (_: Unit) => Token, indent: (_: Unit) => Token, deindent: (_: Unit) => Token, parse_token: (_: string) => CCC.Sum<Token, Unit>) => CCC.Sum<Token[], Unit>;
