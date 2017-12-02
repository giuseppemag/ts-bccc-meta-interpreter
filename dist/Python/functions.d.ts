import { Unit } from "ts-bccc";
import { Expr, Val, Lambda } from "./memory";
export declare let def_fun: (n: string, body: Expr<Val>, args: string[]) => Expr<Unit>;
export declare let ret: (e: Expr<Val>) => Expr<Val>;
export declare let call_by_name: (f_n: string, args: Expr<Val>[]) => Expr<Val>;
export declare let call_lambda: (lambda: Lambda, arg_values: Expr<Val>[]) => Expr<Val>;
