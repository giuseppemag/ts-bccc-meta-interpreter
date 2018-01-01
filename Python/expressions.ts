import * as Immutable from "immutable"
import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair } from "ts-bccc"
import * as CCC from "ts-bccc"
import * as St from "ts-bccc"
import { mk_state, State } from "ts-bccc"
import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
import * as Co from "ts-bccc"

import { Stmt, Expr, Interface, Mem, Err, Val, Lambda, Bool,
  Name, HeapRef,
  set_arr_el, set_arr_el_expr, set_class_def, set_fun_def, set_heap_v, set_v, set_v_expr, set_highlighting,
  runtime_error,
  bool, int, float, lambda, new_arr, new_obj, arr,
  ArrayVal, empty_memory, empty_scope, heap_alloc, highlight,
  init_array_val, load, load_class_def, load_fun_def,
  load_heap, obj, ref, Scope,
  store, store_class_def, store_fun_def, store_heap, str,
  unt, get_arr_len, get_arr_el, get_class_def, get_fun_def,
  get_heap_v, get_v, pop_scope, push_scope } from "./memory"
import { SourceRange } from "../source_range";
import { RenderGrid, render_grid, render_grid_pixel, RenderGridPixel } from "./python";

export interface BoolCat extends Fun<Unit, Sum<Unit,Unit>> {}
export let FalseCat:BoolCat = unit<Unit>().then(inl<Unit,Unit>())
export let TrueCat:BoolCat  = unit<Unit>().then(inr<Unit,Unit>())
export let bool_to_boolcat : Fun<Bool, BoolCat> = fun(b => b ? TrueCat : FalseCat)

export let unit_expr = () => (co_unit<Mem,Err,Val>(unt))
export let str_expr = (s:string) => (co_unit<Mem,Err,Val>(str(s)))
export let float_expr = (n:number) => (co_unit<Mem,Err,Val>(float(n)))
export let int_expr = (n:number) => (co_unit<Mem,Err,Val>(int(n)))
export let arr_expr = (a:ArrayVal) => (co_unit<Mem,Err,Val>(arr(a)))
export let bool_expr = (s:boolean) => (co_unit<Mem,Err,Val>(bool(s)))
export let lambda_expr = (l:Lambda) => (co_unit<Mem,Err,Val>(lambda(l)))
export let obj_expr = (o:Scope) => (co_unit<Mem,Err,Val>(obj(o)))
export let ref_expr = (r:Name) => (co_unit<Mem,Err,Val>(ref(r)))
export let val_expr = (v:Val) => (co_unit<Mem,Err,Val>(v))
export let render_grid_expr = (v:RenderGrid) => (co_unit<Mem,Err,Val>(render_grid(v)))
export let render_grid_pixel_expr = (v:RenderGridPixel) => (co_unit<Mem,Err,Val>(render_grid_pixel(v)))

let lift_binary_operation = function<a,b> (a: Expr<Val>, b:Expr<Val>, check_types:(ab:Prod<Val,Val>) => Sum<Prod<a,b>, Unit>, actual_operation:(_:Prod<a,b>)=>Val, operator_name?:string): Expr<Val> {
  return a.then(a_val => b.then(b_val =>
    apply(fun(check_types).then((fun(actual_operation).then(fun<Val, Expr<Val>>(co_unit))).plus(
      constant<Unit,Expr<Val>>(runtime_error(`Type error: cannot perform ${operator_name} on ${a_val.v} and ${b_val.v}.`)))), { fst:a_val, snd:b_val })))
}
export let mk_empty_render_grid = function (width: Expr<Val>, height:Expr<Val>): Expr<Val> {
  return width.then(w => height.then(h =>
    w.k == "i" && h.k == "i" ?render_grid_expr({ width:w.v, height:h.v, pixels:Immutable.Map<number, Immutable.Set<number>>() })
    : runtime_error(`Type error: cannot create empty render grid with width and height ${w.v} and ${h.v}.`)
  ))
}
export let mk_render_grid_pixel = function (x: Expr<Val>, y:Expr<Val>, status:Expr<Val>): Expr<Val> {
  return x.then(x_val => y.then(y_val => status.then(status_val =>
    x_val.k == "i" && y_val.k == "i" && status_val.k == "b" ?
      render_grid_pixel_expr({ x:x_val.v, y:y_val.v, status:status_val.v })
    : runtime_error(`Type error: cannot create render grid pixel with x,y, and status ${x_val.v}, ${y_val.v}, and ${status_val.v}.`)
  )))
}
export let render_grid_plus = function (r: Expr<Val>, p:Expr<Val>): Expr<Val> {
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
            return render_grid({...rg, pixels: pixels })
          }, "(+)")
}

