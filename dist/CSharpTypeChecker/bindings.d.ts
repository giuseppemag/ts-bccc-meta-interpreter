import * as Immutable from "immutable";
import { Unit, Fun, Prod, Sum } from "ts-bccc";
import { Coroutine } from "ts-bccc";
import { SourceRange } from "../source_range";
import * as Sem from "../Python/memory";
export declare type Name = string;
export declare type Err = string;
export declare type Type = {
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
    inner: Bindings;
} | {
    kind: "arr";
    arg: Type;
};
export declare let unit_type: Type;
export declare let int_type: Type;
export declare let string_type: Type;
export declare let bool_type: Type;
export declare let float_type: Type;
export interface Bindings extends Immutable.Map<Name, Type> {
}
export interface State extends Bindings {
    highlighting: SourceRange;
}
export interface Typing {
    type: Type;
    sem: Sem.Expr<Sem.Val>;
}
export declare let mk_typing_cat: Fun<Prod<Type, Sem.Expr<Sem.Val>>, Typing>;
export declare let load: Fun<Prod<string, State>, Sum<Unit, Type>>;
export declare let store: Fun<Prod<Prod<string, Type>, Bindings>, Bindings>;
export interface Stmt extends Coroutine<State, Err, Typing> {
}
export declare let get_v: (v: string) => Stmt;
export declare let set_v: (v: string, e: Stmt) => Stmt;
export declare let plus: (a: Stmt, b: Stmt) => Stmt;
export declare let minus: (a: Stmt, b: Stmt) => Stmt;
export declare let div: (a: Stmt, b: Stmt) => Stmt;
export declare let times: (a: Stmt, b: Stmt) => Stmt;
export declare let mod: (a: Stmt, b: Stmt) => Stmt;
export declare let minus_unary: (a: Stmt) => Stmt;
export declare let or: (a: Stmt, b: Stmt) => Stmt;
export declare let and: (a: Stmt, b: Stmt) => Stmt;
export declare let not: (a: Stmt) => Stmt;
export declare let length: (a: Stmt) => Stmt;
export declare let get_index: (a: Stmt, i: Stmt) => Stmt;
export declare let set_index: (a: Stmt, i: Stmt, e: Stmt) => Stmt;
export declare let if_then_else: (c: Stmt, t: Stmt, e: Stmt) => Stmt;
export declare let while_do: (c: Stmt, b: Stmt) => Stmt;
export declare let semicolon: (p: Stmt, q: Stmt) => Stmt;
