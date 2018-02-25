import * as Immutable from "immutable"
import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, fun2, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair, distribute_sum_prod_inv, distribute_sum_prod, fun3, co_get_state, co_set_state, Option } from "ts-bccc"
import * as CCC from "ts-bccc"
import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
import * as Co from "ts-bccc"
import { SourceRange, mk_range, zero_range } from "../source_range"
import * as Sem from "../Python/python"
import { comm_list_coroutine, co_stateless } from "../ccc_aux";
import { ValueName, tuple_to_record } from "../main";

// Bindings

export type Name = string
export interface Err { message:string, range:SourceRange }
export interface MethodTyping { typing:Typing, modifiers:Immutable.Set<Modifier> }
export interface FieldType { type:Type, modifiers:Immutable.Set<Modifier> }
export type RenderOperationType = { kind:"circle"} | { kind:"square"} | { kind:"rectangle"} | { kind:"ellipse"} | { kind:"other surface"} | { kind:"sprite"}
export type Type = { kind:"render-grid-pixel"} | { kind:"render-grid"}
                 | { kind:"render surface"} | RenderOperationType
                 | { kind:"unit"} | { kind:"bool"} | { kind:"var"} | { kind:"int"} | { kind:"float"} | { kind:"string"} | { kind:"fun", in:Type, out:Type }
                 | { kind:"obj", C_name:string, methods:Immutable.Map<Name, MethodTyping>, fields:Immutable.Map<Name, FieldType> }
                 | { kind:"ref", C_name:string } | { kind:"arr", arg:Type } | { kind:"tuple", args:Array<Type> }
                 | { kind:"record", args:Immutable.Map<Name, Type> }
                 | { kind:"generic type decl", f:Type, args:Array<Type> }
export let render_grid_type : Type = { kind:"render-grid" }
export let render_grid_pixel_type : Type = { kind:"render-grid-pixel" }

export let render_surface_type : Type = { kind:"render surface" }
export let circle_type : Type = { kind:"circle" }
export let square_type : Type = { kind:"square" }
export let ellipse_type : Type = { kind:"ellipse" }
export let rectangle_type : Type = { kind:"rectangle" }
export let other_render_surface_type : Type = { kind:"other surface" }

export let sprite_type : Type = { kind:"sprite" }
export let unit_type : Type = { kind:"unit" }
export let int_type : Type = { kind:"int" }
export let var_type : Type = { kind:"var" }
export let string_type : Type = { kind:"string" }
export let bool_type : Type = { kind:"bool" }
export let float_type : Type = { kind:"float" }
export let fun_type : (i:Type,o:Type) => Type = (i,o) => ({ kind:"fun", in:i, out:o })
export let arr_type : (el:Type) => Type = (arg) => ({ kind:"arr", arg:arg })
export let tuple_type : (args:Array<Type>) => Type = (args) => ({ kind:"tuple", args:args })
export let record_type : (args:Immutable.Map<Name, Type>) => Type = (args) => ({ kind:"record", args:args })
export let ref_type : (C_name:string) => Type = (C_name) => ({ kind:"ref", C_name:C_name })
export let generic_type_decl = (f:Type, args:Array<Type>) : Type => ({ kind:"generic type decl", f:f, args:args })
export type TypeInformation = Type & { is_constant:boolean }
export interface Bindings extends Immutable.Map<Name, TypeInformation> {}
export interface State { highlighting:SourceRange, bindings:Bindings }
export interface Typing { type:TypeInformation, sem:Sem.ExprRt<Sum<Sem.Val,Sem.Val>> }
let mk_typing = (t:Type,s:Sem.ExprRt<Sum<Sem.Val,Sem.Val>>,is_constant?:boolean) : Typing => ({ type:{...t, is_constant:is_constant == undefined ? false : is_constant}, sem:s })
let mk_typing_cat = fun2(mk_typing)
let mk_typing_cat_full = fun2<TypeInformation, Sem.ExprRt<Sum<Sem.Val,Sem.Val>>, Typing>((t,s) => mk_typing(t,s,t.is_constant))

export let empty_state : State = { highlighting:zero_range, bindings:Immutable.Map<Name, TypeInformation>() }

export let load: Fun<Prod<string, State>, Sum<Unit,TypeInformation>> = fun(x =>
  x.snd.bindings.has(x.fst) ?
    apply(inr<Unit,TypeInformation>(), x.snd.bindings.get(x.fst))
  : apply(inl<Unit,TypeInformation>(), {}))
export let store: Fun<Prod<Prod<string, TypeInformation>, State>, State> = fun(x =>
    ({...x.snd, bindings:x.snd.bindings.set(x.fst.fst, x.fst.snd) }))

let type_equals = (t1:Type,t2:Type) : boolean => {
  if (t1.kind == "fun" && t2.kind == "fun") return type_equals(t1.in,t2.in) && type_equals(t1.out,t2.out)
  if (t1.kind == "tuple" && t2.kind == "tuple") return t1.args.length == t2.args.length &&
    t1.args.every((t1_arg,i) => type_equals(t1_arg, t2.args[i]))
  if (t1.kind == "record" && t2.kind == "record") return t1.args.count() == t2.args.count() &&
    t1.args.every((t1_arg,i) => t1_arg != undefined && i != undefined && t2.args.has(i) && type_equals(t1_arg, t2.args.get(i)))
  if (t1.kind == "arr" && t2.kind == "arr") return type_equals(t1.arg,t2.arg)
  if (t1.kind == "obj" && t2.kind == "obj") return !t1.methods.some((v1,k1) => v1 == undefined || k1 == undefined || !t2.methods.has(k1) || !type_equals(t2.methods.get(k1).typing.type, v1.typing.type)) &&
      !t2.methods.some((v2,k2) => v2 == undefined || k2 == undefined || !t1.methods.has(k2))
  return t1.kind == t2.kind
}

