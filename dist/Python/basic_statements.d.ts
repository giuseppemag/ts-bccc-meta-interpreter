import { StmtRt, ExprRt, Val } from "./memory";
import { SourceRange } from "../source_range";
export declare let done_rt: StmtRt;
export declare let dbg_rt: (range: SourceRange) => <A>(v: A) => ExprRt<A>;
export declare let if_then_else_rt: (c: ExprRt<Val>, f: ExprRt<Val>, g: ExprRt<Val>) => ExprRt<Val>;
export declare let while_do_rt: (p: ExprRt<Val>, k: ExprRt<Val>) => ExprRt<Val>;
