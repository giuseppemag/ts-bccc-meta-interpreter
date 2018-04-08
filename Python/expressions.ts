import * as Immutable from "immutable"
import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair } from "ts-bccc"
import * as CCC from "ts-bccc"
import * as St from "ts-bccc"
import { mk_state, State } from "ts-bccc"
import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
import * as Co from "ts-bccc"

import { StmtRt, ExprRt, Interface, MemRt, ErrVal, Val, Lambda, Bool,
  ValueName, HeapRef,
  set_arr_el_rt, set_arr_el_expr_rt, set_class_def_rt, set_fun_def_rt, set_heap_v_rt, set_v_rt, set_v_expr_rt, set_highlighting_rt,
  runtime_error,
  mk_bool_val, mk_int_val, mk_float_val, mk_lambda_val, new_arr_rt, new_obj_rt, mk_arr_val,
  ArrayVal, empty_memory_rt, empty_scope_val,
  mk_obj_val, mk_ref_val, Scope,
  mk_string_val,
  mk_unit_val, get_arr_len_rt, get_arr_el_rt, get_class_def_rt, get_fun_def_rt,
  get_heap_v_rt, get_v_rt, pop_scope_rt, push_scope_rt, mk_tuple_val, RenderSurface } from "./memory"
import { SourceRange } from "../source_range";
import { mk_render_surface_val, RenderSurfaceOperation, mk_render_surface_operation_val, mk_circle_op, mk_square_op, mk_rectangle_op, mk_ellipse_op, mk_other_surface_op, mk_sprite_op, mk_line_op, mk_polygon_op, mk_text_op } from "./python";
import { comm_list_coroutine } from "../ccc_aux";

export interface BoolCat extends Fun<Unit, Sum<Unit,Unit>> {}
export let FalseCat:BoolCat = unit<Unit>().then(inl<Unit,Unit>())
export let TrueCat:BoolCat  = unit<Unit>().then(inr<Unit,Unit>())
export let bool_to_boolcat : Fun<Bool, BoolCat> = fun(b => b ? TrueCat : FalseCat)

export let unit_expr = () => (co_unit<MemRt,ErrVal,Sum<Val,Val>>(apply(inl<Val,Val>(),mk_unit_val)))
export let str_expr = (s:string) => (co_unit<MemRt,ErrVal,Sum<Val,Val>>(apply(inl(), mk_string_val(s))))
export let float_expr = (n:number) => (co_unit<MemRt,ErrVal,Sum<Val,Val>>(apply(inl(), mk_float_val(n))))
export let int_expr = (n:number) => (co_unit<MemRt,ErrVal,Sum<Val,Val>>(apply(inl(), mk_int_val(n))))
export let arr_expr = (a:ArrayVal) => (co_unit<MemRt,ErrVal,Sum<Val,Val>>(apply(inl(), mk_arr_val(a))))
export let tuple_expr = (a:Array<Val>) => (co_unit<MemRt,ErrVal,Sum<Val,Val>>(apply(inl(), mk_tuple_val(a))))
export let bool_expr = (s:boolean) => (co_unit<MemRt,ErrVal,Sum<Val,Val>>(apply(inl(), mk_bool_val(s))))
export let lambda_expr = (l:Lambda) => (co_unit<MemRt,ErrVal,Sum<Val,Val>>(apply(inl(), mk_lambda_val(l))))
export let obj_expr = (o:Scope) => (co_unit<MemRt,ErrVal,Sum<Val,Val>>(apply(inl(), mk_obj_val(o))))
export let ref_expr = (r:ValueName) => (co_unit<MemRt,ErrVal,Sum<Val,Val>>(apply(inl(), mk_ref_val(r))))
export let val_expr = (v:Sum<Val,Val>) => (co_unit<MemRt,ErrVal,Sum<Val,Val>>(v))
export let render_surface_expr = (v:RenderSurface) => (co_unit<MemRt,ErrVal,Sum<Val,Val>>(apply(inl(), mk_render_surface_val(v))))
export let render_surface_operation_expr = (v:RenderSurfaceOperation) => (co_unit<MemRt,ErrVal,Sum<Val,Val>>(apply(inl(), mk_render_surface_operation_val(v))))

