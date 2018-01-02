import * as Immutable from "immutable"
import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair, co_get_state } from "ts-bccc"
import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
import * as Co from "ts-bccc"
import { StmtRt, ExprRt, Interface, MemRt, ErrVal, Val, Lambda, Bool,
         runtime_error,
         ValueName,
         set_fun_def_rt,
         set_v_rt,
         get_fun_def_rt,
         set_v_expr_rt,
         push_scope_rt,
         pop_scope_rt} from "./memory"
import { done_rt, dbg_rt } from "./basic_statements"
import { empty_scope_val, Scope, lambda_expr, get_v_rt } from "./python";
import { comm_list_coroutine } from "../ccc_aux";

let build_closure = (closure_parameters:Array<ValueName>) => function(i:number, closure:Scope) : ExprRt<Scope> {
  if (i >= closure_parameters.length) return co_unit(closure)
  else
    return get_v_rt(closure_parameters[i]).then(c_val =>
           build_closure(closure_parameters)(i+1, closure.set(closure_parameters[i], c_val))
           )
}

export let mk_lambda_rt = function(body:ExprRt<Val>, parameters:Array<ValueName>, closure_parameters:Array<ValueName>) : ExprRt<Val> {
  return build_closure(closure_parameters)(0, empty_scope_val).then(closure => lambda_expr({ body:body, parameters:parameters, closure:closure }))
}

export let def_fun_rt = function(n:ValueName, body:ExprRt<Val>, parameters:Array<ValueName>, closure_parameters:Array<ValueName>) : StmtRt {
  return build_closure(closure_parameters)(0, empty_scope_val).then(closure => set_fun_def_rt(n, { body:body, parameters:parameters, closure:closure }))
}

export let return_rt = function (e: ExprRt<Val>): ExprRt<Val> {
  return e.then(e_val => set_v_rt("return", e_val).then(_ => co_unit(e_val)))
}

export let call_by_name_rt = function(f_n:ValueName, args:Array<ExprRt<Val>>) : ExprRt<Val> {
  return get_fun_def_rt(f_n).then(f =>
         call_lambda_rt(f, args))
}

export let call_lambda_expr_rt = function(lambda:ExprRt<Val>, arg_values:Array<ExprRt<Val>>) : ExprRt<Val> {
  return lambda.then(l =>
         l.k == "lambda" ? call_lambda_rt(l.v, arg_values)
         : runtime_error("Cannot invoke non-lambda expression."))
}

export let call_lambda_rt = function(lambda:Lambda, arg_expressions:Array<ExprRt<Val>>) : ExprRt<Val> {
  let body = lambda.body
  if (arg_expressions.length != lambda.parameters.length) return runtime_error(`Error: wrong number of parameters in lambda invocation. Expected ${lambda.parameters.length}, received ${arg_expressions.length}.`)

  let eval_args:Coroutine<MemRt, ErrVal, Immutable.List<Val>> = comm_list_coroutine(Immutable.List<ExprRt<Val>>(arg_expressions))

  let set_args = (arg_values:Array<Val>) => lambda.parameters.map((n,i) => ({ fst:n, snd:arg_values[i] })).reduce<StmtRt>((sets, arg_value) =>
    set_v_rt(arg_value.fst, arg_value.snd).then(_ => sets),
    done_rt)
  let init = mk_coroutine(apply(push_scope_rt, lambda.closure).then(unit<MemRt>().times(id<MemRt>())).then(Co.value<MemRt, ErrVal, Unit>().then(Co.result<MemRt, ErrVal, Unit>().then(Co.no_error<MemRt, ErrVal, Unit>()))))

  let pop_success = (unit<MemRt>().times(id<MemRt>())).then(Co.value<MemRt, ErrVal, Unit>().then(Co.result<MemRt, ErrVal, Unit>().then(Co.no_error<MemRt, ErrVal, Unit>())))
  let pop_failure = constant<Unit,ErrVal>(`Internal error: cannot pop an empty stack.`).then(Co.error<MemRt,ErrVal,Unit>())
  let cleanup = mk_coroutine(pop_scope_rt.then(pop_failure.plus(pop_success)))
  return eval_args.then(arg_values =>
         init.then(_ =>
         set_args(arg_values.toArray()).then(_ =>
        //  co_get_state<Mem, Err>().then(s =>
         body.then(res =>
         cleanup.then(_ =>
         co_unit(res))))))
}
