import { Stmt, Expr, Val } from "./memory";
import { SourceRange } from "../source_range";
export declare let done: Stmt;
export declare let dbg: (range: SourceRange) => <A>(v: A) => Expr<A>;
export declare let if_then_else: (c: Expr<Val>, f: Expr<Val>, g: Expr<Val>) => Expr<Val>;
export declare let while_do: (p: Expr<Val>, k: Expr<Val>) => Expr<Val>;
