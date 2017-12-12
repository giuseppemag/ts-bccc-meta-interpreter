import * as Immutable from "immutable"
import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, fun2, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair, distribute_sum_prod_inv, distribute_sum_prod } from "ts-bccc"
import * as CCC from "ts-bccc"
import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
import * as Co from "ts-bccc"
import { SourceRange, mk_range } from "../source_range"
import * as Sem from "../Python/python"

// Bindings

export type Name = string
export type Err = string
export type Type = { kind:"unit"} | { kind:"bool"} | { kind:"int"} | { kind:"float"} | { kind:"string"} | { kind:"fun", in:Type, out:Type } | { kind:"obj", inner:Bindings }
                 | { kind:"arr", arg:Type } | { kind:"tuple", args:Array<Type> }
export let unit_type : Type = { kind:"unit" }
export let int_type : Type = { kind:"int" }
export let string_type : Type = { kind:"string" }
export let bool_type : Type = { kind:"bool" }
export let float_type : Type = { kind:"float" }
export let fun_type : (i:Type,o:Type) => Type = (i,o) => ({ kind:"fun", in:i, out:o })
export let tuple_type : (args:Array<Type>) => Type = (args) => ({ kind:"tuple", args:args })
export interface Bindings extends Immutable.Map<Name, Type>  {}
export interface State { highlighting:SourceRange, bindings:Bindings }
export interface Typing { type:Type, sem:Sem.Expr<Sem.Val> }
let mk_typing = (t:Type,s:Sem.Expr<Sem.Val>) : Typing => ({ type:t, sem:s })
let mk_typing_cat = fun2(mk_typing)

export let empty_state : State = { highlighting:{ start:{ row:0, column:0 }, end:{ row:0, column:0 } }, bindings:Immutable.Map<Name, Type>() }

export let load: Fun<Prod<string, State>, Sum<Unit,Type>> = fun(x =>
  x.snd.bindings.has(x.fst) ?
    apply(inr<Unit,Type>(), x.snd.bindings.get(x.fst))
  : apply(inl<Unit,Type>(), {}))
export let store: Fun<Prod<Prod<string, Type>, State>, State> = fun(x =>
    ({...x.snd, bindings:x.snd.bindings.set(x.fst.fst, x.fst.snd) }))

let type_equals = (t1:Type,t2:Type) : boolean =>
  (t1.kind == "fun" && t2.kind == "fun" && type_equals(t1.in,t2.in) && type_equals(t1.out,t2.out))
  || (t1.kind == "tuple" && t2.kind == "tuple" && t1.args.length == t2.args.length && t1.args.every((t1_arg,i) => type_equals(t1_arg, t2.args[i])))
  || (t1.kind == "arr" && t2.kind == "arr" && type_equals(t1.arg,t2.arg))
  || (t1.kind == "obj" && t2.kind == "obj" &&
      !t1.inner.some((v1,k1) => v1 == undefined || k1 == undefined || !t2.inner.has(k1) || !type_equals(t2.inner.get(k1), v1)) &&
      !t2.inner.some((v2,k2) => v2 == undefined || k2 == undefined || !t1.inner.has(k2)))
  || t1.kind == t2.kind