// Basic statements and expressions
let wrap_co_res = Co.value<State,Err,Typing>().then(Co.result<State,Err,Typing>())
let wrap_co = wrap_co_res.then(Co.no_error())
export type TypeConstraints = Option<Type>
export let no_constraints:TypeConstraints = inr<Type,Unit>().f({})
export type Stmt = (constraints:TypeConstraints) => Coroutine<State, Err, Typing>
export let get_v = function(r:SourceRange, v:Name) : Stmt {
  let f = load.then(
    constant<Unit,Err>({ range:r, message:`Error: variable ${v} does not exist.` }).map_plus(
    (id<TypeInformation>().times(constant<TypeInformation, Sem.ExprRt<Sum<Sem.Val,Sem.Val>>>(Sem.get_v_rt(v)))).then(mk_typing_cat_full)
  ))
  let g = snd<Name,State>().times(f).then(distribute_sum_prod())
  let g1 = g.then(
    (snd<State,Err>()).map_plus(
    (swap_prod<State,Typing>().then(wrap_co_res))
  ))
  let h = apply(curry(g1), v)
  return _ => mk_coroutine<State,Err,Typing>(h)
}
export let decl_v = function(r:SourceRange, v:Name, t:Type, is_constant?:boolean) : Stmt {
  let f = store.then(constant<State, Typing>(mk_typing(unit_type, Sem.decl_v_rt(v, apply(inl(), Sem.mk_unit_val)))).times(id())).then(wrap_co)
  let g = curry(f)
  let args = apply(constant<Unit,Name>(v).times(constant<Unit,TypeInformation>({...t, is_constant:is_constant != undefined ? is_constant : false})), {})
  return _ => mk_coroutine<State,Err,Typing>(apply(g, args))
}
export let decl_and_init_v = function(r:SourceRange, v:Name, t:Type, e:Stmt, is_constant?:boolean) : Stmt {
  return _ => e(apply(inl(), t)).then(e_val => {
    let actual_t = t.kind == "var" ? e_val.type : t
    if (type_equals(e_val.type, actual_t)) {
      let f = store.then(constant<State, Typing>(mk_typing(unit_type, e_val.sem.then(e_val => Sem.decl_v_rt(v, apply(inl(), e_val.value))))).times(id())).then(wrap_co)
      let g = curry(f)
      let args = apply(constant<Unit,Name>(v).times(constant<Unit,TypeInformation>({...actual_t, is_constant:is_constant != undefined ? is_constant : false})), {})
      return mk_coroutine<State,Err,Typing>(apply(g, args))
    } else {
      if (e_val.type.kind == "tuple" && actual_t.kind == "record" && type_equals(e_val.type, tuple_type(actual_t.args.toArray()))) {
        console.log("apparently these two are equal to each other", JSON.stringify([e_val.type, tuple_type(actual_t.args.toArray())]))
        let record_labels = actual_t.args.keySeq().toArray()
        let f = store.then(constant<State, Typing>(mk_typing(unit_type, e_val.sem.then(e_val => Sem.decl_v_rt(v, apply(inl(), tuple_to_record(e_val.value, record_labels)))))).times(id())).then(wrap_co)
        let g = curry(f)
        let args = apply(constant<Unit,Name>(v).times(constant<Unit,TypeInformation>({...actual_t, is_constant:is_constant != undefined ? is_constant : false})), {})
        return mk_coroutine<State,Err,Typing>(apply(g, args))
      } else {
        return co_error<State,Err,Typing>({ range:r, message:`Error: cannot assign ${JSON.stringify(v)} to ${JSON.stringify(e_val)}: type ${JSON.stringify(actual_t)} does not match ${JSON.stringify(e_val.type)}` })
      }
    }
  })
}
export let decl_const = function(r:SourceRange, c:Name, t:Type, e:Stmt) : Stmt {
  let f = store.then(constant<State, Typing>(mk_typing(unit_type, Sem.decl_v_rt(c, apply(inl(), Sem.mk_unit_val)))).times(id())).then(wrap_co)
  let g = curry(f)
  let args = apply(constant<Unit,Name>(c).times(constant<Unit,TypeInformation>({...t, is_constant:true})), {})
  return _ => mk_coroutine<State,Err,Typing>(apply(g, args)).then(_ =>
         e(no_constraints).then(e_val =>
         get_v(r, c)(no_constraints).then(c_val =>
         type_equals(e_val.type, c_val.type) ?
           co_unit(mk_typing(unit_type, Sem.set_v_expr_rt(c, e_val.sem)))
         : co_error<State,Err,Typing>({ range:r, message:`Error: cannot assign ${JSON.stringify(c)} to ${JSON.stringify(e)}: type ${JSON.stringify(c_val.type)} does not match ${JSON.stringify(e_val.type)}` })
         )))
}

export let set_v = function(r:SourceRange, v:Name, e:Stmt) : Stmt {
  return _ => get_v(r, v)(no_constraints).then(v_val =>
          e(apply(inl(), v_val.type)).then(e_val => {
           if (type_equals(e_val.type, v_val.type) && !v_val.type.is_constant) {
             return co_unit(mk_typing(unit_type, Sem.set_v_expr_rt(v, e_val.sem)))
            } else if (v_val.type.is_constant) {
              return co_error<State,Err,Typing>({ range:r, message:`Error: cannot assign anything to ${v}: it is a constant.` })
            } else if (e_val.type.kind == "tuple" && v_val.type.kind == "record" && type_equals(e_val.type, tuple_type(v_val.type.args.toArray()))) {
              let record_labels = v_val.type.args.keySeq().toArray()
              let f = store.then(constant<State, Typing>(mk_typing(unit_type, e_val.sem.then(e_val => Sem.set_v_rt(v, apply(inl(), tuple_to_record(e_val.value, record_labels)))))).times(id())).then(wrap_co)
              let g = curry(f)
              let args = apply(constant<Unit,Name>(v).times(constant<Unit,TypeInformation>({...v_val.type, is_constant:false})), {})
              return mk_coroutine<State,Err,Typing>(apply(g, args))
            } else {
              return co_error<State,Err,Typing>({ range:r, message:`Error: cannot assign ${JSON.stringify(v)} to ${JSON.stringify(e)}: type ${JSON.stringify(v_val.type)} does not match ${JSON.stringify(e_val.type)}` })
            }
          }

        ))
}

export let bool = function(b:boolean) : Stmt {
  return _ => co_unit(mk_typing(bool_type, Sem.bool_expr(b)))
}

export let str = function(s:string) : Stmt {
  return _ => co_unit(mk_typing(string_type, Sem.str_expr(s)))
}

export let int = function(i:number) : Stmt {
  return _ => co_unit(mk_typing(int_type, Sem.int_expr(i)))
}

export let tuple_value = function(r:SourceRange, args:Array<Stmt>) : Stmt {
  return constraints => {
    if (constraints.kind == "left" && constraints.value.kind == "record")
      constraints = apply(inl(), tuple_type(constraints.value.args.toArray()))
    // console.log("Typechecking tuple value with constraints", constraints)
    if (constraints.kind == "left" && constraints.value.kind != "tuple")
      return co_error<State,Err,Typing>({ range:r, message:`Error: wrong constraints ${constraints} when typechecking tuple.` })
    let check_args = comm_list_coroutine(Immutable.List<Coroutine<State,Err,Typing>>(args.map((a, a_i) =>
      a(constraints.kind == "left" && constraints.value.kind == "tuple" ? apply(inl(), constraints.value.args[a_i])
        : no_constraints))))
    return check_args.then(arg_ts => co_unit(mk_typing(
      tuple_type(arg_ts.toArray().map(a_t => a_t.type)),
      Sem.tuple_expr_rt(arg_ts.toArray().map(a_t => a_t.sem)))))
    }
}

