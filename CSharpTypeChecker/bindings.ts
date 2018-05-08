import * as Immutable from "immutable"
import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, fun2, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair, distribute_sum_prod_inv, distribute_sum_prod, fun3, co_get_state, co_set_state, Option } from "ts-bccc"
import * as CCC from "ts-bccc"
import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
import * as Co from "ts-bccc"
import { SourceRange, mk_range, zero_range, print_range } from "../source_range"
import * as Sem from "../Python/python"
import { comm_list_coroutine, co_stateless, co_catch, co_catch_many } from "../ccc_aux";
import { ValueName, tuple_to_record, ExprRt, Val, mk_expr_from_val, done_rt, MemRt, ErrVal } from "../main";
import { Stmt, no_constraints, TypeConstraints, State, Err, Typing, Type, Name, load, TypeInformation, mk_typing_cat_full, store, unit_type, mk_typing, type_equals, tuple_type, bool_type, string_type, int_type, float_type, double_type, square_type, ellipse_type, rectangle_type, line_type, arr_type, polygon_type, text_type, sprite_type, render_surface_type, other_render_surface_type, circle_type, fun_type, ref_type, MethodTyping, FieldType, Parameter, LambdaDefinition, FunDefinition, MethodDefinition, CallingContext, FieldDefinition, Modifier, type_to_string, ObjType, Bindings, var_type, fun_stmts_type, FunWithStmts, generic_type_decl, GenericParameter } from "./types";
import { MultiMap } from "../multi_map";
import { ModifierAST } from "./grammar";

// Basic statements and expressions
let ensure_constraints = (r: SourceRange, constraints: TypeConstraints) => (res: Coroutine<State, Err, Typing>) => {
  if (constraints.kind == "right") return res
  if (constraints.value.kind == "fun_with_input_as_stmts") return res
  return coerce(r, _ => res, constraints.value)(no_constraints)
}

const initial_value = (type: Type): Sem.Val => {
  switch (type.kind) {
    case "bool": return Sem.mk_bool_val(false)
    case "double": return Sem.mk_float_val(0)
    case "float": return Sem.mk_float_val(0)
    case "int": return Sem.mk_int_val(0)
    case "tuple": return Sem.mk_tuple_val(type.args.map(initial_value))
    case "obj": return Sem.mk_obj_val(Immutable.Map(type.fields.toArray().map(f => initial_value(f.type))))
    default: return Sem.mk_unit_val
  }
}

export let wrap_co_res = Co.value<State, Err, Typing>().then(Co.result<State, Err, Typing>())
export let wrap_co = wrap_co_res.then(Co.no_error())
export let get_v = function (r: SourceRange, v: Name): Stmt {
  let f = load.then(
    constant<Unit, Err>({ range: r, message: `Error: variable ${v} does not exist.` }).map_plus(
      (id<TypeInformation>().times(constant<TypeInformation, Sem.ExprRt<Sum<Sem.Val, Sem.Val>>>(Sem.get_v_rt(r, v)))).then(mk_typing_cat_full)
    ))
  let g = snd<Name, State>().times(f).then(distribute_sum_prod())
  let g1 = g.then(
    (snd<State, Err>()).map_plus(
      (swap_prod<State, Typing>().then(wrap_co_res))
    ))
  let h = apply(curry(g1), v)
  let i = mk_coroutine<State, Err, Typing>(h)
  return constraints =>
    {
      return constraints.kind == "right" || constraints.value.kind == "var" || constraints.value.kind == "fun_with_input_as_stmts" ? i :
             coerce(r, _ => i, constraints.value)(no_constraints)
    }
}
export let instantiate_generics = function(r:SourceRange, t:Type) : Coroutine<State, Err, Typing> {
  // console.log("instantiating generics over", type_to_string(t), JSON.stringify(t))
  if (t.kind == "generic type instance") {
    let C_name = t.C_name
    let args = comm_list_coroutine(Immutable.List(t.args.map(a => instantiate_generics(r, a))))
    return args.then(args_i_l => {
      let args_i = args_i_l.toArray()
      let t1_name = type_to_string({...t, args:args_i.map(a_i => a_i.type)})
      let t1 = ref_type(t1_name)
      return co_get_state<State,Err>().then(s => {
      if (s.bindings.has(t1_name)) {
        // t1 has already been instantiated once: nothing to do here
        return co_unit(mk_typing(t1, Sem.done_rt))
      } else if (s.bindings.has(C_name)) {
        let t_template = s.bindings.get(C_name)
        if (t_template.kind == "generic type decl" && t_template.params.length == args_i.length) {
          // t exists but is not instantiated
          let instantiate_t1 = t_template.instantiate(Immutable.Map<string,Type>(t_template.params.map((p,i) => [p.name, args_i[i].type])))
          let args_i_sem = args_i.reduce<Sem.StmtRt>((sem, a_i) => a_i ? sem.then(_ => a_i.sem) : sem, Sem.done_rt)
          return instantiate_t1(no_constraints).then(t1_t =>
              co_unit(mk_typing(t1, args_i_sem.then(_ => t1_t.sem))))
        }
      }
      return co_error<State, Err, Typing>({ range: r, message: `Error: cannot instantiate ${type_to_string(t)}` })
    })
    })
  } else if (t.kind == "tuple") {
    let args = comm_list_coroutine(Immutable.List(t.args.map(a => instantiate_generics(r, a))))
    return args.then(args_i_l => {
      let args_i = args_i_l.toArray()
      let args_i_sem = args_i.reduce<Sem.StmtRt>((sem, a_i) => a_i ? sem.then(_ => a_i.sem) : sem, Sem.done_rt)
      let t1 = {...t, args:args_i.map(a_i => a_i.type)}
      return co_unit(mk_typing(t1, args_i_sem))
    })
  } else if (t.kind == "record") {
    let args = comm_list_coroutine(t.args.map((a,a_name) =>
    a == undefined || a_name == undefined ?
    co_error<State, Err, { t:Typing, n:string }>({ range: r, message: `Error: cannot instantiate ${type_to_string(t)}` })
    : instantiate_generics(r, a).then(a => co_unit<State, Err, { t:Typing, n:string }>({ t:a, n:a_name }))).toList())
    return args.then(args_i_l => {
      let args_i = args_i_l.toArray()
      let args_i_sem = args_i.reduce<Sem.StmtRt>((sem, a_i) => a_i ? sem.then(_ => a_i.t.sem) : sem, Sem.done_rt)
      let t1 = {...t, args:Immutable.Map<string,Type>(args_i.map(a_i => [a_i.n, a_i.t.type]))}
      return co_unit(mk_typing(t1, args_i_sem))
    })
  } else if (t.kind == "fun") {
    let args = comm_list_coroutine(Immutable.List([instantiate_generics(r, t.in), instantiate_generics(r, t.out)]))
    return args.then(args_i_l => {
      let args_i = args_i_l.toArray()
      let args_i_sem = args_i.reduce<Sem.StmtRt>((sem, a_i) => a_i ? sem.then(_ => a_i.sem) : sem, Sem.done_rt)
      let t1 = {...t, in:args_i[0].type, out:args_i[1].type}
      return co_unit(mk_typing(t1, args_i_sem))
    })
  } else if (t.kind == "arr") {
    let arg = instantiate_generics(r, t.arg)
    return arg.then(arg_i => {
      let t1 = {...t, arg:arg_i.type}
      return co_unit(mk_typing(t1, arg_i.sem))
    })
  }

  return co_unit<State,Err,Typing>(mk_typing(t, Sem.done_rt))
}
export let decl_forced_v = function (r: SourceRange, v: Name, t0: Type, is_constant?: boolean): Stmt {
  return _ => {
  return instantiate_generics(r, t0).then(t_t => {
  let t = t_t.type
  let f = store.then(constant<State, Typing>(mk_typing(unit_type, t_t.sem.then(_ => Sem.decl_v_rt(v, apply(inl(), initial_value(t)))))).times(id())).then(wrap_co)
  let g = curry(f)
  let args = apply(constant<Unit, Name>(v).times(constant<Unit, TypeInformation>({ ...t, is_constant: is_constant != undefined ? is_constant : false })), {})
  return co_get_state<State, Err>().then(s =>
      mk_coroutine<State, Err, Typing>(apply(g, args))
    )
  })
  }
}

export let decl_v = function (r: SourceRange, v: Name, t0: Type, is_constant?: boolean): Stmt {
  return _ => {
    return instantiate_generics(r, t0).then(t_t => {
      let t = t_t.type
      return co_get_state<State, Err>().then(s => {
      let f = store.then(constant<State, Typing>(mk_typing(unit_type, t_t.sem.then(_ => Sem.decl_v_rt(v, apply(inl(), initial_value(t)))))).times(id())).then(wrap_co)
      let g = curry(f)
      let args = apply(constant<Unit, Name>(v).times(constant<Unit, TypeInformation>({ ...t, is_constant: is_constant != undefined ? is_constant : false })), {})
      return !s.bindings.has(v) ? mk_coroutine<State, Err, Typing>(apply(g, args))
        : co_error<State, Err, Typing>({ range: r, message: `Error: cannot redeclare variable ${v}` })
      })
    })
    }
}
export let decl_and_init_v = function (r: SourceRange, v: Name, t0: Type, e: Stmt, is_constant?: boolean): Stmt {
  return c => {
    return instantiate_generics(r, t0).then(t_t => {
    let t = t_t.type
    // console.log(`Raw type was ${type_to_string(t0)}, instantiated it is ${type_to_string(t)}`)
    return e(t.kind == "var" ? no_constraints : apply(inl(), t)).then(e_val =>
    co_get_state<State, Err>().then(s => {
      if (s.bindings.has(v)) return co_error<State, Err, Typing>({ range: r, message: `Error: cannot redeclare variable ${v}` })
      let f = store.then(constant<State, Typing>(mk_typing(unit_type, t_t.sem.then(_ => e_val.sem.then(e_val => Sem.decl_v_rt(v, apply(inl(), e_val.value)))))).times(id())).then(wrap_co)
      let g = curry(f)
      let args = apply(constant<Unit, Name>(v).times(constant<Unit, TypeInformation>({ ...e_val.type, is_constant: is_constant != undefined ? is_constant : false })), {})
      return mk_coroutine<State, Err, Typing>(apply(g, args))
    }))})
  }
}
export let decl_const = function (r: SourceRange, c: Name, t0: Type, e: Stmt): Stmt {
  return _ => {
    return instantiate_generics(r, t0).then(t_t => {
    let t = t_t.type
    let f = store.then(constant<State, Typing>(mk_typing(unit_type, Sem.decl_v_rt(c, apply(inl(), Sem.mk_unit_val)))).times(id())).then(wrap_co)
    let g = curry(f)
    let args = apply(constant<Unit, Name>(c).times(constant<Unit, TypeInformation>({ ...t, is_constant: true })), {})
    return mk_coroutine<State, Err, Typing>(apply(g, args)).then(_ =>
      get_v(r, c)(no_constraints).then(c_val =>
        e(apply(inl(), c_val.type)).then(e_val =>
          co_unit(mk_typing(unit_type, t_t.sem.then(_ => Sem.set_v_expr_rt(c, e_val.sem))))
        )))
    })
  }
}

