import { Sum } from "ts-bccc";
import { StmtRt, ExprRt, Val } from "./memory";
import { SourceRange } from "../source_range";
export declare let done_rt: StmtRt;
export declare let dbg_rt: (range: SourceRange) => <A>(v: A) => ExprRt<A>;
export declare let if_then_else_rt: (c: ExprRt<Sum<Val, Val>>, f: ExprRt<Sum<Val, Val>>, g: ExprRt<Sum<Val, Val>>) => ExprRt<Sum<Val, Val>>;
export declare let while_do_rt: (c: ExprRt<Sum<Val, Val>>, k: ExprRt<Sum<Val, Val>>) => ExprRt<Sum<Val, Val>>;
