import * as Immutable from "immutable";
import { Unit, Fun, Prod, Sum } from "ts-bccc";
import { Coroutine } from "ts-bccc";
import { SourceRange } from "../source_range";
export declare let runtime_error: (e: string) => ExprRt<Sum<Val, Val>>;
export declare type Bool = boolean;
export interface Lambda {
    body: ExprRt<Sum<Val, Val>>;
    parameters: Array<ValueName>;
    closure: Scope;
    range: SourceRange;
}
export interface HeapRef {
    v: string;
    k: "ref";
}
export interface ArrayVal {
    elements: Immutable.Map<number, Val>;
    length: number;
}
export interface RenderSurface {
    operations: Immutable.List<RenderSurfaceOperation>;
    width: number;
    height: number;
}
export declare type RenderSurfaceOperation = {
    kind: "circle";
    x: number;
    y: number;
    radius: number;
    color: string;
} | {
    kind: "square";
    x: number;
    y: number;
    side: number;
    color: string;
    rotation: number;
} | {
    kind: "rectangle";
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    rotation: number;
} | {
    kind: "ellipse";
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    rotation: number;
} | {
    kind: "line";
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    width: number;
    color: string;
    rotation: number;
} | {
    kind: "polygon";
    points: Array<{
        x: number;
        y: number;
    }>;
    color: string;
    rotation: number;
} | {
    kind: "text";
    t: string;
    x: number;
    y: number;
    size: number;
    color: string;
    rotation: number;
} | {
    kind: "sprite";
    sprite: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
} | {
    kind: "other surface";
    s: RenderSurface;
    dx: number;
    dy: number;
    sx: number;
    sy: number;
    rotation: number;
};
export declare let init_array_val: (_: number) => ArrayVal;
export declare let init_array_with_args_val: (_: Val[]) => ArrayVal;
export declare type ValueName = string;
export declare type NestingLevel = number;
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
    v: Scope;
    k: "record";
} | {
    v: Lambda;
    k: "lambda";
} | {
    v: Array<Val>;
    k: "tuple";
} | HeapRef | {
    v: RenderSurface;
    k: "render surface";
} | {
    v: RenderSurfaceOperation;
    k: "render surface operation";
};
export interface Scope extends Immutable.Map<ValueName, Val> {
}
export interface Scopes extends Immutable.Map<NestingLevel, Immutable.Map<ValueName, Val>> {
}
export interface Interface {
    base: Sum<Interface, Unit>;
    static_methods: Immutable.Map<ValueName, StmtRt>;
    methods: Immutable.Map<ValueName, StmtRt>;
    static_fields: Immutable.Map<ValueName, Val>;
    is_internal: boolean;
    range: SourceRange;
}
export declare let empty_scope_val: Immutable.Map<string, Val>;
export declare let empty_scopes_val: Immutable.Map<number, Scope>;
export declare let mk_unit_val: Val;
export declare let mk_string_val: (_: string) => Val;
export declare let mk_int_val: (_: number) => Val;
export declare let mk_float_val: (_: number) => Val;
export declare let mk_arr_val: (_: ArrayVal) => Val;
export declare let mk_tuple_val: (_: Array<Val>) => Val;
export declare let mk_bool_val: (_: boolean) => Val;
export declare let mk_lambda_val: (_: Lambda) => Val;
export declare let mk_obj_val: (_: Scope) => Val;
export declare let mk_record_val: (_: Scope) => Val;
export declare let mk_ref_val: (_: ValueName) => Val;
export declare let mk_render_surface_val: (s: RenderSurface) => Val;
export declare let mk_circle_op: (x: number, y: number, radius: number, color: string) => RenderSurfaceOperation;
export declare let mk_square_op: (x: number, y: number, side: number, color: string, rotation: number) => RenderSurfaceOperation;
export declare let mk_ellipse_op: (x: number, y: number, width: number, height: number, color: string, rotation: number) => RenderSurfaceOperation;
export declare let mk_rectangle_op: (x: number, y: number, width: number, height: number, color: string, rotation: number) => RenderSurfaceOperation;
export declare let mk_line_op: (x1: number, y1: number, x2: number, y2: number, width: number, color: string, rotation: number) => RenderSurfaceOperation;
export declare let mk_polygon_op: (points: {
    x: number;
    y: number;
}[], color: string, rotation: number) => RenderSurfaceOperation;
export declare let mk_text_op: (t: string, x: number, y: number, size: number, color: string, rotation: number) => RenderSurfaceOperation;
export declare let mk_sprite_op: (sprite: string, x: number, y: number, width: number, height: number, rotation: number) => RenderSurfaceOperation;
export declare let mk_other_surface_op: (s: RenderSurface, dx: number, dy: number, sx: number, sy: number, rotation: number) => RenderSurfaceOperation;
export declare let mk_render_surface_operation_val: (s: RenderSurfaceOperation) => Val;
export declare let tuple_to_record: (v: Val, labels: string[]) => Val;
export declare type ErrVal = string;
export interface MemRt {
    highlighting: SourceRange;
    globals: Scopes;
    heap: Scope;
    functions: Immutable.Map<ValueName, Lambda>;
    classes: Immutable.Map<ValueName, Interface>;
    stack: Immutable.Map<number, Scopes>;
}
export declare let load_rt: Fun<Prod<string, MemRt>, Sum<Unit, Sum<Val, Val>>>;
export declare let store_rt: Fun<Prod<Prod<string, Val>, MemRt>, MemRt>;
export declare let decl_rt: Fun<Prod<Prod<string, Val>, MemRt>, MemRt>;
export declare let load_class_def_rt: Fun<Prod<ValueName, MemRt>, Sum<Unit, Interface>>;
export declare let store_class_def_rt: Fun<Prod<Prod<ValueName, Interface>, MemRt>, MemRt>;
export declare let load_fun_def_rt: Fun<Prod<ValueName, MemRt>, Sum<Unit, Lambda>>;
export declare let store_fun_def_rt: Fun<Prod<Prod<ValueName, Lambda>, MemRt>, MemRt>;
export declare let load_heap_rt: Fun<Prod<ValueName, MemRt>, Sum<Unit, Val>>;
export declare let store_heap_rt: Fun<Prod<Prod<ValueName, Val>, MemRt>, MemRt>;
export declare let heap_alloc_rt: Fun<Prod<Val, MemRt>, Prod<Val, MemRt>>;
export declare let push_inner_scope_rt: Fun<Scope, Fun<MemRt, MemRt>>;
export declare let pop_inner_scope_rt: Fun<Scope, Fun<MemRt, MemRt>>;
export declare let push_scope_rt: Fun<Scope, Fun<MemRt, MemRt>>;
export declare let pop_scope_rt: Fun<MemRt, Sum<Unit, MemRt>>;
export interface ExprRt<A> extends Coroutine<MemRt, ErrVal, A> {
}
export declare type StmtRt = ExprRt<Sum<Val, Val>>;
export declare let empty_memory_rt: MemRt;
export declare let set_highlighting_rt: (r: SourceRange) => ExprRt<Sum<Val, Val>>;
export declare let set_v_expr_rt: (v: string, e: ExprRt<Sum<Val, Val>>) => ExprRt<Sum<Val, Val>>;
export declare let set_v_rt: (v: string, vals: Sum<Val, Val>) => ExprRt<Sum<Val, Val>>;
export declare let decl_v_rt: (v: string, vals: Sum<Val, Val>) => ExprRt<Sum<Val, Val>>;
export declare let get_v_rt: (v: string) => ExprRt<Sum<Val, Val>>;
export declare let new_obj_rt: () => ExprRt<Sum<Val, Val>>;
export declare let new_arr_rt: (len: number) => ExprRt<Sum<Val, Val>>;
export declare let mk_expr_from_val: (v: Val) => ExprRt<Sum<Val, Val>>;
export declare let new_arr_with_args_rt: (args: Sum<Val, Val>[]) => ExprRt<Sum<Val, Val>>;
export declare let new_arr_expr_rt: (len: ExprRt<Sum<Val, Val>>) => ExprRt<Sum<Val, Val>>;
export declare let new_arr_expr_with_values_rt: (args: ExprRt<Sum<Val, Val>>[]) => ExprRt<Sum<Val, Val>>;
export declare let get_arr_len_rt: (a_ref: Val) => ExprRt<Sum<Val, Val>>;
export declare let get_arr_len_expr_rt: (a: ExprRt<Sum<Val, Val>>) => ExprRt<Sum<Val, Val>>;
export declare let get_arr_el_rt: (a_ref: Val, i: number) => ExprRt<Sum<Val, Val>>;
export declare let get_arr_el_expr_rt: (a: ExprRt<Sum<Val, Val>>, i: ExprRt<Sum<Val, Val>>) => ExprRt<Sum<Val, Val>>;
export declare let set_arr_el_rt: (a_ref: Val, i: number, v: Val) => ExprRt<Sum<Val, Val>>;
export declare let set_arr_el_expr_rt: (a: ExprRt<Sum<Val, Val>>, i: ExprRt<Sum<Val, Val>>, e: ExprRt<Sum<Val, Val>>) => ExprRt<Sum<Val, Val>>;
export declare let set_heap_v_rt: (v: string, val: Val) => ExprRt<Sum<Val, Val>>;
export declare let get_heap_v_rt: (v: string) => ExprRt<Sum<Val, Val>>;
export declare let set_class_def_rt: (v: string, int: Interface) => ExprRt<Sum<Val, Val>>;
export declare let get_class_def_rt: (v: string) => ExprRt<Interface>;
export declare let set_fun_def_rt: (v: string, l: Lambda) => ExprRt<Sum<Val, Val>>;
export declare let get_fun_def_rt: (v: string) => ExprRt<Lambda>;