export let set_v = function (r: SourceRange, v: Name, e: Stmt): Stmt {
  return c => get_v(r, v)(no_constraints).then(v_val =>
    e(apply(inl(), v_val.type)).then(e_val => {
      if (!v_val.type.is_constant) {
        return co_unit(mk_typing(unit_type, Sem.set_v_expr_rt(v, e_val.sem)))
      } else {
        return co_error<State, Err, Typing>({ range: r, message: `Error: cannot assign anything to constant ${v}.` })
      }
    }
    ))
}

export const mk_fs_key_value = (r: SourceRange, k: Stmt, v: Stmt) : Stmt => {
  return _ =>
    k(apply(inl(), string_type)).then(k_t =>
    v(apply(inl(), string_type)).then(v_t =>
    co_unit(mk_typing(tuple_type([string_type, string_type]), Sem.tuple_expr_rt([k_t.sem, v_t.sem])))))
}

export const mk_fs_file = (r: SourceRange, path: Stmt, attr: Array<Stmt>): Stmt => {
  return _ =>
    path(no_constraints).then(p_t =>
    comm_list_coroutine(Immutable.List(attr.map(a => a(no_constraints)))).then(a_t =>
    co_unit(mk_typing(unit_type, Sem.set_file_from_block(r, p_t.sem, Immutable.List(a_t.toArray().map(a => a.sem))))
    )))
}

export const mk_filesystem = (r: SourceRange, nodes: Array<Stmt>): Stmt => {
  return _ =>
  comm_list_coroutine(Immutable.List(nodes.map(n => n(no_constraints)))).then(n_t =>
    co_unit(mk_typing(unit_type, Sem.init_fs(Immutable.List(n_t.toArray().map(n => n.sem)))))
  )
}

export const mk_filesystem_and_program = (r: SourceRange, fs: Stmt, prg: Stmt): Stmt => {
  return _ =>
    fs(no_constraints).then(fs_t =>
    prg(no_constraints).then(prg_t =>
      co_unit(mk_typing(unit_type, Sem.fs_and_prg(fs_t.sem, prg_t.sem))))
    )
}

let coerce_to_constraint = (r: SourceRange, p: Stmt, p_t: Type): Stmt =>
  constraints => coerce(r, p, constraints.kind == "right" || constraints.value.kind == "var" || constraints.value.kind == "fun_with_input_as_stmts" ? p_t : constraints.value)(constraints)

export let bool = (r: SourceRange, b: boolean): Stmt =>
  coerce_to_constraint(r, _ => co_unit(mk_typing(bool_type, Sem.bool_expr(b))), bool_type)

export let str = (r: SourceRange, s: string): Stmt =>
  coerce_to_constraint(r, _ => co_unit(mk_typing(string_type, Sem.str_expr(s))), string_type)

export let int = (r: SourceRange, i: number): Stmt =>
  coerce_to_constraint(r, _ => co_unit<State, Err, Typing>(mk_typing(int_type, Sem.int_expr(i))), int_type)

export let float = (r: SourceRange, i: number): Stmt =>
  coerce_to_constraint(r, _ => co_unit(mk_typing(float_type, Sem.float_expr(i))), float_type)

export let double = (r: SourceRange, i: number): Stmt =>
  coerce_to_constraint(r, _ => co_unit(mk_typing(double_type, Sem.float_expr(i))), double_type)

export let tuple_value = function (r: SourceRange, args: Array<Stmt>): Stmt {
  return constraints => {
    let original_constraints = constraints

    if (constraints.kind == "left" && constraints.value.kind == "record")
      constraints = apply(inl(), tuple_type(constraints.value.args.toArray()))
    if (constraints.kind == "left" && constraints.value.kind != "tuple" && constraints.value.kind != "fun_with_input_as_stmts")
      return co_error<State, Err, Typing>({ range: r, message: `Error: expected type ${type_to_string(constraints.value)} when typechecking tuple.` })

    let check_args = comm_list_coroutine(Immutable.List<Coroutine<State, Err, Typing>>(args.map((a, a_i) =>
      a(constraints.kind == "left" && constraints.value.kind == "tuple" ? apply(inl(), constraints.value.args[a_i])
        : no_constraints))))
    let res = check_args.then(arg_ts =>
      co_unit(mk_typing(tuple_type(arg_ts.toArray().map(a_t => a_t.type)),
        Sem.tuple_expr_rt(arg_ts.toArray().map(a_t => a_t.sem))))
    )
    if (original_constraints.kind == "right") return res
    if (original_constraints.value.kind == "fun_with_input_as_stmts")  return res
    return coerce(r, _ => res, original_constraints.value)(no_constraints)
  }
}

export let gt = (r: SourceRange, a: Stmt, b: Stmt): Stmt => bin_op(r, a, b, ">")

export let lt = (r: SourceRange, a: Stmt, b: Stmt): Stmt => bin_op(r, a, b, "<")

export let geq = (r: SourceRange, a: Stmt, b: Stmt): Stmt => bin_op(r, a, b, ">=")

export let leq = (r: SourceRange, a: Stmt, b: Stmt): Stmt => bin_op(r, a, b, "<=")

export let eq = (r: SourceRange, a: Stmt, b: Stmt): Stmt => bin_op(r, a, b, "==")

export let neq = (r: SourceRange, a: Stmt, b: Stmt): Stmt => bin_op(r, a, b, "!=")

export let xor = (r: SourceRange, a: Stmt, b: Stmt): Stmt => bin_op(r, a, b, "^")

export let mk_empty_surface = function (r: SourceRange, w: Stmt, h: Stmt, col: Stmt): Stmt {
  return _ => w(apply(inl(), double_type)).then(w_t =>
    h(apply(inl(), double_type)).then(h_t =>
      col(apply(inl(), string_type)).then(col_t =>
        co_unit(mk_typing(render_surface_type, Sem.mk_empty_render_surface_rt(r, w_t.sem, h_t.sem, col_t.sem)))
      )))
}

export let mk_circle = function (r: SourceRange, x: Stmt, y: Stmt, radius: Stmt, col: Stmt): Stmt {
  return _ => x(apply(inl(), double_type)).then(x_t =>
    y(apply(inl(), double_type)).then(y_t =>
      radius(apply(inl(), double_type)).then(r_t =>
        col(apply(inl(), string_type)).then(col_t =>
          co_unit(mk_typing(circle_type, Sem.mk_circle_rt(r, x_t.sem, y_t.sem, r_t.sem, col_t.sem)))
        ))))
}

export let mk_square = function (r: SourceRange, x: Stmt, y: Stmt, radius: Stmt, col: Stmt, rot: Stmt): Stmt {
  return _ => x(apply(inl(), double_type)).then(x_t =>
    y(apply(inl(), double_type)).then(y_t =>
      radius(apply(inl(), double_type)).then(r_t =>
        col(apply(inl(), string_type)).then(col_t =>
          rot(apply(inl(), double_type)).then(rot_t =>
            co_unit(mk_typing(square_type, Sem.mk_square_rt(r, x_t.sem, y_t.sem, r_t.sem, col_t.sem, rot_t.sem)))
          )))))
}

export let mk_ellipse = function (r: SourceRange, x: Stmt, y: Stmt, w: Stmt, h: Stmt, col: Stmt, rot: Stmt): Stmt {
  return _ => x(apply(inl(), double_type)).then(x_t =>
    y(apply(inl(), double_type)).then(y_t =>
      w(apply(inl(), double_type)).then(w_t =>
        h(apply(inl(), double_type)).then(h_t =>
          col(apply(inl(), string_type)).then(col_t =>
            rot(apply(inl(), double_type)).then(rot_t =>
              co_unit(mk_typing(ellipse_type, Sem.mk_ellipse_rt(r, x_t.sem, y_t.sem, w_t.sem, h_t.sem, col_t.sem, rot_t.sem)))
            ))))))
}

export let mk_rectangle = function (r: SourceRange, x: Stmt, y: Stmt, w: Stmt, h: Stmt, col: Stmt, rot: Stmt): Stmt {
  return _ => x(apply(inl(), double_type)).then(x_t =>
    y(apply(inl(), double_type)).then(y_t =>
      w(apply(inl(), double_type)).then(w_t =>
        h(apply(inl(), double_type)).then(h_t =>
          col(apply(inl(), string_type)).then(col_t =>
            rot(apply(inl(), double_type)).then(rot_t =>
              co_unit(mk_typing(rectangle_type, Sem.mk_rectangle_rt(r, x_t.sem, y_t.sem, w_t.sem, h_t.sem, col_t.sem, rot_t.sem)))
            ))))))
}

export let mk_line = function (r: SourceRange, x1: Stmt, y1: Stmt, x2: Stmt, y2: Stmt, w: Stmt, col: Stmt, rot: Stmt): Stmt {
  return _ => x1(apply(inl(), double_type)).then(x1_t =>
    y1(apply(inl(), double_type)).then(y1_t =>
      x2(apply(inl(), double_type)).then(x2_t =>
        y2(apply(inl(), double_type)).then(y2_t =>
          w(apply(inl(), double_type)).then(w_t =>
            col(apply(inl(), string_type)).then(col_t =>
              rot(apply(inl(), double_type)).then(rot_t =>
                co_unit(mk_typing(line_type, Sem.mk_line_rt(r, x1_t.sem, y1_t.sem, x2_t.sem, y2_t.sem, w_t.sem, col_t.sem, rot_t.sem)))
              )))))))
}

export let mk_polygon = function (r: SourceRange, points: Stmt, col: Stmt, rot: Stmt): Stmt {
  return _ => points(apply(inl(), arr_type(tuple_type([double_type, double_type])))).then(points_t =>
    rot(apply(inl(), double_type)).then(rot_t =>
      col(apply(inl(), string_type)).then(col_t =>
        co_unit(mk_typing(polygon_type, Sem.mk_polygon_rt(r, points_t.sem, col_t.sem, rot_t.sem)))
      )))
}

