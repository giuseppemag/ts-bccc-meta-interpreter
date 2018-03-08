import { Unit, Sum } from "ts-bccc";
import { ExprRt, Interface, Val, HeapRef } from "./memory";
export declare let declare_class_rt: (C_name: string, int: Interface) => ExprRt<Sum<Val, Val>>;
export declare let field_get_rt: (F_name: string, this_addr: HeapRef) => ExprRt<Sum<Val, Val>>;
export declare let field_get_expr_rt: (F_name: string, this_expr: ExprRt<Sum<Val, Val>>) => ExprRt<Sum<Val, Val>>;
export declare let method_get_rt: (M_name: string, this_addr: HeapRef) => ExprRt<Sum<Val, Val>>;
export declare let method_get_expr_rt: (M_name: string, this_expr: ExprRt<Sum<Val, Val>>) => ExprRt<Sum<Val, Val>>;
export declare let field_set_rt: (F_name: {
    att_name: string;
    kind: "att";
} | {
    att_name: string;
    kind: "att_arr";
    index: ExprRt<Sum<Val, Val>>;
}, new_val_expr: ExprRt<Sum<Val, Val>>, this_addr: HeapRef) => ExprRt<Sum<Val, Val>>;
export declare let static_field_get_expr_rt: (C_name: string, F_name: string) => ExprRt<Sum<Val, Val>>;
export declare let static_method_get_expr_rt: (C_name: string, F_name: string) => ExprRt<Sum<Val, Val>>;
export declare let static_field_set_expr_rt: (C_name: string, F_name: {
    att_name: string;
    kind: "att";
} | {
    att_name: string;
    kind: "att_arr";
    index: ExprRt<Sum<Val, Val>>;
}, new_val_expr: ExprRt<Sum<Val, Val>>) => ExprRt<Sum<Val, Val>>;
export declare let field_set_expr_rt: (F_name: {
    att_name: string;
    kind: "att";
} | {
    att_name: string;
    kind: "att_arr";
    index: ExprRt<Sum<Val, Val>>;
}, new_val_expr: ExprRt<Sum<Val, Val>>, this_expr: ExprRt<Sum<Val, Val>>) => ExprRt<Sum<Val, Val>>;
export declare let resolve_method_rt: (M_name: string, C_def: Interface) => Sum<ExprRt<Sum<Val, Val>>, Unit>;
export declare let call_method_rt: (M_name: string, this_addr: Val, args: ExprRt<Sum<Val, Val>>[]) => ExprRt<Sum<Val, Val>>;
export declare let call_static_method_expr_rt: (C_name: string, M_name: string, args: ExprRt<Sum<Val, Val>>[]) => ExprRt<Sum<Val, Val>>;
export declare let call_method_expr_rt: (M_name: string, this_expr: ExprRt<Sum<Val, Val>>, args: ExprRt<Sum<Val, Val>>[]) => ExprRt<Sum<Val, Val>>;
export declare let call_cons_rt: (C_name: string, args: ExprRt<Sum<Val, Val>>[]) => ExprRt<Sum<Val, Val>>;
