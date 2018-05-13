import { Unit, Sum } from "ts-bccc";
import { Interface, MemRt, ErrVal, Val, HeapRef } from "./memory";
import { SourceRange } from "../source_range";
import { Coroutine } from "../fast_coroutine";
export declare let declare_class_rt: (r: SourceRange, C_name: string, int: Interface) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let field_get_rt: (r: SourceRange, F_name: string, this_addr: HeapRef) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let field_get_expr_rt: (r: SourceRange, F_name: string, this_expr: Coroutine<MemRt, ErrVal, Sum<Val, Val>>) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let method_get_rt: (r: SourceRange, M_name: string, this_addr: HeapRef) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let method_get_expr_rt: (r: SourceRange, M_name: string, this_expr: Coroutine<MemRt, ErrVal, Sum<Val, Val>>) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let field_set_rt: (r: SourceRange, F_name: {
    att_name: string;
    kind: "att";
} | {
    att_name: string;
    kind: "att_arr";
    index: Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
}, new_val_expr: Coroutine<MemRt, ErrVal, Sum<Val, Val>>, this_addr: HeapRef) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let static_field_get_expr_rt: (r: SourceRange, C_name: string, F_name: string) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let static_method_get_expr_rt: (r: SourceRange, C_name: string, F_name: string) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let static_field_set_expr_rt: (r: SourceRange, C_name: string, F_name: {
    att_name: string;
    kind: "att";
} | {
    att_name: string;
    kind: "att_arr";
    index: Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
}, new_val_expr: Coroutine<MemRt, ErrVal, Sum<Val, Val>>) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let field_set_expr_rt: (r: SourceRange, F_name: {
    att_name: string;
    kind: "att";
} | {
    att_name: string;
    kind: "att_arr";
    index: Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
}, new_val_expr: Coroutine<MemRt, ErrVal, Sum<Val, Val>>, this_expr: Coroutine<MemRt, ErrVal, Sum<Val, Val>>) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let resolve_method_rt: (r: SourceRange, M_name: string, C_def: Interface) => Sum<Coroutine<MemRt, ErrVal, Sum<Val, Val>>, Unit>;
export declare let call_method_rt: (r: SourceRange, M_name: string, this_addr: Val, args: Coroutine<MemRt, ErrVal, Sum<Val, Val>>[]) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let call_static_method_expr_rt: (r: SourceRange, C_name: string, M_name: string, args: Coroutine<MemRt, ErrVal, Sum<Val, Val>>[]) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let call_method_expr_rt: (r: SourceRange, M_name: string, this_expr: Coroutine<MemRt, ErrVal, Sum<Val, Val>>, args: Coroutine<MemRt, ErrVal, Sum<Val, Val>>[]) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let call_cons_rt: (r: SourceRange, C_name: string, args: Coroutine<MemRt, ErrVal, Sum<Val, Val>>[], init_fields: Coroutine<MemRt, ErrVal, Sum<Val, Val>>) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