export let mk_text = function (r: SourceRange, t: Stmt, x: Stmt, y: Stmt, s: Stmt, col: Stmt, rot: Stmt): Stmt {
  return _ => t(apply(inl(), string_type)).then(t_t =>
    x(apply(inl(), double_type)).then(x_t =>
      y(apply(inl(), double_type)).then(y_t =>
        s(apply(inl(), double_type)).then(s_t =>
          col(apply(inl(), string_type)).then(col_t =>
            rot(apply(inl(), double_type)).then(rot_t =>
              co_unit(mk_typing(text_type, Sem.mk_text_rt(r, t_t.sem, x_t.sem, y_t.sem, s_t.sem, col_t.sem, rot_t.sem)))
            ))))))
}

export let mk_sprite = function (r: SourceRange, sprite: Stmt, x: Stmt, y: Stmt, w: Stmt, h: Stmt, rot: Stmt): Stmt {
  return _ => sprite(apply(inl(), string_type)).then(s_t =>
    x(apply(inl(), double_type)).then(x_t =>
      y(apply(inl(), double_type)).then(y_t =>
        w(apply(inl(), double_type)).then(w_t =>
          h(apply(inl(), double_type)).then(h_t =>
            rot(apply(inl(), double_type)).then(rot_t =>
              co_unit(mk_typing(sprite_type, Sem.mk_sprite_rt(r, s_t.sem, x_t.sem, y_t.sem, w_t.sem, h_t.sem, rot_t.sem)))
            ))))))
}

export let mk_other_surface = function (r: SourceRange, s: Stmt, dx: Stmt, dy: Stmt, sx: Stmt, sy: Stmt, rot: Stmt): Stmt {
  return _ => dx(apply(inl(), double_type)).then(dx_t =>
    dy(apply(inl(), double_type)).then(dy_t =>
      sx(apply(inl(), double_type)).then(sx_t =>
        sy(apply(inl(), double_type)).then(sy_t =>
          s(apply(inl(), render_surface_type)).then(s_t =>
            rot(apply(inl(), double_type)).then(rot_t =>
              co_unit(mk_typing(other_render_surface_type, Sem.mk_other_surface_rt(r, s_t.sem, dx_t.sem, dy_t.sem, sx_t.sem, sy_t.sem, rot_t.sem)))
            ))))))
}


export let unary_op = function (r: SourceRange, a: Stmt, op: string): Stmt {
  let op_from_type = (t: Type) =>
    get_class(r, t).then(t_c => {
      if (!t_c.methods.has(op))
        return co_error<State, Err, Typing>({ range: r, message: `Error: type ${type_to_string(t)} has no (${op}) operator.` })
      let op_method = t_c.methods.get(op).first()
      if (op_method.typing.type.kind != "fun" || op_method.typing.type.in.kind != "tuple" || op_method.typing.type.in.args.length != 1)
        return co_error<State, Err, Typing>({ range: r, message: `Error: type ${type_to_string(t)} has an operator (${op}), but it is malformed.` })

      let args = op_method.typing.type.in.args
      let op_method_stmt: Stmt = _ =>
        co_unit<State, Err, Typing>(mk_typing(op_method.typing.type, Sem.static_method_get_expr_rt(r, type_to_string(t), op)))

      return a(apply(inl(), args[0])).then(a_f =>
        call_lambda(r, op_method_stmt, [_ => co_unit(a_f)])(no_constraints))
    })

  return constraints => ensure_constraints(r, constraints)(a(constraints).then(a_t => op_from_type(a_t.type)))
}

export let bin_op = function (r: SourceRange, a: Stmt, b: Stmt, op: string): Stmt {
  let op_from_type = (t: Type) =>
    get_class(r, t).then(t_c => {
      if (!t_c.methods.has(op))
        return co_error<State, Err, Typing>({ range: r, message: `Error: type ${type_to_string(t)} has no (${op}) operator.` })
      let op_method = t_c.methods.get(op).first()
      if (op_method.typing.type.kind != "fun" || op_method.typing.type.in.kind != "tuple" || op_method.typing.type.in.args.length != 2)
        return co_error<State, Err, Typing>({ range: r, message: `Error: type ${type_to_string(t)} has a (${op}) operator, but it is malformed.` })

      let args = op_method.typing.type.in.args

      let op_method_stmt: Stmt = _ =>
        co_unit<State, Err, Typing>(mk_typing(op_method.typing.type, Sem.static_method_get_expr_rt(r, type_to_string(t), op)))

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
        co_unit(mk_typing(render_surface_type, Sem.render_surface_plus_rt(r, a_t.sem, b_t.sem)))
        : co_catch<State, Err, Typing>((e1: Err, e2: Err): Err => ({ range: r, message: `Error: unsupported types for operator (${op})!` }))
          (op_from_type(a_t.type))(op_from_type(b_t.type)))))
}

export let plus = (r: SourceRange, a: Stmt, b: Stmt): Stmt => bin_op(r, a, b, "+")

export let minus = (r: SourceRange, a: Stmt, b: Stmt): Stmt => bin_op(r, a, b, "-")

export let div = (r: SourceRange, a: Stmt, b: Stmt): Stmt => bin_op(r, a, b, "/")

export let times = (r: SourceRange, a: Stmt, b: Stmt, sr: SourceRange): Stmt => bin_op(r, a, b, "*")

export let mod = (r: SourceRange, a: Stmt, b: Stmt): Stmt => bin_op(r, a, b, "%")

export let minus_unary = function (r: SourceRange, a: Stmt): Stmt {
  return constraints => ensure_constraints(r, constraints)(a(no_constraints).then(a_t =>
    type_equals(a_t.type, int_type) ?
      co_unit(mk_typing(int_type, Sem.int_minus_unary_rt(r, a_t.sem)))
      : type_equals(a_t.type, float_type) || type_equals(a_t.type, double_type) ?
        co_unit(mk_typing(float_type, Sem.float_minus_unary_rt(r, a_t.sem)))
        : co_error<State, Err, Typing>({ range: r, message: "Error: unsupported type for unary operator (-)!" })
  ))
}

export let or = (r: SourceRange, a: Stmt, b: Stmt): Stmt => bin_op(r, a, b, "||")

export let and = (r: SourceRange, a: Stmt, b: Stmt): Stmt => bin_op(r, a, b, "&&")

export let arrow = function (r: SourceRange, parameters: Array<Parameter>, closure: Array<ValueName>, body: Stmt): Stmt {
  return constraints => {
    if (constraints.kind == "right") return co_error<State, Err, Typing>({ range: r, message: "Error: empty context when defining anonymous function (=>)." })
    if (constraints.value.kind == "fun_with_input_as_stmts") return co_error<State, Err, Typing>({ range: r, message: "Error" })
    let expected_type = constraints.value
    if (expected_type.kind != "fun") return co_error<State, Err, Typing>({ range: r, message: `Error: expected ${type_to_string(expected_type)}, found function.` })

    let input = expected_type.in.kind == "tuple" ? expected_type.in.args : [expected_type.in]
    let output = expected_type.out
    let parameter_declarations = parameters.map((p, p_i) => ({ ...p, type: input[p_i] })).map(p => decl_v(r, p.name, p.type, true)).reduce((p, q) => semicolon(r, p, q), done)
    return co_stateless<State, Err, Typing>(parameter_declarations(no_constraints).then(decls =>
      body(apply(inl<Type, Unit>(), output)).then(b_t =>
        // console.log(`=> ${type_to_string(b_t.type)}`) ||
        co_unit(mk_typing(expected_type, Sem.mk_lambda_rt(b_t.sem, parameters.map(p => p.name), closure, r)))
      )))
  }
}

export let not = (r: SourceRange, a: Stmt): Stmt => unary_op(r, a, "!")

export let get_index = function (r: SourceRange, a: Stmt, i: Stmt): Stmt {
  return constraints => ensure_constraints(r, constraints)(a(no_constraints).then(a_t =>
    i(apply(inl(), int_type)).then(i_t =>
      a_t.type.kind == "arr" ?
        co_unit(mk_typing(a_t.type.arg, Sem.get_arr_el_expr_rt(r, a_t.sem, i_t.sem)))
        : co_error<State, Err, Typing>({ range: r, message: `Error: cannot perform array lookup on type ${type_to_string(a_t.type)}` })
    )))
}

export let set_index = function (r: SourceRange, a: Stmt, i: Stmt, e: Stmt): Stmt {
  return constraints => ensure_constraints(r, constraints)(a(no_constraints).then(a_t =>
    i(apply(inl(), int_type)).then(i_t =>
      a_t.type.kind != "arr" ?
        co_error<State, Err, Typing>({ range: r, message: `Error: cannot perform array lookup on type ${type_to_string(a_t.type)}` })
        : e(apply(inl(), a_t.type.arg)).then(e_t =>
          a_t.type.kind == "arr" ?
            co_unit(mk_typing(a_t.type.arg, Sem.set_arr_el_expr_rt(r, a_t.sem, i_t.sem, e_t.sem)))
            : co_error<State, Err, Typing>({ range: r, message: `Error: cannot perform array lookup on type ${type_to_string(a_t.type)}` })
        ))))
}

// Debugger statements
export let breakpoint = function (r: SourceRange): (_: Stmt) => Stmt {
  return p => semicolon(r, _ => co_unit(mk_typing(unit_type, Sem.dbg_rt(r)(apply(inl<Sem.Val, Sem.Val>(), Sem.mk_unit_val)))), p)
}

export let typechecker_breakpoint = function (range: SourceRange): (_: Stmt) => Stmt {
  return p => semicolon(range, semicolon(range, set_highlighting(range), _ => Co.suspend<State, Err>().then(_ => co_unit<State, Err, Typing>(mk_typing(unit_type, Sem.done_rt)))), p)
}

export let highlight: Fun<Prod<SourceRange, State>, State> = fun(x => ({ ...x.snd, highlighting: x.fst }))
export let set_highlighting = function (r: SourceRange): Stmt {
  return _ => mk_coroutine(constant<State, SourceRange>(r).times(id<State>()).then(highlight).then(
    constant<State, Typing>(mk_typing(unit_type, Sem.done_rt)).times(id<State>())).then(Co.value<State, Err, Typing>().then(Co.result<State, Err, Typing>().then(Co.no_error<State, Err, Typing>()))))
}

// Control flow statements
export let done: Stmt = _ => co_unit(mk_typing(unit_type, Sem.done_rt))

