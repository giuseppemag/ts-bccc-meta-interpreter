import * as Immutable from "immutable"
import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair } from "ts-bccc"
import * as CCC from "ts-bccc"
import * as St from "ts-bccc"
import { mk_state, State } from "ts-bccc"
import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
import * as Co from "ts-bccc"

import { StmtRt, ExprRt, Interface, MemRt, ErrVal, Val, Lambda, Bool,
  Name, HeapRef,
  set_arr_el_rt, set_arr_el_expr_rt, set_class_def_rt, set_fun_def_rt, set_heap_v_rt, set_v_rt, set_v_expr_rt, set_highlighting_rt,
  runtime_error,
  mk_bool_val, mk_int_val, mk_float_val, mk_lambda_val, new_arr_rt, new_obj_rt, mk_arr_val,
  ArrayVal, empty_memory, empty_scope_val,
  mk_obj_val, mk_ref_val, Scope,
  mk_string_val,
  mk_unit_val, get_arr_len_rt, get_arr_el_rt, get_class_def_rt, get_fun_def_rt,
  get_heap_v_rt, get_v_rt, pop_scope, push_scope } from "./memory"
import { SourceRange } from "../source_range";
import { RenderGrid, mk_render_grid_val, mk_render_grid_pixel_val, RenderGridPixel } from "./python";

export interface BoolCat extends Fun<Unit, Sum<Unit,Unit>> {}
export let FalseCat:BoolCat = unit<Unit>().then(inl<Unit,Unit>())
export let TrueCat:BoolCat  = unit<Unit>().then(inr<Unit,Unit>())
export let bool_to_boolcat : Fun<Bool, BoolCat> = fun(b => b ? TrueCat : FalseCat)

export let unit_expr = () => (co_unit<MemRt,ErrVal,Val>(mk_unit_val))
export let str_expr = (s:string) => (co_unit<MemRt,ErrVal,Val>(mk_string_val(s)))
export let float_expr = (n:number) => (co_unit<MemRt,ErrVal,Val>(mk_float_val(n)))
export let int_expr = (n:number) => (co_unit<MemRt,ErrVal,Val>(mk_int_val(n)))
export let arr_expr = (a:ArrayVal) => (co_unit<MemRt,ErrVal,Val>(mk_arr_val(a)))
export let bool_expr = (s:boolean) => (co_unit<MemRt,ErrVal,Val>(mk_bool_val(s)))
export let lambda_expr = (l:Lambda) => (co_unit<MemRt,ErrVal,Val>(mk_lambda_val(l)))
export let obj_expr = (o:Scope) => (co_unit<MemRt,ErrVal,Val>(mk_obj_val(o)))
export let ref_expr = (r:Name) => (co_unit<MemRt,ErrVal,Val>(mk_ref_val(r)))
export let val_expr = (v:Val) => (co_unit<MemRt,ErrVal,Val>(v))
export let render_grid_expr = (v:RenderGrid) => (co_unit<MemRt,ErrVal,Val>(mk_render_grid_val(v)))
export let render_grid_pixel_expr = (v:RenderGridPixel) => (co_unit<MemRt,ErrVal,Val>(mk_render_grid_pixel_val(v)))

let lift_binary_operation = function<a,b> (a: ExprRt<Val>, b:ExprRt<Val>, check_types:(ab:Prod<Val,Val>) => Sum<Prod<a,b>, Unit>, actual_operation:(_:Prod<a,b>)=>Val, operator_name?:string): ExprRt<Val> {
  return a.then(a_val => b.then(b_val =>
    apply(fun(check_types).then((fun(actual_operation).then(fun<Val, ExprRt<Val>>(co_unit))).plus(
      constant<Unit,ExprRt<Val>>(runtime_error(`Type error: cannot perform ${operator_name} on ${a_val.v} and ${b_val.v}.`)))), { fst:a_val, snd:b_val })))
}
export let mk_empty_render_grid_rt = function (width: ExprRt<Val>, height:ExprRt<Val>): ExprRt<Val> {
  return width.then(w => height.then(h =>
    w.k == "i" && h.k == "i" ?render_grid_expr({ width:w.v, height:h.v, pixels:Immutable.Map<number, Immutable.Set<number>>() })
    : runtime_error(`Type error: cannot create empty render grid with width and height ${w.v} and ${h.v}.`)
  ))
}
export let mk_render_grid_pixel_rt = function (x: ExprRt<Val>, y:ExprRt<Val>, status:ExprRt<Val>): ExprRt<Val> {
  return x.then(x_val => y.then(y_val => status.then(status_val =>
    x_val.k == "i" && y_val.k == "i" && status_val.k == "b" ?
      render_grid_pixel_expr({ x:x_val.v, y:y_val.v, status:status_val.v })
    : runtime_error(`Type error: cannot create render grid pixel with x,y, and status ${x_val.v}, ${y_val.v}, and ${status_val.v}.`)
  )))
}
export let render_grid_plus_rt = function (r: ExprRt<Val>, p:ExprRt<Val>): ExprRt<Val> {
  return lift_binary_operation<RenderGrid,RenderGridPixel>(r, p,
          ab => ab.fst.k != "render-grid" || ab.snd.k != "render-grid-pixel" ? inr<Prod<RenderGrid,RenderGridPixel>, Unit>().f({}) : inl<Prod<RenderGrid,RenderGridPixel>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => {
            let rg = ab_val.fst
            let p = ab_val.snd
            let pixels = rg.pixels
            if (p.status) {
              if (!pixels.has(p.x)) pixels = pixels.set(p.x, Immutable.Set<number>().add(p.y))
              else pixels = pixels.set(p.x, pixels.get(p.x).add(p.y))
            } else {
              if (pixels.has(p.x)) {
                let new_row = pixels.get(p.x).remove(p.y)
                if (new_row.isEmpty())
                  pixels = pixels.remove(p.x)
                else
                  pixels = pixels.set(p.x, new_row)
              }
            }
            return mk_render_grid_val({...rg, pixels: pixels })
          }, "(+)")
}

