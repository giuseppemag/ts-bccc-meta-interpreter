import * as CSharp from "./CSharpTypeChecker/csharp";
export declare module ImpLanguageWithSuspend {
    let test_imp: () => string;
    let ast_to_type_checker: (_: CSharp.ParserRes) => CSharp.Stmt;
    type DebuggerStream = ({
        kind: "error" | "done";
    } | {
        kind: "step";
        next: () => DebuggerStream;
    }) & {
        show: () => any;
    };
    let get_stream: (source: string) => DebuggerStream;
    let test_parser: () => string;
}