export let lub = (t1: TypeInformation, t2: TypeInformation): Sum<TypeInformation, Unit> => {
  return type_equals(t1, t2) ? apply(inl<TypeInformation, Unit>(), t1) :
    t1.kind == "unit" ? apply(inl<TypeInformation, Unit>(), t2) :
      t2.kind == "unit" ? apply(inl<TypeInformation, Unit>(), t1) :
        apply(inr<TypeInformation, Unit>(), {})
}

export let if_then_else = function (r: SourceRange, c: Stmt, t: Stmt, e: Stmt): Stmt {
  return expected_type => c(apply(inl(), bool_type)).then(c_t =>
    co_stateless<State, Err, Typing>(t(expected_type)).then(t_t =>
      co_stateless<State, Err, Typing>(e(expected_type)).then(e_t => {

        let on_type: Fun<TypeInformation, Stmt> = fun(t_i => (_: TypeConstraints) => co_unit<State, Err, Typing>(mk_typing(t_i, Sem.if_then_else_rt(r, c_t.sem, t_t.sem, e_t.sem))))
        let on_error: Fun<Unit, Stmt> = constant<Unit, Stmt>(_ =>
          co_error<State, Err, Typing>({ range: r, message: "Error: the branches of a conditional should have compatible types." }))

        let res = apply(on_type.plus(on_error), lub(t_t.type, e_t.type))

        return res(no_constraints)
      })))
}

export let while_do = function (r: SourceRange, c: Stmt, b: Stmt): Stmt {
  return _ => co_stateless<State, Err, Typing>(c(apply(inl(), bool_type)).then(c_t =>
    b(no_constraints).then(t_t => co_unit(mk_typing(t_t.type, Sem.while_do_rt(r, c_t.sem, t_t.sem)))
    )))
}

export let for_loop = function (r: SourceRange, i: Stmt, c: Stmt, s: Stmt, b: Stmt): Stmt {
  return _ => co_stateless<State, Err, Typing>(
    i(no_constraints).then(i_t =>
      c(apply(inl(), bool_type)).then(c_t =>
        s(no_constraints).then(s_t =>
          b(no_constraints).then(b_t => co_unit(mk_typing(b_t.type, Sem.for_loop_rt(r, i_t.sem, c_t.sem, s_t.sem, b_t.sem)))
          )))))
}


export let semicolon = function (r: SourceRange, p: Stmt, q: Stmt): Stmt {
  return constraints => p(constraints).then(p_t =>
    q(constraints).then(q_t =>
      co_unit(mk_typing(q_t.type, p_t.sem.then(res => {
        return co_get_state<MemRt, ErrVal>().then(s =>
        {
          let f = (counter:number) => co_set_state<MemRt, ErrVal>({...s, steps_counter: counter}).then( _ =>
                    {
                      let f: Sem.ExprRt<Sum<Sem.Val, Sem.Val>> = co_unit(apply(inr<Sem.Val, Sem.Val>(), res.value))
                      return res.kind == "left" ? q_t.sem : f
                    } )
          if(s.steps_counter > 300) {
            if (s.custom_alert('The program seems to be taking too much time. This might be an indication of an infinite loop. Press OK to terminate the program.'))
              return co_error({ range: r, message: `It seems your code has run into an infinite loop.` })
            else
              return f(0)
          }

          return f(s.steps_counter + 1)

        })
      }))
      )))
}

export let mk_param = function (name: Name, type: Type) {
  return { name: name, type: type }
}
export let mk_abstract_lambda = function (r: SourceRange, def: LambdaDefinition, closure_parameters: Array<Name>, range: SourceRange): Stmt {
  return constraints => {
  let parameters = def.parameters
  return instantiate_generics(r, def.return_t).then(return_t_i => {
  let return_t = return_t_i.type
  let body = def.body
  let set_bindings = parameters.reduce<Stmt>((acc, par) => semicolon(r, decl_v(r, par.name, par.type, false), acc),
    closure_parameters.reduce<Stmt>((acc, cp) =>
      semicolon(r, _ => get_v(r, cp)(no_constraints).then(cp_t => decl_forced_v(r, cp, cp_t.type, true)(no_constraints)), acc), done))
  return Co.co_get_state<State, Err>().then(initial_bindings =>

    set_bindings(no_constraints).then(_ =>
        {
          let m_params:Type = parameters.length == 0 ? tuple_type([{kind:"unit"}]) : tuple_type((parameters.map(p => p.type)))
          let _fun_type = fun_type(m_params, return_t, r)
          if (constraints.kind == "left" && (constraints.value.kind == "fun_with_input_as_stmts" || !type_equals(_fun_type, constraints.value)))
            return co_error<State, Err, Typing>({ range: r, message: `Error: cannot create lambda, constraint type ${constraints.value.kind == "fun_with_input_as_stmts" ? "" : type_to_string(constraints.value)} is not compatible with found type ${type_to_string(_fun_type)}` })
          return Co.co_set_state<State, Err>(initial_bindings).then(_ =>
                    co_unit(mk_typing(_fun_type, return_t_i.sem.then(_ => Sem.done_rt))))
        }
      ))
    })}
}
export let mk_lambda = function (r: SourceRange, def: LambdaDefinition, closure_parameters: Array<Name>, range: SourceRange): Stmt {
  return constraints => {
  let parameters = def.parameters
  return instantiate_generics(r, def.return_t).then(return_t_i => {
  let return_t = return_t_i.type
  let body = def.body
  let set_bindings = parameters.reduce<Stmt>((acc, par) => semicolon(r, decl_v(r, par.name, par.type, false), acc),
    closure_parameters.reduce<Stmt>((acc, cp) =>
      semicolon(r, _ => get_v(r, cp)(no_constraints).then(cp_t => decl_forced_v(r, cp, cp_t.type, true)(no_constraints)), acc), done))
    return Co.co_get_state<State, Err>().then(initial_bindings =>

    set_bindings(no_constraints).then(_ =>
      body(apply(inl(), return_t)).then(body_t =>
        {

          let m_params:Type = parameters.length == 0 ? tuple_type([{kind:"unit"}]) : tuple_type((parameters.map(p => p.type)))
          let _fun_type = fun_type(m_params, body_t.type, r)
          if (constraints.kind == "left" && (constraints.value.kind == "fun_with_input_as_stmts" || !type_equals(_fun_type, constraints.value)))
            return co_error<State, Err, Typing>({ range: r, message: `Error: cannot create lambda, constraint type ${constraints.value.kind == "fun_with_input_as_stmts" ? "" : type_to_string(constraints.value)} is not compatible with found type ${type_to_string(_fun_type)}` })
          return Co.co_set_state<State, Err>(initial_bindings).then(_ =>
                    co_unit(mk_typing(_fun_type, return_t_i.sem.then(_ => Sem.mk_lambda_rt(body_t.sem, parameters.map(p => p.name), closure_parameters, range)))))
        }
      )))
    })
  }
}
// export interface Bindings extends Immutable.Map<Name, TypeInformation> {}
// export interface State { highlighting:SourceRange, bindings:Bindings }
export let def_fun = function (r: SourceRange, def: FunDefinition, closure_parameters: Array<Name>): Stmt {
  return _ => co_get_state<State, Err>().then(s =>
    co_set_state<State, Err>({ ...s, bindings: s.bindings.set(def.name, { ...fun_type(tuple_type(def.parameters.map(p => p.type)), def.return_t, r), is_constant: true }) }).then(_ =>
      mk_lambda(r, def, closure_parameters, def.range)(no_constraints).then(l =>
        co_set_state<State, Err>(s).then(_ =>
          decl_const(r, def.name, l.type, _ => co_unit<State, Err, Typing>(l))(no_constraints)))))

}


export let def_method = function (r: SourceRange, original_methods:MethodDefinition[], C_kind:"normal" | "abstract" | "interface", C_name: string, _extends: Option<ObjType>, _implements:ObjType[], def: MethodDefinition, override_methods: MethodDefinition[]): Stmt {
  return _ => {
  let is_static = def.modifiers.some(m => m == "static")
  let parameters = def.parameters
  return instantiate_generics(r, def.return_t).then(return_t_i => {
  let return_t = return_t_i.type
  let body = def.body
  let _done: Stmt = done
  let context: CallingContext = { kind: "class", C_name: C_name, looking_up_base: false }
  let set_bindings = (is_static ? parameters : parameters.concat([{ name: "this", type: ref_type(C_name) }]))
    .reduce<Stmt>((acc, par) => semicolon(r, decl_v(r, par.name, par.type, false), acc), done)

  let interfaces_init =
    _implements.length > 0 ?
    _implements.map(i => field_set(r, context, get_v(r, "this"), { kind: "att", att_name: `${i.C_name}_base` }, call_cons(r, context, i.C_name, [], i.C_name, [], true))).reduce((p,c) => semicolon(r, p,c))
    : done

  let virtual_fields =
    original_methods.filter(m => m.modifiers.some(m => m == "abstract" || m == "virtual") || C_kind == "interface")


  interfaces_init =
    virtual_fields.length == 0 ? interfaces_init :
    semicolon(r,
              interfaces_init,
              virtual_fields.map(m =>
                {
                  let inner_lambda_type: Type = {
                    kind: "fun", in: tuple_type(m.parameters.length == 0 ? [{ kind: "unit" }] : m.parameters.map(p => p.type)),
                    out: m.return_t,
                    range: m.range
                  }

                return field_set(r, context, get_v(r, "this"),
                        { kind: "att", att_name: m.name },
                        C_kind == "interface" || m.modifiers.some(m => m == "abstract") ? mk_abstract_lambda(m.range,
                          {
                            return_t: m.return_t,
                            parameters: m.parameters,
                            body: m.body
                          },
                          ["this"],
                          m.range)
                        : mk_lambda(m.range,
                        {
                          return_t: m.return_t,
                          parameters: m.parameters,
                          body: m.body
                        },
                        ["this"],
                        m.range)
                      )
                    }
              ).reduce((p, c) => semicolon(r, p, c)))
  //console.log("interfaces_init", interfaces_init.length, _extends.kind)
  return Co.co_get_state<State, Err>().then(initial_bindings =>
    set_bindings(no_constraints).then(_ =>
      body(apply(inl(), return_t)).then(body_t =>
        ((//improve...
          def.is_constructor ?
          (_extends.kind == "left" ? // this is a constructor with base\
            (override_methods.length == 0 ?
                  semicolon(r,
                            field_set(r, context, get_v(r, "this"), { kind: "att", att_name: "base" }, call_cons(r, context, _extends.value.C_name, def.params_base_call.kind == "left" ? def.params_base_call.value : [], _extends.value.C_name, [], true)),
                            interfaces_init)
                  :
                  semicolon(
                    r,
                    field_set(r, context, get_v(r, "this"), { kind: "att", att_name: "base" }, call_cons(r, context, _extends.value.C_name, def.params_base_call.kind == "left" ? def.params_base_call.value : [], _extends.value.C_name, [], true)),
                    semicolon(r,
                              interfaces_init,
                              override_methods.map(a_m =>
                                field_set(r, context, get_v(r, "this"),
                                  { kind: "att", att_name: a_m.name },
                                  mk_lambda(r, {
                                    return_t: a_m.return_t,
                                    parameters: a_m.parameters,
                                    body: a_m.body
                                  }, ["this"], r))
                              ).reduce((p, c) => semicolon(r, p, c)))
              ))
              :
              (override_methods.length == 0 ?
                interfaces_init :
              semicolon(r, interfaces_init, override_methods.map(a_m =>
                                                    field_set(r, context, get_v(r, "this"),
                                                      { kind: "att", att_name: a_m.name },
                                                      mk_lambda(r, {
                                                        return_t: a_m.return_t,
                                                        parameters: a_m.parameters,
                                                        body: a_m.body
                                                      }, ["this"], r))
                                                  ).reduce((p, c) => semicolon(r, p, c)))))

            : _done)
          (apply(inl(), { kind: "unit" as "unit" }))).then(base_sem =>
            Co.co_set_state<State, Err>(initial_bindings).then(_ =>
              is_static ? co_unit(mk_typing(fun_type(tuple_type(parameters.map(p => p.type)), body_t.type, r),
                  return_t_i.sem.then(_ =>
                  Sem.mk_lambda_rt(body_t.sem, parameters.map(p => p.name), [], def.range))))
                : co_unit(mk_typing(fun_type(tuple_type([ref_type(C_name)]),
                  fun_type(tuple_type(parameters.map(p => p.type)), body_t.type, r), r),
                  return_t_i.sem.then(_ =>
                  Sem.mk_lambda_rt(Sem.mk_lambda_rt(
                    base_sem.sem.then(_ => body_t.sem), parameters.map(p => p.name), ["this"], def.range), ["this"], [], def.range)))))
          ))))
        })
  }
}

