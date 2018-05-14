import * as Immutable from "immutable"
import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair } from "ts-bccc"
// import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
import * as Co from "ts-bccc"
import { SourceRange, mk_range } from "../source_range"
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
// import { comm_list_coroutine } from "../ccc_aux";
import { co_error, Coroutine, mk_coroutine, co_unit, co_suspend, co_get_state, co_set_state, comm_list_coroutine, co_from_state } from "../fast_coroutine";

let build_closure = (r:SourceRange, closure_parameters:Array<ValueName>) => function(i:number, closure:Scope) : ExprRt<Scope> {
  if (i >= closure_parameters.length) return co_unit(closure)
  else
    return get_v_rt(r, closure_parameters[i]).then(c_val =>
           build_closure(r, closure_parameters)(i+1, closure.set(closure_parameters[i], c_val.value))
           )
}

export let mk_lambda_rt = function(body:ExprRt<Sum<Val,Val>>, parameters:Array<ValueName>, closure_parameters:Array<ValueName>, range:SourceRange) : ExprRt<Sum<Val,Val>> {
  return build_closure(range, closure_parameters)(0, empty_scope_val).then(closure => lambda_expr({ body:body, parameters:parameters, closure:closure, range:range }))
}

export let def_fun_rt = function(n:ValueName, body:ExprRt<Sum<Val,Val>>, parameters:Array<ValueName>, closure_parameters:Array<ValueName>, range:SourceRange) : StmtRt {
  return build_closure(range, closure_parameters)(0, empty_scope_val).then(closure => set_fun_def_rt(n, { body:body, parameters:parameters, closure:closure, range:range }))
}

export let return_rt = function (e: ExprRt<Sum<Val,Val>>): ExprRt<Sum<Val,Val>> {
  return e.then(e_val => set_v_rt("return", e_val).then(_ => co_unit(apply(inr<Val,Val>(), e_val.value))))
}

export let call_by_name_rt = function(r:SourceRange,f_n:ValueName, args:Array<ExprRt<Sum<Val,Val>>>) : ExprRt<Sum<Val,Val>> {
  return get_fun_def_rt(r,f_n).then(f =>
         call_lambda_rt(r, f, args))
}

export let call_lambda_expr_rt = function(r:SourceRange,lambda:ExprRt<Sum<Val,Val>>, arg_values:Array<ExprRt<Sum<Val,Val>>>) : ExprRt<Sum<Val,Val>> {
  return lambda.then(l =>
         l.value.k == "lambda" ? call_lambda_rt(r,l.value.v, arg_values)
         : runtime_error(r,"Cannot invoke non-lambda expression."))
}

export let call_lambda_rt = function(r:SourceRange,lambda:Lambda, arg_expressions:Array<ExprRt<Sum<Val,Val>>>) : ExprRt<Sum<Val,Val>> {
  let body = lambda.body
  if (arg_expressions.length != lambda.parameters.length) return runtime_error(r, `Error: wrong number of parameters in lambda invocation. Expected ${lambda.parameters.length}, received ${arg_expressions.length}.`)

  let eval_args:Coroutine<MemRt, ErrVal, Immutable.List<Sum<Val,Val>>> = comm_list_coroutine(Immutable.List<ExprRt<Sum<Val,Val>>>(arg_expressions))

  let set_args = (arg_values:Array<Sum<Val,Val>>) => lambda.parameters.map((n,i) => ({ fst:n, snd:arg_values[i] })).reduce<StmtRt>((sets, arg_value) =>
    set_v_rt(arg_value.fst, arg_value.snd).then(_ => sets),
    done_rt)

  let init = push_scope_rt(lambda.closure) // .then(unit<MemRt>().times(id<MemRt>())).then(Co.value<MemRt, ErrVal, Unit>().then(Co.result<MemRt, ErrVal, Unit>().then(Co.no_error<MemRt, ErrVal, Unit>()))))

  // let pop_success = (unit<MemRt>().times(id<MemRt>())).then(Co.value<MemRt, ErrVal, Unit>().then(Co.result<MemRt, ErrVal, Unit>().then(Co.no_error<MemRt, ErrVal, Unit>())))
  // let pop_failure = constant<Unit,ErrVal>({ message:`Internal error: cannot pop an empty stack.`, range:r }).then(Co.error<MemRt,ErrVal,Unit>())
  let cleanup = co_from_state<MemRt,ErrVal,Sum<Unit,MemRt>>(pop_scope_rt).then(popped_state => {
    if (popped_state.kind == "left") return co_error<MemRt,ErrVal,Unit>({ message:`Internal error: cannot pop an empty stack.`, range:r })
    return co_set_state(popped_state.value)
  })
return eval_args.then(arg_values =>
         // console.log("lambda arguments", JSON.stringify(arg_values)) ||
         init.then(_ =>
         set_args(arg_values.toArray()).then(_ =>
         body.then(res =>
         cleanup.then(_ =>
         co_unit(apply(inl<Val,Val>(), res.value)))
        ))))
}