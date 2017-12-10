import * as Immutable from "immutable";
import { Unit, Fun, Prod, Sum } from "ts-bccc";
import { Coroutine } from "ts-bccc";
import { SourceRange } from "../source_range";
export declare let runtime_error: (e: string) => Expr<Val>;
export declare type Bool = boolean;
export interface Lambda extends Prod<Expr<Val>, Array<Name>> {
}
export interface HeapRef {
    v: string;
    k: "ref";
}
export interface ArrayVal {
    elements: Immutable.Map<number, Val>;
    length: number;
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
} | HeapRef;
export interface Scope extends Immutable.Map<Name, Val> {
}
export interface Interface {
    base: Sum<Interface, Unit>;
    methods: Immutable.Map<Name, Lambda>;
}
export declare let empty_scope: Immutable.Map<string, Val>;
export declare let unt: Val;
export declare let str: (_: string) => Val;
export declare let int: (_: number) => Val;
export declare let float: (_: number) => Val;
export declare let arr: (_: ArrayVal) => Val;
export declare let bool: (_: boolean) => Val;
export declare let lambda: (_: Prod<Expr<Val>, Array<Name>>) => Val;
export declare let obj: (_: Scope) => Val;
export declare let ref: (_: Name) => Val;
export declare type Err = string;
export interface Mem {
    highlighting: SourceRange;
    globals: Scope;
    heap: Scope;
    functions: Immutable.Map<Name, Lambda>;
    classes: Immutable.Map<Name, Interface>;
    stack: Immutable.Map<number, Scope>;
}
export declare let highlight: Fun<Prod<SourceRange, Mem>, Mem>;
export declare let load: Fun<Prod<string, Mem>, Sum<Unit, Val>>;
export declare let store: Fun<Prod<Prod<string, Val>, Mem>, Mem>;
export declare let load_class_def: Fun<Prod<Name, Mem>, Sum<Unit, Interface>>;
export declare let store_class_def: Fun<Prod<Prod<Name, Interface>, Mem>, Mem>;
export declare let load_fun_def: Fun<Prod<Name, Mem>, Sum<Unit, Lambda>>;
export declare let store_fun_def: Fun<Prod<Prod<Name, Lambda>, Mem>, Mem>;
export declare let load_heap: Fun<Prod<Name, Mem>, Sum<Unit, Val>>;
export declare let store_heap: Fun<Prod<Prod<Name, Val>, Mem>, Mem>;
export declare let heap_alloc: Fun<Prod<Val, Mem>, Prod<Val, Mem>>;
export declare let push_scope: Fun<Mem, Mem>;
export declare let pop_scope: Fun<Mem, Sum<Unit, Mem>>;
export interface Expr<A> extends Coroutine<Mem, Err, A> {
}
export declare type Stmt = Expr<Val>;
export declare let empty_memory: Mem;
export declare let set_highlighting: (r: SourceRange) => Expr<Val>;
export declare let set_v_expr: (v: string, e: Expr<Val>) => Expr<Val>;
export declare let set_v: (v: string, val: Val) => Expr<Val>;
export declare let get_v: (v: string) => Expr<Val>;
export declare let new_obj: () => Expr<Val>;
export declare let new_arr: (len: number) => Expr<Val>;
export declare let get_arr_len: (a_ref: Val) => Expr<Val>;
export declare let get_arr_len_expr: (a: Expr<Val>) => Expr<Val>;
export declare let get_arr_el: (a_ref: Val, i: number) => Expr<Val>;
export declare let get_arr_el_expr: (a: Expr<Val>, i: Expr<Val>) => Expr<Val>;
export declare let set_arr_el: (a_ref: Val, i: number, v: Val) => Expr<Val>;
export declare let set_arr_el_expr: (a: Expr<Val>, i: Expr<Val>, e: Expr<Val>) => Expr<Val>;
export declare let set_heap_v: (v: string, val: Val) => Expr<Val>;
export declare let get_heap_v: (v: string) => Expr<Val>;
export declare let set_class_def: (v: string, int: Interface) => Expr<Val>;
export declare let get_class_def: (v: string) => Expr<Interface>;
export declare let set_fun_def: (v: string, l: Lambda) => Expr<Val>;
export declare let get_fun_def: (v: string) => Expr<Lambda>;