export let call_lambda = function (r: SourceRange, lambda: Stmt, arg_values: Array<Stmt>): Stmt {
  return constraints => ensure_constraints(r, constraints)(//check_arguments(constraints).then(_args =>
    lambda(apply(inl(), fun_stmts_type(arg_values, constraints.kind == "left" && constraints.value.kind != "fun_with_input_as_stmts" ? constraints.value : var_type, r))).then(lambda_t => {

    // if (constraints.kind == "left" && constraints.value.kind != "fun_with_input_as_stmts")
    //   console.log("lambda constraints: ", type_to_string(constraints.value))
    // console.log("lambda: ", type_to_string(lambda_t.type))

    if (lambda_t.type.kind != "fun" || lambda_t.type.in.kind != "tuple")
      return co_error<State, Err, Typing>({ range: r, message: `Error: invalid lambda type ${JSON.stringify(lambda_t.type)}` })

    let expected_args = lambda_t.type.in.args

    let check_arguments = arg_values.reduce<Coroutine<State, Err, Immutable.List<Typing>>>((args, arg, arg_i) =>
      arg(apply(inl(), expected_args[arg_i])).then(arg_t =>
        // console.log(`Lambda arg: ${type_to_string(expected_args[arg_i])}, ${type_to_string(arg_t.type)}`) ||
        args.then(args_t =>
          co_unit(args_t.push(arg_t))
        )),
      co_unit(Immutable.List<Typing>()))

    return check_arguments.then(args_t =>
      lambda_t.type.kind != "fun" || lambda_t.type.in.kind != "tuple" ||
        arg_values.length != lambda_t.type.in.args.length ?
        (lambda_t.type.kind == "fun" && lambda_t.type.in.kind == "tuple" && lambda_t.type.in.args.length == 1 && lambda_t.type.in.args[0].kind == "unit" &&
          arg_values.length == 0) ||
          (lambda_t.type.kind == "fun" && lambda_t.type.out.kind == "fun" && lambda_t.type.out.in.kind == "tuple" && lambda_t.type.out.in.args.length == 1 && lambda_t.type.out.in.args[0].kind == "unit" &&
            arg_values.length == 0) ?
          co_unit(mk_typing(lambda_t.type.out, Sem.call_lambda_expr_rt(r, lambda_t.sem, args_t.toArray().map(arg_t => arg_t.sem)))) :
          co_error<State, Err, Typing>({ range: r, message: `Error: parameter type mismatch when calling lambda expression ${type_to_string(lambda_t.type)} with arguments ${JSON.stringify([args_t.toArray().map(a => type_to_string(a.type))])}` })
        : co_unit(mk_typing(lambda_t.type.out, Sem.call_lambda_expr_rt(r, lambda_t.sem, args_t.toArray().map(arg_t => arg_t.sem))))
    )
  }))
}

export let call_by_name = function (r: SourceRange, f_n: Name, args: Array<Stmt>): Stmt {
  return call_lambda(r, get_v(r, f_n), args)
}

export let ret = function (r: SourceRange, p: Stmt): Stmt {
  return constraints => p(constraints).then(p_t =>
    co_unit(mk_typing(p_t.type, Sem.return_rt(p_t.sem))
    ))
}

export let new_array = function (r: SourceRange, type: Type, len: Stmt): Stmt {

  return constraints => constraints.kind == "left" && (constraints.value.kind == "fun_with_input_as_stmts" || !type_equals(arr_type(type), constraints.value)) ?
    co_error<State, Err, Typing>({ range: r, message: `Error: array type ${type_to_string(type)} does not match context ${constraints.value.kind == "fun_with_input_as_stmts" ? "" : type_to_string(constraints.value)}` })
    : len(apply(inl(), int_type)).then(len_t =>
      co_unit(mk_typing(arr_type(type), Sem.new_arr_expr_rt(r, len_t.sem))))
}

export let new_array_and_init = function (r: SourceRange, type: Type, args: Stmt[]): Stmt {
  return constraints => {
    if (constraints.kind == "left" && (constraints.value.kind == "fun_with_input_as_stmts" || !type_equals(arr_type(type), constraints.value)))
      return co_error<State, Err, Typing>({ range: r, message: `Error: array type ${type_to_string(type)} does not match context ${constraints.value.kind == "fun_with_input_as_stmts" ? "" : type_to_string(constraints.value)}` })
    let xs = Immutable.List<Coroutine<State, Err, Typing>>(args.map(a => a(apply(inl(), type))))
    return comm_list_coroutine(xs).then(xs_t => {
      let arg_types = xs_t.toArray().map(x_t => x_t.type)
      // arg_types must all be of type `type`
      let arg_values = xs_t.toArray().map(x_t => x_t.sem)
      return co_unit(mk_typing(arr_type(type), Sem.new_arr_expr_with_values_rt(arg_values)))
    })
  }
}

export let get_arr_el = function (r: SourceRange, a: Stmt, i: Stmt): Stmt {
  return constraints => a(no_constraints).then(a_t =>
    i(apply(inl(), int_type)).then(i_t => {
      if (a_t.type.kind != "arr")
        return co_error<State, Err, Typing>({ range: r, message: `Error: expected an array, instead found ${type_to_string(a_t.type)}.` })
      let arr_arg = a_t.type.arg
      return coerce_to_constraint(r, _ => co_unit(mk_typing(arr_arg, Sem.get_arr_el_expr_rt(r, a_t.sem, i_t.sem))), arr_arg)(constraints)
    }
    ))
}

export let set_arr_el = function (r: SourceRange, a: Stmt, i: Stmt, e: Stmt): Stmt {
  return _ => a(no_constraints).then(a_t =>
    a_t.type.kind == "arr" ? e(apply(inl(), a_t.type.arg)).then(e_t =>
      i(apply(inl(), int_type)).then(i_t =>
        co_unit(mk_typing(unit_type, Sem.set_arr_el_expr_rt(r, a_t.sem, i_t.sem, e_t.sem)))
      ))
      : co_error<State, Err, Typing>({ range: r, message: `Error: expected an array, iclearnstead found ${type_to_string(a_t.type)}.` }))
}

