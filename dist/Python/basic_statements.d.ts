import { Unit } from "ts-bccc";
import { Stmt, Expr, Val } from "./memory";
import { SourceRange } from "../source_range";
export declare let done: Stmt;
export declare let dbg: (range: SourceRange) => <A>(v: A) => Expr<A>;
export declare let if_then_else: (c: Expr<Val>, f: Expr<Unit>, g: Expr<Unit>) => Expr<Unit>;
export declare let while_do: (p: Expr<Val>, k: Expr<Unit>) => Expr<Unit>;
