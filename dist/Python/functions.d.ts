import { Sum } from "ts-bccc";
import { SourceRange } from "../source_range";
import { ExprRt, Val, Lambda } from "./memory";
export declare let mk_lambda_rt: (body: ExprRt<Sum<Val, Val>>, parameters: string[], closure_parameters: string[], range: SourceRange) => ExprRt<Sum<Val, Val>>;
export declare let def_fun_rt: (n: string, body: ExprRt<Sum<Val, Val>>, parameters: string[], closure_parameters: string[], range: SourceRange) => ExprRt<Sum<Val, Val>>;
export declare let return_rt: (e: ExprRt<Sum<Val, Val>>) => ExprRt<Sum<Val, Val>>;
export declare let call_by_name_rt: (f_n: string, args: ExprRt<Sum<Val, Val>>[]) => ExprRt<Sum<Val, Val>>;
export declare let call_lambda_expr_rt: (lambda: ExprRt<Sum<Val, Val>>, arg_values: ExprRt<Sum<Val, Val>>[]) => ExprRt<Sum<Val, Val>>;
export declare let call_lambda_rt: (lambda: Lambda, arg_expressions: ExprRt<Sum<Val, Val>>[]) => ExprRt<Sum<Val, Val>>;
