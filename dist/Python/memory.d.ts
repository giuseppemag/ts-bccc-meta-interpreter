import * as Immutable from "immutable";
import { Unit, Fun, Prod, Sum } from "ts-bccc";
import { Coroutine } from "ts-bccc";
import { SourceRange } from "../source_range";
export declare let runtime_error: (e: string) => ExprRt<Val>;
export declare type Bool = boolean;
export interface Lambda {
    body: ExprRt<Val>;
    parameters: Array<Name>;
    closure: Scope;
}
export interface HeapRef {
    v: string;
    k: "ref";
}
export interface ArrayVal {
    elements: Immutable.Map<number, Val>;
    length: number;
}
export interface RenderGrid {
    pixels: Immutable.Map<number, Immutable.Set<number>>;
    width: number;
    height: number;
}
export interface RenderGridPixel {
    x: number;
    y: number;
    status: boolean;
}
export declare let init_array_val: (_: number) => ArrayVal;
export declare type Name = string;
export declare type Val = {
    v: Unit;
    k: "u";
} | {
    v: string;
    k: "s";
} | {
    v: number;
    k: "f";
} | {
    v: number;
    k: "i";
} | {
    v: Bool;
    k: "b";
} | {
    v: ArrayVal;
    k: "arr";
} | {
    v: Scope;
    k: "obj";
} | {
    v: Lambda;
    k: "lambda";
} | HeapRef | {
    v: RenderGrid;
    k: "render-grid";
} | {
    v: RenderGridPixel;
    k: "render-grid-pixel";
};
export interface Scope extends Immutable.Map<Name, Val> {
}
export interface Interface {
    base: Sum<Interface, Unit>;
    methods: Immutable.Map<Name, StmtRt>;
}
export declare let empty_scope_val: Immutable.Map<string, Val>;
export declare let mk_unit_val: Val;
export declare let mk_string_val: (_: string) => Val;
export declare let mk_int_val: (_: number) => Val;
export declare let mk_float_val: (_: number) => Val;
export declare let mk_arr_val: (_: ArrayVal) => Val;
export declare let mk_bool_val: (_: boolean) => Val;
export declare let mk_lambda_val: (_: Lambda) => Val;
export declare let mk_obj_val: (_: Scope) => Val;
export declare let mk_ref_val: (_: Name) => Val;
export declare let mk_render_grid_val: (_: RenderGrid) => Val;
export declare let mk_render_grid_pixel_val: (_: RenderGridPixel) => Val;
export declare type ErrVal = string;
export interface MemRt {
    highlighting: SourceRange;
    globals: Scope;
    heap: Scope;
    functions: Immutable.Map<Name, Lambda>;
    classes: Immutable.Map<Name, Interface>;
    stack: Immutable.Map<number, Scope>;
}
export declare let load: Fun<Prod<string, MemRt>, Sum<Unit, Val>>;
export declare let store: Fun<Prod<Prod<string, Val>, MemRt>, MemRt>;
export declare let load_class_def: Fun<Prod<Name, MemRt>, Sum<Unit, Interface>>;
export declare let store_class_def: Fun<Prod<Prod<Name, Interface>, MemRt>, MemRt>;
export declare let load_fun_def: Fun<Prod<Name, MemRt>, Sum<Unit, Lambda>>;
export declare let store_fun_def: Fun<Prod<Prod<Name, Lambda>, MemRt>, MemRt>;
export declare let load_heap: Fun<Prod<Name, MemRt>, Sum<Unit, Val>>;
export declare let store_heap: Fun<Prod<Prod<Name, Val>, MemRt>, MemRt>;
export declare let heap_alloc: Fun<Prod<Val, MemRt>, Prod<Val, MemRt>>;
export declare let push_scope: Fun<Scope, Fun<MemRt, MemRt>>;
export declare let pop_scope: Fun<MemRt, Sum<Unit, MemRt>>;
export interface ExprRt<A> extends Coroutine<MemRt, ErrVal, A> {
}
export declare type StmtRt = ExprRt<Val>;
export declare let empty_memory: MemRt;
export declare let set_highlighting_rt: (r: SourceRange) => ExprRt<Val>;
export declare let set_v_expr_rt: (v: string, e: ExprRt<Val>) => ExprRt<Val>;
export declare let set_v_rt: (v: string, val: Val) => ExprRt<Val>;
export declare let get_v_rt: (v: string) => ExprRt<Val>;
export declare let new_obj_rt: () => ExprRt<Val>;
export declare let new_arr_rt: (len: number) => ExprRt<Val>;
export declare let new_arr_expr_rt: (len: ExprRt<Val>) => ExprRt<Val>;
export declare let get_arr_len_rt: (a_ref: Val) => ExprRt<Val>;
export declare let get_arr_len_expr_rt: (a: ExprRt<Val>) => ExprRt<Val>;
export declare let get_arr_el_rt: (a_ref: Val, i: number) => ExprRt<Val>;
export declare let get_arr_el_expr_rt: (a: ExprRt<Val>, i: ExprRt<Val>) => ExprRt<Val>;
export declare let set_arr_el_rt: (a_ref: Val, i: number, v: Val) => ExprRt<Val>;
export declare let set_arr_el_expr_rt: (a: ExprRt<Val>, i: ExprRt<Val>, e: ExprRt<Val>) => ExprRt<Val>;
export declare let set_heap_v_rt: (v: string, val: Val) => ExprRt<Val>;
export declare let get_heap_v_rt: (v: string) => ExprRt<Val>;
export declare let set_class_def_rt: (v: string, int: Interface) => ExprRt<Val>;
export declare let get_class_def_rt: (v: string) => ExprRt<Interface>;
export declare let set_fun_def_rt: (v: string, l: Lambda) => ExprRt<Val>;
export declare let get_fun_def_rt: (v: string) => ExprRt<Lambda>;
