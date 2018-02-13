import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair } from "ts-bccc"
import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
import * as Co from "ts-bccc"
import { StmtRt, MemRt, ErrVal, ExprRt, set_highlighting_rt, Bool, Val, runtime_error, mk_unit_val, push_inner_scope_rt, empty_scope_val, pop_inner_scope_rt } from "./memory"
import { bool_to_boolcat } from "./expressions"
import { SourceRange } from "../source_range";

export let done_rt: StmtRt = co_unit<MemRt, ErrVal, Sum<Val,Val>>(apply(inl(), mk_unit_val))
export let dbg_rt = (range:SourceRange) => function<A> (v:A) : ExprRt<A> { return set_highlighting_rt(range).then(_ => Co.suspend<MemRt,ErrVal>().then(_ => co_unit<MemRt,ErrVal,A>(v))) }

let push_new_context = mk_coroutine(apply(push_inner_scope_rt, empty_scope_val).then(unit<MemRt>().times(id<MemRt>())).then(Co.value<MemRt, ErrVal, Unit>().then(Co.result<MemRt, ErrVal, Unit>().then(Co.no_error<MemRt, ErrVal, Unit>()))))
let pop_current_context = mk_coroutine(apply(pop_inner_scope_rt, empty_scope_val).then(unit<MemRt>().times(id<MemRt>())).then(Co.value<MemRt, ErrVal, Unit>().then(Co.result<MemRt, ErrVal, Unit>().then(Co.no_error<MemRt, ErrVal, Unit>()))))

export let if_then_else_rt = function(c:ExprRt<Sum<Val,Val>>, f:StmtRt, g:StmtRt) : StmtRt {
  return c.then(c_val => c_val.value.k != "b" ? runtime_error(`Error: conditional expression ${c_val} is not a boolean.`)
                         : c_val.value.v ? 
                push_new_context.then(_ => f.then(res => pop_current_context.then(_ => co_unit(res)))) : 
                push_new_context.then(_ => g.then(res => pop_current_context.then(_ => co_unit(res)))))
}

export let while_do_rt = function (c: ExprRt<Sum<Val,Val>>, k: StmtRt): StmtRt {
  return c.then(c_val => c_val.value.k != "b" ? runtime_error(`Error: conditional expression ${c_val} is not a boolean.`)
                         : c_val.value.v ? 
                push_new_context.then(_ => k.then(k_res => pop_current_context.then(_ => while_do_rt(c,k)))) : 
                done_rt)
}
