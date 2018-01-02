import { ExprRt, Val, Lambda } from "./memory";
export declare let mk_lambda_rt: (body: ExprRt<Val>, parameters: string[], closure_parameters: string[]) => ExprRt<Val>;
export declare let def_fun_rt: (n: string, body: ExprRt<Val>, parameters: string[], closure_parameters: string[]) => ExprRt<Val>;
export declare let return_rt: (e: ExprRt<Val>) => ExprRt<Val>;
export declare let call_by_name_rt: (f_n: string, args: ExprRt<Val>[]) => ExprRt<Val>;
export declare let call_lambda_expr_rt: (lambda: ExprRt<Val>, arg_values: ExprRt<Val>[]) => ExprRt<Val>;
export declare let call_lambda_rt: (lambda: Lambda, arg_expressions: ExprRt<Val>[]) => ExprRt<Val>;