let lift_binary_operation = function<a,b> (a: ExprRt<Sum<Val,Val>>, b:ExprRt<Sum<Val,Val>>, check_types:(ab:Prod<Val,Val>) => Sum<Prod<a,b>, Unit>, actual_operation:(_:Prod<a,b>)=>Val, operator_name?:string): ExprRt<Sum<Val,Val>> {
  return a.then(a_val => b.then(b_val =>
    apply(fun(check_types).then((fun(actual_operation).then(inl<Val,Val>()).then(fun<Sum<Val,Val>, ExprRt<Sum<Val,Val>>>(co_unit))).plus(
      constant<Unit,ExprRt<Sum<Val,Val>>>(runtime_error(`Type error: cannot perform ${operator_name} on ${a_val.value.v} and ${b_val.value.v}.`)))), { fst:a_val.value, snd:b_val.value })))
}
export let tuple_expr_rt = (args:Array<ExprRt<Sum<Val,Val>>>) : ExprRt<Sum<Val,Val>> => {
  let eval_args = comm_list_coroutine(Immutable.List<ExprRt<Sum<Val,Val>>>(args))
  return eval_args.then(arg_vals => (co_unit<MemRt,ErrVal,Sum<Val,Val>>(apply(inl(), mk_tuple_val(arg_vals.toArray().map(a => a.value))))))
}

export let tuple_get_rt = (r:SourceRange, t:ExprRt<Sum<Val,Val>>, item_index:number) : ExprRt<Sum<Val,Val>> => {
  return t.then(t_val =>
        t_val.value.k == "tuple" ? co_unit(apply(inl<Val,Val>(), t_val.value.v[item_index]))
        : runtime_error(`Type error (tuple): cannot lookup item ${item_index} on non-tuple value ${t_val.value}.`))
}

export let record_get_rt = (r:SourceRange, t:ExprRt<Sum<Val,Val>>, F_name:string) : ExprRt<Sum<Val,Val>> => {
  return t.then(t_val =>
        t_val.value.k == "record" && t_val.value.v.has(F_name) ? co_unit(apply(inl<Val,Val>(), t_val.value.v.get(F_name)))
        : runtime_error(`Type error (record): cannot lookup item ${F_name} on ${JSON.stringify( t_val.value)}.`))
}

export let render_surface_plus_rt = function (r: ExprRt<Sum<Val, Val>>, p:ExprRt<Sum<Val, Val>>): ExprRt<Sum<Val, Val>> {
  return lift_binary_operation<RenderSurface,RenderSurfaceOperation>(r, p,
          ab => ab.fst.k != "render surface" || ab.snd.k != "render surface operation" ? inr<Prod<RenderSurface,RenderSurfaceOperation>, Unit>().f({}) : inl<Prod<RenderSurface,RenderSurfaceOperation>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
          ab_val => mk_render_surface_val({...ab_val.fst, operations:ab_val.fst.operations.push(ab_val.snd) }), "(+)")
}

export let mk_empty_render_surface_rt = function (width: ExprRt<Sum<Val,Val>>, height:ExprRt<Sum<Val,Val>>, color:ExprRt<Sum<Val,Val>>): ExprRt<Sum<Val, Val>> {
  return width.then(w => height.then(h => color.then(col =>
    w.value.k == "f" && h.value.k == "f" && col.value.k == "s" ?
      render_surface_expr({ width:w.value.v, height:h.value.v, operations:Immutable.List<RenderSurfaceOperation>([{ kind:"rectangle", x:0, y:0, width:w.value.v, height:h.value.v, color:col.value.v, rotation:0 }]) })
    : runtime_error(`Type error: cannot create empty render surface with ${w.value.v}, ${h.value.v}, and ${col.value.v}.`)
  )))
}

