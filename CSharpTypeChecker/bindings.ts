import * as Immutable from "immutable"
import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, fun2, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair, distribute_sum_prod_inv, distribute_sum_prod, fun3, co_get_state, co_set_state } from "ts-bccc"
import * as CCC from "ts-bccc"
import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
import * as Co from "ts-bccc"
import { SourceRange, mk_range, zero_range } from "../source_range"
import * as Sem from "../Python/python"
import { comm_list_coroutine } from "../ccc_aux";

// Bindings

export type Name = string
export type Err = string
export type Type = { kind:"render-grid-pixel"} | { kind:"render-grid"} | { kind:"unit"} | { kind:"bool"} | { kind:"int"} | { kind:"float"} | { kind:"string"} | { kind:"fun", in:Type, out:Type } | { kind:"obj", methods:Immutable.Map<Name, Typing>, fields:Immutable.Map<Name, Type> }
                 | { kind:"ref", C_name:string } | { kind:"arr", arg:Type } | { kind:"tuple", args:Array<Type> }
export let render_grid_type : Type = { kind:"render-grid" }
export let render_grid_pixel_type : Type = { kind:"render-grid-pixel" }
export let unit_type : Type = { kind:"unit" }
export let int_type : Type = { kind:"int" }
export let string_type : Type = { kind:"string" }
export let bool_type : Type = { kind:"bool" }
export let float_type : Type = { kind:"float" }
export let fun_type : (i:Type,o:Type) => Type = (i,o) => ({ kind:"fun", in:i, out:o })
export let arr_type : (el:Type) => Type = (arg) => ({ kind:"arr", arg:arg })
export let tuple_type : (args:Array<Type>) => Type = (args) => ({ kind:"tuple", args:args })
export let ref_type : (C_name:string) => Type = (C_name) => ({ kind:"ref", C_name:C_name })
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

let type_equals = (t1:Type,t2:Type) : boolean =>
  (t1.kind == "fun" && t2.kind == "fun" && type_equals(t1.in,t2.in) && type_equals(t1.out,t2.out))
  || (t1.kind == "tuple" && t2.kind == "tuple" && t1.args.length == t2.args.length && t1.args.every((t1_arg,i) => type_equals(t1_arg, t2.args[i])))
  || (t1.kind == "arr" && t2.kind == "arr" && type_equals(t1.arg,t2.arg))
  || (t1.kind == "obj" && t2.kind == "obj" &&
      !t1.methods.some((v1,k1) => v1 == undefined || k1 == undefined || !t2.methods.has(k1) || !type_equals(t2.methods.get(k1).type, v1.type)) &&
      !t2.methods.some((v2,k2) => v2 == undefined || k2 == undefined || !t1.methods.has(k2)))
  || t1.kind == t2.kind

// Basic statements and expressions
let wrap_co_res = Co.value<State,Err,Typing>().then(Co.result<State,Err,Typing>())
let wrap_co = wrap_co_res.then(Co.no_error())
export interface Stmt extends Coroutine<State, Err, Typing> {}
export let get_v = function(v:Name) : Stmt {
  let f = load.then(
    constant<Unit,Err>(`Error: variable ${v} does not exist.`).map_plus(
    (id<TypeInformation>().times(constant<TypeInformation, Sem.ExprRt<Sum<Sem.Val,Sem.Val>>>(Sem.get_v_rt(v)))).then(mk_typing_cat_full)
  ))
  let g = snd<Name,State>().times(f).then(distribute_sum_prod())
  let g1 = g.then(
    (snd<State,Err>()).map_plus(
    (swap_prod<State,Typing>().then(wrap_co_res))
  ))
  let h = apply(curry(g1), v)
  return mk_coroutine<State,Err,Typing>(h)
}
export let decl_v = function(v:Name, t:Type, is_constant?:boolean) : Stmt {
  let f = store.then(constant<State, Typing>(mk_typing(unit_type, Sem.done_rt)).times(id())).then(wrap_co)
  let g = curry(f)
  let args = apply(constant<Unit,Name>(v).times(constant<Unit,TypeInformation>({...t, is_constant:is_constant != undefined ? is_constant : false})), {})
  return mk_coroutine<State,Err,Typing>(apply(g, args))
}
export let decl_const = function(c:Name, t:Type, e:Stmt) : Stmt {
  let f = store.then(constant<State, Typing>(mk_typing(unit_type, Sem.done_rt)).times(id())).then(wrap_co)
  let g = curry(f)
  let args = apply(constant<Unit,Name>(c).times(constant<Unit,TypeInformation>({...t, is_constant:true})), {})
  return mk_coroutine<State,Err,Typing>(apply(g, args)).then(_ =>
         e.then(e_val =>
         get_v(c).then(c_val =>
         // console.log(`Initialising constant ${v} (${JSON.stringify(v_val.type)})`) ||
         type_equals(e_val.type, c_val.type) ?
           co_unit(mk_typing(unit_type, Sem.set_v_expr_rt(c, e_val.sem)))
         : co_error<State,Err,Typing>(`Error: cannot assign ${JSON.stringify(c)} to ${JSON.stringify(e)}: type ${JSON.stringify(c_val.type)} does not match ${JSON.stringify(e_val.type)}`)
         )))
}

