import * as Immutable from "immutable"
import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, fun2, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair, distribute_sum_prod_inv, distribute_sum_prod, fun3, co_get_state, co_set_state, Option } from "ts-bccc"
import * as CCC from "ts-bccc"
import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
import * as Co from "ts-bccc"
import { SourceRange, mk_range, zero_range, print_range } from "../source_range"
import * as Sem from "../Python/python"
import { comm_list_coroutine, co_stateless, co_catch, co_catch_many } from "../ccc_aux";
import { ValueName, tuple_to_record, ExprRt, Val, mk_expr_from_val } from "../main";
import { Stmt, no_constraints, TypeConstraints, State, Err, Typing, Type, Name, load, TypeInformation, mk_typing_cat_full, store, unit_type, mk_typing, type_equals, tuple_type, bool_type, string_type, int_type, float_type, double_type, square_type, ellipse_type, rectangle_type, line_type, arr_type, polygon_type, text_type, sprite_type, render_surface_type, other_render_surface_type, circle_type, fun_type, ref_type, MethodTyping, FieldType, Parameter, LambdaDefinition, FunDefinition, MethodDefinition, CallingContext, FieldDefinition, Modifier, type_to_string, ObjType } from "./types";

// Basic statements and expressions
let ensure_constraints = (r:SourceRange, constraints:TypeConstraints) => (res:Coroutine<State,Err,Typing>) => {
  if (constraints.kind == "right") return res
  return coerce(r, _ => res, constraints.value)(no_constraints)
}

const initial_value = (type: Type): Sem.Val => {
  switch (type.kind) {
    case "bool":   return Sem.mk_bool_val(false)
    case "double": return Sem.mk_float_val(0)
    case "float":  return Sem.mk_float_val(0)
    case "int":    return Sem.mk_int_val(0)
    case "tuple":  return Sem.mk_tuple_val(type.args.map(initial_value))
    case "obj":    return Sem.mk_obj_val(Immutable.Map(type.fields.toArray().map(f => initial_value(f.type))))
    default:       return Sem.mk_unit_val
  }
}

export let wrap_co_res = Co.value<State,Err,Typing>().then(Co.result<State,Err,Typing>())
export let wrap_co = wrap_co_res.then(Co.no_error())
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
  let i = mk_coroutine<State,Err,Typing>(h)
  return constraints => constraints.kind == "right" || constraints.value.kind == "var" || constraints.value.kind == "fun" ? i : coerce(r, _ => i, constraints.value)(no_constraints)
}
export let decl_forced_v = function(r:SourceRange, v:Name, t:Type, is_constant?:boolean) : Stmt {
  let f = store.then(constant<State, Typing>(mk_typing(unit_type, Sem.decl_v_rt(v, apply(inl(), initial_value(t))))).times(id())).then(wrap_co)
  let g = curry(f)
  let args = apply(constant<Unit,Name>(v).times(constant<Unit,TypeInformation>({...t, is_constant:is_constant != undefined ? is_constant : false})), {})
  return _ =>
    co_get_state<State,Err>().then(s =>
    mk_coroutine<State,Err,Typing>(apply(g, args))
    )
}
export let decl_v = function(r:SourceRange, v:Name, t:Type, is_constant?:boolean) : Stmt {
  let f = store.then(constant<State, Typing>(mk_typing(unit_type, Sem.decl_v_rt(v, apply(inl(), initial_value(t))))).times(id())).then(wrap_co)
  let g = curry(f)
  let args = apply(constant<Unit,Name>(v).times(constant<Unit,TypeInformation>({...t, is_constant:is_constant != undefined ? is_constant : false})), {})
  return _ =>
    co_get_state<State,Err>().then(s =>
    !s.bindings.has(v) ? mk_coroutine<State,Err,Typing>(apply(g, args))
    : co_error<State,Err,Typing>({ range:r, message:`Error: cannot redeclare variable ${v}` }))
}
export let decl_and_init_v = function(r:SourceRange, v:Name, t:Type, e:Stmt, is_constant?:boolean) : Stmt {
  return _ => e(t.kind == "var" ? no_constraints : apply(inl(), t)).then(e_val =>
    co_get_state<State,Err>().then(s => {
    if (s.bindings.has(v)) return co_error<State,Err,Typing>({ range:r, message:`Error: cannot redeclare variable ${v}` })
    let f = store.then(constant<State, Typing>(mk_typing(unit_type, e_val.sem.then(e_val => Sem.decl_v_rt(v, apply(inl(), e_val.value))))).times(id())).then(wrap_co)
    let g = curry(f)
    let args = apply(constant<Unit,Name>(v).times(constant<Unit,TypeInformation>({...e_val.type, is_constant:is_constant != undefined ? is_constant : false})), {})
    return mk_coroutine<State,Err,Typing>(apply(g, args))
  }))
}
export let decl_const = function(r:SourceRange, c:Name, t:Type, e:Stmt) : Stmt {
  let f = store.then(constant<State, Typing>(mk_typing(unit_type, Sem.decl_v_rt(c, apply(inl(), Sem.mk_unit_val)))).times(id())).then(wrap_co)
  let g = curry(f)
  let args = apply(constant<Unit,Name>(c).times(constant<Unit,TypeInformation>({...t, is_constant:true})), {})
  return _ => mk_coroutine<State,Err,Typing>(apply(g, args)).then(_ =>
         get_v(r, c)(no_constraints).then(c_val =>
          e(apply(inl(), c_val.type)).then(e_val =>
           co_unit(mk_typing(unit_type, Sem.set_v_expr_rt(c, e_val.sem)))
         )))
}

export let set_v = function(r:SourceRange, v:Name, e:Stmt) : Stmt {
  return _ => get_v(r, v)(no_constraints).then(v_val =>
          e(apply(inl(), v_val.type)).then(e_val => {
           if (!v_val.type.is_constant) {
             return co_unit(mk_typing(unit_type, Sem.set_v_expr_rt(v, e_val.sem)))
            } else {
              return co_error<State,Err,Typing>({ range:r, message:`Error: cannot assign anything to constant ${v}.` })
            }
          }
        ))
}


let coerce_to_constraint = (r:SourceRange, p:Stmt, p_t:Type) : Stmt =>
  constraints => coerce(r, p, constraints.kind == "right" || constraints.value.kind == "var" ? p_t : constraints.value)(constraints)

