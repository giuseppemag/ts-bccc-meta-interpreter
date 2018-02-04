import * as DebuggerStream from "./csharp_debugger_stream";
export declare module ImpLanguageWithSuspend {
    let get_stream: (source: string) => DebuggerStream.DebuggerStream;
    let test_parser: () => string;
}