export let set_v = function(v:Name, e:Stmt) : Stmt {
  return e.then(e_val =>
         get_v(v).then(v_val =>
         // console.log(`Assigning ${v} (${JSON.stringify(v_val.type)})`) ||
         type_equals(e_val.type, v_val.type) && !v_val.type.is_constant ?
           co_unit(mk_typing(unit_type, Sem.set_v_expr_rt(v, e_val.sem)))
         : v_val.type.is_constant ?
           co_error<State,Err,Typing>(`Error: cannot assign anything to ${v}: it is a constant.`)
         : co_error<State,Err,Typing>(`Error: cannot assign ${JSON.stringify(v)} to ${JSON.stringify(e)}: type ${JSON.stringify(v_val.type)} does not match ${JSON.stringify(e_val.type)}`)
         ))
}

export let bool = function(b:boolean) : Stmt {
  return co_unit(mk_typing(bool_type, Sem.bool_expr(b)))
}

export let str = function(s:string) : Stmt {
  return co_unit(mk_typing(string_type, Sem.str_expr(s)))
}

export let int = function(i:number) : Stmt {
  return co_unit(mk_typing(int_type, Sem.int_expr(i)))
}

export let gt = function(a:Stmt, b:Stmt) : Stmt {
  return a.then(a_t =>
         b.then(b_t =>
          type_equals(a_t.type, b_t.type) ?
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(bool_type, Sem.int_gt_rt(a_t.sem, b_t.sem)))
            : type_equals(a_t.type, float_type) ?
             co_unit(mk_typing(float_type, Sem.float_gt_rt(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>("Error: unsupported types for operator (>)!")
          : co_error<State,Err,Typing>("Error: cannot compare expressions of different types!")
        ))
}

export let lt = function(a:Stmt, b:Stmt) : Stmt {
  return a.then(a_t =>
         b.then(b_t =>
          type_equals(a_t.type, b_t.type) ?
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(bool_type, Sem.int_lt_rt(a_t.sem, b_t.sem)))
            : type_equals(a_t.type, float_type) ?
             co_unit(mk_typing(float_type, Sem.float_lt_rt(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>("Error: unsupported types for operator (<)!")
          : co_error<State,Err,Typing>("Error: cannot compare expressions of different types!")
        ))
}

export let geq = function(a:Stmt, b:Stmt) : Stmt {
  return a.then(a_t =>
         b.then(b_t =>
          type_equals(a_t.type, b_t.type) ?
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(bool_type, Sem.int_geq_rt(a_t.sem, b_t.sem)))
            : type_equals(a_t.type, float_type) ?
             co_unit(mk_typing(float_type, Sem.float_geq_rt(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>("Error: unsupported types for operator (>=)!")
          : co_error<State,Err,Typing>("Error: cannot compare expressions of different types!")
        ))
}

export let leq = function(a:Stmt, b:Stmt) : Stmt {
  return a.then(a_t =>
         b.then(b_t =>
          type_equals(a_t.type, b_t.type) ?
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(bool_type, Sem.int_leq_rt(a_t.sem, b_t.sem)))
            : type_equals(a_t.type, float_type) ?
             co_unit(mk_typing(float_type, Sem.float_leq_rt(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>("Error: unsupported types for operator (<=)!")
          : co_error<State,Err,Typing>("Error: cannot compare expressions of different types!")
        ))
}

export let eq = function(a:Stmt, b:Stmt) : Stmt {
  return a.then(a_t =>
         b.then(b_t =>
          type_equals(a_t.type, b_t.type) ?
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(bool_type, Sem.int_eq_rt(a_t.sem, b_t.sem)))
            : type_equals(a_t.type, float_type) ?
             co_unit(mk_typing(float_type, Sem.float_eq_rt(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>("Error: unsupported types for operator (==)!")
          : co_error<State,Err,Typing>("Error: cannot compare expressions of different types!")
        ))
}

export let neq = function(a:Stmt, b:Stmt) : Stmt {
  return a.then(a_t =>
         b.then(b_t =>
          type_equals(a_t.type, b_t.type) ?
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(bool_type, Sem.int_neq_rt(a_t.sem, b_t.sem)))
            : type_equals(a_t.type, float_type) ?
             co_unit(mk_typing(float_type, Sem.float_neq_rt(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>("Error: unsupported types for operator (!=)!")
          : co_error<State,Err,Typing>("Error: cannot compare expressions of different types!")
        ))
}

export let xor = function(a:Stmt, b:Stmt) : Stmt {
  return a.then(a_t =>
         b.then(b_t =>
          type_equals(a_t.type, b_t.type) ?
            type_equals(a_t.type, bool_type) ?
             co_unit(mk_typing(bool_type, Sem.bool_neq_rt(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>("Error: unsupported types for operator (^)!")
          : co_error<State,Err,Typing>("Error: cannot compare expressions of different types!")
        ))
}

export let mk_empty_render_grid = function(w:Stmt, h:Stmt) : Stmt {
  return w.then(w_t =>
         h.then(h_t =>
          type_equals(w_t.type, int_type) && type_equals(h_t.type, int_type) ?
            co_unit(mk_typing(render_grid_type, Sem.mk_empty_render_grid_rt(w_t.sem, h_t.sem)))
          : co_error<State,Err,Typing>("Error: unsupported types for empty grid creation.")
         ))
}

export let mk_render_grid_pixel = function(w:Stmt, h:Stmt, st:Stmt) : Stmt {
  return w.then(w_t =>
         h.then(h_t =>
         st.then(st_t =>
          type_equals(w_t.type, int_type) && type_equals(h_t.type, int_type) && type_equals(st_t.type, bool_type) ?
            co_unit(mk_typing(render_grid_pixel_type, Sem.mk_render_grid_pixel_rt(w_t.sem, h_t.sem, st_t.sem)))
          : co_error<State,Err,Typing>("Error: unsupported types for empty grid creation.")
         )))
}

export let plus = function(a:Stmt, b:Stmt) : Stmt {
  return a.then(a_t =>
         b.then(b_t =>
          type_equals(a_t.type, b_t.type) ?
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(int_type, Sem.int_plus_rt(a_t.sem, b_t.sem)))
            : type_equals(a_t.type, float_type) ?
             co_unit(mk_typing(int_type, Sem.float_plus_rt(a_t.sem, b_t.sem)))
            : type_equals(a_t.type, string_type) ?
             co_unit(mk_typing(string_type, Sem.string_plus_rt(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>("Error: unsupported types for operator (+)!")
          : type_equals(a_t.type, render_grid_type) && type_equals(b_t.type, render_grid_pixel_type) ?
            co_unit(mk_typing(render_grid_type, Sem.render_grid_plus_rt(a_t.sem, b_t.sem)))
          : co_error<State,Err,Typing>("Error: cannot sum expressions of non-compatible types!")
        ))
}

export let minus = function(a:Stmt, b:Stmt) : Stmt {
  return a.then(a_t =>
         b.then(b_t =>
          type_equals(a_t.type, b_t.type) ?
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(int_type, Sem.int_minus_rt(a_t.sem, b_t.sem)))
            : type_equals(a_t.type, float_type) ?
             co_unit(mk_typing(float_type, Sem.float_minus_rt(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>("Error: unsupported types for operator (-)!")
          : co_error<State,Err,Typing>("Error: cannot subtract expressions of different types!")
        ))
}

export let div = function(a:Stmt, b:Stmt) : Stmt {
  return a.then(a_t =>
         b.then(b_t =>
          type_equals(a_t.type, b_t.type) ?
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(int_type, Sem.int_div_rt(a_t.sem, b_t.sem)))
            : type_equals(a_t.type, float_type) ?
             co_unit(mk_typing(float_type, Sem.float_div_rt(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>("Error: unsupported types for operator (/)!")
          : co_error<State,Err,Typing>("Error: cannot divide expressions of different types!")
        ))
}

export let times = function(a:Stmt, b:Stmt, sr:SourceRange) : Stmt {
  return a.then(a_t =>
         b.then(b_t =>
          type_equals(a_t.type, b_t.type) ?
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(int_type, Sem.int_times_rt(a_t.sem, b_t.sem, sr)))
            : type_equals(a_t.type, float_type) ?
             co_unit(mk_typing(float_type, Sem.float_times_rt(a_t.sem, b_t.sem, sr)))
            : co_error<State,Err,Typing>(`Error (${sr.to_string()}): unsupported types for operator (*)!`)
          : co_error<State,Err,Typing>(`Error (${sr.to_string()}): cannot multiply expressions of incompatible types!`)
        ))
}

export let mod = function(a:Stmt, b:Stmt) : Stmt {
  return a.then(a_t =>
         b.then(b_t =>
          type_equals(a_t.type, b_t.type) ?
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(int_type, Sem.int_mod_rt(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>("Error: unsupported types for operator (-)!")
          : co_error<State,Err,Typing>("Error: cannot mod expressions of different types!")
        ))
}

export let minus_unary = function(a:Stmt) : Stmt {
  return a.then(a_t =>
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(int_type, Sem.int_minus_unary_rt(a_t.sem)))
            : type_equals(a_t.type, float_type) ?
             co_unit(mk_typing(float_type, Sem.float_minus_unary_rt(a_t.sem)))
            : co_error<State,Err,Typing>("Error: unsupported type for unary operator (-)!")
        )
}

export let or = function(a:Stmt, b:Stmt) : Stmt {
  return a.then(a_t =>
         b.then(b_t =>
          type_equals(a_t.type, b_t.type) && type_equals(a_t.type, bool_type) ?
             co_unit(mk_typing(bool_type, Sem.bool_plus_rt(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>("Error: unsupported types for operator (||)!")
        ))
}

export let and = function(a:Stmt, b:Stmt) : Stmt {
  return a.then(a_t =>
         b.then(b_t =>
          type_equals(a_t.type, b_t.type) && type_equals(a_t.type, bool_type) ?
             co_unit(mk_typing(bool_type, Sem.bool_times_rt(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>("Error: unsupported types for operator (&&)!")
        ))
}

export let not = function(a:Stmt) : Stmt {
  return a.then(a_t =>
            type_equals(a_t.type, bool_type) ?
             co_unit(mk_typing(bool_type, Sem.bool_not_rt(a_t.sem)))
            : co_error<State,Err,Typing>("Error: unsupported type for unary operator (!)!")
        )
}

export let length = function(a:Stmt) : Stmt {
  return a.then(a_t =>
            type_equals(a_t.type, string_type) ?
             co_unit(mk_typing(int_type, Sem.string_length_rt(a_t.sem)))
            : a_t.type.kind == "arr" ?
             co_unit(mk_typing(int_type, a_t.sem.then(a_val => Sem.get_arr_len_rt(a_val.value))))
            : co_error<State,Err,Typing>("Error: unsupported type for unary operator (-)!")
        )
}

export let get_index = function(a:Stmt, i:Stmt) : Stmt {
  return a.then(a_t =>
         i.then(i_t =>
          a_t.type.kind == "arr" && type_equals(i_t.type, int_type) ?
            co_unit(mk_typing(a_t.type.arg, Sem.get_arr_el_expr_rt(a_t.sem, i_t.sem)))
          : co_error<State,Err,Typing>("Error: unsupported types for array lookup!")
        ))
}

export let set_index = function(a:Stmt, i:Stmt, e:Stmt) : Stmt {
  return a.then(a_t =>
         i.then(i_t =>
         e.then(e_t =>
          a_t.type.kind == "arr" && type_equals(i_t.type, int_type) && type_equals(e_t.type, a_t.type.arg) ?
            co_unit(mk_typing(a_t.type.arg, Sem.set_arr_el_expr_rt(a_t.sem, i_t.sem, e_t.sem)))
          : co_error<State,Err,Typing>("Error: unsupported types for writing in an array!")
        )))
}

// Debugger statements
export let breakpoint = function(r:SourceRange) : (_:Stmt) => Stmt {
  return p => semicolon(co_unit(mk_typing(unit_type, Sem.dbg_rt(r)(apply(inl<Sem.Val,Sem.Val>(), Sem.mk_unit_val)))), p)
}

export let typechecker_breakpoint = function(range:SourceRange) : (_:Stmt) => Stmt {
  return p => semicolon(semicolon(set_highlighting(range), Co.suspend<State,Err>().then(_ => co_unit<State,Err,Typing>(mk_typing(unit_type,Sem.done_rt)))), p)
}

export let highlight : Fun<Prod<SourceRange, State>, State> = fun(x => ({...x.snd, highlighting:x.fst }))
export let set_highlighting = function(r:SourceRange) : Stmt {
  return mk_coroutine(constant<State, SourceRange>(r).times(id<State>()).then(highlight).then(
    constant<State,Typing>(mk_typing(unit_type,Sem.done_rt)).times(id<State>())).then(Co.value<State, Err, Typing>().then(Co.result<State, Err, Typing>().then(Co.no_error<State, Err, Typing>()))))
}

// Control flow statements
export let done : Stmt = co_unit(mk_typing(unit_type, Sem.done_rt))

export let lub = (t1:TypeInformation, t2:TypeInformation) : Sum<TypeInformation, Unit> => {
  return type_equals(t1, t2) ? apply(inl<TypeInformation, Unit>(), t1) :
         t1.kind == "unit" ? apply(inl<TypeInformation, Unit>(), t2) :
         t2.kind == "unit" ? apply(inl<TypeInformation, Unit>(), t1) :
         apply(inr<TypeInformation, Unit>(), {})
}

export let if_then_else = function(c:Stmt, t:Stmt, e:Stmt) : Stmt {
  return c.then(c_t =>
         c_t.type.kind != "bool" ? co_error<State,Err,Typing>("Error: condition has the wrong type!") :
         t.then(t_t =>
         e.then(e_t => {

          let on_type : Fun<TypeInformation, Stmt> = fun(t_i => co_unit(mk_typing(t_i,Sem.if_then_else_rt(c_t.sem, t_t.sem, e_t.sem))))
          let on_error : Fun<Unit, Stmt> = constant<Unit, Stmt>(co_error<State,Err,Typing>("Error: the branches of a conditional should have compatible types!"))

          return apply(on_type.plus(on_error), lub(t_t.type, e_t.type))
         })))
}

export let while_do = function(c:Stmt, b:Stmt) : Stmt {
  return c.then(c_t =>
         c_t.type.kind != "bool" ? co_error<State,Err,Typing>("Error: condition has the wrong type!") :
         b.then(t_t => co_unit(mk_typing(t_t.type,Sem.while_do_rt(c_t.sem, t_t.sem)))
         ))
}

export let semicolon = function(p:Stmt, q:Stmt) : Stmt {
  return p.then(p_t =>
         q.then(q_t =>          
           co_unit(mk_typing(q_t.type, p_t.sem.then(res => {
            let f:Sem.ExprRt<Sum<Sem.Val,Sem.Val>> = co_unit(apply(inr<Sem.Val,Sem.Val>(), res.value))
            return res.kind == "left" ? q_t.sem : f
           }))
         )))
}

export interface Parameter { name:Name, type:Type }
export interface LambdaDefinition { return_t:Type, parameters:Array<Parameter>, body:Stmt }
export interface FunDefinition extends LambdaDefinition { name:string, range:SourceRange }
export let mk_param = function(name:Name, type:Type) {
  return { name:name, type:type }
}
export let mk_lambda = function(def:LambdaDefinition, closure_parameters:Array<Name>, range:SourceRange) : Stmt {
  let parameters = def.parameters
  let return_t = def.return_t
  let body = def.body
  let set_bindings = parameters.reduce<Stmt>((acc, par) => semicolon(decl_v(par.name, par.type, false), acc),
                     closure_parameters.reduce<Stmt>((acc, cp) => semicolon(get_v(cp).then(cp_t => decl_v(cp, cp_t.type, true)), acc), done))
  return  Co.co_get_state<State,Err>().then(initial_bindings =>
          set_bindings.then(_ =>
          body.then(body_t =>
          type_equals(body_t.type, return_t) ?
            Co.co_set_state<State,Err>(initial_bindings).then(_ =>
            co_unit(mk_typing(fun_type(tuple_type(parameters.map(p => p.type)) ,body_t.type), Sem.mk_lambda_rt(body_t.sem, parameters.map(p => p.name), closure_parameters, range))))
          :
            co_error<State,Err,Typing>(`Error: return type does not match declaration`)
          )))
}
// export interface Bindings extends Immutable.Map<Name, TypeInformation> {}
// export interface State { highlighting:SourceRange, bindings:Bindings }
export let def_fun = function(def:FunDefinition, closure_parameters:Array<Name>) : Stmt {
  return co_get_state<State, Err>().then(s =>
         co_set_state<State, Err>({...s, bindings:s.bindings.set(def.name, {...fun_type(tuple_type(def.parameters.map(p => p.type)), def.return_t), is_constant:true})}).then(_ =>
         mk_lambda(def, closure_parameters, def.range).then(l =>
         co_set_state<State, Err>(s).then(_ =>
         decl_const(def.name, l.type, co_unit(l))))))

}

export let def_method = function(C_name:string, def:FunDefinition) : Stmt {
  let parameters_with_this:Array<Parameter> = [{ name:"this", type:ref_type(C_name)}]
  def.parameters = def.parameters.concat(parameters_with_this)

  let parameters = def.parameters
  let return_t = def.return_t
  let body = def.body
  let set_bindings = parameters.reduce<Stmt>((acc, par) => semicolon(decl_v(par.name, par.type, false), acc), done)
  return  Co.co_get_state<State,Err>().then(initial_bindings =>
          set_bindings.then(_ =>
          body.then(body_t =>
          type_equals(body_t.type, return_t) ?
            Co.co_set_state<State,Err>(initial_bindings).then(_ =>
            co_unit(mk_typing(fun_type(tuple_type(parameters.map(p => p.type)), body_t.type),
                              Sem.mk_lambda_rt(body_t.sem, parameters.map(p => p.name), [], def.range))))
          :
            co_error<State,Err,Typing>(`Error: return type does not match declaration`)
          )))
}

export let call_lambda = function(lambda:Stmt, arg_values:Array<Stmt>) : Stmt {
  let check_arguments = arg_values.reduce<Coroutine<State, Err, Immutable.List<Typing>>>((args, arg) =>
    arg.then(arg_t =>
    args.then(args_t =>
    co_unit(args_t.push(arg_t))
    )),
    co_unit(Immutable.List<Typing>()))

  return lambda.then(lambda_t =>
    lambda_t.type.kind == "fun" && lambda_t.type.in.kind == "tuple" ?
      check_arguments.then(args_t =>
        lambda_t.type.kind != "fun" || lambda_t.type.in.kind != "tuple" ||
        arg_values.length != lambda_t.type.in.args.length ||
        args_t.some((arg_t, i) => lambda_t.type.kind != "fun" || lambda_t.type.in.kind != "tuple" || arg_t == undefined || i == undefined ||
                                  !type_equals(arg_t.type, lambda_t.type.in.args[i])) ?
          co_error<State,Err,Typing>(`Error: parameter type mismatch when calling lambda expression ${JSON.stringify(lambda_t.type)}`)
        :
          co_unit(mk_typing(lambda_t.type.out, Sem.call_lambda_expr_rt(lambda_t.sem, args_t.toArray().map(arg_t => arg_t.sem))))
      )
    : co_error<State,Err,Typing>(`Error: cannot invoke non-lambda expression of type ${JSON.stringify(lambda_t.type)}`)
    )
}

export let call_by_name = function(f_n:Name, args:Array<Stmt>) : Stmt {
  return call_lambda(get_v(f_n), args)
}

export let ret = function(p:Stmt) : Stmt {
  return p.then(p_t =>
         co_unit(mk_typing(p_t.type, Sem.return_rt(p_t.sem))
         ))
}

export let new_array = function(type:Type, len:Stmt) {
  return len.then(len_t =>
         type_equals(len_t.type, int_type) ?
           co_unit(mk_typing(arr_type(type), Sem.new_arr_expr_rt(len_t.sem)))
         : co_error<State,Err,Typing>(`Error: argument of array constructor must be of type int`))
}

export let get_arr_len = function(a:Stmt) {
  return a.then(a_t =>
         a_t.type.kind == "arr"  ?
           co_unit(mk_typing(int_type, Sem.get_arr_len_expr_rt(a_t.sem)))
         : co_error<State,Err,Typing>(`Error: array length requires an array`)
        )
}

export let get_arr_el = function(a:Stmt, i:Stmt) {
  return a.then(a_t =>
         i.then(i_t =>
         a_t.type.kind == "arr" && type_equals(i_t.type, int_type)  ?
           co_unit(mk_typing(a_t.type.arg, Sem.get_arr_el_expr_rt(a_t.sem, i_t.sem)))
         : co_error<State,Err,Typing>(`Error: array getter requires an array and an integer as arguments`)
        ))
}

export let set_arr_el = function(a:Stmt, i:Stmt, e:Stmt) {
  return a.then(a_t =>
         i.then(i_t =>
         e.then(e_t =>
         a_t.type.kind == "arr" && type_equals(i_t.type, int_type) && type_equals(e_t.type, a_t.type.arg) ?
           co_unit(mk_typing(unit_type, Sem.set_arr_el_expr_rt(a_t.sem, i_t.sem, e_t.sem)))
         : co_error<State,Err,Typing>(`Error: array setter requires an array and an integer as arguments`)
        )))
}

export let def_class = function(C_name:string, methods:Array<FunDefinition>, fields:Array<Parameter>) : Stmt {
  let C_type_placeholder:Type = {
    kind: "obj",
    methods:Immutable.Map<Name, Typing>(
      methods.map(m => [m.name, mk_typing(fun_type(tuple_type([ref_type(C_name)].concat(m.parameters.map(p => p.type))), m.return_t), Sem.done_rt)])
    ),
    fields:Immutable.Map<Name, Type>(
      fields.map(f => [f.name, f.type])
    )
  }

  return co_get_state<State, Err>().then(initial_bindings =>
          co_set_state<State, Err>({...initial_bindings, bindings:initial_bindings.bindings.set(C_name, {...C_type_placeholder, is_constant:true}) }).then(_ =>
          comm_list_coroutine(Immutable.List<Stmt>(methods.map(m => def_method(C_name, m)))).then(methods_t => {
          let methods_full_t = methods_t.zipWith((m_t,m_d) => ({ typ:m_t, def:m_d}), Immutable.Seq<FunDefinition>(methods)).toArray()
          let C_type:Type = {
            kind: "obj",
            methods:Immutable.Map<Name, Typing>(
              methods_full_t.map(m => [m.def.name, m.typ])
            ),
            fields:Immutable.Map<Name, Type>(
              fields.map(f => [f.name, f.type])
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
              ))
          }
          return co_set_state<State, Err>({...initial_bindings, bindings:initial_bindings.bindings.set(C_name, {...C_type, is_constant:true}) }).then(_ =>
            co_unit(mk_typing(unit_type, Sem.declare_class_rt(C_name, C_int))))
          }
          )))
}

export let field_get = function(this_ref:Stmt, F_name:string) : Stmt {
  return this_ref.then(this_ref_t =>
         co_get_state<State, Err>().then(bindings => {
           if (this_ref_t.type.kind != "ref") return co_error<State,Err,Typing>(`Error: this must be a reference`)
           if (!bindings.bindings.has(this_ref_t.type.C_name)) return co_error<State,Err,Typing>(`Error: class ${this_ref_t.type.C_name} is undefined`)
           let C_def = bindings.bindings.get(this_ref_t.type.C_name)
           if (C_def.kind != "obj") return co_error<State,Err,Typing>(`Error: class ${this_ref_t.type.C_name} is not a clas`)
           if (!C_def.fields.has(F_name)) return co_error<State,Err,Typing>(`Error: class ${this_ref_t.type.C_name} does not contain field ${F_name}`)
           let F_def = C_def.fields.get(F_name)
           return co_unit(mk_typing(F_def, Sem.field_get_expr_rt(F_name, this_ref_t.sem)))
          }
         ))
}

export let field_set = function(this_ref:Stmt, F_name:string, new_value:Stmt) : Stmt {
  return this_ref.then(this_ref_t =>
         new_value.then(new_value_t =>
         co_get_state<State, Err>().then(bindings => {
           if (this_ref_t.type.kind != "ref") return co_error<State,Err,Typing>(`Error: this must be a reference`)
           if (!bindings.bindings.has(this_ref_t.type.C_name)) return co_error<State,Err,Typing>(`Error: class ${this_ref_t.type.C_name} is undefined`)
           let C_def = bindings.bindings.get(this_ref_t.type.C_name)
           if (C_def.kind != "obj") return co_error<State,Err,Typing>(`Error: type ${this_ref_t.type.C_name} is not a class`)
           if (!C_def.fields.has(F_name)) return co_error<State,Err,Typing>(`Error: class ${this_ref_t.type.C_name} does not contain field ${F_name}`)
           let F_def = C_def.fields.get(F_name)
           if (!type_equals(F_def, new_value_t.type)) return co_error<State,Err,Typing>(`Error: field ${this_ref_t.type.C_name}::${F_name} cannot be assigned to value of type ${JSON.stringify(new_value_t.type)}`)
           return co_unit(mk_typing(unit_type, Sem.field_set_expr_rt(F_name, new_value_t.sem, this_ref_t.sem)))
          }
         )))
}


export let call_cons = function(C_name:string, arg_values:Array<Stmt>) : Stmt {
  return co_get_state<State, Err>().then(bindings => {
    if (!bindings.bindings.has(C_name)) return co_error<State,Err,Typing>(`Error: class ${C_name} is undefined`)
    let C_def = bindings.bindings.get(C_name)
    if (C_def.kind != "obj") return co_error<State,Err,Typing>(`Error: type  ${C_name} is not a class`)
    if (!C_def.methods.has(C_name)) return co_error<State,Err,Typing>(`Error: class ${C_name} does not have constructors`)
    let lambda_t = C_def.methods.get(C_name)

    let check_arguments = arg_values.reduce<Coroutine<State, Err, Immutable.List<Typing>>>((args, arg) =>
      arg.then(arg_t =>
      args.then(args_t =>
      co_unit(args_t.push(arg_t))
      )),
      co_unit(Immutable.List<Typing>()))

    return lambda_t.type.kind == "fun" && lambda_t.type.in.kind == "tuple" ?
        check_arguments.then(args_t =>
          lambda_t.type.kind != "fun" || lambda_t.type.in.kind != "tuple" ||
          arg_values.length != lambda_t.type.in.args.length - 1 ||
          args_t.some((arg_t, i) => lambda_t.type.kind != "fun" || lambda_t.type.in.kind != "tuple" || arg_t == undefined || i == undefined ||
                                    !type_equals(arg_t.type, lambda_t.type.in.args[i])) ?
            co_error<State,Err,Typing>(`Error: parameter type mismatch when calling lambda expression ${JSON.stringify(lambda_t.type)} with arguments ${JSON.stringify(args_t)}`)
          :
            co_unit(mk_typing(ref_type(C_name), Sem.call_cons_rt(C_name, args_t.toArray().map(arg_t => arg_t.sem))))
        )
      : co_error<State,Err,Typing>(`Error: cannot invoke non-lambda expression of type ${JSON.stringify(lambda_t.type)}`)
  })
}


export let call_method = function(this_ref:Stmt, M_name:string, arg_values:Array<Stmt>) : Stmt {
  return this_ref.then(this_ref_t =>
    co_get_state<State, Err>().then(bindings => {
      if (this_ref_t.type.kind != "ref") return co_error<State,Err,Typing>(`Error: this must be a reference`)
      let C_name = this_ref_t.type.C_name
    if (!bindings.bindings.has(C_name)) return co_error<State,Err,Typing>(`Error: class ${C_name} is undefined`)
    let C_def = bindings.bindings.get(C_name)
    if (C_def.kind != "obj") return co_error<State,Err,Typing>(`Error: type  ${C_name} is not a class`)
    if (!C_def.methods.has(M_name)) return co_error<State,Err,Typing>(`Error: class ${C_name} does not have constructors`)
    let lambda_t = C_def.methods.get(M_name)

    let check_arguments = arg_values.reduce<Coroutine<State, Err, Immutable.List<Typing>>>((args, arg) =>
      arg.then(arg_t =>
      args.then(args_t =>
      co_unit(args_t.push(arg_t))
      )),
      co_unit(Immutable.List<Typing>()))

    return lambda_t.type.kind == "fun" && lambda_t.type.in.kind == "tuple" ?
        check_arguments.then(args_t =>
          lambda_t.type.kind != "fun" || lambda_t.type.in.kind != "tuple" ||
          arg_values.length != lambda_t.type.in.args.length - 1 ||
          args_t.some((arg_t, i) => lambda_t.type.kind != "fun" || lambda_t.type.in.kind != "tuple" || arg_t == undefined || i == undefined ||
                                    !type_equals(arg_t.type, lambda_t.type.in.args[i])) ?
            co_error<State,Err,Typing>(`Error: parameter type mismatch when calling method ${JSON.stringify(lambda_t.type)} with arguments ${JSON.stringify(args_t)}`)
          :
            co_unit(mk_typing(ref_type(C_name), Sem.call_method_expr_rt(M_name, this_ref_t.sem, args_t.toArray().map(arg_t => arg_t.sem))))
        )
      : co_error<State,Err,Typing>(`Error: cannot invoke non-lambda expression of type ${JSON.stringify(lambda_t.type)}`)
  }))
}
