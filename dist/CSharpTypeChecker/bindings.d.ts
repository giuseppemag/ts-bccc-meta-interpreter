import * as Immutable from "immutable";
import { Unit, Fun, Prod, Sum } from "ts-bccc";
import { Coroutine } from "ts-bccc";
import { SourceRange } from "../source_range";
import * as Sem from "../Python/python";
export declare type Name = string;
export declare type Err = string;
export declare type Type = {
    kind: "render-grid-pixel";
} | {
    kind: "render-grid";
} | {
    kind: "unit";
} | {
    kind: "bool";
} | {
    kind: "int";
} | {
    kind: "float";
} | {
    kind: "string";
} | {
    kind: "fun";
    in: Type;
    out: Type;
} | {
    kind: "obj";
    methods: Immutable.Map<Name, Typing>;
    fields: Immutable.Map<Name, Type>;
} | {
    kind: "ref";
    C_name: string;
} | {
    kind: "arr";
    arg: Type;
} | {
    kind: "tuple";
    args: Array<Type>;
};
export declare let render_grid_type: Type;
export declare let render_grid_pixel_type: Type;
export declare let unit_type: Type;
export declare let int_type: Type;
export declare let string_type: Type;
export declare let bool_type: Type;
export declare let float_type: Type;
export declare let fun_type: (i: Type, o: Type) => Type;
export declare let arr_type: (el: Type) => Type;
export declare let tuple_type: (args: Array<Type>) => Type;
export declare let ref_type: (C_name: string) => Type;
export declare type TypeInformation = Type & {
    is_constant: boolean;
};
export interface Bindings extends Immutable.Map<Name, TypeInformation> {
}
export interface State {
    highlighting: SourceRange;
    bindings: Bindings;
}
export interface Typing {
    type: TypeInformation;
    sem: Sem.ExprRt<Sum<Sem.Val, Sem.Val>>;
}
export declare let empty_state: State;
export declare let load: Fun<Prod<string, State>, Sum<Unit, TypeInformation>>;
export declare let store: Fun<Prod<Prod<string, TypeInformation>, State>, State>;
export interface Stmt extends Coroutine<State, Err, Typing> {
}
export declare let get_v: (v: string) => Stmt;
export declare let decl_v: (v: string, t: Type, is_constant?: boolean | undefined) => Stmt;
export declare let decl_const: (c: string, t: Type, e: Stmt) => Stmt;
export declare let set_v: (v: string, e: Stmt) => Stmt;
export declare let bool: (b: boolean) => Stmt;
export declare let str: (s: string) => Stmt;
export declare let int: (i: number) => Stmt;
export declare let gt: (a: Stmt, b: Stmt) => Stmt;
export declare let lt: (a: Stmt, b: Stmt) => Stmt;
export declare let geq: (a: Stmt, b: Stmt) => Stmt;
export declare let leq: (a: Stmt, b: Stmt) => Stmt;
export declare let eq: (a: Stmt, b: Stmt) => Stmt;
export declare let neq: (a: Stmt, b: Stmt) => Stmt;
export declare let xor: (a: Stmt, b: Stmt) => Stmt;
export declare let mk_empty_render_grid: (w: Stmt, h: Stmt) => Stmt;
export declare let mk_render_grid_pixel: (w: Stmt, h: Stmt, st: Stmt) => Stmt;
export declare let plus: (a: Stmt, b: Stmt) => Stmt;
export declare let minus: (a: Stmt, b: Stmt) => Stmt;
export declare let div: (a: Stmt, b: Stmt) => Stmt;
export declare let times: (a: Stmt, b: Stmt, sr: SourceRange) => Stmt;
export declare let mod: (a: Stmt, b: Stmt) => Stmt;
export declare let minus_unary: (a: Stmt) => Stmt;
export declare let or: (a: Stmt, b: Stmt) => Stmt;
export declare let and: (a: Stmt, b: Stmt) => Stmt;
export declare let not: (a: Stmt) => Stmt;
export declare let length: (a: Stmt) => Stmt;
export declare let get_index: (a: Stmt, i: Stmt) => Stmt;
export declare let set_index: (a: Stmt, i: Stmt, e: Stmt) => Stmt;
export declare let breakpoint: (r: SourceRange) => (_: Stmt) => Stmt;
export declare let typechecker_breakpoint: (range: SourceRange) => (_: Stmt) => Stmt;
export declare let highlight: Fun<Prod<SourceRange, State>, State>;
export declare let set_highlighting: (r: SourceRange) => Stmt;
export declare let done: Stmt;
export declare let lub: (t1: TypeInformation, t2: TypeInformation) => Sum<TypeInformation, Unit>;
export declare let if_then_else: (c: Stmt, t: Stmt, e: Stmt) => Stmt;
export declare let while_do: (c: Stmt, b: Stmt) => Stmt;
export declare let semicolon: (p: Stmt, q: Stmt) => Stmt;
export interface Parameter {
    name: Name;
    type: Type;
}
export interface LambdaDefinition {
    return_t: Type;
    parameters: Array<Parameter>;
    body: Stmt;
}
export interface FunDefinition extends LambdaDefinition {
    name: string;
    range: SourceRange;
}
export declare let mk_param: (name: string, type: Type) => {
    name: string;
    type: Type;
};
export declare let mk_lambda: (def: LambdaDefinition, closure_parameters: string[], range: SourceRange) => Stmt;
export declare let def_fun: (def: FunDefinition, closure_parameters: string[]) => Stmt;
export declare let def_method: (C_name: string, def: FunDefinition) => Stmt;
export declare let call_lambda: (lambda: Stmt, arg_values: Stmt[]) => Stmt;
export declare let call_by_name: (f_n: string, args: Stmt[]) => Stmt;
export declare let ret: (p: Stmt) => Stmt;
export declare let new_array: (type: Type, len: Stmt) => Coroutine<State, string, Typing>;
export declare let get_arr_len: (a: Stmt) => Coroutine<State, string, Typing>;
export declare let get_arr_el: (a: Stmt, i: Stmt) => Coroutine<State, string, Typing>;
export declare let set_arr_el: (a: Stmt, i: Stmt, e: Stmt) => Coroutine<State, string, Typing>;
export declare let def_class: (C_name: string, methods: FunDefinition[], fields: Parameter[]) => Stmt;
export declare let field_get: (this_ref: Stmt, F_name: string) => Stmt;
export declare let field_set: (this_ref: Stmt, F_name: string, new_value: Stmt) => Stmt;
export declare let call_cons: (C_name: string, arg_values: Stmt[]) => Stmt;
export declare let call_method: (this_ref: Stmt, M_name: string, arg_values: Stmt[]) => Stmt;
