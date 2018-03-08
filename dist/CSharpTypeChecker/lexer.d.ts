import { Sum } from 'ts-bccc';
import { SourceRange } from '../source_range';
export declare type BinOpKind = "+" | "*" | "/" | "-" | "%" | ">" | "<" | "<=" | ">=" | "==" | "!=" | "&&" | "||" | "xor" | "=>" | ",";
export declare type UnaryOpKind = "not";
export declare type ReservedKeyword = "for" | "while" | "if" | "then" | "else" | "private" | "public" | "static" | "protected" | "virtual" | "override" | "class" | "new" | "debugger" | "typechecker_debugger" | "return";
export declare type Token = ({
    kind: "string";
    v: string;
} | {
    kind: "int";
    v: number;
} | {
    kind: "double";
    v: number;
} | {
    kind: "float";
    v: number;
} | {
    kind: "bool";
    v: boolean;
} | {
    kind: ReservedKeyword;
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
    kind: "(";
} | {
    kind: ")";
} | {
    kind: "{";
} | {
    kind: "}";
} | {
    kind: "[";
} | {
    kind: "]";
} | {
    kind: "eof";
} | {
    kind: "nl";
} | {
    kind: " ";
} | {
    kind: ",";
} | {
    kind: RenderingKind;
} | {
    kind: "RenderGrid";
    v: number;
}) & {
    range: SourceRange;
};
export declare type RenderingKind = "empty_surface" | "circle" | "square" | "rectangle" | "ellipse" | "sprite" | "other_surface" | "text" | "line" | "polygon";
export declare module GrammarBasics {
    let tokenize: (source: string) => Sum<string, Token[]>;
}
