import * as Immutable from "immutable";
import { Unit, Fun, Prod, Sum, Option } from "ts-bccc";
import { Coroutine } from "ts-bccc";
import { SourceRange } from "../source_range";
import * as Sem from "../Python/python";
import { Stmt } from "./csharp";
import { MultiMap } from "../multi_map";
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
    is_used_as_base: boolean;
    modifiers: Immutable.Set<Modifier>;
    initial_value: Option<Stmt>;
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
export declare type ObjType = {
    kind: "obj";
    C_name: string;
    is_internal: boolean;
    methods: MultiMap<Name, MethodTyping>;
    class_kind: "normal" | "abstract" | "interface";
    fields: Immutable.Map<Name, FieldType>;
    range: SourceRange;
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
    range: SourceRange;
} | ObjType | {
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
export declare let type_to_string: (t: Type) => string;
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
export declare let fun_type: (i: Type, o: Type, range: SourceRange) => Type;
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
export declare let mk_typing: (t: Type, s: Sem.ExprRt<Sum<Sem.Val, Sem.Val>>, is_constant?: boolean | undefined) => Typing;
export declare let mk_typing_cat: Fun<Prod<Type, Sem.ExprRt<Sum<Sem.Val, Sem.Val>>>, Typing>;
export declare let mk_typing_cat_full: Fun<Prod<TypeInformation, Sem.ExprRt<Sum<Sem.Val, Sem.Val>>>, Typing>;
export declare let empty_state: State;
export declare let load: Fun<Prod<string, State>, Sum<Unit, TypeInformation>>;
export declare let store: Fun<Prod<Prod<string, TypeInformation>, State>, State>;
export declare let type_equals: (t1: Type, t2: Type) => boolean;
export declare type Modifier = "private" | "public" | "static" | "protected" | "virtual" | "override" | "operator" | "casting" | "abstract" | "interface";
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
    params_base_call: Option<Stmt[]>;
}
export interface FieldDefinition extends Parameter {
    modifiers: Array<Modifier>;
    initial_value: Option<Stmt>;
    is_used_as_base: boolean;
}
export declare type CallingContext = {
    kind: "global scope";
} | {
    kind: "class";
    C_name: string;
};
export declare type TypeConstraints = Option<Type>;
export declare let no_constraints: TypeConstraints;
export declare type Stmt = (constraints: TypeConstraints) => Coroutine<State, Err, Typing>;
