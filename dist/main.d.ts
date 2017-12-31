export declare module ImpLanguageWithSuspend {
    let test_imp: () => string;
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