// Basic statements and expressions
let wrap_co_res = Co.value<State,Err,Typing>().then(Co.result<State,Err,Typing>())
let wrap_co = wrap_co_res.then(Co.no_error())
export interface Stmt extends Coroutine<State, Err, Typing> {}
export let get_v = function(v:Name) : Stmt {
  let f = load.then(
    constant<Unit,Err>(`Error: variable ${v} does not exist.`).map_plus(
    (id<Type>().times(constant<Type, Sem.Expr<Sem.Val>>(Sem.get_v(v)))).then(mk_typing_cat)
  ))
  let g = snd<Name,State>().times(f).then(distribute_sum_prod())
  let g1 = g.then(
    (snd<State,Err>()).map_plus(
    (swap_prod<State,Typing>().then(wrap_co_res))
  ))
  let h = apply(curry(g1), v)
  return mk_coroutine<State,Err,Typing>(h)
}
export let decl_v = function(v:Name, t:Type) : Stmt {
  let f = store.then(constant<State, Typing>(mk_typing(unit_type, Sem.done)).times(id())).then(wrap_co)
  let g = curry(f)
  let args = apply(constant<Unit,Name>(v).times(constant<Unit,Type>(t)), {})
  return mk_coroutine<State,Err,Typing>(apply(g, args))

}
export let set_v = function(v:Name, e:Stmt) : Stmt {
  return e.then(e_val =>
         get_v(v).then(v_val =>
         type_equals(e_val.type, v_val.type) ?
           co_unit(mk_typing(unit_type, Sem.set_v_expr(v, e_val.sem)))
         :
           co_error<State,Err,Typing>(`Error: cannot assign ${v} to ${e}: type ${v_val.type} does not match ${e_val.type}`)
         ))
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
             co_unit(mk_typing(bool_type, Sem.int_gt(a_t.sem, b_t.sem)))
            : type_equals(a_t.type, float_type) ?
             co_unit(mk_typing(float_type, Sem.float_gt(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>("Error: unsupported types for operator (>)!")
          : co_error<State,Err,Typing>("Error: cannot sum expressions of different types!")
        ))
}

export let plus = function(a:Stmt, b:Stmt) : Stmt {
  return a.then(a_t =>
         b.then(b_t =>
          type_equals(a_t.type, b_t.type) ?
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(int_type, Sem.int_plus(a_t.sem, b_t.sem)))
            : type_equals(a_t.type, float_type) ?
             co_unit(mk_typing(int_type, Sem.float_plus(a_t.sem, b_t.sem)))
            : type_equals(a_t.type, string_type) ?
             co_unit(mk_typing(string_type, Sem.string_plus(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>("Error: unsupported types for operator (+)!")
          : co_error<State,Err,Typing>("Error: cannot sum expressions of different types!")
        ))
}

export let minus = function(a:Stmt, b:Stmt) : Stmt {
  return a.then(a_t =>
         b.then(b_t =>
          type_equals(a_t.type, b_t.type) ?
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(int_type, Sem.int_minus(a_t.sem, b_t.sem)))
            : type_equals(a_t.type, float_type) ?
             co_unit(mk_typing(float_type, Sem.float_minus(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>("Error: unsupported types for operator (-)!")
          : co_error<State,Err,Typing>("Error: cannot subtract expressions of different types!")
        ))
}

export let div = function(a:Stmt, b:Stmt) : Stmt {
  return a.then(a_t =>
         b.then(b_t =>
          type_equals(a_t.type, b_t.type) ?
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(int_type, Sem.int_div(a_t.sem, b_t.sem)))
            : type_equals(a_t.type, float_type) ?
             co_unit(mk_typing(float_type, Sem.float_div(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>("Error: unsupported types for operator (/)!")
          : co_error<State,Err,Typing>("Error: cannot divide expressions of different types!")
        ))
}

export let times = function(a:Stmt, b:Stmt) : Stmt {
  return a.then(a_t =>
         b.then(b_t =>
          type_equals(a_t.type, b_t.type) ?
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(int_type, Sem.int_times(a_t.sem, b_t.sem)))
            : type_equals(a_t.type, float_type) ?
             co_unit(mk_typing(float_type, Sem.float_times(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>("Error: unsupported types for operator (*)!")
          : co_error<State,Err,Typing>("Error: cannot multiply expressions of different types!")
        ))
}

export let mod = function(a:Stmt, b:Stmt) : Stmt {
  return a.then(a_t =>
         b.then(b_t =>
          type_equals(a_t.type, b_t.type) ?
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(int_type, Sem.int_mod(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>("Error: unsupported types for operator (-)!")
          : co_error<State,Err,Typing>("Error: cannot mod expressions of different types!")
        ))
}

export let minus_unary = function(a:Stmt) : Stmt {
  return a.then(a_t =>
            type_equals(a_t.type, int_type) ?
             co_unit(mk_typing(int_type, Sem.int_minus_unary(a_t.sem)))
            : type_equals(a_t.type, float_type) ?
             co_unit(mk_typing(float_type, Sem.float_minus_unary(a_t.sem)))
            : co_error<State,Err,Typing>("Error: unsupported type for unary operator (-)!")
        )
}

export let or = function(a:Stmt, b:Stmt) : Stmt {
  return a.then(a_t =>
         b.then(b_t =>
          type_equals(a_t.type, b_t.type) && type_equals(a_t.type, bool_type) ?
             co_unit(mk_typing(bool_type, Sem.bool_plus(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>("Error: unsupported types for operator (&&)!")
        ))
}

export let and = function(a:Stmt, b:Stmt) : Stmt {
  return a.then(a_t =>
         b.then(b_t =>
          type_equals(a_t.type, b_t.type) && type_equals(a_t.type, bool_type) ?
             co_unit(mk_typing(bool_type, Sem.bool_times(a_t.sem, b_t.sem)))
            : co_error<State,Err,Typing>("Error: unsupported types for operator (&&)!")
        ))
}

export let not = function(a:Stmt) : Stmt {
  return a.then(a_t =>
            type_equals(a_t.type, bool_type) ?
             co_unit(mk_typing(bool_type, Sem.bool_not(a_t.sem)))
            : co_error<State,Err,Typing>("Error: unsupported type for unary operator (!)!")
        )
}

export let length = function(a:Stmt) : Stmt {
  return a.then(a_t =>
            type_equals(a_t.type, string_type) ?
             co_unit(mk_typing(int_type, Sem.string_length(a_t.sem)))
            : a_t.type.kind == "arr" ?
             co_unit(mk_typing(int_type, a_t.sem.then(a_val => Sem.get_arr_len(a_val))))
            : co_error<State,Err,Typing>("Error: unsupported type for unary operator (-)!")
        )
}

export let get_index = function(a:Stmt, i:Stmt) : Stmt {
  return a.then(a_t =>
         i.then(i_t =>
          a_t.type.kind == "arr" && type_equals(i_t.type, int_type) ?
            co_unit(mk_typing(a_t.type.arg, Sem.get_arr_el_expr(a_t.sem, i_t.sem)))
          : co_error<State,Err,Typing>("Error: unsupported types for array lookup!")
        ))
}

export let set_index = function(a:Stmt, i:Stmt, e:Stmt) : Stmt {
  return a.then(a_t =>
         i.then(i_t =>
         e.then(e_t =>
          a_t.type.kind == "arr" && type_equals(i_t.type, int_type) && type_equals(e_t.type, a_t.type.arg) ?
            co_unit(mk_typing(a_t.type.arg, Sem.set_arr_el_expr(a_t.sem, i_t.sem, e_t.sem)))
          : co_error<State,Err,Typing>("Error: unsupported types for writing in an array!")
        )))
}

// Debugger statements
export let breakpoint = function(r:SourceRange) : Stmt {
  return co_unit(mk_typing(unit_type, Sem.dbg(r)(Sem.unt)))
}

export let highlight : Fun<Prod<SourceRange, State>, State> = fun(x => ({...x.snd, highlighting:x.fst }))
export let set_highlighting = function(r:SourceRange) : Stmt {
  return mk_coroutine(constant<State, SourceRange>(r).times(id<State>()).then(highlight).then(
    constant<State,Typing>(mk_typing(unit_type,Sem.done)).times(id<State>())).then(Co.value<State, Err, Typing>().then(Co.result<State, Err, Typing>().then(Co.no_error<State, Err, Typing>()))))
}

export let typechecker_breakpoint = function(range:SourceRange) : Stmt {
  return semicolon(set_highlighting(range), Co.suspend<State,Err>().then(_ => co_unit<State,Err,Typing>(mk_typing(unit_type,Sem.done))))
}

// Control flow statements
export let done : Stmt = co_unit(mk_typing(unit_type, Sem.done))

export let if_then_else = function(c:Stmt, t:Stmt, e:Stmt) : Stmt {
  return c.then(c_t =>
         c_t.type.kind != "bool" ? co_error<State,Err,Typing>("Error: condition has the wrong type!") :
         t.then(t_t =>
         e.then(e_t =>
         type_equals(t_t.type, unit_type) && type_equals(e_t.type, unit_type) ?
           co_unit(mk_typing(t_t.type,Sem.if_then_else(c_t.sem, t_t.sem, e_t.sem)))
         : co_error<State,Err,Typing>("Error: the branches of a conditional should be of type unit!"))))
}

export let while_do = function(c:Stmt, b:Stmt) : Stmt {
  return c.then(c_t =>
         c_t.type.kind != "bool" ? co_error<State,Err,Typing>("Error: condition has the wrong type!") :
         b.then(t_t =>
         type_equals(t_t.type, unit_type) ?
           co_unit(mk_typing(t_t.type,Sem.while_do(c_t.sem, t_t.sem)))
         : co_error<State,Err,Typing>(`Error: the body of a loop should be of type unit, instead it has type ${JSON.stringify(t_t.type)}`)
         ))
}

export let semicolon = function(p:Stmt, q:Stmt) : Stmt {
  return p.then(p_t =>
         q.then(q_t =>
         co_unit(mk_typing(q_t.type, p_t.sem.then(_ => q_t.sem))
         )))
}

export type Parameter = { name:Name, type:Type }
export let lambda = function(body:Stmt, parameters:Array<Parameter>, closure_parameters:Array<Parameter>) : Stmt {
  let set_bindings = parameters.reduce<Stmt>((acc, par) => semicolon(decl_v(par.name, par.type), acc),
                     closure_parameters.reduce<Stmt>((acc, cp) => semicolon(decl_v(cp.name, cp.type), acc), done))
  return  Co.co_get_state<State,Err>().then(initial_bindings =>
          set_bindings.then(_ =>
          body.then(body_t =>
          Co.co_set_state<State,Err>(initial_bindings).then(_ =>
          co_unit(mk_typing(fun_type(tuple_type(parameters.map(p => p.type)) ,body_t.type), Sem.mk_lambda(body_t.sem, parameters.map(p => p.name), closure_parameters.map(p => p.name))))
          ))))
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
          co_unit(mk_typing(lambda_t.type.out, Sem.call_lambda_expr(lambda_t.sem, args_t.toArray().map(arg_t => arg_t.sem))))
      )
    : co_error<State,Err,Typing>(`Error: cannot invoke non-lambda expression of type ${JSON.stringify(lambda_t.type)}`)
    )
}
