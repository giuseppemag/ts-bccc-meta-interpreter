import { Unit, Sum } from "ts-bccc";
export declare module ImpLanguageWithSuspend {
    let test_imp: () => string;
    let test_parser: () => Sum<({
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
    })[], Unit>;
}
