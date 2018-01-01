import { Expr, Val, Lambda } from "./memory";
export declare let mk_lambda: (body: Expr<Val>, parameters: string[], closure_parameters: string[]) => Expr<Val>;
export declare let def_fun: (n: string, body: Expr<Val>, parameters: string[], closure_parameters: string[]) => Expr<Val>;
export declare let ret: (e: Expr<Val>) => Expr<Val>;
export declare let call_by_name: (f_n: string, args: Expr<Val>[]) => Expr<Val>;
export declare let call_lambda_expr: (lambda: Expr<Val>, arg_values: Expr<Val>[]) => Expr<Val>;
export declare let call_lambda: (lambda: Lambda, arg_expressions: Expr<Val>[]) => Expr<Val>;