export let def_class = function (r: SourceRange, modifiers:Modifier[], C_kind: "normal" | "abstract" | "interface", C_name: string, extends_or_implements: string[], methods_from_context: Array<(_: CallingContext) => MethodDefinition>, fields_from_context: Array<(_: CallingContext) => FieldDefinition>, is_internal = false): Stmt {
  return _ => co_get_state<State, Err>().then(initial_bindings => {
    let context: CallingContext = { kind: "class", C_name: C_name, looking_up_base: false }
    let _methods = methods_from_context.map(m => m(context))
    let methods = C_kind == "interface" ? [] : _methods.filter(m => !m.modifiers.some(m => m == "abstract" || m == "virtual" || m == "override"))
    if(!methods.some(m => m.is_constructor)){
      let def_constructor : MethodDefinition = {
        modifiers:["public"], is_constructor:true, range:r,
        return_t:unit_type,
        name:C_name,
        parameters:[],
        params_base_call:apply(inr(), {}),
        body: done
      }
      methods = methods.concat([def_constructor])
    }
    let s = extends_or_implements.filter(c => !initial_bindings.bindings.has(c) || initial_bindings.bindings.get(c).kind != "obj")
    if (extends_or_implements.some(c => !initial_bindings.bindings.has(c) || initial_bindings.bindings.get(c).kind != "obj"))
      return co_error({ message: `Wrong definition of base types when declaring class ${C_name}.`, range: r })
    let extended_classes = extends_or_implements.map(c => initial_bindings.bindings.get(c) as ObjType)

    let fields = fields_from_context.map(f => f(context))

    let instantiate_field_types = comm_list_coroutine(Immutable.List(fields.map(f => instantiate_generics(r, f.type))))
    return instantiate_field_types.then(field_types_i_l => {
    let field_types_i = field_types_i_l.toArray()

    fields.forEach((f,f_i) => {
      f.type = field_types_i[f_i].type
    })

    let field_types_i_sem = field_types_i.map(a => a.sem).reduce((a,b) => a.then(_ => b), Sem.done_rt)

    fields = fields.concat(
      extended_classes.map(e => {
        let base: FieldDefinition = {
          is_used_as_base:true,
          name: e.class_kind != "interface" ? "base" : `${e.C_name}_base`,
          type: { kind: "ref", C_name: e.C_name } as Type,
          modifiers: ["public"] as Modifier[],
          initial_value: apply(inr<Stmt, Unit>(), {})
        }

        return base
      }))
    let this_class_ref_type: Type = { kind: "ref", C_name: C_name }
    let this_class_ref_param: Parameter = { name: "this", type: this_class_ref_type }

    let casting_operators = extended_classes.map((ec:ObjType) : MethodDefinition => {
      let base_type: Type = { kind: "ref", C_name: ec.C_name }
      return  ({ modifiers:["static", "public", "casting", "operator"], is_constructor:false, range:r,
      return_t:base_type, name:ec.C_name, parameters:[{ name:"self", type:this_class_ref_type }],
      params_base_call:apply(inr(), {}),
      body:field_get(r, context, get_v(r, "self"), ec.class_kind != "interface" ? "base" : `${ec.C_name}_base`) })
    })
    methods = methods.concat(casting_operators)

    fields = fields.concat(
      _methods.filter(m => m.modifiers.some(m => m == "abstract" || m == "virtual") || C_kind == "interface")
        .map(m => {
          let inner_lambda_type: Type = {
            kind: "fun", in: tuple_type(m.parameters.length == 0 ? [{ kind: "unit" }] : m.parameters.map(p => p.type)),
            out: m.return_t,
            range: m.range
          }
          let m1: FieldDefinition = {
            name: m.name,
            is_used_as_base:false,
            type: inner_lambda_type,
            modifiers: C_kind == "interface" ? modifiers.filter(m => m == "public" || m == "private" || m == "protected") : m.modifiers,
            initial_value: apply(inr<Stmt, Unit>(), {})
            // initial_value: apply(inl<Stmt, Unit>(),
            //   mk_lambda(m.range,
            //     {
            //       return_t: m.return_t,
            //       parameters: m.parameters,
            //       body: m.body
            //     },
            //     ["this"],
            //     m.range)
            // )
          }
          return m1
        }))
    // console.log("fields: ", JSON.stringify([C_name, C_kind, fields.map(f => f.type)]))
    // console.log("methods: ", JSON.stringify([C_name, C_kind, methods.map(f => f.name)]))


    let get_class_kind = (name: string, bindings: Bindings): Option<ObjType> => {
      if (bindings.has(name)) {
        let elem = bindings.get(name)
        if (elem.kind == "obj") {
          return apply(inl(), elem)
        }
      }
      return apply(inr(), {})
    }
    let C_type_placeholder: Type = {
      range: r,
      kind: "obj",
      is_internal: is_internal,
      C_name: C_name,
      class_kind: C_kind,
      methods: MultiMap<Name, MethodTyping>(
        methods.map(m => {
          let m_params:Type = m.parameters.length == 0 ? tuple_type([{kind:"unit"}]) : tuple_type((m.parameters.map(p => p.type)))
          return {
            k: m.name,
            v: {
              typing:
                m.modifiers.filter(md => md == "static").length == 0 ?
                  mk_typing(fun_type(tuple_type([ref_type(C_name)]), fun_type(m_params, m.return_t, m.range), m.range), Sem.done_rt) :
                  mk_typing(fun_type(m_params, m.return_t, m.range), Sem.done_rt),
              modifiers: Immutable.Set<Modifier>(m.modifiers)
            }
          }
        })
      ),
      fields: Immutable.Map<Name, FieldType>(
        fields.map(f => {
          return [
            f.name,
            {
              is_used_as_base:f.is_used_as_base,
              type: f.type,
              modifiers: Immutable.Set<Modifier>(f.modifiers),
              initial_value: f.initial_value
            }
          ]
        })
      )
    }
    return co_set_state<State, Err>({ ...initial_bindings, bindings: initial_bindings.bindings.set(C_name, { ...C_type_placeholder, is_constant: true }) }).then(_ => {
      let concrete_extends_or_implements = extends_or_implements.map(c => get_class_kind(c, initial_bindings.bindings))
      let concrete_classes_to_extend = concrete_extends_or_implements.filter(e => e.kind == "left" && e.value.class_kind != "interface")
      let interfaces_to_implement:ObjType[] = concrete_extends_or_implements.filter(e => e.kind == "left" && e.value.class_kind == "interface").map(e => e.value) as any
      if (concrete_classes_to_extend.length > 1) {
        return co_error({ message: "You can extend one concrete class at a time", range: r })
      }
      return comm_list_coroutine(Immutable.List<Coroutine<State, Err, Typing>>(methods.map(m => {
        let concrete_extend: Option<ObjType> = apply(inr(), {})
        let interfaces: ObjType[] = []
        if (concrete_classes_to_extend.length == 1) {
          concrete_extend = apply(inl(), concrete_classes_to_extend[0].value as ObjType)
        }
        let res = def_method(m.range, _methods, C_kind, C_name, concrete_extend, interfaces_to_implement, m,  _methods.filter(m => m.modifiers.some(m => m == "override")))(no_constraints)
        return res
      }
      ))).then(methods_t => {
        let methods_full_t = methods_t.zipWith((m_t, m_d) => ({ typ: m_t, def: m_d }), Immutable.Seq<MethodDefinition>(methods)).toArray()
        let C_type: Type = {
          range: r,
          class_kind: C_kind,
          kind: "obj",
          is_internal: is_internal,
          C_name: C_name,
          methods: MultiMap<Name, MethodTyping>(
            methods_full_t.map(m =>
              ({
                k: m.def.name,
                v: { typing: m.typ, modifiers: Immutable.Set<Modifier>(m.def.modifiers) }
              }))
          ),
          fields: Immutable.Map<Name, FieldType>(
            fields.filter(f => !f.modifiers.some(mod => mod == "static")).map(f =>
              [f.name,
              { is_used_as_base:f.is_used_as_base, type: f.type, initial_value: f.initial_value, modifiers: Immutable.Set<Modifier>(f.modifiers) }])
          )
        }
        let static_fields = fields.filter(f => f.modifiers.some(mod => mod == "static"))
        let C_int: Sem.Interface = {
          range: r,
          is_internal: is_internal,
          base: apply(inr<Sem.Interface, Unit>(), {}),
          methods:
            Immutable.Map<Name, Sem.StmtRt>(methods_full_t.filter(m => !m.def.modifiers.some(mod => mod == "static")).map(m => {
              let res: [Name, Sem.StmtRt] = [
                m.def.name,
                m.typ.sem]
              return res
            }
            )),
          static_methods: Immutable.Map<Name, Sem.StmtRt>(methods_full_t.filter(m => m.def.modifiers.some(mod => mod == "static")).map(m => {
            let res: [Name, Sem.StmtRt] = [
              m.def.name,
              m.typ.sem]
            return res
          }
          )),
          static_fields: Immutable.Map<Sem.ValueName, Sem.Val>(static_fields.map(f =>
            [f.name,
            initial_value(f.type)
            ]))
        }

        let init_static_fields = static_fields.map(f => {
          if (f.initial_value.kind == "right") return done
          else {
            let v = f.initial_value.value
            return (_: TypeConstraints) => v(apply(inl(), f.type)).then(v_v =>
              co_unit<State, Err, Typing>(mk_typing(unit_type, Sem.static_field_set_expr_rt(r, C_name, { att_name: f.name, kind: "att" }, v_v.sem))))
          }
        }).reduce((a, b) => semicolon(r, a, b), done)

        return co_set_state<State, Err>({ ...initial_bindings, bindings: initial_bindings.bindings.set(C_name, { ...C_type, is_constant: true }) }).then(_ =>
          init_static_fields(no_constraints).then(init_static_fields_t =>
            co_unit(mk_typing(unit_type, field_types_i_sem.then(_fti => Sem.declare_class_rt(r, C_name, C_int).then(_ => init_static_fields_t.sem))))
          )
        )
      }
      )
    })
  })
})
}

export let generic_instance_name = (C_name:string, generic_parameters:Array<GenericParameter>, generic_arguments:Immutable.Map<string,Type>) : string =>
  generic_parameters.length == 0 ? C_name : `${C_name}<${generic_parameters.map(p => type_to_string(generic_arguments.get(p.name))).reduce((a,b) => a + "," + b)}>`

export let def_generic_class = function (r: SourceRange, C_name: string, generic_parameters:Array<GenericParameter>, instantiate:(_:Immutable.Map<Name, Type>, is_visible?:boolean) => Stmt): Stmt {
  return _ => co_get_state<State, Err>().then(initial_bindings => {
    let C_name_inst_basic = generic_instance_name(C_name, generic_parameters, Immutable.Map<Name, Type>(generic_parameters.map(p => [p.name, ref_type(p.name)])))
    let new_bindings = initial_bindings.bindings.set(C_name, {...generic_type_decl(instantiate, generic_parameters, C_name), is_constant:true })
    return co_set_state<State, Err>({ ...initial_bindings, bindings:new_bindings }).then(_ =>
      co_stateless<State, Err, [Type,Sem.StmtRt]>(
      co_set_state<State, Err>({ ...initial_bindings, bindings:generic_parameters.reduce((b,p) => b.set(p.name, {...unit_type, is_constant:true }), new_bindings) }).then(_ =>
      instantiate(Immutable.Map<Name,Type>(generic_parameters.map(p => [p.name, ref_type(p.name)])), true)(no_constraints).then(t_sem =>
      co_get_state<State, Err>().then(temp_bindings =>
      co_unit<State, Err, [Type,Sem.StmtRt]>([temp_bindings.bindings.get(C_name_inst_basic), t_sem.sem]))))).then(t =>
      co_get_state<State, Err>().then(final_bindings =>
      co_set_state<State, Err>({ ...final_bindings, bindings:final_bindings.bindings.set(C_name_inst_basic, ({...t[0], is_constant:true})) }).then(_ =>
      co_unit<State, Err, Typing>(mk_typing(unit_type, t[1]))))))
  })
}


