import * as Py from "./Python/python";
import * as CSharp from "./CSharpTypeChecker/csharp";
export declare type DebuggerStream = ({
    kind: "error" | "done";
} | {
    kind: "step";
    next: () => DebuggerStream;
}) & {
    show: () => Py.Mem | CSharp.State | string;
};
export declare let get_stream: (source: string) => DebuggerStream;
