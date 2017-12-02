import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair } from "ts-bccc"
import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
import * as Co from "ts-bccc"
import { Stmt, Mem, Err, Expr, SourceRange, set_highlighting, Bool } from "./memory"
import { bool_to_boolcat } from "./expressions"

export let done: Stmt = apply(fun<Unit, Coroutine<Mem, Err, Unit>>(co_unit), {})
export let dbg = (range:SourceRange) => function<A> (v:A) : Expr<A> { return set_highlighting(range).then(_ => Co.suspend<Mem,Err>().then(_ => co_unit<Mem,Err,A>(v))) }
export let if_then_else = function<c>(f:Fun<Unit,Expr<c>>, g:Fun<Unit,Expr<c>>) : Fun<Bool, Expr<c>> {
  return bool_to_boolcat.times(unit()).then(apply_pair()).then(g.plus(f))
}

export let while_do = function (p: Expr<Bool>, k: Stmt): Stmt {
  let h:Fun<Bool, Expr<Unit>> = if_then_else(fun(_ => k.then(_ => while_do(p, k))), fun(_ => done))
  return p.then(defun(h))
}