export let bool_times = function (a: Expr<Val>, b:Expr<Val>): Expr<Val> {
  return lift_binary_operation<boolean,boolean>(a, b,
          ab => ab.fst.k != "b" || ab.snd.k != "b" ? inr<Prod<boolean,boolean>, Unit>().f({}) : inl<Prod<boolean,boolean>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => bool(ab_val.fst && ab_val.snd), "(&&)")
}
export let bool_plus = function (a: Expr<Val>, b:Expr<Val>): Expr<Val> {
  return lift_binary_operation<boolean,boolean>(a, b,
          ab => ab.fst.k != "b" || ab.snd.k != "b" ? inr<Prod<boolean,boolean>, Unit>().f({}) : inl<Prod<boolean,boolean>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => bool(ab_val.fst || ab_val.snd), "(||)")
}
export let int_plus = function (a: Expr<Val>, b:Expr<Val>): Expr<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "i" || ab.snd.k != "i" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => int(ab_val.fst + ab_val.snd), "(+)")
}
export let int_minus = function (a: Expr<Val>, b:Expr<Val>): Expr<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "i" || ab.snd.k != "i" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => console.log("int_minus", ab_val) || int(ab_val.fst - ab_val.snd), "(-)")
}
export let int_times = function (a: Expr<Val>, b:Expr<Val>, sr:SourceRange): Expr<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "i" || ab.snd.k != "i" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => int(ab_val.fst * ab_val.snd), `(*) at ${sr.to_string()}`)
}
export let int_div = function (a: Expr<Val>, b:Expr<Val>): Expr<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "i" || ab.snd.k != "i" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => int(Math.floor(ab_val.fst / ab_val.snd)), "(/)")
}
export let int_mod = function (a: Expr<Val>, b:Expr<Val>): Expr<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "i" || ab.snd.k != "i" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => int(ab_val.fst % ab_val.snd), "(%)")
}
export let int_gt = function (a: Expr<Val>, b:Expr<Val>): Expr<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "i" || ab.snd.k != "i" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => bool(ab_val.fst > ab_val.snd), "(>)")
}
export let int_lt = function (a: Expr<Val>, b:Expr<Val>): Expr<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "i" || ab.snd.k != "i" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => bool(ab_val.fst < ab_val.snd), "(<)")
}
export let int_geq = function (a: Expr<Val>, b:Expr<Val>): Expr<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "i" || ab.snd.k != "i" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => bool(ab_val.fst >= ab_val.snd), "(>=)")
}
export let int_leq = function (a: Expr<Val>, b:Expr<Val>): Expr<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "i" || ab.snd.k != "i" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => bool(ab_val.fst <= ab_val.snd), "(<=)")
}
export let int_eq = function (a: Expr<Val>, b:Expr<Val>): Expr<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "i" || ab.snd.k != "i" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => bool(ab_val.fst == ab_val.snd), "(==)")
}
export let int_neq = function (a: Expr<Val>, b:Expr<Val>): Expr<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "i" || ab.snd.k != "i" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => bool(ab_val.fst != ab_val.snd), "(!=)")
}
export let bool_neq = function (a: Expr<Val>, b:Expr<Val>): Expr<Val> {
  return lift_binary_operation<boolean,boolean>(a, b,
          ab => ab.fst.k != "b" || ab.snd.k != "b" ? inr<Prod<boolean,boolean>, Unit>().f({}) : inl<Prod<boolean,boolean>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => bool(ab_val.fst != ab_val.snd), "(!=)")
}
export let float_plus = function (a: Expr<Val>, b:Expr<Val>): Expr<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "f" || ab.snd.k != "f" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => float(ab_val.fst + ab_val.snd), "(+)")
}
export let float_minus = function (a: Expr<Val>, b:Expr<Val>): Expr<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "f" || ab.snd.k != "f" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => float(ab_val.fst - ab_val.snd), "(-)")
}
export let float_times = function (a: Expr<Val>, b:Expr<Val>, sr:SourceRange): Expr<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "f" || ab.snd.k != "f" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => float(ab_val.fst * ab_val.snd), `(*) at ${sr.to_string()}`)
}
export let float_div = function (a: Expr<Val>, b:Expr<Val>): Expr<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "f" || ab.snd.k != "f" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => float(ab_val.fst / ab_val.snd), "(/)")
}
export let float_gt = function (a: Expr<Val>, b:Expr<Val>): Expr<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "f" || ab.snd.k != "f" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => bool(ab_val.fst > ab_val.snd), "(>)")
}
export let float_lt = function (a: Expr<Val>, b:Expr<Val>): Expr<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "f" || ab.snd.k != "f" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => bool(ab_val.fst < ab_val.snd), "(<)")
}
export let float_geq = function (a: Expr<Val>, b:Expr<Val>): Expr<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "f" || ab.snd.k != "f" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => bool(ab_val.fst >= ab_val.snd), "(>=)")
}
export let float_leq = function (a: Expr<Val>, b:Expr<Val>): Expr<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "f" || ab.snd.k != "f" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => bool(ab_val.fst <= ab_val.snd), "(<=)")
}
export let float_eq = function (a: Expr<Val>, b:Expr<Val>): Expr<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "f" || ab.snd.k != "f" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => bool(ab_val.fst == ab_val.snd), "(==)")
}
export let float_neq = function (a: Expr<Val>, b:Expr<Val>): Expr<Val> {
  return lift_binary_operation<number,number>(a, b,
          ab => ab.fst.k != "f" || ab.snd.k != "f" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => bool(ab_val.fst != ab_val.snd), "(!=)")
}