export let mk_circle_rt = function (x: ExprRt<Sum<Val,Val>>, y:ExprRt<Sum<Val,Val>>, r:ExprRt<Sum<Val,Val>>, color:ExprRt<Sum<Val,Val>>): ExprRt<Sum<Val, Val>> {
  return x.then(x_v => y.then(y_v => r.then(r_v => color.then(col =>
    x_v.value.k == "f" && y_v.value.k == "f" && r_v.value.k == "f" && col.value.k == "s" ?
      render_surface_operation_expr(mk_circle_op(x_v.value.v, y_v.value.v, r_v.value.v, col.value.v))
    : runtime_error(`Type error: cannot create circle with ${x_v.value.v}, ${y_v.value.v}, ${r_v.value.v} and ${col.value.v}.`)
  ))))
}

export let mk_square_rt = function (x: ExprRt<Sum<Val,Val>>, y:ExprRt<Sum<Val,Val>>, s:ExprRt<Sum<Val,Val>>, color:ExprRt<Sum<Val,Val>>, rot:ExprRt<Sum<Val,Val>>): ExprRt<Sum<Val, Val>> {
  return x.then(x_v => y.then(y_v => s.then(s_v => color.then(col => rot.then(rot_v =>
    x_v.value.k == "f" && y_v.value.k == "f" && s_v.value.k == "f" && col.value.k == "s" && rot_v.value.k == "f" ?
      render_surface_operation_expr(mk_square_op(x_v.value.v, y_v.value.v, s_v.value.v, col.value.v, rot_v.value.v))
    : runtime_error(`Type error: cannot create square with ${x_v.value.v}, ${y_v.value.v}, ${s_v.value.v} and ${col.value.v}.`)
  )))))
}

export let mk_rectangle_rt = function (x: ExprRt<Sum<Val,Val>>, y:ExprRt<Sum<Val,Val>>, w:ExprRt<Sum<Val,Val>>, h:ExprRt<Sum<Val,Val>>, color:ExprRt<Sum<Val,Val>>, rot:ExprRt<Sum<Val,Val>>): ExprRt<Sum<Val, Val>> {
  return x.then(x_v => y.then(y_v => w.then(w_v => h.then(h_v => color.then(col => rot.then(rot_v =>
    x_v.value.k == "f" && y_v.value.k == "f" && w_v.value.k == "f" && h_v.value.k == "f" && col.value.k == "s" && rot_v.value.k == "f" ?
      render_surface_operation_expr(mk_rectangle_op(x_v.value.v, y_v.value.v, w_v.value.v, h_v.value.v, col.value.v, rot_v.value.v))
    : runtime_error(`Type error: cannot create rectangle with ${x_v.value.v}, ${y_v.value.v}, ${w_v.value.v}, ${h_v.value.v} and ${col.value.v}.`)
  ))))))
}

export let mk_line_rt = function (x1: ExprRt<Sum<Val,Val>>, y1:ExprRt<Sum<Val,Val>>, x2: ExprRt<Sum<Val,Val>>, y2:ExprRt<Sum<Val,Val>>, w:ExprRt<Sum<Val,Val>>, color:ExprRt<Sum<Val,Val>>, rot:ExprRt<Sum<Val,Val>>): ExprRt<Sum<Val, Val>> {
  return x1.then(x1_v => y1.then(y1_v => x2.then(x2_v => y2.then(y2_v => w.then(w_v => color.then(col => rot.then(rot_v =>
    x1_v.value.k == "f" && y1_v.value.k == "f" && x2_v.value.k == "f" && y2_v.value.k == "f" && w_v.value.k == "f" && col.value.k == "s" && rot_v.value.k == "f" ?
      render_surface_operation_expr(mk_line_op(x1_v.value.v, y1_v.value.v, x2_v.value.v, y2_v.value.v, w_v.value.v, col.value.v, rot_v.value.v))
    : runtime_error(`Type error: cannot create line with ${x1_v.value.v}, ${y1_v.value.v}, ${x2_v.value.v}, ${y2_v.value.v}, ${w_v.value.v}, and ${col.value.v}.`)
  )))))))
}

