import * as Py from "./Python/python";
import * as CSharp from "./CSharpTypeChecker/csharp";
import { Stmt } from "./main";
export declare type DebuggerStream = ({
    kind: "error" | "done";
} | {
    kind: "step";
    next: () => DebuggerStream;
}) & {
    show: () => {
        kind: "memory";
        memory: Py.MemRt;
        ast: Stmt;
    } | {
        kind: "bindings";
        state: CSharp.State;
        ast: Stmt;
    } | {
        kind: "message";
        message: string;
    };
};
export declare let get_stream: (source: string) => DebuggerStream;