export let string_plus = function (a: Expr<Val>, b:Expr<Val>): Expr<Val> {
  return lift_binary_operation<string,string>(a, b,
          ab => ab.fst.k != "s" || ab.snd.k != "s" ? inr<Prod<string,string>, Unit>().f({}) : inl<Prod<string,string>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => str(ab_val.fst + ab_val.snd), "(+)")
}

let lift_unary_operation = function<a> (a: Expr<Val>, check_type:(a:Val) => Sum<a, Unit>, actual_operation:(_:a)=>Val, operator_name?:string): Expr<Val> {
  return a.then(a_val =>
    apply(fun(check_type).then((fun(actual_operation).then(fun<Val, Expr<Val>>(co_unit))).plus(constant<Unit,Expr<Val>>(
      runtime_error(`Type error: cannot perform ${operator_name} on value ${a_val.v}.`)))), a_val))
}
export let bool_not = function (a: Expr<Val>): Expr<Val> {
  return lift_unary_operation<boolean>(a,
          ab => ab.k != "b" ? inr<boolean, Unit>().f({}) : inl<boolean, Unit>().f(ab.v),
          ab_val => bool(!ab_val), "(!)")
}
export let int_minus_unary = function (a: Expr<Val>): Expr<Val> {
  return lift_unary_operation<number>(a,
          ab => ab.k != "i" ? inr<number, Unit>().f({}) : inl<number, Unit>().f(ab.v),
          ab_val => int(-ab_val), "(-)")
}
export let float_minus_unary = function (a: Expr<Val>): Expr<Val> {
  return lift_unary_operation<number>(a,
          ab => ab.k != "f" ? inr<number, Unit>().f({}) : inl<number, Unit>().f(ab.v),
          ab_val => float(-ab_val), "(-)")
}
export let string_length = function (a: Expr<Val>): Expr<Val> {
  return lift_unary_operation<string>(a,
          ab => ab.k != "s" ? inr<string, Unit>().f({}) : inl<string, Unit>().f(ab.v),
          ab_val => int(ab_val.length), "(length)")
}
