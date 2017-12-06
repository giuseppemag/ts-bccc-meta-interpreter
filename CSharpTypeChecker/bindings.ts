import * as Immutable from "immutable"
import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair } from "ts-bccc"
import * as CCC from "ts-bccc"
import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
import * as Co from "ts-bccc"
import { SourceRange, mk_range } from "../source_range"
import * as Sem from "../Python/memory"
import * as SemExpr from "../Python/expressions"
import * as SemStmts from "../Python/basic_statements"

export interface Name extends String {}
export interface Err extends String {}
export type Type = { kind:"unit"} | { kind:"bool"} | { kind:"int"} | { kind:"float"} | { kind:"string"} | { kind:"fun", in:Type, out:Type } | { kind:"obj", inner:Bindings }
export let unit_type : Type = { kind:"unit" }
export interface Bindings extends Immutable.Map<Name, Type>  {}
export interface State extends Bindings { highlighting:SourceRange }
export interface Typing { type:Type, sem:Sem.Expr<Sem.Val> }
let mk_typing = (t:Type,s:Sem.Expr<Sem.Val>) : Typing => ({ type:t, sem:s })

let type_equals = (t1:Type,t2:Type) : boolean =>
  (t1.kind == "fun" && t2.kind == "fun" && type_equals(t1.in,t2.in) && type_equals(t1.out,t2.out))
  || (t1.kind == "obj" && t2.kind == "obj" &&
      !t1.inner.some((v1,k1) => v1 == undefined || k1 == undefined || !t2.inner.has(k1) || !type_equals(t2.inner.get(k1), v1)) &&
      !t2.inner.some((v2,k2) => v2 == undefined || k2 == undefined || !t1.inner.has(k2)))
  || t1.kind == t2.kind

export interface Stmt extends Coroutine<Bindings, Err, Typing> {}

export let if_then_else = function(c:Stmt, t:Stmt, e:Stmt) : Stmt {
  return c.then(c_t =>
         c_t.type.kind != "bool" ? co_error<Bindings,Err,Typing>("Error: condition has the wrong type!") :
         t.then(t_t =>
         e.then(e_t =>
         type_equals(t_t.type, unit_type) && type_equals(e_t.type, unit_type) ? co_error<Bindings,Err,Typing>("Error: the branches of a conditional should be of type unit!") :
         co_unit(mk_typing(t_t.type,
            SemStmts.if_then_else(c_t.sem, t_t.sem.ignore(), e_t.sem.ignore()).ignore_with(Sem.unt))
         ))))
}

export let while_do = function(c:Stmt, b:Stmt) : Stmt {
  return c.then(c_t =>
         c_t.type.kind != "bool" ? co_error<Bindings,Err,Typing>("Error: condition has the wrong type!") :
         b.then(t_t =>
         type_equals(t_t.type, unit_type) ? co_error<Bindings,Err,Typing>("Error: the body of a loop should be of type unit!") :
         co_unit(mk_typing(t_t.type,
            SemStmts.while_do(c_t.sem, t_t.sem.ignore()).ignore_with(Sem.unt))
         )))
}
