import { Sum } from 'ts-bccc';
import * as CCC from 'ts-bccc';
import * as DebuggerStream from './csharp_debugger_stream';
export declare module ImpLanguageWithSuspend {
    let get_stream: (source: string, custom_alert: Sum<(_: string) => boolean, CCC.Unit>) => DebuggerStream.DebuggerStream;
    let test_parser: () => string;
}
