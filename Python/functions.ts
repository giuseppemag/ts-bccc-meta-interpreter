import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair } from "ts-bccc"
import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
import * as Co from "ts-bccc"
import { Stmt, Expr, Interface, Mem, Err, Val, Lambda, Bool,
         runtime_error,
         Name,
         set_fun_def,
         set_v,
         get_fun_def,
         set_v_expr,
         push_scope,
         pop_scope} from "./memory"
import { done, dbg } from "./basic_statements"
import { empty_scope, Scope } from "./python";

export let def_fun = function(n:Name, body:Expr<Val>, args:Array<Name>, closure:Scope) : Stmt {
  return set_fun_def(n, { body:body, parameters:args, closure:closure})
}

export let ret = function (e: Expr<Val>): Expr<Val> {
  return e.then(e_val => set_v("return", e_val).then(_ => co_unit(e_val)))
}

export let call_by_name = function(f_n:Name, args:Array<Expr<Val>>) : Expr<Val> {
  return get_fun_def(f_n).then(f => call_lambda(f, args))
}

export let call_lambda = function(lambda:Lambda, arg_values:Array<Expr<Val>>) : Expr<Val> {
  let body = lambda.body
  if (arg_values.length != lambda.parameters.length) return runtime_error(`Error: wrong number of parameters in lambda invocation. Expected ${lambda.parameters.length}, received ${arg_values.length}.`)
  let set_args = lambda.parameters.map((n,i) => ({ fst:n, snd:arg_values[i] })).reduce<Stmt>((sets, arg_expr) =>
    set_v_expr(arg_expr.fst, arg_expr.snd).then(_ => sets),
    done)
  let init = mk_coroutine(apply(push_scope, lambda.closure).then(unit<Mem>().times(id<Mem>())).then(Co.value<Mem, Err, Unit>().then(Co.result<Mem, Err, Unit>().then(Co.no_error<Mem, Err, Unit>()))))

  let pop_success = (unit<Mem>().times(id<Mem>())).then(Co.value<Mem, Err, Unit>().then(Co.result<Mem, Err, Unit>().then(Co.no_error<Mem, Err, Unit>())))
  let pop_failure = constant<Unit,Err>(`Internal error: cannot pop an empty stack.`).then(Co.error<Mem,Err,Unit>())
  let cleanup = mk_coroutine(pop_scope.then(pop_failure.plus(pop_success)))
  return init.then(_ =>
         set_args.then(_ =>
         body.then(res =>
         cleanup.then(_ =>
         co_unit(res)))))
}
