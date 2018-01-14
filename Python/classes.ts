import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair } from "ts-bccc"
import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
import * as Co from "ts-bccc"
import { StmtRt, ExprRt, Interface, MemRt, ErrVal, Val, Lambda, Bool,
         ValueName, HeapRef,
         set_class_def_rt, set_fun_def_rt, set_heap_v_rt, set_v_rt, set_v_expr_rt, set_highlighting_rt,
         runtime_error,
         mk_ref_val, Scope,
         mk_string_val,
         mk_unit_val, get_arr_len_rt, get_arr_el_rt, get_class_def_rt, get_fun_def_rt,
         get_heap_v_rt, get_v_rt, pop_scope_rt, push_scope_rt, new_obj_rt } from "./memory"
import { done_rt, dbg_rt, if_then_else_rt, while_do_rt } from "./basic_statements"
import { call_by_name_rt, call_lambda_rt, def_fun_rt, return_rt } from "./functions"
import { val_expr, unit_expr, str_expr } from "./expressions"
import { call_lambda_expr_rt } from "./python";

export let declare_class_rt = function(C_name:ValueName, int:Interface) : StmtRt {
  return set_class_def_rt(C_name, int)
}

export let field_get_rt = function(F_name:ValueName, this_addr:HeapRef) : ExprRt<Sum<Val,Val>> {
  return get_heap_v_rt(this_addr.v).then(this_val => {
    if (this_val.value.k != "obj") return runtime_error(`runtime type error: this is not a reference when looking ${F_name} up.`)
    return val_expr(apply(inl<Val,Val>(), this_val.value.v.get(F_name)))
  })
}

export let field_get_expr_rt = function(F_name:ValueName, this_expr:ExprRt<Sum<Val, Val>>) : ExprRt<Sum<Val, Val>> {
  return this_expr.then(this_addr =>
    this_addr.value.k != "ref" ? runtime_error(`runtime type error`) :
    field_get_rt(F_name, this_addr.value))
}

export let field_set_rt = function(F_name:ValueName, new_val_expr:ExprRt<Sum<Val, Val>>, this_addr:HeapRef) : StmtRt {
  return new_val_expr.then(new_val =>
    get_heap_v_rt(this_addr.v).then(this_val => {
    if (this_val.value.k != "obj") return runtime_error(`runtime type error: this is not a reference when looking ${F_name} up.`)

    let new_this_val:Val = {...this_val.value, v:this_val.value.v.set(F_name, new_val.value) }
    return set_heap_v_rt(this_addr.v, new_this_val).then(_ => done_rt)
  }))
}

export let field_set_expr_rt = function(F_name:ValueName, new_val_expr:ExprRt<Sum<Val, Val>>, this_expr:ExprRt<Sum<Val, Val>>) : StmtRt {
  return this_expr.then(this_addr =>
    this_addr.value.k != "ref" ? runtime_error(`runtime type error`) :
    field_set_rt(F_name, new_val_expr, this_addr.value))
}

export let resolve_method_rt = function(M_name:ValueName, C_def:Interface) : Sum<StmtRt, Unit> {
  return C_def.methods.has(M_name) ? apply(inl(), C_def.methods.get(M_name))
         : apply(fun((int:Interface) => resolve_method_rt(M_name, int)).plus(inr<StmtRt, Unit>()), C_def.base)
}

export let call_method_rt = function(M_name:ValueName, this_addr:Val, args:Array<ExprRt<Sum<Val, Val>>>) : ExprRt<Sum<Val, Val>> {
  return this_addr.k != "ref" ? runtime_error(`runtime type error: this is not a reference when calling ${M_name}.`) :
                                get_heap_v_rt(this_addr.v).then(this_val => {
    if (this_val.value.k != "obj") return runtime_error(`runtime type error: this is not an object when calling ${M_name}.`)
    let this_class = this_val.value.v.get("class")
    if (this_class.k != "s") return runtime_error(`runtime type error: this.class is not a string.`)
    return get_class_def_rt(this_class.v).then(C_def => {
      let f = fun((m:StmtRt) => call_lambda_expr_rt(m, args.concat([val_expr(apply(inl(), this_addr))]))).plus(constant<Unit, ExprRt<Sum<Val, Val>>>(unit_expr()))
      return apply(f, resolve_method_rt(M_name, C_def))
    }

    )
  })
}

export let call_method_expr_rt = function(M_name:ValueName, this_expr:ExprRt<Sum<Val, Val>>, args:Array<ExprRt<Sum<Val, Val>>>) : ExprRt<Sum<Val, Val>> {
  return this_expr.then(this_addr => call_method_rt(M_name, this_addr.value, args))
}

export let call_cons_rt = function(C_name:ValueName, args:Array<ExprRt<Sum<Val, Val>>>) : ExprRt<Sum<Val, Val>> {
  return get_class_def_rt(C_name).then(C_def =>
  new_obj_rt().then(this_addr =>
  this_addr.value.k != "ref" ? runtime_error(`this is not a reference when calling ${C_name}::cons`) :
  field_set_rt("class", str_expr(C_name), this_addr.value).then(_ =>
  call_lambda_expr_rt(C_def.methods.get(C_name), args.concat([val_expr(this_addr)])).then(res =>
  co_unit<MemRt,ErrVal,Sum<Val,Val>>(this_addr)
  ))))
}
