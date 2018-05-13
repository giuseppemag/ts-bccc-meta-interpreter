import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair } from "ts-bccc"
// import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
// import * as Co from "ts-bccc"
import { StmtRt, MemRt, ErrVal, ExprRt, set_highlighting_rt, Bool, Val, runtime_error, mk_unit_val, push_inner_scope_rt, empty_scope_val, pop_inner_scope_rt } from "./memory"
import { bool_to_boolcat } from "./expressions"
import { SourceRange } from "../source_range";
import { co_error, Coroutine, mk_coroutine, co_unit, co_suspend, co_get_state, co_set_state, run_step } from "../fast_coroutine";

export let done_rt: StmtRt = co_unit<MemRt, ErrVal, Sum<Val,Val>>(apply(inl(), mk_unit_val))
export let dbg_rt = (range:SourceRange) => function<A> (v:A) : ExprRt<A> { return set_highlighting_rt(range).then(_ => co_suspend<MemRt,ErrVal>().then(_ => co_unit<MemRt,ErrVal,A>(v))) }

let push_new_context = push_inner_scope_rt(empty_scope_val)
let pop_current_context = pop_inner_scope_rt()

export let if_then_else_rt = function(r:SourceRange, c:ExprRt<Sum<Val,Val>>, f:StmtRt, g:StmtRt) : StmtRt {
  return c.then(c_val => c_val.value.k != "b" ? runtime_error(r, `Error: conditional expression ${c_val} is not a boolean.`)
                         : c_val.value.v ?
                push_new_context.then(_ => f.then(res => pop_current_context.then(_ => co_unit(res)))) :
                push_new_context.then(_ => g.then(res => pop_current_context.then(_ => co_unit(res)))))
}


export let while_do_rt = function(r:SourceRange, c: ExprRt<Sum<Val,Val>>, k: StmtRt): StmtRt {
  let k_full = push_new_context.combine(k.then(k_res => pop_current_context.combine(co_unit(k_res))))
  return mk_coroutine<MemRt, ErrVal, Sum<Val,Val>>({ kind:"run", run:(s0:MemRt) => {
    let s = s0
    while (true) {
      let c_step = run_step(c, s)
      if (c_step.kind == "err") {
        return { kind:"e", e:c_step.e }
      }
      if (c_step.kind == "k") {
        s = c_step.s
        return { kind:"k", s:s, k:while_do_rt(r, c_step.k, k) }
      }
      let c_val = c_step.v
      // imperatively update s
      s = c_step.s
      if (c_val.value.k != "b") {
        return { kind:"e", e:{ range:r, message:`Error: conditional expression ${c_val} is not a boolean.` } }
      }
      if (c_val.value.v == false) {
        // loop has ended
        return { kind:"v", s:s, v:apply(inl<Val,Val>(), mk_unit_val) }
      } else {
        // loop has not ended and must continue
        let k_step = run_step(k_full, s)
        if (k_step.kind == "err") {
          return { kind:"e", e:k_step.e }
        }
        if (k_step.kind == "k") {
          s = k_step.s
          return { kind:"k", s:s, k:k_step.k.combine(while_do_rt(r, c, k)) }
        }
        // imperatively update s
        s = k_step.s
        // todo: if k_step.v is right, then propagate returned value
        if (k_step.v.kind == "right")
          return { kind:"v", s:s, v:k_step.v }
          s.steps_counter = s.steps_counter + 1
          if(s.steps_counter > 10000) {
            if (s.custom_alert('The program seems to be taking too much time. This might be an indication of an infinite loop. Press OK to terminate the program.'))
              return { kind:"e", e:{ range:r, message:`It seems your code has run into an infinite loop.` } }
            s.steps_counter = 0
            // return co_error<MemRt,ErrVal,Sum<Val,Val>>({ range: r, message: `It seems your code has run into an infinite loop.` })
          }
      }
    }
  }})
}

// export let while_do_rt = function(r:SourceRange, c: ExprRt<Sum<Val,Val>>, k: StmtRt): StmtRt {
//   return c.then(c_val => c_val.value.k != "b" ? runtime_error(r, `Error: conditional expression ${c_val} is not a boolean.`)
//                          : c_val.value.v ?
//                 push_new_context.then(_ =>
//                   co_get_state<MemRt, ErrVal>().then(s =>
//                     {
//                       let f = (counter:number) : StmtRt => co_set_state<MemRt, ErrVal>({...s, steps_counter: counter}).then(_ =>
//                                 k.then(k_res => pop_current_context.then(_ => while_do_rt(r,c,k))))
//                       if(s.steps_counter > 300) {
//                         if (s.custom_alert('The program seems to be taking too much time. This might be an indication of an infinite loop. Press OK to terminate the program.'))
//                           return co_error<MemRt,ErrVal,Sum<Val,Val>>({ range: r, message: `It seems your code has run into an infinite loop.` })
//                         else
//                           return f(0)
//                       }
//                       return f(s.steps_counter + 1)
//                     })
//                 ) :
//                 done_rt)
// }

export let for_loop_rt = function(r:SourceRange, i: ExprRt<Sum<Val,Val>>, c: ExprRt<Sum<Val,Val>>, s: ExprRt<Sum<Val,Val>>, b: StmtRt): StmtRt {
  return push_new_context.then(_ =>
          i.then(_ =>
          while_do_rt(r, c, b.then(_ => s)).then(_ =>
          pop_current_context.then(_ =>
          done_rt))))
}
