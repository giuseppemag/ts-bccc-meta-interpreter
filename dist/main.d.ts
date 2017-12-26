import * as CSharp from "./CSharpTypeChecker/csharp";
export declare module ImpLanguageWithSuspend {
    let test_imp: () => string;
    let test_lexer: () => ({
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
    })[];
    let ast_to_type_checker: (_: CSharp.Node) => CSharp.Stmt;
    let test_parser: () => string;
}
