import * as CSharp from "./CSharpTypeChecker/csharp";
export declare module ImpLanguageWithSuspend {
    let test_imp: () => string;
    let ast_to_type_checker: (_: CSharp.ParserRes) => CSharp.Stmt;
    let test_parser: () => string;
}
