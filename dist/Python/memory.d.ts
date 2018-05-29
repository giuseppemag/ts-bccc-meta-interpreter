import * as Immutable from "immutable";
import { Unit, Sum } from "ts-bccc";
import { SourceRange } from "../source_range";
import { FileSystem } from "./filesystem";
import { Coroutine } from "../fast_coroutine";
export declare let runtime_error: (r: SourceRange, e: string) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
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
    generic_methods: Immutable.Map<ValueName, StmtRt>;
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
export interface ErrVal {
    message: string;
    range: SourceRange;
}
export interface MemRt {
    highlighting: SourceRange;
    globals: Scopes;
    heap: Scope;
    functions: Immutable.Map<ValueName, Lambda>;
    classes: Immutable.Map<ValueName, Interface>;
    stack: Immutable.Map<number, Scopes>;
    steps_counter: number;
    custom_alert: (s: string) => boolean;
    fs: FileSystem;
}
export declare let load_rt: (v_name: string) => (x: MemRt) => Sum<Unit, Sum<Val, Val>>;
export declare let store_rt: (v_name: string, val: Val) => (m: MemRt) => MemRt;
export declare let decl_rt: (v_name: string, val: Val) => (m: MemRt) => MemRt;
export declare let load_class_def_rt: (v_name: string) => (x: MemRt) => Sum<Unit, Interface>;
export declare let store_class_def_rt: (v_name: string, i: Interface) => (x: MemRt) => MemRt;
export declare let load_fun_def_rt: (v_name: string) => (x: MemRt) => Sum<Unit, Lambda>;
export declare let store_fun_def_rt: (v_name: string, l: Lambda) => (x: MemRt) => MemRt;
export declare let load_heap_rt: (v_name: string) => (x: MemRt) => Sum<Unit, Val>;
export declare let store_heap_rt: (v_name: string, val: Val) => (x: MemRt) => MemRt;
export declare let heap_alloc_rt: (val: Val) => (x: MemRt) => [Sum<Val, Val>, MemRt];
export declare let push_inner_scope_rt: (s: Scope) => Coroutine<MemRt, ErrVal, Unit>;
export declare let pop_inner_scope_rt: () => Coroutine<MemRt, ErrVal, Unit>;
export declare let push_scope_rt: (s: Scope) => Coroutine<MemRt, ErrVal, Unit>;
export declare let pop_scope_rt: (x: MemRt) => Sum<Unit, MemRt>;
export declare type ExprRt<A> = Coroutine<MemRt, ErrVal, A>;
export declare type StmtRt = ExprRt<Sum<Val, Val>>;
export declare let empty_memory_rt: (c_a: (_: string) => boolean) => MemRt;
export declare let set_highlighting_rt: (r: SourceRange) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let set_v_expr_rt: (v: string, e: Coroutine<MemRt, ErrVal, Sum<Val, Val>>) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let set_v_rt: (v: string, vals: Sum<Val, Val>) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let decl_v_rt: (v: string, vals: Sum<Val, Val>) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let get_v_rt: (r: SourceRange, v: string) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let new_obj_rt: () => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let new_arr_rt: (len: number) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let mk_expr_from_val: (v: Val) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let new_arr_with_args_rt: (args: Sum<Val, Val>[]) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let new_arr_expr_rt: (r: SourceRange, len: Coroutine<MemRt, ErrVal, Sum<Val, Val>>) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let new_arr_expr_with_values_rt: (args: Coroutine<MemRt, ErrVal, Sum<Val, Val>>[]) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let get_arr_len_rt: (r: SourceRange, a_ref: Val) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let get_arr_len_expr_rt: (r: SourceRange, a: Coroutine<MemRt, ErrVal, Sum<Val, Val>>) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let get_arr_el_rt: (r: SourceRange, a_ref: Val, i: number) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let get_arr_el_expr_rt: (r: SourceRange, a: Coroutine<MemRt, ErrVal, Sum<Val, Val>>, i: Coroutine<MemRt, ErrVal, Sum<Val, Val>>) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let set_arr_el_rt: (r: SourceRange, a_ref: Val, i: number, v: Val) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let set_arr_el_expr_rt: (r: SourceRange, a: Coroutine<MemRt, ErrVal, Sum<Val, Val>>, i: Coroutine<MemRt, ErrVal, Sum<Val, Val>>, e: Coroutine<MemRt, ErrVal, Sum<Val, Val>>) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let set_heap_v_rt: (v: string, val: Val) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let get_heap_v_rt: (r: SourceRange, v: string) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let set_class_def_rt: (v: string, int: Interface) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let add_method_def_rt: (class_name: string, method_name: string, method_body: Coroutine<MemRt, ErrVal, Sum<Val, Val>>) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let get_class_def_rt: (r: SourceRange, v: string) => Coroutine<MemRt, ErrVal, Interface>;
export declare let set_fun_def_rt: (v: string, l: Lambda) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let get_fun_def_rt: (r: SourceRange, v: string) => Coroutine<MemRt, ErrVal, Lambda>;
