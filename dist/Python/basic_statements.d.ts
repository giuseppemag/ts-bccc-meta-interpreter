import { Unit, Fun } from "ts-bccc";
import { Stmt, Expr, SourceRange } from "./memory";
export declare let done: Stmt;
export declare let dbg: (range: SourceRange) => <A>(v: A) => Expr<A>;
export declare let if_then_else: <c>(f: Fun<Unit, Expr<c>>, g: Fun<Unit, Expr<c>>) => Fun<boolean, Expr<c>>;
export declare let while_do: (p: Expr<boolean>, k: Expr<Unit>) => Expr<Unit>;
