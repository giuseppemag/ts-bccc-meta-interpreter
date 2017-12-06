import * as Immutable from "immutable";
import { Coroutine } from "ts-bccc";
import { SourceRange } from "../source_range";
import * as Sem from "../Python/memory";
export interface Name extends String {
}
export interface Err extends String {
}
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
};
export declare let unit_type: Type;
export interface Bindings extends Immutable.Map<Name, Type> {
}
export interface State extends Bindings {
    highlighting: SourceRange;
}
export interface Typing {
    type: Type;
    sem: Sem.Expr<Sem.Val>;
}
export interface Stmt extends Coroutine<Bindings, Err, Typing> {
}
export declare let if_then_else: (c: Stmt, t: Stmt, e: Stmt) => Stmt;
export declare let while_do: (c: Stmt, b: Stmt) => Stmt;