export let bool = (r:SourceRange, b:boolean) : Stmt =>
  coerce_to_constraint(r, _ => co_unit(mk_typing(bool_type, Sem.bool_expr(b))), bool_type)

export let str = (r:SourceRange, s:string) : Stmt =>
  coerce_to_constraint(r, _ => co_unit(mk_typing(string_type, Sem.str_expr(s))), string_type)

export let int = (r:SourceRange, i:number) : Stmt =>
  coerce_to_constraint(r, _ => co_unit<State,Err,Typing>(mk_typing(int_type, Sem.int_expr(i))), int_type)

export let float = (r:SourceRange, i:number) : Stmt =>
  coerce_to_constraint(r, _ => co_unit(mk_typing(float_type, Sem.float_expr(i))), float_type)

export let double = (r:SourceRange, i:number) : Stmt =>
  coerce_to_constraint(r, _ => co_unit(mk_typing(double_type, Sem.float_expr(i))), double_type)

export let tuple_value = function(r:SourceRange, args:Array<Stmt>) : Stmt {
  return constraints => {
    let original_constraints = constraints
    if (constraints.kind == "left" && constraints.value.kind == "record")
      constraints = apply(inl(), tuple_type(constraints.value.args.toArray()))
    if (constraints.kind == "left" && constraints.value.kind != "tuple")
      return co_error<State,Err,Typing>({ range:r, message:`Error: expected type ${type_to_string(constraints.value)} when typechecking tuple.` })
    let check_args = comm_list_coroutine(Immutable.List<Coroutine<State,Err,Typing>>(args.map((a, a_i) =>
      a(constraints.kind == "left" && constraints.value.kind == "tuple" ? apply(inl(), constraints.value.args[a_i])
        : no_constraints))))
    let res = check_args.then(arg_ts =>
        co_unit(mk_typing(tuple_type(arg_ts.toArray().map(a_t => a_t.type)),
                Sem.tuple_expr_rt(arg_ts.toArray().map(a_t => a_t.sem))))
      )
    if (original_constraints.kind == "right") return res
    return coerce(r, _ => res, original_constraints.value)(no_constraints)
    }
}

export let gt = (r:SourceRange, a:Stmt, b:Stmt) : Stmt => bin_op(r, a, b, ">")

export let lt = (r:SourceRange, a:Stmt, b:Stmt) : Stmt => bin_op(r, a, b, "<")

export let geq = (r:SourceRange, a:Stmt, b:Stmt) : Stmt => bin_op(r, a, b, ">=")

export let leq = (r:SourceRange, a:Stmt, b:Stmt) : Stmt => bin_op(r, a, b, "<=")

export let eq = (r:SourceRange, a:Stmt, b:Stmt) : Stmt => bin_op(r, a, b, "==")

export let neq = (r:SourceRange, a:Stmt, b:Stmt) : Stmt => bin_op(r, a, b, "!=")

export let xor = (r:SourceRange, a:Stmt, b:Stmt) : Stmt  => bin_op(r, a, b, "^")

export let mk_empty_surface = function(r:SourceRange, w:Stmt, h:Stmt, col:Stmt) : Stmt {
  return _ => w(apply(inl(), double_type)).then(w_t =>
              h(apply(inl(), double_type)).then(h_t =>
              col(apply(inl(), string_type)).then(col_t =>
                co_unit(mk_typing(render_surface_type, Sem.mk_empty_render_surface_rt(w_t.sem, h_t.sem, col_t.sem)))
            )))
}

export let mk_circle = function(r:SourceRange, x:Stmt, y:Stmt, radius:Stmt, col:Stmt) : Stmt {
  return _ => x(apply(inl(), double_type)).then(x_t =>
              y(apply(inl(), double_type)).then(y_t =>
              radius(apply(inl(), double_type)).then(r_t =>
              col(apply(inl(), string_type)).then(col_t =>
                co_unit(mk_typing(circle_type, Sem.mk_circle_rt(x_t.sem, y_t.sem, r_t.sem, col_t.sem)))
              ))))
}

export let mk_square = function(r:SourceRange, x:Stmt, y:Stmt, radius:Stmt, col:Stmt, rot:Stmt) : Stmt {
  return _ => x(apply(inl(), double_type)).then(x_t =>
              y(apply(inl(), double_type)).then(y_t =>
              radius(apply(inl(), double_type)).then(r_t =>
              col(apply(inl(), string_type)).then(col_t =>
              rot(apply(inl(), double_type)).then(rot_t =>
                co_unit(mk_typing(square_type, Sem.mk_square_rt(x_t.sem, y_t.sem, r_t.sem, col_t.sem, rot_t.sem)))
              )))))
}

export let mk_ellipse = function(r:SourceRange, x:Stmt, y:Stmt, w:Stmt, h:Stmt, col:Stmt, rot:Stmt) : Stmt {
  return _ => x(apply(inl(), double_type)).then(x_t =>
              y(apply(inl(), double_type)).then(y_t =>
              w(apply(inl(), double_type)).then(w_t =>
              h(apply(inl(), double_type)).then(h_t =>
              col(apply(inl(), string_type)).then(col_t =>
              rot(apply(inl(), double_type)).then(rot_t =>
                co_unit(mk_typing(ellipse_type, Sem.mk_ellipse_rt(x_t.sem, y_t.sem, w_t.sem, h_t.sem, col_t.sem, rot_t.sem)))
              ))))))
}

export let mk_rectangle = function(r:SourceRange, x:Stmt, y:Stmt, w:Stmt, h:Stmt, col:Stmt, rot:Stmt) : Stmt {
  return _ => x(apply(inl(), double_type)).then(x_t =>
              y(apply(inl(), double_type)).then(y_t =>
              w(apply(inl(), double_type)).then(w_t =>
              h(apply(inl(), double_type)).then(h_t =>
              col(apply(inl(), string_type)).then(col_t =>
              rot(apply(inl(), double_type)).then(rot_t =>
                co_unit(mk_typing(rectangle_type, Sem.mk_rectangle_rt(x_t.sem, y_t.sem, w_t.sem, h_t.sem, col_t.sem, rot_t.sem)))
              ))))))
}

