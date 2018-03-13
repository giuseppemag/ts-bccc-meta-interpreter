import * as Immutable from "immutable";
import { Unit, Fun, Prod, Sum, Option } from "ts-bccc";
import { Coroutine } from "ts-bccc";
import { SourceRange } from "../source_range";
import * as Sem from "../Python/python";
import { ExprRt, Val } from "../main";
export declare type Name = string;
export interface Err {
    message: string;
    range: SourceRange;
}
export interface MethodTyping {
    typing: Typing;
    modifiers: Immutable.Set<Modifier>;
}
export interface FieldType {
    type: Type;
    modifiers: Immutable.Set<Modifier>;
}
export declare type RenderOperationType = {
    kind: "circle";
} | {
    kind: "square";
} | {
    kind: "rectangle";
} | {
    kind: "ellipse";
} | {
    kind: "line";
} | {
    kind: "polygon";
} | {
    kind: "text";
} | {
    kind: "other surface";
} | {
    kind: "sprite";
};
export declare type Type = {
    kind: "render-grid-pixel";
} | {
    kind: "render-grid";
} | {
    kind: "render surface";
} | RenderOperationType | {
    kind: "unit";
} | {
    kind: "bool";
} | {
    kind: "var";
} | {
    kind: "int";
} | {
    kind: "double";
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
    C_name: string;
    methods: Immutable.Map<Name, MethodTyping>;
    fields: Immutable.Map<Name, FieldType>;
} | {
    kind: "ref";
    C_name: string;
} | {
    kind: "arr";
    arg: Type;
} | {
    kind: "tuple";
    args: Array<Type>;
} | {
    kind: "record";
    args: Immutable.Map<Name, Type>;
} | {
    kind: "generic type decl";
    f: Type;
    args: Array<Type>;
};
export declare let render_grid_type: Type;
export declare let render_grid_pixel_type: Type;
export declare let render_surface_type: Type;
export declare let circle_type: Type;
export declare let square_type: Type;
export declare let ellipse_type: Type;
export declare let rectangle_type: Type;
export declare let line_type: Type;
export declare let polygon_type: Type;
export declare let text_type: Type;
export declare let sprite_type: Type;
export declare let other_render_surface_type: Type;
export declare let unit_type: Type;
export declare let int_type: Type;
export declare let var_type: Type;
export declare let string_type: Type;
export declare let bool_type: Type;
export declare let float_type: Type;
export declare let double_type: Type;
export declare let fun_type: (i: Type, o: Type) => Type;
export declare let arr_type: (el: Type) => Type;
export declare let tuple_type: (args: Array<Type>) => Type;
export declare let record_type: (args: Immutable.Map<Name, Type>) => Type;
export declare let ref_type: (C_name: string) => Type;
export declare let generic_type_decl: (f: Type, args: Type[]) => Type;
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
export declare let mk_typing: (t: Type, s: ExprRt<Sum<Val, Val>>, is_constant?: boolean | undefined) => Typing;
export declare let empty_state: State;
export declare let load: Fun<Prod<string, State>, Sum<Unit, TypeInformation>>;
export declare let store: Fun<Prod<Prod<string, TypeInformation>, State>, State>;
export declare type TypeConstraints = Option<Type>;
export declare let no_constraints: TypeConstraints;
export declare type Stmt = (constraints: TypeConstraints) => Coroutine<State, Err, Typing>;
export declare let get_v: (r: SourceRange, v: string) => Stmt;
export declare let decl_v: (r: SourceRange, v: string, t: Type, is_constant?: boolean | undefined) => Stmt;
export declare let decl_and_init_v: (r: SourceRange, v: string, t: Type, e: Stmt, is_constant?: boolean | undefined) => Stmt;
export declare let decl_const: (r: SourceRange, c: string, t: Type, e: Stmt) => Stmt;
export declare let set_v: (r: SourceRange, v: string, e: Stmt) => Stmt;
export declare let bool: (b: boolean) => Stmt;
export declare let str: (s: string) => Stmt;
export declare let int: (i: number) => Stmt;
export declare let float: (i: number) => Stmt;
export declare let double: (i: number) => Stmt;
export declare let tuple_value: (r: SourceRange, args: Stmt[]) => Stmt;
export declare let gt: (r: SourceRange, a: Stmt, b: Stmt) => Stmt;
export declare let lt: (r: SourceRange, a: Stmt, b: Stmt) => Stmt;
export declare let geq: (r: SourceRange, a: Stmt, b: Stmt) => Stmt;
export declare let leq: (r: SourceRange, a: Stmt, b: Stmt) => Stmt;
export declare let eq: (r: SourceRange, a: Stmt, b: Stmt) => Stmt;
export declare let neq: (r: SourceRange, a: Stmt, b: Stmt) => Stmt;
export declare let xor: (r: SourceRange, a: Stmt, b: Stmt) => Stmt;
export declare let mk_empty_surface: (r: SourceRange, w: Stmt, h: Stmt, col: Stmt) => Stmt;
export declare let mk_circle: (r: SourceRange, x: Stmt, y: Stmt, radius: Stmt, col: Stmt) => Stmt;
export declare let mk_square: (r: SourceRange, x: Stmt, y: Stmt, radius: Stmt, col: Stmt, rot: Stmt) => Stmt;
export declare let mk_ellipse: (r: SourceRange, x: Stmt, y: Stmt, w: Stmt, h: Stmt, col: Stmt, rot: Stmt) => Stmt;
export declare let mk_rectangle: (r: SourceRange, x: Stmt, y: Stmt, w: Stmt, h: Stmt, col: Stmt, rot: Stmt) => Stmt;
export declare let mk_line: (r: SourceRange, x1: Stmt, y1: Stmt, x2: Stmt, y2: Stmt, w: Stmt, col: Stmt, rot: Stmt) => Stmt;
export declare let mk_polygon: (r: SourceRange, points: Stmt, col: Stmt, rot: Stmt) => Stmt;
export declare let mk_text: (r: SourceRange, t: Stmt, x: Stmt, y: Stmt, s: Stmt, col: Stmt, rot: Stmt) => Stmt;
export declare let mk_sprite: (r: SourceRange, sprite: Stmt, x: Stmt, y: Stmt, w: Stmt, h: Stmt, rot: Stmt) => Stmt;
export declare let mk_other_surface: (r: SourceRange, s: Stmt, dx: Stmt, dy: Stmt, sx: Stmt, sy: Stmt, rot: Stmt) => Stmt;
export declare let plus: (r: SourceRange, a: Stmt, b: Stmt) => Stmt;
export declare let minus: (r: SourceRange, a: Stmt, b: Stmt) => Stmt;
export declare let div: (r: SourceRange, a: Stmt, b: Stmt) => Stmt;
export declare let times: (r: SourceRange, a: Stmt, b: Stmt, sr: SourceRange) => Stmt;
export declare let mod: (r: SourceRange, a: Stmt, b: Stmt) => Stmt;
export declare let minus_unary: (r: SourceRange, a: Stmt) => Stmt;
export declare let or: (r: SourceRange, a: Stmt, b: Stmt) => Stmt;
export declare let and: (r: SourceRange, a: Stmt, b: Stmt) => Stmt;
export declare let arrow: (r: SourceRange, parameters: Parameter[], closure: string[], body: Stmt) => Stmt;
export declare let not: (r: SourceRange, a: Stmt) => Stmt;
export declare let length: (r: SourceRange, a: Stmt) => Stmt;
export declare let get_index: (r: SourceRange, a: Stmt, i: Stmt) => Stmt;
export declare let set_index: (r: SourceRange, a: Stmt, i: Stmt, e: Stmt) => Stmt;
export declare let breakpoint: (r: SourceRange) => (_: Stmt) => Stmt;
export declare let typechecker_breakpoint: (range: SourceRange) => (_: Stmt) => Stmt;
export declare let highlight: Fun<Prod<SourceRange, State>, State>;
export declare let set_highlighting: (r: SourceRange) => Stmt;
export declare let done: Stmt;
export declare let lub: (t1: TypeInformation, t2: TypeInformation) => Sum<TypeInformation, Unit>;
export declare let if_then_else: (r: SourceRange, c: Stmt, t: Stmt, e: Stmt) => Stmt;
export declare let while_do: (r: SourceRange, c: Stmt, b: Stmt) => Stmt;
export declare let for_loop: (r: SourceRange, i: Stmt, c: Stmt, s: Stmt, b: Stmt) => Stmt;
export declare let semicolon: (r: SourceRange, p: Stmt, q: Stmt) => Stmt;
export declare type Modifier = "private" | "public" | "static" | "protected" | "virtual" | "override" | "operator";
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
export interface MethodDefinition extends FunDefinition {
    modifiers: Array<Modifier>;
    is_constructor: boolean;
}
export interface FieldDefinition extends Parameter {
    modifiers: Array<Modifier>;
}
export declare type CallingContext = {
    kind: "global scope";
} | {
    kind: "class";
    C_name: string;
};
export declare let mk_param: (name: string, type: Type) => {
    name: string;
    type: Type;
};
export declare let mk_lambda: (r: SourceRange, def: LambdaDefinition, closure_parameters: string[], range: SourceRange) => Stmt;
export declare let def_fun: (r: SourceRange, def: FunDefinition, closure_parameters: string[]) => Stmt;
export declare let def_method: (r: SourceRange, C_name: string, def: MethodDefinition) => Stmt;
export declare let call_lambda: (r: SourceRange, lambda: Stmt, arg_values: Stmt[]) => Stmt;
export declare let call_by_name: (r: SourceRange, f_n: string, args: Stmt[]) => Stmt;
export declare let ret: (r: SourceRange, p: Stmt) => Stmt;
export declare let new_array: (r: SourceRange, type: Type, len: Stmt) => Stmt;
export declare let get_arr_len: (r: SourceRange, a: Stmt) => Stmt;
export declare let get_arr_el: (r: SourceRange, a: Stmt, i: Stmt) => Stmt;
export declare let set_arr_el: (r: SourceRange, a: Stmt, i: Stmt, e: Stmt) => Stmt;
export declare let def_class: (r: SourceRange, C_name: string, methods_from_context: ((_: CallingContext) => MethodDefinition)[], fields_from_context: ((_: CallingContext) => FieldDefinition)[]) => Stmt;
export declare let field_get: (r: SourceRange, context: CallingContext, this_ref: Stmt, F_or_M_name: string) => Stmt;
export declare let field_set: (r: SourceRange, context: CallingContext, this_ref: Stmt, F_name: {
    att_name: string;
    kind: "att";
} | {
    att_name: string;
    kind: "att_arr";
    index: Stmt;
}, new_value: Stmt) => Stmt;
export declare let call_cons: (r: SourceRange, context: CallingContext, C_name: string, arg_values: Stmt[]) => Stmt;