export let field_get = function (r: SourceRange, context: CallingContext, this_ref: Stmt, F_or_M_name: string, n=0, called_by=""): Stmt {
  return constraints => this_ref(no_constraints).then(this_ref_t =>
    co_get_state<State, Err>().then(bindings => {
      if (this_ref_t.type.kind == "string" && F_or_M_name == "Length") {
        return ensure_constraints(r, constraints)(co_unit(mk_typing(int_type, Sem.string_length_rt(r, this_ref_t.sem))))
      } else if (this_ref_t.type.kind == "arr" && F_or_M_name == "Length") {
        return ensure_constraints(r, constraints)(co_unit(mk_typing(int_type, Sem.get_arr_len_expr_rt(r, this_ref_t.sem))))
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
              return co_error<State, Err, Typing>({ range: r, message: `Invalid field getter ${F_or_M_name}. }` })
            }
          } else {
            if (this_ref_t.type.kind == "record" && this_ref_t.type.args.has(F_or_M_name)) {
              try {
                return ensure_constraints(r, constraints)(co_unit(mk_typing(this_ref_t.type.args.get(F_or_M_name),
                  Sem.record_get_rt(r, this_ref_t.sem, F_or_M_name))))
              } catch (error) {
                return co_error<State, Err, Typing>({ range: r, message: `Invalid field getter ${F_or_M_name}. }` })
              }
            }
          }
        }

      let C_name = this_ref_t.type.kind == "ref" || this_ref_t.type.kind == "obj" ? this_ref_t.type.C_name : type_to_string(this_ref_t.type)
      if (!bindings.bindings.has(C_name)) return co_error<State, Err, Typing>({ range: r, message: `Error: class ${C_name} is undefined` })
      let C_def = bindings.bindings.get(C_name)
      if (C_def.kind != "obj") return co_error<State, Err, Typing>({ range: r, message: `Error: ${C_name} is not a class.` })
      if (C_def.fields.has(F_or_M_name)) {
        let F_def = C_def.fields.get(F_or_M_name)
        if (!F_def.modifiers.has("public")) {
          if (context.kind == "global scope"){
            return co_error<State, Err, Typing>({ range: r, message: `Error: cannot get non-public field ${F_or_M_name}.` })
          }
          else if (context.C_name != C_name){
            if (context.looking_up_base && !F_def.modifiers.has("protected")){
              return co_error<State, Err, Typing>({ range: r, message: `Error: cannot get non-public field ${C_name}::${F_or_M_name}.` })
            }
          }
        }
        return ensure_constraints(r, constraints)(co_unit<State, Err, Typing>(mk_typing(F_def.type,
          F_def.modifiers.has("static") ?
            Sem.static_field_get_expr_rt(r, C_name, F_or_M_name)
            : Sem.field_get_expr_rt(r, F_or_M_name, this_ref_t.sem))))

      }
      else {
        let C_def_obj = C_def
        let method_try_get = (): Coroutine<State, Err, Typing> => {
          if (C_def_obj.methods.has(F_or_M_name)) {
            // console.log("found: ", JSON.stringify(constraints))
            // console.log("methods: ", JSON.stringify(C_def_obj.methods.get(F_or_M_name)))

            let ms = C_def_obj.methods.get(F_or_M_name)




            let compute_method = (m:MethodTyping, _c:Option<FunWithStmts>, check_equality?:boolean) : Coroutine<State, Err, Typing> =>
              {
                if(m.typing.type.kind != "fun") return co_error<State, Err, Typing>({ range: r, message: `Internal error. Expected method.` })
                if(m.typing.type.in.kind != "tuple") return co_error<State, Err, Typing>({ range: r, message: `Internal error. Expected args of kind tuple.` })

                let expected_args : Type[] = []
                if (!m.modifiers.has("static")) {
                  if(m.typing.type.out.kind != "fun") return co_error<State, Err, Typing>({ range: r, message: `Internal error. Expected method.` })
                  if(m.typing.type.out.in.kind != "tuple") return co_error<State, Err, Typing>({ range: r, message: `Internal error. Expected args of kind tuple.` })
                  expected_args = m.typing.type.out.in.args
                }
                else{
                  expected_args = m.typing.type.in.args
                }




                let is_static = false
                let f = () => {
                    let M_def = m

                    if (!M_def.modifiers.has("public")) {
                      if (context.kind == "global scope")
                        return co_error<State, Err, Typing>({ range: r, message: `Error: cannot get non-public method ${F_or_M_name}.` })
                      else if (context.C_name != C_name){
                        if (context.looking_up_base && !M_def.modifiers.has("protected")){
                          return co_error<State, Err, Typing>({ range: r, message: `Error: cannot get non-public method ${C_name}::${F_or_M_name}.` })
                        }
                      }
                    }
                    if (M_def.typing.type.kind != "fun") return co_error<State, Err, Typing>({ range: r, message: `Error: method ${C_name}::${F_or_M_name} is not a lambda.` })
                    if (M_def.modifiers.has("static")) {
                      is_static = true
                      if (this_ref_t.type.kind == "ref" || this_ref_t.type.kind == "obj") {
                        return co_unit<State, Err, Typing>(mk_typing(M_def.typing.type,
                          m.typing.sem
                          //Sem.static_method_get_expr_rt(r, C_name, F_or_M_name)
                        ))
                      } else {
                        return co_unit<State, Err, Typing>(mk_typing(fun_type(tuple_type([]), M_def.typing.type, r),
                          Sem.mk_lambda_rt(Sem.call_lambda_expr_rt(r, m.typing.sem,
                                                                    //Sem.static_method_get_expr_rt(r, C_name, F_or_M_name),
                                                                    [this_ref_t.sem]),
                            [], [], r)
                        ))
                      }
                    } else {
                      return co_unit<State, Err, Typing>(mk_typing(M_def.typing.type.out,
                        Sem.call_lambda_expr_rt(r,m.typing.sem,
                                                //Sem.method_get_expr_rt(r, F_or_M_name, this_ref_t.sem),
                                                [this_ref_t.sem])))
                    }
                  }
                  if(_c.kind == "left"){
                    let c = _c.value
                    let check_arguments =
                      expected_args.length != c.in.length ? co_error<State, Err, Immutable.List<Typing>>({ range: r, message: `Method args length do not match.` })
                      : c.in.reduce<Coroutine<State, Err, Immutable.List<Typing>>>((args, arg, arg_i) =>
                          arg(check_equality ? no_constraints : apply(inl(), expected_args[arg_i])).then(arg_t =>
                            args.then(args_t =>
                              co_unit(args_t.push(arg_t))
                            )),
                          co_unit(Immutable.List<Typing>()))
                    return check_arguments.then(args =>
                      {
                        let fun = fun_type(tuple_type(args.toArray().map(a => a.type)), c.out, c.range)
                        // if (check_equality) {
                        //   console.log(`Equality check: ${type_to_string(fun)} == ${type_to_string(is_static ? m.typing.type :
                        //     m.typing.type.kind != "fun" ? m.typing.type :
                        //     m.typing.type.out)} ? ${type_equals(fun, is_static ? m.typing.type :
                        //       m.typing.type.kind != "fun" ? m.typing.type :
                        //       m.typing.type.out)}`)
                        // }
                        if (check_equality && !type_equals(fun, is_static ? m.typing.type :
                                                                m.typing.type.kind != "fun" ? m.typing.type :
                                                                m.typing.type.out)) {
                          return co_error<State, Err, Typing>({ range: r, message: `Unexpected method` })
                        }
                        return coerce(r, _ => f(), fun)(no_constraints)
                      })
                  }
                  else{

                    return f()
                  }

              }



            if(ms.count() == 1){

              let m = ms.first()
              if(m.typing.type.kind != "fun")
                return co_error<State, Err, Typing>({ range: r, message: `Unexpected method` })

              if(constraints.kind != "right" && constraints.value.kind == "fun_with_input_as_stmts"){
                let refined_constraints = constraints.value

                return compute_method(m, apply(inl(),refined_constraints))
              }
              else{
                return compute_method(m, apply(inr(),{}))

              }
            }
            if(constraints.kind == "right") return co_error<State, Err, Typing>({ range: r, message: `Internal error. Expected constraints inside a method.` })
            if(constraints.value.kind != "fun_with_input_as_stmts") return co_error<State, Err, Typing>({ range: r, message: `Internal error. Expected fun_with_input_as_stmts.` })
            let refined_constraints = constraints.value

            let c = co_catch_many<State, Err, Typing>
                          ({ range: r, message: `Error: cannot get method ${F_or_M_name}.` })
                          (ms.map((m, i) => {
                            if (!m)
                            return co_error<State, Err, Typing>({ range: r, message: `Unexpected coercion error` })
                          if(m.typing.type.kind != "fun")
                            return co_error<State, Err, Typing>({ range: r, message: `Unexpected method` })
                          return compute_method(m, apply(inl(),refined_constraints), true)
                      }).concat(
                          (ms.map((m, i) =>
                            {
                              if (!m)
                                return co_error<State, Err, Typing>({ range: r, message: `Unexpected coercion error` })
                              if(m.typing.type.kind != "fun")
                                return co_error<State, Err, Typing>({ range: r, message: `Unexpected method` })
                              return compute_method(m, apply(inl(),refined_constraints), true)
                            }
                          ))).toList())
            return c


          }
          return co_error<State, Err, Typing>({ range: r, message: `Error: ${C_name} does not contain field or method ${F_or_M_name}` })
        }
        let base_fields : {name:string, f:FieldDefinition}[] = C_def.fields.map((f,k) => ({name:k, f:f})).toArray().filter((f:any) => f.f.is_used_as_base) as any
        //comm_list_coroutine
        let field_to_lookup = base_fields.map(f =>
            field_get(r, context.kind == "global scope" ? {kind:"class", C_name: C_name, looking_up_base : true } :  {...context, looking_up_base : true}, field_get(r, context, this_ref, f.name, n+1, C_name), F_or_M_name, n+2, C_name)(constraints)
          ).concat([method_try_get()])

        return co_catch_many<State, Err, Typing>({ range: r, message: `Error: cannot get ${F_or_M_name}.` })(Immutable.List(field_to_lookup))
      }
    }
    ))
}