export let bool_times_rt = function (a: ExprRt<Val>, b:ExprRt<Val>): ExprRt<Val> {
  return lift_binary_operation<boolean,boolean>(a, b,
          ab => ab.fst.k != "b" || ab.snd.k != "b" ? inr<Prod<boolean,boolean>, Unit>().f({}) : inl<Prod<boolean,boolean>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => mk_bool_val(ab_val.fst && ab_val.snd), "(&&)")
}
export let bool_plus_rt = function (a: ExprRt<Val>, b:ExprRt<Val>): ExprRt<Val> {
  return lift_binary_operation<boolean,boolean>(a, b,
          ab => ab.fst.k != "b" || ab.snd.k != "b" ? inr<Prod<boolean,boolean>, Unit>().f({}) : inl<Prod<boolean,boolean>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => mk_bool_val(ab_val.fst || ab_val.snd), "(||)")
}
export let int_plus_rt = function (a: ExprRt<Val>, b:ExprRt<Val>): ExprRt<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "i" || ab.snd.k != "i" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => mk_int_val(ab_val.fst + ab_val.snd), "(+)")
}
export let int_minus_rt = function (a: ExprRt<Val>, b:ExprRt<Val>): ExprRt<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "i" || ab.snd.k != "i" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => mk_int_val(ab_val.fst - ab_val.snd), "(-)")
}
export let int_times_rt = function (a: ExprRt<Val>, b:ExprRt<Val>, sr:SourceRange): ExprRt<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "i" || ab.snd.k != "i" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => mk_int_val(ab_val.fst * ab_val.snd), `(*) at ${sr.to_string()}`)
}
export let int_div_rt = function (a: ExprRt<Val>, b:ExprRt<Val>): ExprRt<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "i" || ab.snd.k != "i" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => mk_int_val(Math.floor(ab_val.fst / ab_val.snd)), "(/)")
}
export let int_mod_rt = function (a: ExprRt<Val>, b:ExprRt<Val>): ExprRt<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "i" || ab.snd.k != "i" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => mk_int_val(ab_val.fst % ab_val.snd), "(%)")
}
export let int_gt_rt = function (a: ExprRt<Val>, b:ExprRt<Val>): ExprRt<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "i" || ab.snd.k != "i" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => mk_bool_val(ab_val.fst > ab_val.snd), "(>)")
}
export let int_lt_rt = function (a: ExprRt<Val>, b:ExprRt<Val>): ExprRt<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "i" || ab.snd.k != "i" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => mk_bool_val(ab_val.fst < ab_val.snd), "(<)")
}
export let int_geq_rt = function (a: ExprRt<Val>, b:ExprRt<Val>): ExprRt<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "i" || ab.snd.k != "i" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => mk_bool_val(ab_val.fst >= ab_val.snd), "(>=)")
}
export let int_leq_rt = function (a: ExprRt<Val>, b:ExprRt<Val>): ExprRt<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "i" || ab.snd.k != "i" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => mk_bool_val(ab_val.fst <= ab_val.snd), "(<=)")
}
export let int_eq_rt = function (a: ExprRt<Val>, b:ExprRt<Val>): ExprRt<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "i" || ab.snd.k != "i" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => mk_bool_val(ab_val.fst == ab_val.snd), "(==)")
}
export let int_neq_rt = function (a: ExprRt<Val>, b:ExprRt<Val>): ExprRt<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "i" || ab.snd.k != "i" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => mk_bool_val(ab_val.fst != ab_val.snd), "(!=)")
}
export let bool_neq_rt = function (a: ExprRt<Val>, b:ExprRt<Val>): ExprRt<Val> {
  return lift_binary_operation<boolean,boolean>(a, b,
          ab => ab.fst.k != "b" || ab.snd.k != "b" ? inr<Prod<boolean,boolean>, Unit>().f({}) : inl<Prod<boolean,boolean>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => mk_bool_val(ab_val.fst != ab_val.snd), "(!=)")
}
export let float_plus_rt = function (a: ExprRt<Val>, b:ExprRt<Val>): ExprRt<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "f" || ab.snd.k != "f" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => mk_float_val(ab_val.fst + ab_val.snd), "(+)")
}
export let float_minus_rt = function (a: ExprRt<Val>, b:ExprRt<Val>): ExprRt<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "f" || ab.snd.k != "f" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => mk_float_val(ab_val.fst - ab_val.snd), "(-)")
}
export let float_times_rt = function (a: ExprRt<Val>, b:ExprRt<Val>, sr:SourceRange): ExprRt<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "f" || ab.snd.k != "f" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => mk_float_val(ab_val.fst * ab_val.snd), `(*) at ${sr.to_string()}`)
}
export let float_div_rt = function (a: ExprRt<Val>, b:ExprRt<Val>): ExprRt<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "f" || ab.snd.k != "f" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => mk_float_val(ab_val.fst / ab_val.snd), "(/)")
}
export let float_gt_rt = function (a: ExprRt<Val>, b:ExprRt<Val>): ExprRt<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "f" || ab.snd.k != "f" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => mk_bool_val(ab_val.fst > ab_val.snd), "(>)")
}
export let float_lt_rt = function (a: ExprRt<Val>, b:ExprRt<Val>): ExprRt<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "f" || ab.snd.k != "f" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => mk_bool_val(ab_val.fst < ab_val.snd), "(<)")
}
export let float_geq_rt = function (a: ExprRt<Val>, b:ExprRt<Val>): ExprRt<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "f" || ab.snd.k != "f" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => mk_bool_val(ab_val.fst >= ab_val.snd), "(>=)")
}
export let float_leq_rt = function (a: ExprRt<Val>, b:ExprRt<Val>): ExprRt<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "f" || ab.snd.k != "f" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => mk_bool_val(ab_val.fst <= ab_val.snd), "(<=)")
}
export let float_eq_rt = function (a: ExprRt<Val>, b:ExprRt<Val>): ExprRt<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "f" || ab.snd.k != "f" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => mk_bool_val(ab_val.fst == ab_val.snd), "(==)")
}
export let float_neq_rt = function (a: ExprRt<Val>, b:ExprRt<Val>): ExprRt<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "f" || ab.snd.k != "f" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => mk_bool_val(ab_val.fst != ab_val.snd), "(!=)")
}

