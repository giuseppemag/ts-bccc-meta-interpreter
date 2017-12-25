import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair } from "ts-bccc"
import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
import * as Co from "ts-bccc"
import { Stmt, Expr, Interface, Mem, Err, Val, Lambda, Bool,
         Name, HeapRef,
         set_class_def, set_fun_def, set_heap_v, set_v, set_v_expr, set_highlighting,
         runtime_error,
         heap_alloc, highlight,
         load_heap, obj, ref, Scope,
         store, store_class_def, store_fun_def, store_heap, str,
         unt, get_arr_len, get_arr_el, get_class_def, get_fun_def,
         get_heap_v, get_v, pop_scope, push_scope, new_obj } from "./memory"
import { done, dbg, if_then_else, while_do } from "./basic_statements"
import { call_by_name, call_lambda, def_fun, ret } from "./functions"
import { val_expr, unit_expr, str_expr } from "./expressions"
import { call_lambda_expr } from "./python";

export let declare_class = function(C_name:Name, int:Interface) : Stmt {
  return set_class_def(C_name, int)
}

export let field_get = function(F_name:Name, this_addr:HeapRef) : Expr<Val> {
  return get_heap_v(this_addr.v).then(this_val => {
    if (this_val.k != "obj") return runtime_error(`runtime type error: this is not a reference when looking ${F_name} up.`)
    return val_expr(this_val.v.get(F_name))
  })
}

export let field_get_expr = function(F_name:Name, this_expr:Expr<Val>) : Expr<Val> {
  return this_expr.then(this_addr =>
    this_addr.k != "ref" ? runtime_error(`runtime type error`) :
    field_get(F_name, this_addr))
}

export let field_set = function(F_name:Name, new_val_expr:Expr<Val>, this_addr:HeapRef) : Stmt {
  return new_val_expr.then(new_val =>
    get_heap_v(this_addr.v).then(this_val => {
    if (this_val.k != "obj") return runtime_error(`runtime type error: this is not a reference when looking ${F_name} up.`)
    let new_this_val = {...this_val, v:this_val.v.set(F_name, new_val) }
    return set_heap_v(this_addr.v, new_this_val).then(_ => done)
  }))
}

export let field_set_expr = function(F_name:Name, new_val_expr:Expr<Val>, this_expr:Expr<Val>) : Stmt {
  return this_expr.then(this_addr =>
    this_addr.k != "ref" ? runtime_error(`runtime type error`) :
    field_set(F_name, new_val_expr, this_addr))
}

export let resolve_method = function(M_name:Name, C_def:Interface) : Sum<Stmt, Unit> {
  return C_def.methods.has(M_name) ? apply(inl(), C_def.methods.get(M_name))
         : apply(fun((int:Interface) => resolve_method(M_name, int)).plus(inr<Stmt, Unit>()), C_def.base)
}

export let call_method = function(M_name:Name, this_addr:Val, args:Array<Expr<Val>>) : Expr<Val> {
  return this_addr.k != "ref" ? runtime_error(`runtime type error: this is not a reference when calling ${M_name}.`) :
                                get_heap_v(this_addr.v).then(this_val => {
    if (this_val.k != "obj") return runtime_error(`runtime type error: this is not an object when calling ${M_name}.`)
    let this_class = this_val.v.get("class")
    if (this_class.k != "s") return runtime_error(`runtime type error: this.class is not a string.`)
    return get_class_def(this_class.v).then(C_def => {
      let f = fun((m:Stmt) => call_lambda_expr(m, args.concat([val_expr(this_addr)]))).plus(constant<Unit, Expr<Val>>(unit_expr()))
      return apply(f, resolve_method(M_name, C_def))
    }

    )
  })
}

export let call_method_expr = function(M_name:Name, this_expr:Expr<Val>, args:Array<Expr<Val>>) : Expr<Val> {
  return this_expr.then(this_addr => call_method(M_name, this_addr, args))
}

export let call_cons = function(C_name:Name, args:Array<Expr<Val>>) : Expr<Val> {
  return get_class_def(C_name).then(C_def =>
  new_obj().then(this_addr =>
  this_addr.k != "ref" ? runtime_error(`this is not a reference when calling ${C_name}::cons`) :
  field_set("class", str_expr(C_name), this_addr).then(_ =>
  call_lambda_expr(C_def.methods.get(C_name), args.concat([val_expr(this_addr)])).then(res =>
  co_unit<Mem,Err,Val>(this_addr)
  ))))
}
