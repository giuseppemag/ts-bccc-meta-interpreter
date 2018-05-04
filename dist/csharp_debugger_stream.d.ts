import * as Immutable from "immutable";
import { Unit, Sum } from "ts-bccc";
import { SourceRange } from "./source_range";
import * as Py from "./Python/python";
import * as CSharp from "./CSharpTypeChecker/csharp";
import { ParserRes } from "./CSharpTypeChecker/csharp";
export declare type DebuggerStreamStep = {
    kind: "memory";
    memory: Py.MemRt;
    ast: ParserRes;
} | {
    kind: "bindings";
    state: CSharp.State;
    ast: ParserRes;
} | {
    kind: "message";
    message: string;
    range: SourceRange;
};
export declare type DebuggerStream = ({
    kind: "error" | "done";
} | {
    kind: "step";
    next: () => DebuggerStream;
}) & {
    show: () => DebuggerStreamStep;
};
export declare let run_stream_to_end: (s: DebuggerStream) => Immutable.List<DebuggerStreamStep>;
export declare let get_stream: (source: string, custom_alert: Sum<(_: string) => boolean, Unit>) => DebuggerStream;