export let mk_line = function(r:SourceRange, x1:Stmt, y1:Stmt, x2:Stmt, y2:Stmt, w:Stmt, col:Stmt, rot:Stmt) : Stmt {
  return _ => x1(apply(inl(), double_type)).then(x1_t =>
              y1(apply(inl(), double_type)).then(y1_t =>
              x2(apply(inl(), double_type)).then(x2_t =>
              y2(apply(inl(), double_type)).then(y2_t =>
              w(apply(inl(), double_type)).then(w_t =>
              col(apply(inl(), string_type)).then(col_t =>
              rot(apply(inl(), double_type)).then(rot_t =>
                co_unit(mk_typing(line_type, Sem.mk_line_rt(x1_t.sem, y1_t.sem, x2_t.sem, y2_t.sem, w_t.sem, col_t.sem, rot_t.sem)))
              )))))))
}

export let mk_polygon = function(r:SourceRange, points:Stmt, col:Stmt, rot:Stmt) : Stmt {
  return _ => points(apply(inl(), arr_type(tuple_type([double_type, double_type])))).then(points_t =>
              rot(apply(inl(), double_type)).then(rot_t =>
              col(apply(inl(), string_type)).then(col_t =>
                co_unit(mk_typing(polygon_type, Sem.mk_polygon_rt(points_t.sem, col_t.sem, rot_t.sem)))
              )))
}

export let mk_text = function(r:SourceRange, t:Stmt, x:Stmt, y:Stmt, s:Stmt, col:Stmt, rot:Stmt) : Stmt {
  return _ => t(apply(inl(), string_type)).then(t_t =>
              x(apply(inl(), double_type)).then(x_t =>
              y(apply(inl(), double_type)).then(y_t =>
              s(apply(inl(), double_type)).then(s_t =>
              col(apply(inl(), string_type)).then(col_t =>
              rot(apply(inl(), double_type)).then(rot_t =>
                co_unit(mk_typing(text_type, Sem.mk_text_rt(t_t.sem, x_t.sem, y_t.sem, s_t.sem, col_t.sem, rot_t.sem)))
              ))))))
}

export let mk_sprite = function(r:SourceRange, sprite:Stmt, x:Stmt, y:Stmt, w:Stmt, h:Stmt, rot:Stmt) : Stmt {
  return _ => sprite(apply(inl(), string_type)).then(s_t =>
              x(apply(inl(), double_type)).then(x_t =>
              y(apply(inl(), double_type)).then(y_t =>
              w(apply(inl(), double_type)).then(w_t =>
              h(apply(inl(), double_type)).then(h_t =>
              rot(apply(inl(), double_type)).then(rot_t =>
                co_unit(mk_typing(sprite_type, Sem.mk_sprite_rt(s_t.sem, x_t.sem, y_t.sem, w_t.sem, h_t.sem, rot_t.sem)))
              ))))))
}

export let mk_other_surface = function(r:SourceRange, s:Stmt, dx:Stmt, dy:Stmt, sx:Stmt, sy:Stmt, rot:Stmt) : Stmt {
  return _ => dx(apply(inl(), double_type)).then(dx_t =>
              dy(apply(inl(), double_type)).then(dy_t =>
              sx(apply(inl(), double_type)).then(sx_t =>
              sy(apply(inl(), double_type)).then(sy_t =>
              s(apply(inl(), render_surface_type)).then(s_t =>
              rot(apply(inl(), double_type)).then(rot_t =>
                co_unit(mk_typing(other_render_surface_type, Sem.mk_other_surface_rt(s_t.sem, dx_t.sem, dy_t.sem, sx_t.sem, sy_t.sem, rot_t.sem)))
              ))))))
}


export let unary_op = function(r:SourceRange, a:Stmt, op:string) : Stmt {
  let op_from_type = (t:Type) =>
    get_class(r, t).then(t_c => {
      if (!t_c.methods.has(op))
        return co_error<State,Err,Typing>({ range:r, message:`Error: type ${type_to_string(t)} has no (${op}) operator.`})
      let op_method = t_c.methods.get(op)
      if (op_method.typing.type.kind != "fun" || op_method.typing.type.in.kind != "tuple" || op_method.typing.type.in.args.length != 1)
        return co_error<State,Err,Typing>({ range:r, message:`Error: type ${type_to_string(t)} has an operator (${op}), but it is malformed.`})

      let args = op_method.typing.type.in.args
      let op_method_stmt:Stmt = _ =>
        co_unit<State,Err,Typing>(mk_typing(op_method.typing.type, Sem.static_method_get_expr_rt(type_to_string(t), op)))

      return a(apply(inl(), args[0])).then(a_f =>
          call_lambda(r, op_method_stmt, [_ => co_unit(a_f)])(no_constraints))
    })

  return constraints => ensure_constraints(r, constraints)(a(constraints).then(a_t => op_from_type(a_t.type)))
}

export let bin_op = function(r:SourceRange, a:Stmt, b:Stmt, op:string) : Stmt {
  let op_from_type = (t:Type) =>
    get_class(r, t).then(t_c => {
      if (!t_c.methods.has(op))
        return co_error<State,Err,Typing>({ range:r, message:`Error: type ${type_to_string(t)} has no (${op}) operator.`})
      let op_method = t_c.methods.get(op)
      if (op_method.typing.type.kind != "fun" || op_method.typing.type.in.kind != "tuple" || op_method.typing.type.in.args.length != 2)
        return co_error<State,Err,Typing>({ range:r, message:`Error: type ${type_to_string(t)} has a (${op}) operator, but it is malformed.`})

      let args = op_method.typing.type.in.args

      let op_method_stmt:Stmt = _ =>
        co_unit<State,Err,Typing>(mk_typing(op_method.typing.type, Sem.static_method_get_expr_rt(type_to_string(t), op)))

      return a(apply(inl(), args[0])).then(a_f =>
            b(apply(inl(), args[1])).then(b_f =>
          call_lambda(r, op_method_stmt, [_ => co_unit(a_f), _ => co_unit(b_f)])(no_constraints)))
    })

  return constraints => ensure_constraints(r, constraints)(a(no_constraints).then(a_t =>
         b(no_constraints).then(b_t =>
          op == "+" && type_equals(a_t.type, render_surface_type) &&
            (type_equals(b_t.type, circle_type) || type_equals(b_t.type, square_type)
            || type_equals(b_t.type, ellipse_type) || type_equals(b_t.type, rectangle_type)
            || type_equals(b_t.type, sprite_type) || type_equals(b_t.type, line_type)
            || type_equals(b_t.type, polygon_type) || type_equals(b_t.type, text_type)
            || type_equals(b_t.type, other_render_surface_type)
            ) ?
            co_unit(mk_typing(render_surface_type, Sem.render_surface_plus_rt(a_t.sem, b_t.sem)))
          : co_catch<State, Err, Typing>((e1:Err, e2:Err) : Err => ({ range:r, message:`Error: unsupported types for operator (${op})!` }))
          (op_from_type(a_t.type))(op_from_type(b_t.type)))))
}