export let mk_polygon_rt = function(points:ExprRt<Sum<Val,Val>>, col:ExprRt<Sum<Val,Val>>, rot:ExprRt<Sum<Val,Val>>) : ExprRt<Sum<Val,Val>> {
  return points.then(points_v =>
          col.then(col_v =>
          rot.then(rot_v =>
          points_v.value.k != "ref" ? runtime_error(`Type error: cannot create polygon with ${points_v.value.v}, ${col_v.value.v}, and ${rot_v.value.v}.`)
          : 
          get_heap_v_rt(points_v.value.v).then(points_arr_v =>
          col_v.value.k == "s" && rot_v.value.k == "f" && points_arr_v.value.k == "arr" ?
                render_surface_operation_expr(
                  mk_polygon_op(
                    points_arr_v.value.v.elements.toArray().map(e =>
                      e.k == "tuple" && e.v[0].k == "f" && e.v[1].k == "f" ? ({ x:e.v[0].v as number, y:e.v[1].v as number }) : 
                      ({ x:0, y:0 })),
                      col_v.value.v, rot_v.value.v))
            : runtime_error(`Type error: cannot create polygon with ${points_v.value.v}, ${col_v.value.v}, and ${rot_v.value.v}.`)
            ))))
}

export let mk_text_rt = function (text:ExprRt<Sum<Val,Val>>, x: ExprRt<Sum<Val,Val>>, y:ExprRt<Sum<Val,Val>>, s:ExprRt<Sum<Val,Val>>, color:ExprRt<Sum<Val,Val>>, rotation:ExprRt<Sum<Val,Val>>): ExprRt<Sum<Val, Val>> {
  return text.then(t_v => x.then(x_v => y.then(y_v => s.then(s_v => color.then(col => rotation.then(rot =>
    t_v.value.k == "s" && x_v.value.k == "f" && y_v.value.k == "f" && s_v.value.k == "f" && col.value.k == "s" && rot.value.k == "f" ?
      render_surface_operation_expr(mk_text_op(t_v.value.v, x_v.value.v, y_v.value.v, s_v.value.v, col.value.v, rot.value.v))
    : runtime_error(`Type error: cannot create text with ${t_v.value.v}, ${x_v.value.v}, ${y_v.value.v}, ${s_v.value.v}, ${col.value.v} and ${rot.value.v}.`)
  ))))))
}


export let mk_sprite_rt = function (sprite: ExprRt<Sum<Val,Val>>, x: ExprRt<Sum<Val,Val>>, y:ExprRt<Sum<Val,Val>>, w:ExprRt<Sum<Val,Val>>, h:ExprRt<Sum<Val,Val>>, rot:ExprRt<Sum<Val,Val>>): ExprRt<Sum<Val, Val>> {
  return sprite.then(sprite_v => x.then(x_v => y.then(y_v => w.then(w_v => h.then(h_v => rot.then(rot_v =>
    sprite_v.value.k == "s" && x_v.value.k == "f" && y_v.value.k == "f" && w_v.value.k == "f" && h_v.value.k == "f" && rot_v.value.k == "f" ?
      render_surface_operation_expr(mk_sprite_op(sprite_v.value.v, x_v.value.v, y_v.value.v, w_v.value.v, h_v.value.v, rot_v.value.v))
    : runtime_error(`Type error: cannot create sprite with ${x_v.value.v}, ${y_v.value.v}, ${w_v.value.v}, ${h_v.value.v} and ${rot_v.value.v}.`)
  ))))))
}