export let string_plus_rt = function (a: ExprRt<Val>, b:ExprRt<Val>): ExprRt<Val> {
  return lift_binary_operation<string,string>(a, b,
          ab => ab.fst.k != "s" || ab.snd.k != "s" ? inr<Prod<string,string>, Unit>().f({}) : inl<Prod<string,string>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => mk_string_val(ab_val.fst + ab_val.snd), "(+)")
}

let lift_unary_operation = function<a> (a: ExprRt<Val>, check_type:(a:Val) => Sum<a, Unit>, actual_operation:(_:a)=>Val, operator_name?:string): ExprRt<Val> {
  return a.then(a_val =>
    apply(fun(check_type).then((fun(actual_operation).then(fun<Val, ExprRt<Val>>(co_unit))).plus(constant<Unit,ExprRt<Val>>(
      runtime_error(`Type error: cannot perform ${operator_name} on value ${a_val.v}.`)))), a_val))
}
export let bool_not_rt = function (a: ExprRt<Val>): ExprRt<Val> {
  return lift_unary_operation<boolean>(a,
          ab => ab.k != "b" ? inr<boolean, Unit>().f({}) : inl<boolean, Unit>().f(ab.v),
          ab_val => mk_bool_val(!ab_val), "(!)")
}
export let int_minus_unary_rt = function (a: ExprRt<Val>): ExprRt<Val> {
  return lift_unary_operation<number>(a,
          ab => ab.k != "i" ? inr<number, Unit>().f({}) : inl<number, Unit>().f(ab.v),
          ab_val => mk_int_val(-ab_val), "(-)")
}
export let float_minus_unary_rt = function (a: ExprRt<Val>): ExprRt<Val> {
  return lift_unary_operation<number>(a,
          ab => ab.k != "f" ? inr<number, Unit>().f({}) : inl<number, Unit>().f(ab.v),
          ab_val => mk_float_val(-ab_val), "(-)")
}
export let string_length_rt = function (a: ExprRt<Val>): ExprRt<Val> {
  return lift_unary_operation<string>(a,
          ab => ab.k != "s" ? inr<string, Unit>().f({}) : inl<string, Unit>().f(ab.v),
          ab_val => mk_int_val(ab_val.length), "(length)")
}