export let plus = (r:SourceRange, a:Stmt, b:Stmt) : Stmt => bin_op(r, a, b, "+")

export let minus = (r:SourceRange, a:Stmt, b:Stmt) : Stmt => bin_op(r, a, b, "-")

export let div = (r:SourceRange, a:Stmt, b:Stmt) : Stmt => bin_op(r, a, b, "/")

export let times = (r:SourceRange, a:Stmt, b:Stmt, sr:SourceRange) : Stmt => bin_op(r, a, b, "*")

export let mod = (r:SourceRange, a:Stmt, b:Stmt) : Stmt => bin_op(r, a, b, "%")

export let minus_unary = function(r:SourceRange, a:Stmt) : Stmt {
  return constraints => ensure_constraints(r, constraints)(a(no_constraints).then(a_t =>
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(int_type, Sem.int_minus_unary_rt(a_t.sem)))
            : type_equals(a_t.type, float_type) || type_equals(a_t.type, double_type) ?
             co_unit(mk_typing(float_type, Sem.float_minus_unary_rt(a_t.sem)))
            : co_error<State,Err,Typing>({ range:r, message:"Error: unsupported type for unary operator (-)!" })
        ))
}

export let or = (r:SourceRange, a:Stmt, b:Stmt) : Stmt => bin_op(r, a, b, "||")

export let and = (r:SourceRange, a:Stmt, b:Stmt) : Stmt => bin_op(r, a, b, "&&")

export let arrow = function(r:SourceRange, parameters:Array<Parameter>, closure:Array<ValueName>, body:Stmt) : Stmt {
  return constraints => {
    if (constraints.kind == "right") return co_error<State,Err,Typing>({ range:r, message:"Error: empty context when defining anonymous function (=>)." })
    let expected_type = constraints.value
    if (expected_type.kind != "fun") return co_error<State,Err,Typing>({ range:r, message:`Error: expected ${type_to_string(expected_type)}, found function.` })
    let input = expected_type.in.kind == "tuple" ? expected_type.in.args : [expected_type.in]
    let output = expected_type.out
    let parameter_declarations = parameters.map((p,p_i) => ({...p, type:input[p_i]})).map(p => decl_v(r, p.name, p.type, true)).reduce((p,q) => semicolon(r, p, q), done)
    return co_stateless<State,Err,Typing>(parameter_declarations(no_constraints).then(decls =>
        body(apply(inl<Type,Unit>(), output)).then(b_t =>
        co_unit(mk_typing(expected_type, Sem.mk_lambda_rt(b_t.sem, parameters.map(p => p.name), closure, r)))
      )))
    }
}

export let not = (r:SourceRange, a:Stmt) : Stmt => unary_op(r, a, "!")

export let get_index = function(r:SourceRange, a:Stmt, i:Stmt) : Stmt {
  return constraints => ensure_constraints(r, constraints)(a(no_constraints).then(a_t =>
         i(apply(inl(), int_type)).then(i_t =>
          a_t.type.kind == "arr" ?
            co_unit(mk_typing(a_t.type.arg, Sem.get_arr_el_expr_rt(a_t.sem, i_t.sem)))
          : co_error<State,Err,Typing>({ range:r, message:`Error: cannot perform array lookup on type ${type_to_string(a_t.type)}` })
        )))
}

export let set_index = function(r:SourceRange, a:Stmt, i:Stmt, e:Stmt) : Stmt {
  return constraints => ensure_constraints(r, constraints)(a(no_constraints).then(a_t =>
         i(apply(inl(), int_type)).then(i_t =>
          a_t.type.kind != "arr" ?
            co_error<State,Err,Typing>({ range:r, message:`Error: cannot perform array lookup on type ${type_to_string(a_t.type)}` })
          : e(apply(inl(), a_t.type.arg)).then(e_t =>
            a_t.type.kind == "arr" ?
              co_unit(mk_typing(a_t.type.arg, Sem.set_arr_el_expr_rt(a_t.sem, i_t.sem, e_t.sem)))
            : co_error<State,Err,Typing>({ range:r, message:`Error: cannot perform array lookup on type ${type_to_string(a_t.type)}` })
        ))))
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
  return expected_type => c(apply(inl(), bool_type)).then(c_t =>
          co_stateless<State,Err,Typing>(t(expected_type)).then(t_t =>
          co_stateless<State,Err,Typing>(e(expected_type)).then(e_t => {

          let on_type : Fun<TypeInformation, Stmt> = fun(t_i => (_:TypeConstraints) => co_unit<State,Err,Typing>(mk_typing(t_i,Sem.if_then_else_rt(c_t.sem, t_t.sem, e_t.sem))))
          let on_error : Fun<Unit, Stmt> = constant<Unit, Stmt>(_ =>
            co_error<State,Err,Typing>({ range:r, message:"Error: the branches of a conditional should have compatible types." }))

          let res = apply(on_type.plus(on_error), lub(t_t.type, e_t.type))

          return res(no_constraints)
         })))
}

export let while_do = function(r:SourceRange, c:Stmt, b:Stmt) : Stmt {
  return _ => co_stateless<State,Err,Typing>(c(apply(inl(), bool_type)).then(c_t =>
         b(no_constraints).then(t_t => co_unit(mk_typing(t_t.type,Sem.while_do_rt(c_t.sem, t_t.sem)))
         )))
}