export let mk_ellipse_rt = function (x: ExprRt<Sum<Val,Val>>, y:ExprRt<Sum<Val,Val>>, w:ExprRt<Sum<Val,Val>>, h:ExprRt<Sum<Val,Val>>, color:ExprRt<Sum<Val,Val>>, rot:ExprRt<Sum<Val,Val>>): ExprRt<Sum<Val, Val>> {
  return x.then(x_v => y.then(y_v => w.then(w_v => h.then(h_v => color.then(col => rot.then(rot_v =>
    x_v.value.k == "f" && y_v.value.k == "f" && w_v.value.k == "f" && h_v.value.k == "f" && col.value.k == "s" && rot_v.value.k == "f" ?
      render_surface_operation_expr(mk_ellipse_op(x_v.value.v, y_v.value.v, w_v.value.v, h_v.value.v, col.value.v, rot_v.value.v))
    : runtime_error(`Type error: cannot create ellipse with ${x_v.value.v}, ${y_v.value.v}, ${w_v.value.v}, ${h_v.value.v} and ${col.value.v}.`)
  ))))))
}

export let mk_other_surface_rt = function (s:ExprRt<Sum<Val,Val>>, dx: ExprRt<Sum<Val,Val>>, dy:ExprRt<Sum<Val,Val>>, sx:ExprRt<Sum<Val,Val>>, sy:ExprRt<Sum<Val,Val>>, rot:ExprRt<Sum<Val,Val>>): ExprRt<Sum<Val, Val>> {
  return dx.then(dx_v => dy.then(dy_v => sx.then(sx_v => sy.then(sy_v => s.then(s_v => rot.then(rot_v =>
    dx_v.value.k == "f" && dy_v.value.k == "f" && sx_v.value.k == "f" && sy_v.value.k == "f" && s_v.value.k == "render surface" && rot_v.value.k == "f" ?
      render_surface_operation_expr(mk_other_surface_op(s_v.value.v, dx_v.value.v, dy_v.value.v, sx_v.value.v, sy_v.value.v, rot_v.value.v))
    : runtime_error(`Type error: cannot create other surface with ${dx_v.value.v}, ${dy_v.value.v}, ${sx_v.value.v}, ${sy_v.value.v}, ${s_v.value.v}, and ${rot_v.value.v}.`)
  ))))))
}

let lift_unary_operation = function<a> (a: ExprRt<Sum<Val, Val>>, check_type:(a:Val) => Sum<a, Unit>, actual_operation:(_:a)=>Val, operator_name?:string): ExprRt<Sum<Val, Val>> {
  return a.then(a_val =>
    apply(fun(check_type).then((fun(actual_operation).then(inl<Val,Val>()).then(fun<Sum<Val,Val>, ExprRt<Sum<Val, Val>>>(co_unit))).plus(constant<Unit,ExprRt<Sum<Val, Val>>>(
      runtime_error(`Type error: cannot perform ${operator_name} on value ${a_val.value.v}.`)))), a_val.value))
}
export let int_minus_unary_rt = function (a: ExprRt<Sum<Val, Val>>): ExprRt<Sum<Val, Val>> {
  return lift_unary_operation<number>(a,
          ab => ab.k != "i" ? inr<number, Unit>().f({}) : inl<number, Unit>().f(ab.v),
          ab_val => mk_int_val(-ab_val), "(-)")
}
export let float_minus_unary_rt = function (a: ExprRt<Sum<Val, Val>>): ExprRt<Sum<Val, Val>> {
  return lift_unary_operation<number>(a,
          ab => ab.k != "f" ? inr<number, Unit>().f({}) : inl<number, Unit>().f(ab.v),
          ab_val => mk_float_val(-ab_val), "(-)")
}
export let string_length_rt = function (a: ExprRt<Sum<Val, Val>>): ExprRt<Sum<Val, Val>> {
  return lift_unary_operation<string>(a,
          ab => ab.k != "s" ? inr<string, Unit>().f({}) : inl<string, Unit>().f(ab.v),
          ab_val => mk_int_val(ab_val.length), "(length)")
}
