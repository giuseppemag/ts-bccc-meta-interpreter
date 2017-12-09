import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair } from "ts-bccc"
import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
import * as Co from "ts-bccc"
import { Stmt, Mem, Err, Expr, set_highlighting, Bool, Val, runtime_error, unt } from "./memory"
import { bool_to_boolcat } from "./expressions"
import { SourceRange } from "../source_range";

export let done: Stmt = co_unit<Mem, Err, Val>(unt)
export let dbg = (range:SourceRange) => function<A> (v:A) : Expr<A> { return set_highlighting(range).then(_ => Co.suspend<Mem,Err>().then(_ => co_unit<Mem,Err,A>(v))) }
export let if_then_else = function(c:Expr<Val>, f:Stmt, g:Stmt) : Stmt {
  return c.then(c_val => c_val.k != "b" ? runtime_error(`Error: conditional expression ${c_val} is not a boolean.`)
                         : c_val.v ? f : g)
}

export let while_do = function (p: Expr<Val>, k: Stmt): Stmt {
  return if_then_else(p, k.then(_ => while_do(p, k)), done)
}