export let for_loop = function(r:SourceRange, i:Stmt, c:Stmt, s:Stmt, b:Stmt) : Stmt {
  return _ => co_stateless<State,Err,Typing>(
          i(no_constraints).then(i_t =>
          c(apply(inl(), bool_type)).then(c_t =>
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

export let mk_param = function(name:Name, type:Type) {
  return { name:name, type:type }
}
export let mk_lambda = function(r:SourceRange, def:LambdaDefinition, closure_parameters:Array<Name>, range:SourceRange) : Stmt {
  let parameters = def.parameters
  let return_t = def.return_t
  let body = def.body
  let set_bindings = parameters.reduce<Stmt>((acc, par) => semicolon(r, decl_v(r, par.name, par.type, false), acc),
                     closure_parameters.reduce<Stmt>((acc, cp) =>
                      semicolon(r, _ => get_v(r, cp)(no_constraints).then(cp_t => decl_forced_v(r, cp, cp_t.type, true)(no_constraints)), acc), done))
  return  _ => Co.co_get_state<State,Err>().then(initial_bindings =>
          set_bindings(no_constraints).then(_ =>
          body(apply(inl(), return_t)).then(body_t =>
            Co.co_set_state<State,Err>(initial_bindings).then(_ =>
            co_unit(mk_typing(fun_type(tuple_type(parameters.map(p => p.type)), body_t.type, r), Sem.mk_lambda_rt(body_t.sem, parameters.map(p => p.name), closure_parameters, range))))
          )))
}
// export interface Bindings extends Immutable.Map<Name, TypeInformation> {}
// export interface State { highlighting:SourceRange, bindings:Bindings }
export let def_fun = function(r:SourceRange, def:FunDefinition, closure_parameters:Array<Name>) : Stmt {
  return _ => co_get_state<State, Err>().then(s =>
         co_set_state<State, Err>({...s, bindings:s.bindings.set(def.name, {...fun_type(tuple_type(def.parameters.map(p => p.type)), def.return_t, r), is_constant:true})}).then(_ =>
         mk_lambda(r, def, closure_parameters, def.range)(no_constraints).then(l =>
         co_set_state<State, Err>(s).then(_ =>
         decl_const(r, def.name, l.type, _ => co_unit<State,Err,Typing>(l))(no_constraints)))))

}


export let def_method = function(r:SourceRange, C_name:string, def:MethodDefinition) : Stmt {

  let is_static = def.modifiers.some(m => m == "static")
  let parameters = def.parameters
  // console.log("params", JSON.stringify(parameters))
  let return_t = def.return_t
  let body = def.body
  let set_bindings = (is_static ? parameters : parameters.concat([{name:"this", type:ref_type(C_name)}]))
                        .reduce<Stmt>((acc, par) => semicolon(r, decl_v(r, par.name, par.type, false), acc), done)
  return  _ => Co.co_get_state<State,Err>().then(initial_bindings =>
          set_bindings(no_constraints).then(_ =>
          body(apply(inl(), return_t)).then(body_t =>
            Co.co_set_state<State,Err>(initial_bindings).then(_ =>
              is_static ?
                co_unit(mk_typing(fun_type(tuple_type(parameters.map(p => p.type)), body_t.type, r),
                      Sem.mk_lambda_rt(body_t.sem, parameters.map(p => p.name), [], def.range)))
              : co_unit(mk_typing(fun_type(tuple_type([ref_type(C_name)]),
                                           fun_type(tuple_type(parameters.map(p => p.type)), body_t.type, r), r),
                        Sem.mk_lambda_rt(Sem.mk_lambda_rt(body_t.sem, parameters.map(p => p.name), ["this"], def.range), ["this"], [], def.range))))
          )))
}

export let call_lambda = function(r:SourceRange, lambda:Stmt, arg_values:Array<Stmt>) : Stmt {
  return constraints => ensure_constraints(r, constraints)(lambda(no_constraints).then(lambda_t => {
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
      arg_values.length != lambda_t.type.in.args.length ?
      lambda_t.type.kind == "fun" && lambda_t.type.in.kind == "tuple" && lambda_t.type.in.args.length == 1 && lambda_t.type.in.args[0].kind == "unit" &&
      arg_values.length == 0 ?
      co_unit(mk_typing(lambda_t.type.out, Sem.call_lambda_expr_rt(lambda_t.sem, args_t.toArray().map(arg_t => arg_t.sem)))) :
      co_error<State,Err,Typing>({ range:r, message:`Error: parameter type mismatch when calling lambda expression ${type_to_string(lambda_t.type)} with arguments ${JSON.stringify([args_t.toArray().map(a => type_to_string(a.type))])}`})
      :
      co_unit(mk_typing(lambda_t.type.out, Sem.call_lambda_expr_rt(lambda_t.sem, args_t.toArray().map(arg_t => arg_t.sem))))
    )
  }))
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
  return constraints => constraints.kind == "left" && !type_equals(arr_type(type), constraints.value) ?
          co_error<State,Err,Typing>({ range:r, message:`Error: array type ${type_to_string(type)} does not match context ${type_to_string(constraints.value)}`})
          : len(apply(inl(), int_type)).then(len_t =>
            co_unit(mk_typing(arr_type(type), Sem.new_arr_expr_rt(len_t.sem))))
}

export let new_array_and_init = function(r:SourceRange, type:Type, args:Stmt[]) : Stmt {
  return constraints => {
    if (constraints.kind == "left" && !type_equals(arr_type(type), constraints.value))
      return co_error<State,Err,Typing>({ range:r, message:`Error: array type ${type_to_string(type)} does not match context ${type_to_string(constraints.value)}`})
    let xs = Immutable.List<Coroutine<State,Err,Typing>>(args.map(a => a(apply(inl(), type))))
    return comm_list_coroutine(xs).then(xs_t => {
      let arg_types = xs_t.toArray().map(x_t => x_t.type)
      // arg_types must all be of type `type`
      let arg_values = xs_t.toArray().map(x_t => x_t.sem)
      return co_unit(mk_typing(arr_type(type), Sem.new_arr_expr_with_values_rt(arg_values)))
    })
  }
}

export let get_arr_el = function(r:SourceRange, a:Stmt, i:Stmt) : Stmt {
  return constraints => a(no_constraints).then(a_t =>
         i(apply(inl(), int_type)).then(i_t => {
          if (a_t.type.kind != "arr")
            return co_error<State,Err,Typing>({ range:r, message:`Error: expected an array, instead found ${type_to_string(a_t.type)}.`})
          let arr_arg = a_t.type.arg
          return coerce_to_constraint(r, _ => co_unit(mk_typing(arr_arg, Sem.get_arr_el_expr_rt(a_t.sem, i_t.sem))), arr_arg)(constraints)
         }
        ))
}

export let set_arr_el = function(r:SourceRange, a:Stmt, i:Stmt, e:Stmt) : Stmt {
  return _ => a(no_constraints).then(a_t =>
         a_t.type.kind == "arr" ? e(apply(inl(), a_t.type.arg)).then(e_t =>
         i(apply(inl(), int_type)).then(i_t =>
          co_unit(mk_typing(unit_type, Sem.set_arr_el_expr_rt(a_t.sem, i_t.sem, e_t.sem)))
        ))
        : co_error<State,Err,Typing>({ range:r, message:`Error: expected an array, instead found ${type_to_string(a_t.type)}.`}))
}

export let def_class = function(r:SourceRange, C_name:string, methods_from_context:Array<(_:CallingContext) => MethodDefinition>, fields_from_context:Array<(_:CallingContext) => FieldDefinition>, is_internal=false) : Stmt {
  let context:CallingContext = { kind:"class", C_name:C_name }
  let methods = methods_from_context.map(m => m(context))
  let fields = fields_from_context.map(f => f(context))
  let C_type_placeholder:Type = {
    range: r,
    kind: "obj",
    is_internal:is_internal,
    C_name:C_name,
    methods:Immutable.Map<Name, MethodTyping>(
      methods.map(m => {
        // console.log("===>>> ",m.name,JSON.stringify(m.modifiers.filter(md => md == "static").length == 0 ?
        // mk_typing(fun_type(ref_type(C_name), fun_type(tuple_type((m.parameters.map(p => p.type))), m.return_t, m.range), m.range), Sem.done_rt) :
        // mk_typing(fun_type(tuple_type(m.parameters.map(p => p.type)), m.return_t, m.range), Sem.done_rt)))
        return [
          m.name,
          {
            typing:
              m.modifiers.filter(md => md == "static").length == 0 ?
              mk_typing(fun_type(tuple_type([ref_type(C_name)]), fun_type(tuple_type((m.parameters.map(p => p.type))), m.return_t, m.range), m.range), Sem.done_rt) :
              mk_typing(fun_type(tuple_type(m.parameters.map(p => p.type)), m.return_t, m.range), Sem.done_rt),
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
            modifiers:Immutable.Set<Modifier>(f.modifiers),
            initial_value:f.initial_value
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
            range: r,
            kind: "obj",
            is_internal:is_internal,
            C_name:C_name,
            methods:Immutable.Map<Name, MethodTyping>(
              methods_full_t.map(m => [m.def.name, { typing:m.typ, modifiers:Immutable.Set<Modifier>(m.def.modifiers) }])
            ),
            fields:Immutable.Map<Name, FieldType>(
              fields.filter(f => !f.modifiers.some(mod => mod == "static")).map(f =>
                  [ f.name,
                  { type:f.type, initial_value:f.initial_value, modifiers:Immutable.Set<Modifier>(f.modifiers) } ] )
            )
          }
          let static_fields = fields.filter(f => f.modifiers.some(mod => mod == "static"))
          let C_int:Sem.Interface = {
            range: r,
            is_internal:is_internal,
            base:apply(inr<Sem.Interface, Unit>(), {}),
            methods:
              Immutable.Map<Name, Sem.StmtRt>(methods_full_t.filter(m => !m.def.modifiers.some(mod => mod == "static")).map(m =>
                {
                  let res:[Name, Sem.StmtRt] = [
                    m.def.name,
                    m.typ.sem ]
                  return res
                }
              )),
            static_methods:Immutable.Map<Name, Sem.StmtRt>(methods_full_t.filter(m => m.def.modifiers.some(mod => mod == "static")).map(m =>
              {
                let res:[Name, Sem.StmtRt] = [
                  m.def.name,
                  m.typ.sem ]
                return res
              }
            )),
            static_fields:Immutable.Map<Sem.ValueName, Sem.Val>(static_fields.map(f =>
              [ f.name,
                initial_value(f.type)
              ]))
          }

          let init_static_fields = static_fields.map(f => {
            if (f.initial_value.kind == "right") return done
            else {
              let v = f.initial_value.value
              return (_:TypeConstraints) => v(apply(inl(), f.type)).then(v_v =>
                co_unit<State, Err, Typing>(mk_typing(unit_type, Sem.static_field_set_expr_rt(C_name, { att_name:f.name, kind:"att" }, v_v.sem))))
            }
          }).reduce((a,b) => semicolon(r,a,b), done)

          return co_set_state<State, Err>({...initial_bindings, bindings:initial_bindings.bindings.set(C_name, {...C_type, is_constant:true}) }).then(_ =>
            init_static_fields(no_constraints).then(init_static_fields_t =>
              co_unit(mk_typing(unit_type, Sem.declare_class_rt(C_name, C_int).then(_ => init_static_fields_t.sem)))
            )
          )
          }
          )))
}

export let field_get = function(r:SourceRange, context:CallingContext, this_ref:Stmt, F_or_M_name:string) : Stmt {
  return constraints => this_ref(no_constraints).then(this_ref_t =>
         co_get_state<State, Err>().then(bindings => {

            if (this_ref_t.type.kind == "string" && F_or_M_name == "Length") {
              return ensure_constraints(r, constraints)(co_unit(mk_typing(int_type, Sem.string_length_rt(this_ref_t.sem))))
            } else if (this_ref_t.type.kind == "arr" && F_or_M_name == "Length") {
              return ensure_constraints(r, constraints)(co_unit(mk_typing(int_type, Sem.get_arr_len_expr_rt(this_ref_t.sem))))
            }
            else
              if (this_ref_t.type.kind != "ref" && this_ref_t.type.kind != "obj") {
              let item = /^Item/
              let m = F_or_M_name.match(item)
              if (this_ref_t.type.kind == "tuple" && m != null && m.length != 0) {
                try {
                  let item_index = parseInt(F_or_M_name.replace(item, "")) - 1
                  return ensure_constraints(r, constraints)(co_unit(mk_typing(this_ref_t.type.args[item_index],
                          Sem.tuple_get_rt(r, this_ref_t.sem, item_index))))
                } catch (error) {
                  return co_error<State,Err,Typing>({ range:r, message:`Invalid field getter ${F_or_M_name}. }`})
                }
              } else {
                if (this_ref_t.type.kind == "record" && this_ref_t.type.args.has(F_or_M_name)) {
                  try {
                    return ensure_constraints(r, constraints)(co_unit(mk_typing(this_ref_t.type.args.get(F_or_M_name),
                            Sem.record_get_rt(r, this_ref_t.sem, F_or_M_name))))
                  } catch (error) {
                    return co_error<State,Err,Typing>({ range:r, message:`Invalid field getter ${F_or_M_name}. }`})
                  }
                }
              }
           }

           let C_name = this_ref_t.type.kind == "ref" || this_ref_t.type.kind == "obj" ? this_ref_t.type.C_name : type_to_string(this_ref_t.type)
           if (!bindings.bindings.has(C_name)) return co_error<State,Err,Typing>({ range:r, message:`Error: class ${C_name} is undefined`})
           let C_def = bindings.bindings.get(C_name)
           if (C_def.kind != "obj") return co_error<State,Err,Typing>({ range:r, message:`Error: ${C_name} is not a class.`})

           if (C_def.fields.has(F_or_M_name)){
            let F_def = C_def.fields.get(F_or_M_name)
            if (!F_def.modifiers.has("public")) {
              if (context.kind == "global scope")
                return co_error<State,Err,Typing>({ range:r, message:`Error: cannot get non-public field ${F_or_M_name}.`})
              else if (context.C_name != C_name)
                return co_error<State,Err,Typing>({ range:r, message:`Error: cannot get non-public field ${C_name}::${F_or_M_name}.`})
            }
            return ensure_constraints(r, constraints)(co_unit<State,Err,Typing>(mk_typing(F_def.type,
                      F_def.modifiers.has("static") ?
                          Sem.static_field_get_expr_rt(C_name, F_or_M_name)
                        : Sem.field_get_expr_rt(F_or_M_name, this_ref_t.sem))))
           }
            else if (C_def.methods.has(F_or_M_name)){
              let M_def = C_def.methods.get(F_or_M_name)
              // console.log("This is the method", JSON.stringify(M_def), F_or_M_name)
              // console.log("This is this", JSON.stringify(this_ref_t))

              if (!M_def.modifiers.has("public")) {
                if (context.kind == "global scope")
                  return co_error<State,Err,Typing>({ range:r, message:`Error: cannot get non-public method ${F_or_M_name}.`})
                else if (context.C_name != C_name)
                  return co_error<State,Err,Typing>({ range:r, message:`Error: cannot get non-public method ${C_name}::${F_or_M_name}.`})
              }
              if (M_def.typing.type.kind != "fun") return co_error<State,Err,Typing>({ range:r, message:`Error: method ${C_name}::${F_or_M_name} is not a lambda.`})
              if (M_def.modifiers.has("static")) {
                if (this_ref_t.type.kind == "ref" || this_ref_t.type.kind == "obj") {
                  return co_unit(mk_typing(M_def.typing.type,
                    Sem.static_method_get_expr_rt(C_name, F_or_M_name)))
                  } else {
                    return co_unit(mk_typing(fun_type(tuple_type([]), M_def.typing.type, r),
                    Sem.mk_lambda_rt(Sem.call_lambda_expr_rt(Sem.static_method_get_expr_rt(C_name, F_or_M_name), [this_ref_t.sem]),
                    [], [], r)
                  ))
                }
              } else {
                return co_unit(mk_typing(M_def.typing.type.out,
                  Sem.call_lambda_expr_rt(Sem.method_get_expr_rt(F_or_M_name, this_ref_t.sem), [this_ref_t.sem])))

              }
            }
            return co_error<State,Err,Typing>({ range:r, message:`Error: ${C_name} does not contain field or method ${F_or_M_name}`})

          }
         ))
}

export let field_set = function(r:SourceRange, context:CallingContext, this_ref:Stmt, F_name:{att_name:string, kind:"att"} |
                                                                                             {att_name:string, kind:"att_arr", index:Stmt}, new_value:Stmt) : Stmt {
  return _ => this_ref(no_constraints).then(this_ref_t =>
         (F_name.kind == "att_arr" ? F_name.index(no_constraints) : co_unit<State, Err, Typing>(mk_typing(bool_type, Sem.bool_expr(false)))).then(maybe_index =>
         co_get_state<State, Err>().then(bindings => {
           if (this_ref_t.type.kind != "ref" && this_ref_t.type.kind != "obj") {
             return co_error<State,Err,Typing>({ range:r, message:`Error: expected reference or class name when setting ${F_name.att_name}.`})
           }
           let C_name:string = this_ref_t.type.C_name
           if (!bindings.bindings.has(C_name)) return co_error<State,Err,Typing>({ range:r, message:`Error: class ${C_name} is undefined`})
           let C_def = bindings.bindings.get(C_name)
           if (C_def.kind != "obj") return co_error<State,Err,Typing>({ range:r, message:`Error: type ${C_name} is not a class`})
           if (!C_def.fields.has(F_name.att_name)) return co_error<State,Err,Typing>({ range:r, message:`Error: class ${C_name} does not contain ${F_name.att_name}`})
           let F_def = C_def.fields.get(F_name.att_name)

           if (!F_def.modifiers.has("public")) {
            if (context.kind == "global scope")
              return co_error<State,Err,Typing>({ range:r, message:`Error: cannot set non-public field ${F_name.att_name}.`})
            else if (context.C_name != C_name)
              return co_error<State,Err,Typing>({ range:r, message:`Error: cannot set non-public field ${C_name}::${F_name.att_name}.`})
           }
           return new_value(apply(inl(), F_def.type)).then(new_value_t => {
             //if (!type_equals(F_def.type, new_value_t.type)) return co_error<State,Err,Typing>({ range:r, message:`Error: field ${C_name}::${F_name.att_name} cannot be assigned to value of type ${JSON.stringify(new_value_t.type)}`})
             return co_unit(mk_typing(unit_type,
              F_def.modifiers.has("static") ?
              Sem.static_field_set_expr_rt(C_name, F_name.kind == "att" ? F_name : {...F_name, index:maybe_index.sem}, new_value_t.sem)
              : Sem.field_set_expr_rt(F_name.kind == "att" ? F_name : {...F_name, index:maybe_index.sem}, new_value_t.sem, this_ref_t.sem)))
            })
          }
         )))
}


export let call_cons = function(r:SourceRange, context:CallingContext, C_name:string, arg_values:Array<Stmt>) : Stmt {
  return constraints => co_get_state<State, Err>().then(bindings => {
    if (!bindings.bindings.has(C_name)) return co_error<State,Err,Typing>({ range:r, message:`Error: class ${C_name} is undefined.`})
    let C_def = bindings.bindings.get(C_name)
    if (C_def.kind != "obj") return co_error<State,Err,Typing>({ range:r, message:`Error: type  ${C_name} is not a class.`})
    if (!C_def.methods.has(C_name)) {
      return co_error<State,Err,Typing>({ range:r, message:`Error: class ${C_name} has no constructors.`})
    }
    let lambda_t = C_def.methods.get(C_name)

    if (lambda_t.typing.type.kind != "fun" || lambda_t.typing.type.in.kind != "tuple" ||
        lambda_t.typing.type.out.kind != "fun" || lambda_t.typing.type.out.in.kind != "tuple" )
      return co_error<State,Err,Typing>({ range:r, message:`Error: invalid constructor type ${type_to_string(lambda_t.typing.type)}`})

    let expected_args = lambda_t.typing.type.out.in.args

    let check_arguments = arg_values.reduce<Coroutine<State, Err, Immutable.List<Typing>>>((args, arg, arg_i) =>
      arg(apply(inl(), expected_args[arg_i])).then(arg_t =>
      args.then(args_t =>
      co_unit(args_t.push(arg_t))
      )),
      co_unit(Immutable.List<Typing>()))


    let init_fields = C_def.fields.filter(f => !!f && !f.modifiers.has("static")).map((f, f_name) => {
      if (f_name == undefined || f == undefined || f.initial_value.kind == "right") return done
      else {
        let v = f.initial_value.value
        return (_:TypeConstraints) => v(no_constraints).then(v_v =>
          co_unit<State, Err, Typing>(mk_typing(unit_type, Sem.field_set_expr_rt({ att_name:f_name, kind:"att" }, v_v.sem, Sem.get_v_rt("this")))))
      }
    }).toArray().reduce((a,b) => semicolon(r,a,b), done)

    if (!lambda_t.modifiers.has("public")) {
      if (context.kind == "global scope")
        return co_error<State,Err,Typing>({ range:r, message:`Error: cannot call non-public constructor ${C_name}.`})
      else if (context.C_name != C_name)
        return co_error<State,Err,Typing>({ range:r, message:`Error: cannot call non-public constructor ${C_name}.`})
    }
    return ensure_constraints(r, constraints)(lambda_t.typing.type.kind == "fun" && lambda_t.typing.type.in.kind == "tuple" ?
        check_arguments.then(args_t =>
        init_fields(no_constraints).then(init_fields_t =>
          lambda_t.typing.type.kind != "fun" || lambda_t.typing.type.in.kind != "tuple" ||
          (lambda_t.typing.type.out.kind == "fun" &&
          lambda_t.typing.type.out.in.kind == "tuple" &&
          arg_values.length != lambda_t.typing.type.out.in.args.length) ?
            co_error<State,Err,Typing>({ range:r, message:`Error: parameter type mismatch when calling lambda expression ${type_to_string(lambda_t.typing.type)} with arguments ${JSON.stringify(args_t.toArray().map(t => type_to_string(t.type)))}`})
          :
            co_unit(mk_typing(ref_type(C_name), Sem.call_cons_rt(C_name, args_t.toArray().map(arg_t => arg_t.sem), init_fields_t.sem)))
          ))
      : co_error<State,Err,Typing>({ range:r, message:`Error: cannot invoke non-lambda expression of type ${type_to_string(lambda_t.typing.type)}`}))
  })
}

export let get_class = (r:SourceRange, t:Type) : Coroutine<State, Err, ObjType> =>
  t.kind == "int" || t.kind == "float" || t.kind == "string" || t.kind == "double" || t.kind == "bool" || t.kind == "unit" ?
  co_get_state<State, Err>().then(bindings => {
    if (!bindings.bindings.has(t.kind)) return co_error<State, Err, ObjType>({ message: `Cannot find class for primitive type ${type_to_string(t)}`, range:r })
    let t_t = bindings.bindings.get(t.kind)
    if (t_t.kind != "obj") co_error<State, Err, ObjType>({ message: `Malformed class for primitive type ${type_to_string(t)}`, range:r })
    let t_obj:ObjType = t_t as ObjType
    return co_unit(t_obj)
  })
  : t.kind == "obj" ? co_unit<State, Err, ObjType>(t)
  : co_unit<State, Err, ObjType>({ C_name:type_to_string(t), fields:Immutable.Map<Name, FieldType>(), methods:Immutable.Map<Name, MethodTyping>(), is_internal:true, range:zero_range, kind:"obj" })

export let coerce = (r:SourceRange, e:Stmt, t:Type) : Stmt =>
  constraints => e(constraints).then(e_v => {
    if (type_equals(t, e_v.type)) return co_unit(e_v)

    if (e_v.type.kind == "tuple" && t.kind == "record") {
      let record_labels = t.args.keySeq().toArray()
      return co_unit(
        mk_typing(t, e_v.sem.then(e_v_rt => co_unit(apply(inl(), tuple_to_record(e_v_rt.value, record_labels)))))
      )
    }
    return get_class(r, e_v.type).then(e_c => {
    let t_name = type_to_string(t)
    let e_type_name = type_to_string(e_v.type)

    // console.log(`Coercing ${e_type_name} -> ${JSON.stringify(t)}`)

    let casting_operators = e_c.methods.filter(m => m != undefined && m.modifiers.some(mod => mod == "casting") && m.modifiers.some(mod => mod == "operator") && m.modifiers.some(mod => mod == "static")).map((c_op, c_op_name) => ({ body:c_op, name:c_op_name}) ).toArray() as { body:MethodTyping, name:string}[]
    let coercions = casting_operators.map(c_op => {
      let c_op_typing:Stmt = _ => co_unit<State,Err,Typing>(mk_typing(c_op.body.typing.type, Sem.static_method_get_expr_rt(e_type_name, c_op.name)))
      let coercion = call_lambda(r, c_op_typing, [_ => co_unit<State,Err,Typing>(e_v)])
      if (c_op.name == t_name) {
        return coercion
      } else {
        return coerce(r, coercion, t)
      }
    })

    return co_catch_many<State,Err,Typing>({ message:`Cannot cast from ${e_type_name} to ${t_name}`, range:r})(Immutable.List<Coroutine<State, Err, Typing>>(coercions.map(c => c(no_constraints))))
  })
  })