export let gt = function(r:SourceRange, a:Stmt, b:Stmt) : Stmt {
  return _ => a(no_constraints).then(a_t =>
         b(no_constraints).then(b_t =>
          type_equals(a_t.type, b_t.type) ?
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(bool_type, Sem.int_gt_rt(a_t.sem, b_t.sem)))
            : type_equals(a_t.type, float_type) ?
             co_unit(mk_typing(float_type, Sem.float_gt_rt(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>({ range:r, message:"Error: unsupported types for operator (>)!" })
          : co_error<State,Err,Typing>({ range:r, message:"Error: cannot compare expressions of different types!" })
        ))
}

export let lt = function(r:SourceRange, a:Stmt, b:Stmt) : Stmt {
  return _ => a(no_constraints).then(a_t =>
         b(no_constraints).then(b_t =>
          type_equals(a_t.type, b_t.type) ?
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(bool_type, Sem.int_lt_rt(a_t.sem, b_t.sem)))
            : type_equals(a_t.type, float_type) ?
             co_unit(mk_typing(float_type, Sem.float_lt_rt(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>({ range:r, message:"Error: unsupported types for operator (<)!" })
          : co_error<State,Err,Typing>({ range:r, message:"Error: cannot compare expressions of different types!" })
        ))
}

export let geq = function(r:SourceRange, a:Stmt, b:Stmt) : Stmt {
  return _ => a(no_constraints).then(a_t =>
         b(no_constraints).then(b_t =>
          type_equals(a_t.type, b_t.type) ?
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(bool_type, Sem.int_geq_rt(a_t.sem, b_t.sem)))
            : type_equals(a_t.type, float_type) ?
             co_unit(mk_typing(float_type, Sem.float_geq_rt(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>({ range:r, message:"Error: unsupported types for operator (>=)!" })
          : co_error<State,Err,Typing>({ range:r, message:"Error: cannot compare expressions of different types!" })
        ))
}

export let leq = function(r:SourceRange, a:Stmt, b:Stmt) : Stmt {
  return _ => a(no_constraints).then(a_t =>
         b(no_constraints).then(b_t =>
          type_equals(a_t.type, b_t.type) ?
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(bool_type, Sem.int_leq_rt(a_t.sem, b_t.sem)))
            : type_equals(a_t.type, float_type) ?
             co_unit(mk_typing(float_type, Sem.float_leq_rt(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>({ range:r, message:"Error: unsupported types for operator (<=)!" })
          : co_error<State,Err,Typing>({ range:r, message:"Error: cannot compare expressions of different types!" })
        ))
}

export let eq = function(r:SourceRange, a:Stmt, b:Stmt) : Stmt {
  return _ => a(no_constraints).then(a_t =>
         b(no_constraints).then(b_t =>
          type_equals(a_t.type, b_t.type) ?
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(bool_type, Sem.int_eq_rt(a_t.sem, b_t.sem)))
            : type_equals(a_t.type, float_type) ?
             co_unit(mk_typing(bool_type, Sem.float_eq_rt(a_t.sem, b_t.sem)))
            : type_equals(a_t.type, bool_type) ?
             co_unit(mk_typing(bool_type, Sem.bool_eq_rt(a_t.sem, b_t.sem)))
            : type_equals(a_t.type, string_type) ?
             co_unit(mk_typing(bool_type, Sem.string_eq_rt(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>({ range:r, message:"Error: unsupported types for operator (==)!" })
          : co_error<State,Err,Typing>({ range:r, message:"Error: cannot compare expressions of different types!" })
        ))
}

export let neq = function(r:SourceRange, a:Stmt, b:Stmt) : Stmt {
  return _ => a(no_constraints).then(a_t =>
         b(no_constraints).then(b_t =>
          type_equals(a_t.type, b_t.type) ?
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(bool_type, Sem.int_neq_rt(a_t.sem, b_t.sem)))
            : type_equals(a_t.type, float_type) ?
             co_unit(mk_typing(bool_type, Sem.float_neq_rt(a_t.sem, b_t.sem)))
            : type_equals(a_t.type, string_type) ?
             co_unit(mk_typing(bool_type, Sem.string_neq_rt(a_t.sem, b_t.sem)))
            : type_equals(a_t.type, bool_type) ?
             co_unit(mk_typing(bool_type, Sem.bool_neq_rt(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>({ range:r, message:"Error: unsupported types for operator (!=)!" })
          : co_error<State,Err,Typing>({ range:r, message:"Error: cannot compare expressions of different types!" })
        ))
}

export let xor = function(r:SourceRange, a:Stmt, b:Stmt) : Stmt {
  return _ => a(no_constraints).then(a_t =>
         b(no_constraints).then(b_t =>
          type_equals(a_t.type, b_t.type) ?
            type_equals(a_t.type, bool_type) ?
             co_unit(mk_typing(bool_type, Sem.bool_neq_rt(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>({ range:r, message:"Error: unsupported types for operator (^)!" })
          : co_error<State,Err,Typing>({ range:r, message:"Error: cannot compare expressions of different types!" })
        ))
}

export let mk_empty_render_grid = function(r:SourceRange, w:Stmt, h:Stmt) : Stmt {
  return _ => w(no_constraints).then(w_t =>
         h(no_constraints).then(h_t =>
          type_equals(w_t.type, int_type) && type_equals(h_t.type, int_type) ?
            co_unit(mk_typing(render_grid_type, Sem.mk_empty_render_grid_rt(w_t.sem, h_t.sem)))
          : co_error<State,Err,Typing>({ range:r, message:"Error: unsupported types for empty grid creation." })
         ))
}

export let mk_render_grid_pixel = function(r:SourceRange, w:Stmt, h:Stmt, st:Stmt) : Stmt {
  return _ => w(no_constraints).then(w_t =>
         h(no_constraints).then(h_t =>
         st(no_constraints).then(st_t =>
          type_equals(w_t.type, int_type) && type_equals(h_t.type, int_type) && type_equals(st_t.type, bool_type) ?
            co_unit(mk_typing(render_grid_pixel_type, Sem.mk_render_grid_pixel_rt(w_t.sem, h_t.sem, st_t.sem)))
          : co_error<State,Err,Typing>({ range:r, message:"Error: unsupported types for empty grid creation." })
         )))
}

export let mk_empty_surface = function(r:SourceRange, w:Stmt, h:Stmt, col:Stmt) : Stmt {
  return _ => w(no_constraints).then(w_t =>
              h(no_constraints).then(h_t =>
              col(no_constraints).then(col_t =>
                type_equals(w_t.type, int_type) && type_equals(h_t.type, int_type) && type_equals(col_t.type, string_type) ?
                co_unit(mk_typing(render_surface_type, Sem.mk_empty_render_surface_rt(w_t.sem, h_t.sem, col_t.sem)))
              : co_error<State,Err,Typing>({ range:r, message:"Error: unsupported types for empty grid creation." })
            )))
}

export let mk_circle = function(r:SourceRange, x:Stmt, y:Stmt, radius:Stmt, col:Stmt) : Stmt {
  return _ => x(no_constraints).then(x_t =>
              y(no_constraints).then(y_t =>
              radius(no_constraints).then(r_t =>
              col(no_constraints).then(col_t =>
              type_equals(x_t.type, int_type) && type_equals(y_t.type, int_type) &&
              type_equals(r_t.type, int_type) && type_equals(col_t.type, string_type) ?
                co_unit(mk_typing(circle_type, Sem.mk_circle_rt(x_t.sem, y_t.sem, r_t.sem, col_t.sem)))
              : co_error<State,Err,Typing>({ range:r, message:"Error: unsupported types for circle creation." })
              ))))
}

export let mk_square = function(r:SourceRange, x:Stmt, y:Stmt, radius:Stmt, col:Stmt) : Stmt {
  return _ => x(no_constraints).then(x_t =>
              y(no_constraints).then(y_t =>
              radius(no_constraints).then(r_t =>
              col(no_constraints).then(col_t =>
              type_equals(x_t.type, int_type) && type_equals(y_t.type, int_type) &&
              type_equals(r_t.type, int_type) && type_equals(col_t.type, string_type) ?
                co_unit(mk_typing(square_type, Sem.mk_square_rt(x_t.sem, y_t.sem, r_t.sem, col_t.sem)))
              : co_error<State,Err,Typing>({ range:r, message:"Error: unsupported types for square creation." })
              ))))
}

export let mk_ellipse = function(r:SourceRange, x:Stmt, y:Stmt, w:Stmt, h:Stmt, col:Stmt) : Stmt {
  return _ => x(no_constraints).then(x_t =>
              y(no_constraints).then(y_t =>
              w(no_constraints).then(w_t =>
              h(no_constraints).then(h_t =>
              col(no_constraints).then(col_t =>
              type_equals(x_t.type, int_type) && type_equals(y_t.type, int_type) &&
              type_equals(w_t.type, int_type) && type_equals(h_t.type, int_type) &&
              type_equals(col_t.type, string_type) ?
                co_unit(mk_typing(ellipse_type, Sem.mk_ellipse_rt(x_t.sem, y_t.sem, w_t.sem, h_t.sem, col_t.sem)))
              : co_error<State,Err,Typing>({ range:r, message:"Error: unsupported types for ellipse creation." })
              )))))
}

export let mk_rectangle = function(r:SourceRange, x:Stmt, y:Stmt, w:Stmt, h:Stmt, col:Stmt) : Stmt {
  return _ => x(no_constraints).then(x_t =>
              y(no_constraints).then(y_t =>
              w(no_constraints).then(w_t =>
              h(no_constraints).then(h_t =>
              col(no_constraints).then(col_t =>
              type_equals(x_t.type, int_type) && type_equals(y_t.type, int_type) &&
              type_equals(w_t.type, int_type) && type_equals(h_t.type, int_type) &&
              type_equals(col_t.type, string_type) ?
                co_unit(mk_typing(rectangle_type, Sem.mk_rectangle_rt(x_t.sem, y_t.sem, w_t.sem, h_t.sem, col_t.sem)))
              : co_error<State,Err,Typing>({ range:r, message:"Error: unsupported types for rectangle creation." })
              )))))
}

export let mk_sprite = function(r:SourceRange, sprite:Stmt, x:Stmt, y:Stmt, w:Stmt, h:Stmt, rot:Stmt) : Stmt {
  return _ => sprite(no_constraints).then(s_t =>
              x(no_constraints).then(x_t =>
              y(no_constraints).then(y_t =>
              w(no_constraints).then(w_t =>
              h(no_constraints).then(h_t =>
              rot(no_constraints).then(rot_t =>
              type_equals(s_t.type, string_type) &&
              type_equals(x_t.type, int_type) && type_equals(y_t.type, int_type) &&
              type_equals(w_t.type, int_type) && type_equals(h_t.type, int_type) &&
              type_equals(rot_t.type, int_type) ?
                co_unit(mk_typing(sprite_type, Sem.mk_sprite_rt(s_t.sem, x_t.sem, y_t.sem, w_t.sem, h_t.sem, rot_t.sem)))
              : co_error<State,Err,Typing>({ range:r, message:`Error: unsupported types for sprite creation.` })
              ))))))
}

export let mk_other_surface = function(r:SourceRange, s:Stmt, dx:Stmt, dy:Stmt, sx:Stmt, sy:Stmt) : Stmt {
  return _ => dx(no_constraints).then(dx_t =>
              dy(no_constraints).then(dy_t =>
              sx(no_constraints).then(sx_t =>
              sy(no_constraints).then(sy_t =>
              s(no_constraints).then(s_t =>
              type_equals(dx_t.type, int_type) && type_equals(dy_t.type, int_type) &&
              type_equals(sx_t.type, int_type) && type_equals(sy_t.type, int_type) &&
              type_equals(s_t.type, render_surface_type) ?
                co_unit(mk_typing(other_render_surface_type, Sem.mk_other_surface_rt(s_t.sem, dx_t.sem, dy_t.sem, sx_t.sem, sy_t.sem)))
              : co_error<State,Err,Typing>({ range:r, message:"Error: unsupported types for other surface displacement." })
              )))))
}

export let plus = function(r:SourceRange, a:Stmt, b:Stmt) : Stmt {
  return _ => a(no_constraints).then(a_t =>
         b(no_constraints).then(b_t =>
          type_equals(a_t.type, b_t.type) ?
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(int_type, Sem.int_plus_rt(a_t.sem, b_t.sem)))
            : type_equals(a_t.type, float_type) ?
             co_unit(mk_typing(int_type, Sem.float_plus_rt(a_t.sem, b_t.sem)))
            : type_equals(a_t.type, string_type) ?
             co_unit(mk_typing(string_type, Sem.string_plus_rt(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>({ range:r, message:"Error: unsupported types for operator (+)!" })
          : type_equals(a_t.type, render_grid_type) && type_equals(b_t.type, render_grid_pixel_type) ?
            co_unit(mk_typing(render_grid_type, Sem.render_grid_plus_rt(a_t.sem, b_t.sem)))
          : type_equals(a_t.type, render_surface_type) &&
            (type_equals(b_t.type, circle_type) || type_equals(b_t.type, square_type)
            || type_equals(b_t.type, ellipse_type) || type_equals(b_t.type, rectangle_type)
            || type_equals(b_t.type, sprite_type)
            || type_equals(b_t.type, other_render_surface_type)
            ) ?
            co_unit(mk_typing(render_surface_type, Sem.render_surface_plus_rt(a_t.sem, b_t.sem)))
          : co_error<State,Err,Typing>({ range:r, message:"Error: cannot sum expressions of non-compatible types! (" +  a_t.type.kind + "," + b_t.type.kind + ")" })
        ))
}

export let minus = function(r:SourceRange, a:Stmt, b:Stmt) : Stmt {
  return _ => a(no_constraints).then(a_t =>
         b(no_constraints).then(b_t =>
          type_equals(a_t.type, b_t.type) ?
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(int_type, Sem.int_minus_rt(a_t.sem, b_t.sem)))
            : type_equals(a_t.type, float_type) ?
             co_unit(mk_typing(float_type, Sem.float_minus_rt(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>({ range:r, message:"Error: unsupported types for operator (-)!" })
          : co_error<State,Err,Typing>({ range:r, message:"Error: cannot subtract expressions of different types!" })
        ))
}

export let div = function(r:SourceRange, a:Stmt, b:Stmt) : Stmt {
  return _ => a(no_constraints).then(a_t =>
         b(no_constraints).then(b_t =>
          type_equals(a_t.type, b_t.type) ?
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(int_type, Sem.int_div_rt(a_t.sem, b_t.sem)))
            : type_equals(a_t.type, float_type) ?
             co_unit(mk_typing(float_type, Sem.float_div_rt(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>({ range:r, message:"Error: unsupported types for operator (/)!" })
          : co_error<State,Err,Typing>({ range:r, message:"Error: cannot divide expressions of different types!" })
        ))
}

export let times = function(r:SourceRange, a:Stmt, b:Stmt, sr:SourceRange) : Stmt {
  return _ => a(no_constraints).then(a_t =>
         b(no_constraints).then(b_t =>
          type_equals(a_t.type, b_t.type) ?
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(int_type, Sem.int_times_rt(a_t.sem, b_t.sem, sr)))
            : type_equals(a_t.type, float_type) ?
             co_unit(mk_typing(float_type, Sem.float_times_rt(a_t.sem, b_t.sem, sr)))
            : co_error<State,Err,Typing>({ range:r, message:`Error (${sr.to_string()}): unsupported types for operator (*)!` })
          : co_error<State,Err,Typing>({ range:r, message:`Error (${sr.to_string()}): cannot multiply expressions of incompatible types!` })
        ))
}

export let mod = function(r:SourceRange, a:Stmt, b:Stmt) : Stmt {
  return _ => a(no_constraints).then(a_t =>
         b(no_constraints).then(b_t =>
          type_equals(a_t.type, b_t.type) ?
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(int_type, Sem.int_mod_rt(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>({ range:r, message:"Error: unsupported types for operator (-)!" })
          : co_error<State,Err,Typing>({ range:r, message:"Error: cannot mod expressions of different types!" })
        ))
}

export let minus_unary = function(r:SourceRange, a:Stmt) : Stmt {
  return _ => a(no_constraints).then(a_t =>
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(int_type, Sem.int_minus_unary_rt(a_t.sem)))
            : type_equals(a_t.type, float_type) ?
             co_unit(mk_typing(float_type, Sem.float_minus_unary_rt(a_t.sem)))
            : co_error<State,Err,Typing>({ range:r, message:"Error: unsupported type for unary operator (-)!" })
        )
}

export let or = function(r:SourceRange, a:Stmt, b:Stmt) : Stmt {
  return _ => a(no_constraints).then(a_t =>
         b(no_constraints).then(b_t =>
          type_equals(a_t.type, b_t.type) && type_equals(a_t.type, bool_type) ?
             co_unit(mk_typing(bool_type, Sem.bool_plus_rt(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>({ range:r, message:"Error: unsupported types for operator (||)!" })
        ))
}

export let and = function(r:SourceRange, a:Stmt, b:Stmt) : Stmt {
  return _ => a(no_constraints).then(a_t =>
         b(no_constraints).then(b_t =>
          type_equals(a_t.type, b_t.type) && type_equals(a_t.type, bool_type) ?
             co_unit(mk_typing(bool_type, Sem.bool_times_rt(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>({ range:r, message:"Error: unsupported types for operator (&&)!" })
        ))
}

export let arrow = function(r:SourceRange, parameters:Array<Parameter>, closure:Array<ValueName>, body:Stmt) : Stmt {
  return constraints => {
    if (constraints.kind == "right") return co_error<State,Err,Typing>({ range:r, message:"Error: empty context when defining anonymous function (=>)!" })
    let expected_type = constraints.value
    if (expected_type.kind != "fun") return co_error<State,Err,Typing>({ range:r, message:`Error: expected ${expected_type.kind}, found function.` })
    let input = expected_type.in.kind == "tuple" ? expected_type.in.args : [expected_type.in]
    let output = expected_type.out
    let parameter_declarations = parameters.map((p,p_i) => ({...p, type:input[p_i]})).map(p => decl_v(r, p.name, p.type, true)).reduce((p,q) => semicolon(r, p, q), done)
    return co_stateless<State,Err,Typing>(parameter_declarations(no_constraints).then(decls =>
        body(apply(inl<Type,Unit>(), output)).then(b_t =>
        co_unit(mk_typing(expected_type, Sem.mk_lambda_rt(b_t.sem, parameters.map(p => p.name), closure, r)))
      )))
    }
}

export let not = function(r:SourceRange, a:Stmt) : Stmt {
  return _ => a(no_constraints).then(a_t =>
            type_equals(a_t.type, bool_type) ?
             co_unit(mk_typing(bool_type, Sem.bool_not_rt(a_t.sem)))
            : co_error<State,Err,Typing>({ range:r, message:"Error: unsupported type for unary operator (!)!" })
        )
}

export let length = function(r:SourceRange, a:Stmt) : Stmt {
  return _ => a(no_constraints).then(a_t =>
            type_equals(a_t.type, string_type) ?
             co_unit(mk_typing(int_type, Sem.string_length_rt(a_t.sem)))
            : a_t.type.kind == "arr" ?
             co_unit(mk_typing(int_type, a_t.sem.then(a_val => Sem.get_arr_len_rt(a_val.value))))
            : co_error<State,Err,Typing>({ range:r, message:"Error: unsupported type for unary operator (-)!" })
        )
}

export let get_index = function(r:SourceRange, a:Stmt, i:Stmt) : Stmt {
  return _ => a(no_constraints).then(a_t =>
         i(no_constraints).then(i_t =>
          a_t.type.kind == "arr" && type_equals(i_t.type, int_type) ?
            co_unit(mk_typing(a_t.type.arg, Sem.get_arr_el_expr_rt(a_t.sem, i_t.sem)))
          : co_error<State,Err,Typing>({ range:r, message:"Error: unsupported types for array lookup!" })
        ))
}

export let set_index = function(r:SourceRange, a:Stmt, i:Stmt, e:Stmt) : Stmt {
  return _ => a(no_constraints).then(a_t =>
         i(no_constraints).then(i_t =>
          a_t.type.kind != "arr" ?
            co_error<State,Err,Typing>({ range:r, message:"Error: array set operation is only permitted on arrays!" })
          : e(apply(inl(), a_t.type.arg)).then(e_t =>
            a_t.type.kind == "arr" && type_equals(i_t.type, int_type) && type_equals(e_t.type, a_t.type.arg) ?
              co_unit(mk_typing(a_t.type.arg, Sem.set_arr_el_expr_rt(a_t.sem, i_t.sem, e_t.sem)))
            : co_error<State,Err,Typing>({ range:r, message:"Error: unsupported types for writing in an array!" })
        )))
}

// Debugger statements
export let breakpoint = function(r:SourceRange) : (_:Stmt) => Stmt {
  return p => semicolon(r, _ => co_unit(mk_typing(unit_type, Sem.dbg_rt(r)(apply(inl<Sem.Val,Sem.Val>(), Sem.mk_unit_val)))), p)
}

export let typechecker_breakpoint = function(range:SourceRange) : (_:Stmt) => Stmt {
  return p => semicolon(range, semicolon(range, set_highlighting(range), _ => Co.suspend<State,Err>().then(_ => co_unit<State,Err,Typing>(mk_typing(unit_type,Sem.done_rt)))), p)
}

export let highlight : Fun<Prod<SourceRange, State>, State> = fun(x => ({...x.snd, highlighting:x.fst }))
export let set_highlighting = function(r:SourceRange) : Stmt {
  return _ => mk_coroutine(constant<State, SourceRange>(r).times(id<State>()).then(highlight).then(
    constant<State,Typing>(mk_typing(unit_type,Sem.done_rt)).times(id<State>())).then(Co.value<State, Err, Typing>().then(Co.result<State, Err, Typing>().then(Co.no_error<State, Err, Typing>()))))
}

// Control flow statements
export let done : Stmt = _ => co_unit(mk_typing(unit_type, Sem.done_rt))

export let lub = (t1:TypeInformation, t2:TypeInformation) : Sum<TypeInformation, Unit> => {
  return type_equals(t1, t2) ? apply(inl<TypeInformation, Unit>(), t1) :
         t1.kind == "unit" ? apply(inl<TypeInformation, Unit>(), t2) :
         t2.kind == "unit" ? apply(inl<TypeInformation, Unit>(), t1) :
         apply(inr<TypeInformation, Unit>(), {})
}

export let if_then_else = function(r:SourceRange, c:Stmt, t:Stmt, e:Stmt) : Stmt {
  return _ => c(no_constraints).then(c_t =>
          c_t.type.kind != "bool" ? co_error<State,Err,Typing>({ range:r, message:"Error: condition has the wrong type!" }) :
          co_stateless<State,Err,Typing>(t(no_constraints)).then(t_t =>
          co_stateless<State,Err,Typing>(e(no_constraints)).then(e_t => {

          let on_type : Fun<TypeInformation, Stmt> = fun(t_i => (_:TypeConstraints) => co_unit<State,Err,Typing>(mk_typing(t_i,Sem.if_then_else_rt(c_t.sem, t_t.sem, e_t.sem))))
          let on_error : Fun<Unit, Stmt> = constant<Unit, Stmt>(_ => co_error<State,Err,Typing>({ range:r, message:"Error: the branches of a conditional should have compatible types!" }))

          let res = apply(on_type.plus(on_error), lub(t_t.type, e_t.type))

          return res(no_constraints)
         })))
}

export let while_do = function(r:SourceRange, c:Stmt, b:Stmt) : Stmt {
  return _ => co_stateless<State,Err,Typing>(c(no_constraints).then(c_t =>
         c_t.type.kind != "bool" ? co_error<State,Err,Typing>({ range:r, message:"Error: condition has the wrong type!" }) :
         b(no_constraints).then(t_t => co_unit(mk_typing(t_t.type,Sem.while_do_rt(c_t.sem, t_t.sem)))
         )))
}

export let for_loop = function(r:SourceRange, i:Stmt, c:Stmt, s:Stmt, b:Stmt) : Stmt {
  return _ => co_stateless<State,Err,Typing>(
          i(no_constraints).then(i_t =>
          c(no_constraints).then(c_t =>
          c_t.type.kind != "bool" ? co_error<State,Err,Typing>({ range:r, message:"Error: condition has the wrong type!" }) :
          s(no_constraints).then(s_t =>
          b(no_constraints).then(b_t => co_unit(mk_typing(b_t.type,Sem.for_loop_rt(i_t.sem, c_t.sem, s_t.sem, b_t.sem)))
          )))))
}

export let semicolon = function(r:SourceRange, p:Stmt, q:Stmt) : Stmt {
  return constraints => p(constraints).then(p_t =>
         q(constraints).then(q_t =>
           co_unit(mk_typing(q_t.type, p_t.sem.then(res => {
            let f:Sem.ExprRt<Sum<Sem.Val,Sem.Val>> = co_unit(apply(inr<Sem.Val,Sem.Val>(), res.value))
            return res.kind == "left" ? q_t.sem : f
           }))
         )))
}

export type Modifier = "private" | "public" | "static" | "protected" | "virtual" | "override"
export interface Parameter { name:Name, type:Type }
export interface LambdaDefinition { return_t:Type, parameters:Array<Parameter>, body:Stmt }
export interface FunDefinition extends LambdaDefinition { name:string, range:SourceRange }
export interface MethodDefinition extends FunDefinition { modifiers:Array<Modifier> }
export interface FieldDefinition extends Parameter { modifiers:Array<Modifier> }
export type CallingContext = { kind:"global scope" } | { kind:"class", C_name:string }

export let mk_param = function(name:Name, type:Type) {
  return { name:name, type:type }
}
export let mk_lambda = function(r:SourceRange, def:LambdaDefinition, closure_parameters:Array<Name>, range:SourceRange) : Stmt {
  let parameters = def.parameters
  let return_t = def.return_t
  let body = def.body
  let set_bindings = parameters.reduce<Stmt>((acc, par) => semicolon(r, decl_v(r, par.name, par.type, false), acc),
                     closure_parameters.reduce<Stmt>((acc, cp) =>
                      semicolon(r, _ => get_v(r, cp)(no_constraints).then(cp_t => decl_v(r, cp, cp_t.type, true)(no_constraints)), acc), done))
  return  _ => Co.co_get_state<State,Err>().then(initial_bindings =>
          set_bindings(no_constraints).then(_ =>
          body(apply(inl(), return_t)).then(body_t =>
          type_equals(body_t.type, return_t) ?
            Co.co_set_state<State,Err>(initial_bindings).then(_ =>
            co_unit(mk_typing(fun_type(tuple_type(parameters.map(p => p.type)) ,body_t.type), Sem.mk_lambda_rt(body_t.sem, parameters.map(p => p.name), closure_parameters, range))))
          :
            co_error<State,Err,Typing>({ range:r, message:`Error: return type does not match declaration`})
          )))
}
// export interface Bindings extends Immutable.Map<Name, TypeInformation> {}
// export interface State { highlighting:SourceRange, bindings:Bindings }
export let def_fun = function(r:SourceRange, def:FunDefinition, closure_parameters:Array<Name>) : Stmt {
  return _ => co_get_state<State, Err>().then(s =>
         co_set_state<State, Err>({...s, bindings:s.bindings.set(def.name, {...fun_type(tuple_type(def.parameters.map(p => p.type)), def.return_t), is_constant:true})}).then(_ =>
         mk_lambda(r, def, closure_parameters, def.range)(no_constraints).then(l =>
         co_set_state<State, Err>(s).then(_ =>
         decl_const(r, def.name, l.type, _ => co_unit<State,Err,Typing>(l))(no_constraints)))))

}

export let def_method = function(r:SourceRange, C_name:string, def:MethodDefinition) : Stmt {
  def.parameters = def.modifiers.some(m => m == "static") ? def.parameters
                   : def.parameters.concat(Array<Parameter>({ name:"this", type:ref_type(C_name)}))

  let parameters = def.parameters
  let return_t = def.return_t
  let body = def.body
  let set_bindings = parameters.reduce<Stmt>((acc, par) => semicolon(r, decl_v(r, par.name, par.type, false), acc), done)
  return  _ => Co.co_get_state<State,Err>().then(initial_bindings =>
          set_bindings(no_constraints).then(_ =>
          body(no_constraints).then(body_t =>
          type_equals(body_t.type, return_t) ?
            Co.co_set_state<State,Err>(initial_bindings).then(_ =>
            co_unit(mk_typing(fun_type(tuple_type(parameters.map(p => p.type)), body_t.type),
                              Sem.mk_lambda_rt(body_t.sem, parameters.map(p => p.name), [], def.range))))
          :
            co_error<State,Err,Typing>({ range:r, message:`Error: return type does not match declaration`})
          )))
}

export let call_lambda = function(r:SourceRange, lambda:Stmt, arg_values:Array<Stmt>) : Stmt {
  return _ => lambda(no_constraints).then(lambda_t => {
    if (lambda_t.type.kind != "fun" || lambda_t.type.in.kind != "tuple")
    return co_error<State,Err,Typing>({ range:r, message:`Error: invalid lambda type ${JSON.stringify(lambda_t.type)}`})

    let expected_args = lambda_t.type.in.args

    let check_arguments = arg_values.reduce<Coroutine<State, Err, Immutable.List<Typing>>>((args, arg, arg_i) =>
      arg(apply(inl(), expected_args[arg_i])).then(arg_t =>
      args.then(args_t =>
      co_unit(args_t.push(arg_t))
      )),
      co_unit(Immutable.List<Typing>()))


    return check_arguments.then(args_t =>
      lambda_t.type.kind != "fun" || lambda_t.type.in.kind != "tuple" ||
      arg_values.length != lambda_t.type.in.args.length ||
      args_t.some((arg_t, i) => lambda_t.type.kind != "fun" || lambda_t.type.in.kind != "tuple" || arg_t == undefined || i == undefined ||
      !type_equals(arg_t.type, lambda_t.type.in.args[i])) ?
      co_error<State,Err,Typing>({ range:r, message:`Error: parameter type mismatch when calling lambda expression ${JSON.stringify(lambda_t.type)}`})
      :
      co_unit(mk_typing(lambda_t.type.out, Sem.call_lambda_expr_rt(lambda_t.sem, args_t.toArray().map(arg_t => arg_t.sem))))
    )
  })
}

export let call_by_name = function(r:SourceRange, f_n:Name, args:Array<Stmt>) : Stmt {
  return call_lambda(r, get_v(r, f_n), args)
}

export let ret = function(r:SourceRange, p:Stmt) : Stmt {
  return constraints => p(constraints).then(p_t =>
         co_unit(mk_typing(p_t.type, Sem.return_rt(p_t.sem))
         ))
}

export let new_array = function(r:SourceRange, type:Type, len:Stmt) : Stmt {
  return _ => len(no_constraints).then(len_t =>
         type_equals(len_t.type, int_type) ?
           co_unit(mk_typing(arr_type(type), Sem.new_arr_expr_rt(len_t.sem)))
         : co_error<State,Err,Typing>({ range:r, message:`Error: argument of array constructor must be of type int`}))
}

export let get_arr_len = function(r:SourceRange, a:Stmt) : Stmt {
  return _ => a(no_constraints).then(a_t =>
         a_t.type.kind == "arr"  ?
           co_unit(mk_typing(int_type, Sem.get_arr_len_expr_rt(a_t.sem)))
         : co_error<State,Err,Typing>({ range:r, message:`Error: array length requires an array`})
        )
}

export let get_arr_el = function(r:SourceRange, a:Stmt, i:Stmt) : Stmt {
  return _ => a(no_constraints).then(a_t =>
         i(no_constraints).then(i_t =>
         a_t.type.kind == "arr" && type_equals(i_t.type, int_type)  ?
           co_unit(mk_typing(a_t.type.arg, Sem.get_arr_el_expr_rt(a_t.sem, i_t.sem)))
         : co_error<State,Err,Typing>({ range:r, message:`Error: array getter requires an array and an integer as arguments`})
        ))
}

export let set_arr_el = function(r:SourceRange, a:Stmt, i:Stmt, e:Stmt) : Stmt {
  return _ => a(no_constraints).then(a_t =>
         i(no_constraints).then(i_t =>
         e(no_constraints).then(e_t =>
         a_t.type.kind == "arr" && type_equals(i_t.type, int_type) && type_equals(e_t.type, a_t.type.arg) ?
           co_unit(mk_typing(unit_type, Sem.set_arr_el_expr_rt(a_t.sem, i_t.sem, e_t.sem)))
         : co_error<State,Err,Typing>({ range:r, message:`Error: array setter requires an array and an integer as arguments`})
        )))
}

export let def_class = function(r:SourceRange, C_name:string, methods_from_context:Array<(_:CallingContext) => MethodDefinition>, fields_from_context:Array<(_:CallingContext) => FieldDefinition>) : Stmt {
  let context:CallingContext = { kind:"class", C_name:C_name }
  let methods = methods_from_context.map(m => m(context))
  let fields = fields_from_context.map(f => f(context))
  let C_type_placeholder:Type = {
    kind: "obj",
    C_name:C_name,
    methods:Immutable.Map<Name, MethodTyping>(
      methods.map(m => {
        return [
          m.name,
          {
            typing:mk_typing(fun_type(tuple_type([ref_type(C_name)].concat(m.parameters.map(p => p.type))), m.return_t), Sem.done_rt),
            modifiers:Immutable.Set<Modifier>(m.modifiers)
          }
        ]
      })
    ),
    fields:Immutable.Map<Name, FieldType>(
      fields.map(f => {
        return [
          f.name,
          {
            type:f.type,
            modifiers:Immutable.Set<Modifier>(f.modifiers)
          }
        ]
      })
    )
  }

  return _ => co_get_state<State, Err>().then(initial_bindings =>
          co_set_state<State, Err>({...initial_bindings, bindings:initial_bindings.bindings.set(C_name, {...C_type_placeholder, is_constant:true}) }).then(_ =>
          comm_list_coroutine(Immutable.List<Coroutine<State,Err,Typing>>(methods.map(m => def_method(m.range, C_name, m)(no_constraints)))).then(methods_t => {
          let methods_full_t = methods_t.zipWith((m_t,m_d) => ({ typ:m_t, def:m_d}), Immutable.Seq<MethodDefinition>(methods)).toArray()
          let C_type:Type = {
            kind: "obj",
            C_name:C_name,
            methods:Immutable.Map<Name, MethodTyping>(
              methods_full_t.map(m => [m.def.name, { typing:m.typ, modifiers:Immutable.Set<Modifier>(m.def.modifiers) }])
            ),
            fields:Immutable.Map<Name, FieldType>(
              fields.map(f =>
                  [ f.name,
                  { type:f.type, modifiers:Immutable.Set<Modifier>(f.modifiers) } ] )
            )
          }
          let C_int:Sem.Interface = {
            base:apply(inr<Sem.Interface, Unit>(), {}),
            methods:
              Immutable.Map<Name, Sem.StmtRt>(methods_full_t.map(m =>
                {
                  let res:[Name, Sem.StmtRt] = [
                    m.def.name,
                    m.typ.sem ]
                  return res
                }
              )),
            static_methods:Immutable.Map<Sem.ValueName, Sem.StmtRt>(),
            static_fields:Immutable.Map<Sem.ValueName, Sem.Val>()
          }
          return co_set_state<State, Err>({...initial_bindings, bindings:initial_bindings.bindings.set(C_name, {...C_type, is_constant:true}) }).then(_ =>
            co_unit(mk_typing(unit_type, Sem.declare_class_rt(C_name, C_int))))
          }
          )))
}

export let field_get = function(r:SourceRange, context:CallingContext, this_ref:Stmt, F_name:string) : Stmt {
  return _ => this_ref(no_constraints).then(this_ref_t =>
         co_get_state<State, Err>().then(bindings => {
           if (this_ref_t.type.kind != "ref" && this_ref_t.type.kind != "obj") {
            let item = /^Item/
            let m = F_name.match(item)
            if (this_ref_t.type.kind == "tuple" && m != null && m.length != 0) {
              try {
                let item_index = parseInt(F_name.replace(item, "")) - 1
                return co_unit(mk_typing(this_ref_t.type.args[item_index],
                        Sem.tuple_get_rt(r, this_ref_t.sem, item_index)))
              } catch (error) {
                return co_error<State,Err,Typing>({ range:r, message:`Invalid field getter ${F_name}.`})
              }
            } else {
              console.log("Checking getter on", JSON.stringify(this_ref_t.type))
              if (this_ref_t.type.kind == "record" && this_ref_t.type.args.has(F_name)) {
                try {
                  return co_unit(mk_typing(this_ref_t.type.args.get(F_name),
                          Sem.record_get_rt(r, this_ref_t.sem, F_name)))
                } catch (error) {
                  return co_error<State,Err,Typing>({ range:r, message:`Invalid field getter ${F_name}.`})
                }
              } else {
                return co_error<State,Err,Typing>({ range:r, message:`Error: expected reference or class name when getting field ${F_name}.`})
              }
            }
           }
           let C_name = this_ref_t.type.C_name
           if (!bindings.bindings.has(this_ref_t.type.C_name)) return co_error<State,Err,Typing>({ range:r, message:`Error: class ${this_ref_t.type.C_name} is undefined`})
           let C_def = bindings.bindings.get(this_ref_t.type.C_name)
           if (C_def.kind != "obj") return co_error<State,Err,Typing>({ range:r, message:`Error: ${this_ref_t.type.C_name} is not a class`})
           if (!C_def.fields.has(F_name)) return co_error<State,Err,Typing>({ range:r, message:`Error: class ${this_ref_t.type.C_name} does not contain field ${F_name}`})
           let F_def = C_def.fields.get(F_name)

           if (!F_def.modifiers.has("public")) {
            if (context.kind == "global scope")
              return co_error<State,Err,Typing>({ range:r, message:`Error: cannot get non-public field ${JSON.stringify(F_name)} from global scope`})
            else if (context.C_name != C_name)
              return co_error<State,Err,Typing>({ range:r, message:`Error: cannot get non-public field ${C_name}::${JSON.stringify(F_name)} from ${context.C_name}`})
           }

           return co_unit(mk_typing(F_def.type,
                    F_def.modifiers.has("static") ?
                        Sem.static_field_get_expr_rt(C_name, F_name)
                      : Sem.field_get_expr_rt(F_name, this_ref_t.sem)))
          }
         ))
}

export let field_set = function(r:SourceRange, context:CallingContext, this_ref:Stmt, F_name:{att_name:string, kind:"att"} |
                                                                                             {att_name:string, kind:"att_arr", index:Stmt}, new_value:Stmt) : Stmt {
  return _ => this_ref(no_constraints).then(this_ref_t =>
         (F_name.kind == "att_arr" ? F_name.index(no_constraints) : co_unit<State, Err, Typing>(mk_typing(bool_type, Sem.bool_expr(false)))).then(maybe_index =>
         co_get_state<State, Err>().then(bindings => {
           if (this_ref_t.type.kind != "ref" && this_ref_t.type.kind != "obj") {
             return co_error<State,Err,Typing>({ range:r, message:`Error: expected reference or class name when setting field ${F_name.att_name}.`})
           }
           let C_name:string = this_ref_t.type.C_name
           if (!bindings.bindings.has(C_name)) return co_error<State,Err,Typing>({ range:r, message:`Error: class ${C_name} is undefined`})
           let C_def = bindings.bindings.get(C_name)
           if (C_def.kind != "obj") return co_error<State,Err,Typing>({ range:r, message:`Error: type ${C_name} is not a class`})
           if (!C_def.fields.has(F_name.att_name)) return co_error<State,Err,Typing>({ range:r, message:`Error: class ${C_name} does not contain field ${F_name.att_name}`})
           let F_def = C_def.fields.get(F_name.att_name)

           if (!F_def.modifiers.has("public")) {
            if (context.kind == "global scope")
              return co_error<State,Err,Typing>({ range:r, message:`Error: cannot set non-public field ${JSON.stringify(F_name.att_name)} from global scope`})
            else if (context.C_name != C_name)
              return co_error<State,Err,Typing>({ range:r, message:`Error: cannot set non-public field ${C_name}::${JSON.stringify(F_name.att_name)} from ${context.C_name}`})
           }
           return new_value(apply(inl(), F_def.type)).then(new_value_t => {
             if (!type_equals(F_def.type, new_value_t.type)) return co_error<State,Err,Typing>({ range:r, message:`Error: field ${C_name}::${F_name.att_name} cannot be assigned to value of type ${JSON.stringify(new_value_t.type)}`})
             return co_unit(mk_typing(unit_type,
              F_def.modifiers.has("static") ?
              Sem.static_field_set_expr_rt(C_name, F_name.kind == "att" ? F_name : {...F_name, index:maybe_index.sem}, new_value_t.sem)
              : Sem.field_set_expr_rt(F_name.kind == "att" ? F_name : {...F_name, index:maybe_index.sem}, new_value_t.sem, this_ref_t.sem)))
            })
          }
         )))
}


export let call_cons = function(r:SourceRange, context:CallingContext, C_name:string, arg_values:Array<Stmt>) : Stmt {
  return _ => co_get_state<State, Err>().then(bindings => {
    if (!bindings.bindings.has(C_name)) return co_error<State,Err,Typing>({ range:r, message:`Error: class ${C_name} is undefined`})
    let C_def = bindings.bindings.get(C_name)
    if (C_def.kind != "obj") return co_error<State,Err,Typing>({ range:r, message:`Error: type  ${C_name} is not a class`})
    if (!C_def.methods.has(C_name)) {
      return co_error<State,Err,Typing>({ range:r, message:`Error: class ${C_name} does not have constructors`})
    }
    let lambda_t = C_def.methods.get(C_name)

    if (lambda_t.typing.type.kind != "fun" || lambda_t.typing.type.in.kind != "tuple")
      return co_error<State,Err,Typing>({ range:r, message:`Error: invalid constructor type ${JSON.stringify(lambda_t.typing.type)}`})

    let expected_args = lambda_t.typing.type.in.args

    let check_arguments = arg_values.reduce<Coroutine<State, Err, Immutable.List<Typing>>>((args, arg, arg_i) =>
      arg(apply(inl(), expected_args[arg_i])).then(arg_t =>
      args.then(args_t =>
      co_unit(args_t.push(arg_t))
      )),
      co_unit(Immutable.List<Typing>()))

    if (!lambda_t.modifiers.has("public")) {
      if (context.kind == "global scope")
        return co_error<State,Err,Typing>({ range:r, message:`Error: cannot call non-public constructor ${C_name} from global scope`})
      else if (context.C_name != C_name)
        return co_error<State,Err,Typing>({ range:r, message:`Error: cannot call non-public constructor ${C_name} from ${context.C_name}`})
    }

    return lambda_t.typing.type.kind == "fun" && lambda_t.typing.type.in.kind == "tuple" ?
        check_arguments.then(args_t =>
          lambda_t.typing.type.kind != "fun" || lambda_t.typing.type.in.kind != "tuple" ||
          arg_values.length != lambda_t.typing.type.in.args.length - 1 ||
          args_t.some((arg_t, i) => lambda_t.typing.type.kind != "fun" || lambda_t.typing.type.in.kind != "tuple" || arg_t == undefined || i == undefined ||
                                    !type_equals(arg_t.type, lambda_t.typing.type.in.args[i])) ?
            co_error<State,Err,Typing>({ range:r, message:`Error: parameter type mismatch when calling lambda expression ${JSON.stringify(lambda_t.typing.type)} with arguments ${JSON.stringify(args_t)}`})
          :
            co_unit(mk_typing(ref_type(C_name), Sem.call_cons_rt(C_name, args_t.toArray().map(arg_t => arg_t.sem))))
        )
      : co_error<State,Err,Typing>({ range:r, message:`Error: cannot invoke non-lambda expression of type ${JSON.stringify(lambda_t.typing.type)}`})
  })
}


export let call_method = function(r:SourceRange, context:CallingContext, this_ref:Stmt, M_name:string, arg_values:Array<Stmt>) : Stmt {
  return _ => this_ref(no_constraints).then(this_ref_t =>
    co_get_state<State, Err>().then(bindings => {
      if (this_ref_t.type.kind != "ref" && this_ref_t.type.kind != "obj") {
        return co_error<State,Err,Typing>({ range:r, message:`Error: expected reference or class name when calling method ${M_name}.`})
      }
      let C_name = this_ref_t.type.C_name
      if (!bindings.bindings.has(C_name)) return co_error<State,Err,Typing>({ range:r, message:`Error: class ${C_name} is undefined`})
      let C_def = bindings.bindings.get(C_name)
      if (C_def.kind != "obj") return co_error<State,Err,Typing>({ range:r, message:`Error: type  ${C_name} is not a class`})
      if (!C_def.methods.has(M_name)) return co_error<State,Err,Typing>({ range:r, message:`Error: class ${C_name} does not have method ${M_name}`})
      let lambda_t = C_def.methods.get(M_name)

      if (lambda_t.typing.type.kind != "fun" || lambda_t.typing.type.in.kind != "tuple")
        return co_error<State,Err,Typing>({ range:r, message:`Error: invalid method type ${JSON.stringify(lambda_t.typing.type)}`})

      let expected_args = lambda_t.typing.type.in.args

      let check_arguments = arg_values.reduce<Coroutine<State, Err, Immutable.List<Typing>>>((args, arg, arg_i) =>
        arg(apply(inl(), expected_args[arg_i])).then(arg_t =>
        args.then(args_t =>
        co_unit(args_t.push(arg_t))
        )),
        co_unit(Immutable.List<Typing>()))

      if (!lambda_t.modifiers.has("public")) {
        if (context.kind == "global scope")
          return co_error<State,Err,Typing>({ range:r, message:`Error: cannot call non-public method ${JSON.stringify(M_name)} from global scope`})
        else if (context.C_name != C_name)
          return co_error<State,Err,Typing>({ range:r, message:`Error: cannot call non-public method ${C_name}::${JSON.stringify(M_name)} from ${context.C_name}`})
      }

      if (lambda_t.modifiers.has("static") && this_ref_t.type.kind == "ref") {
        return co_error<State,Err,Typing>({ range:r, message:`Error: cannot call static method ${JSON.stringify(M_name)} from reference.`})
      }

      return lambda_t.typing.type.kind == "fun" && lambda_t.typing.type.in.kind == "tuple" ?
          check_arguments.then(args_t =>
            lambda_t.typing.type.kind != "fun" || lambda_t.typing.type.in.kind != "tuple" ||
            arg_values.length != (lambda_t.modifiers.has("static") ? lambda_t.typing.type.in.args.length : lambda_t.typing.type.in.args.length - 1) ||
            args_t.some((arg_t, i) => lambda_t.typing.type.kind != "fun" || lambda_t.typing.type.in.kind != "tuple" || arg_t == undefined || i == undefined ||
                                      !type_equals(arg_t.type, lambda_t.typing.type.in.args[i])) ?
              co_error<State,Err,Typing>({ range:r, message:`Error: parameter type mismatch when calling method ${JSON.stringify(lambda_t.typing.type)} with arguments ${JSON.stringify(args_t)}`})
            :
              co_unit(mk_typing(lambda_t.typing.type.out,
                lambda_t.modifiers.has("static") ?
                  Sem.call_static_method_expr_rt(C_name, M_name, args_t.toArray().map(arg_t => arg_t.sem))
                :
                  Sem.call_method_expr_rt(M_name, this_ref_t.sem, args_t.toArray().map(arg_t => arg_t.sem))))
          )
        : co_error<State,Err,Typing>({ range:r, message:`Error: cannot invoke non-lambda expression of type ${JSON.stringify(lambda_t.typing.type)}`})
  }))
}
