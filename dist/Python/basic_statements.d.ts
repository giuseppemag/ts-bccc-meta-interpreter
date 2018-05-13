import { Sum } from "ts-bccc";
import { StmtRt, MemRt, ErrVal, Val } from "./memory";
import { SourceRange } from "../source_range";
import { Coroutine } from "../fast_coroutine";
export declare let done_rt: StmtRt;
export declare let dbg_rt: (range: SourceRange) => <A>(v: A) => Coroutine<MemRt, ErrVal, A>;
export declare let if_then_else_rt: (r: SourceRange, c: Coroutine<MemRt, ErrVal, Sum<Val, Val>>, f: Coroutine<MemRt, ErrVal, Sum<Val, Val>>, g: Coroutine<MemRt, ErrVal, Sum<Val, Val>>) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let while_do_rt: (r: SourceRange, c: Coroutine<MemRt, ErrVal, Sum<Val, Val>>, k: Coroutine<MemRt, ErrVal, Sum<Val, Val>>) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let for_loop_rt: (r: SourceRange, i: Coroutine<MemRt, ErrVal, Sum<Val, Val>>, c: Coroutine<MemRt, ErrVal, Sum<Val, Val>>, s: Coroutine<MemRt, ErrVal, Sum<Val, Val>>, b: Coroutine<MemRt, ErrVal, Sum<Val, Val>>) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