export let field_set = function (r: SourceRange, context: CallingContext, this_ref: Stmt, F_name: { att_name: string, kind: "att" } |
                                                                                                  { att_name: string, kind: "att_arr", index: Stmt },
                                  new_value: Stmt): Stmt {
  return _ => this_ref(no_constraints).then(this_ref_t =>
    (F_name.kind == "att_arr" ? F_name.index(no_constraints) : co_unit<State, Err, Typing>(mk_typing(bool_type, Sem.bool_expr(false)))).then(maybe_index =>
      co_get_state<State, Err>().then(bindings => {
        if (this_ref_t.type.kind != "ref" && this_ref_t.type.kind != "obj") {
          return co_error<State, Err, Typing>({ range: r, message: `Error: expected reference or class name when setting ${F_name.att_name}.` })
        }
        let C_name: string = this_ref_t.type.C_name
        if (!bindings.bindings.has(C_name)) return co_error<State, Err, Typing>({ range: r, message: `Error: class ${C_name} is undefined` })
        let C_def = bindings.bindings.get(C_name)
        if (C_def.kind != "obj") return co_error<State, Err, Typing>({ range: r, message: `Error: type ${C_name} is not a class` })
        let x = C_def.fields.toArray().filter(f => f.is_used_as_base)
        if (!C_def.fields.has(F_name.att_name)) {
          let base_fields : {name:string, f:FieldDefinition}[] = C_def.fields.map((f,k) => ({name:k, f:f})).toArray().filter((f:any) => f.f.is_used_as_base) as any
          if (base_fields.length > 0){
            let field_to_lookup = base_fields.map(f => field_set(r, context, field_get(r, context, this_ref, f.name), F_name, new_value)(no_constraints))
            return co_catch_many<State, Err, Typing>({ range: r, message: `Error: cannot get ${F_name.att_name}.` })(Immutable.List(field_to_lookup))
          }
          else return co_error<State, Err, Typing>({ range: r, message: `Error: class ${C_name} does not contain ${F_name.att_name}` })
        }
        let F_def = C_def.fields.get(F_name.att_name)
        if (!F_def.modifiers.has("public")) {
          if (context.kind == "global scope")
            return co_error<State, Err, Typing>({ range: r, message: `Error: cannot set non-public field ${F_name.att_name}.` })
          else if (context.C_name != C_name)
            return co_error<State, Err, Typing>({ range: r, message: `Error: cannot set non-public field ${C_name}::${F_name.att_name}.` })
        }
        return new_value(apply(inl(), F_def.type)).then(new_value_t => {

          return co_unit(mk_typing(unit_type,
            F_def.modifiers.has("static")
              ? Sem.static_field_set_expr_rt(r, C_name, F_name.kind == "att" ? F_name : { ...F_name, index: maybe_index.sem }, new_value_t.sem)
              : Sem.field_set_expr_rt(r, F_name.kind == "att" ? F_name : { ...F_name, index: maybe_index.sem }, new_value_t.sem, this_ref_t.sem)))
        })
      }
      )))
}


export let call_cons = function (r: SourceRange, context: CallingContext, C_name: string, arg_values: Array<Stmt>, C_name_generic: string, type_args:Array<Type>, is_internal:boolean = false): Stmt {
  return constraints => instantiate_generics(r, { kind:"generic type instance", C_name:C_name_generic, args:type_args }).then(inst_t => {
    let t = inst_t.type
    return co_get_state<State, Err>().then(bindings => {
    if (!bindings.bindings.has(C_name)) return co_error<State, Err, Typing>({ range: r, message: `Error: class ${C_name} is undefined.` })
    let C_def = bindings.bindings.get(C_name)
    if (C_def.kind != "obj") return co_error<State, Err, Typing>({ range: r, message: `Error: type  ${C_name} is not a class.` })
    if (C_def.class_kind != "normal" && !is_internal) return co_error<State, Err, Typing>({ range: r, message: `Error: cannot instantiate ${C_name} as it is not a concrete class.` })
    if (!C_def.methods.has(C_name)) {
      return co_error<State, Err, Typing>({ range: r, message: `Error: class ${C_name} has no constructors.` })
    }
    let lambda_t = C_def.methods.get(C_name).first()

    if (lambda_t.typing.type.kind != "fun" || lambda_t.typing.type.in.kind != "tuple" ||
      lambda_t.typing.type.out.kind != "fun" || lambda_t.typing.type.out.in.kind != "tuple")
      return co_error<State, Err, Typing>({ range: r, message: `Error: invalid constructor type ${type_to_string(lambda_t.typing.type)}` })

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
        if (f.modifiers.some(m => m == "abstract" || m == "virtual")) {
          //console.log("virtual...")
          return (_: TypeConstraints) =>
            // co_stateless<State,Err,Typing>(
            //   Co.co_set_state<State,Err>({...bindings, bindings:bindings.bindings.remove("this")}).then(_ =>
            v(no_constraints).then(v_v =>
              co_unit<State, Err, Typing>(mk_typing(unit_type,
                Sem.field_set_expr_rt(r, { att_name: f_name, kind: "att" },
                  v_v.sem, //Sem.call_lambda_expr_rt(r, v_v.sem, [Sem.get_v_rt(r, "this")]),
                  Sem.get_v_rt(r, "this")))))
        }
        return (_: TypeConstraints) => v(no_constraints).then(v_v =>
          co_unit<State, Err, Typing>(mk_typing(unit_type, Sem.field_set_expr_rt(r, { att_name: f_name, kind: "att" }, v_v.sem, Sem.get_v_rt(r, "this")))))
      }
    }).toArray().reduce((a, b) => semicolon(r, a, b), done)

    if (!lambda_t.modifiers.has("public")) {
      if (context.kind == "global scope")
        return co_error<State, Err, Typing>({ range: r, message: `Error: cannot call non-public constructor ${C_name}.` })
      else if (context.C_name != C_name)
        return co_error<State, Err, Typing>({ range: r, message: `Error: cannot call non-public constructor ${C_name}.` })
    }
    return ensure_constraints(r, constraints)(lambda_t.typing.type.kind == "fun" && lambda_t.typing.type.in.kind == "tuple" ?
      check_arguments.then(args_t =>
        init_fields(no_constraints).then(init_fields_t =>
          lambda_t.typing.type.kind != "fun" || lambda_t.typing.type.in.kind != "tuple" ||
            (lambda_t.typing.type.out.kind == "fun" &&
              lambda_t.typing.type.out.in.kind == "tuple" &&
              arg_values.length != lambda_t.typing.type.out.in.args.length) ?
            co_error<State, Err, Typing>({ range: r, message: `Error: parameter type mismatch when calling lambda expression ${type_to_string(lambda_t.typing.type)} with arguments ${JSON.stringify(args_t.toArray().map(t => type_to_string(t.type)))}` })
            :
            co_unit(mk_typing(ref_type(C_name), inst_t.sem.then(_ => Sem.call_cons_rt(r, C_name, args_t.toArray().map(arg_t => arg_t.sem), init_fields_t.sem))))
        ))
      : co_error<State, Err, Typing>({ range: r, message: `Error: cannot invoke non-lambda expression of type ${type_to_string(lambda_t.typing.type)}` }))
  })
  })
}

export let get_class = (r: SourceRange, t: Type): Coroutine<State, Err, ObjType> =>
  t.kind == "int" || t.kind == "float" || t.kind == "string" || t.kind == "double" || t.kind == "bool" || t.kind == "unit" ?
    co_get_state<State, Err>().then(bindings => {
      if (!bindings.bindings.has(t.kind)) return co_error<State, Err, ObjType>({ message: `Cannot find class for primitive type ${type_to_string(t)}`, range: r })
      let t_t = bindings.bindings.get(t.kind)
      if (t_t.kind != "obj") co_error<State, Err, ObjType>({ message: `Malformed class for primitive type ${type_to_string(t)}`, range: r })
      let t_obj: ObjType = t_t as ObjType
      return co_unit(t_obj)
    })
    : t.kind == "obj" ? co_unit<State, Err, ObjType>(t)
    : t.kind == "ref" ?
      co_get_state<State, Err>().then(bindings => {
        if(bindings.bindings.has(t.C_name)) {
          let t_in_bindings = bindings.bindings.get(t.C_name)
          if(t_in_bindings.kind == "obj") return co_unit<State, Err, ObjType>(t_in_bindings)
        }
        return co_unit<State, Err, ObjType>({ C_name: type_to_string(t), class_kind: "normal", fields: Immutable.Map<Name, FieldType>(), methods: MultiMap<Name, MethodTyping>([]), is_internal: true, range: zero_range, kind: "obj" })
      })
      : co_unit<State, Err, ObjType>({ C_name: type_to_string(t), class_kind: "normal", fields: Immutable.Map<Name, FieldType>(), methods: MultiMap<Name, MethodTyping>([]), is_internal: true, range: zero_range, kind: "obj" })

export let coerce = (r: SourceRange, e: Stmt, t: Type): Stmt =>
  constraints => e(constraints).then(e_v => {
    if (type_equals(t, e_v.type)) return co_unit(e_v)

    // console.log(`Coercing from ${type_to_string(e_v.type)} to ${type_to_string(t)}`)
    if (e_v.type.kind == "tuple" && t.kind == "record") {
      let record_labels = t.args.keySeq().toArray()
      return co_unit(
        mk_typing(t, e_v.sem.then(e_v_rt => co_unit(apply(inl(), tuple_to_record(e_v_rt.value, record_labels)))))
      )
    }

    if (e_v.type.kind == "fun" && t.kind == "fun") {
      // console.log(`Coercing ${type_to_string(e_v.type)} --> ${type_to_string(t)}`)
      let x = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)
      let body = call_lambda(r, e, [get_v(r,x)])
      return arrow(r, [{ name:x, type:t.in }], [], body)(apply(inl(), t))
    }

    return get_class(r, e_v.type).then(e_c => {
      let t_name = type_to_string(t)
      let e_type_name = type_to_string(e_v.type)

      let casting_operators = e_c.methods.values().filter(m =>
        m != undefined && m.v.modifiers.some(mod => mod == "casting") &&
        m.v.modifiers.some(mod => mod == "operator") &&
        m.v.modifiers.some(mod => mod == "static")).map(c_op => !c_op ? undefined : ({ body: c_op.v, name: c_op.k }))
        .toArray() // as { body:MethodTyping, name:string}[]
      let coercions = casting_operators.map(c_op => {
        if (!c_op)
          return (_: TypeConstraints) => co_error<State, Err, Typing>({ range: r, message: `Unexpected coercion error` })
        let c_op_typing: Stmt = _ => co_unit<State, Err, Typing>(mk_typing(c_op.body.typing.type, Sem.static_method_get_expr_rt(r, e_type_name, c_op.name)))
        let coercion = call_lambda(r, c_op_typing, [_ => co_unit<State, Err, Typing>(e_v)])
        if (c_op.name == t_name) {
          return coercion
        } else {
          return coerce(r, coercion, t)
        }
      })

      return co_catch_many<State, Err, Typing>({ message: `Cannot cast from ${e_type_name} to ${t_name}`, range: r })(Immutable.List<Coroutine<State, Err, Typing>>(coercions.map(c => c(no_constraints))))
    })
  })
