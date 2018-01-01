import * as Py from "./Python/python";
import * as CSharp from "./CSharpTypeChecker/csharp";
export declare type DebuggerStream = ({
    kind: "error" | "done";
} | {
    kind: "step";
    next: () => DebuggerStream;
}) & {
    show: () => {
        kind: "memory";
        memory: Py.Mem;
    } | {
        kind: "bindings";
        state: CSharp.State;
    } | {
        kind: "message";
        message: string;
    };
};
export declare let get_stream: (source: string) => DebuggerStream;
