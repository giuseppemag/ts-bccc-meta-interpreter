import * as Immutable from "immutable"
import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair } from "ts-bccc"
import * as CCC from "ts-bccc"
import * as St from "ts-bccc"
import { mk_state, State } from "ts-bccc"
import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
import * as Co from "ts-bccc"
import { Stmt, Expr, Interface, Mem, Err, Val, Lambda, Bool,
         Name, HeapRef, set_arr_el, set_arr_el_expr, set_class_def, set_fun_def, set_heap_v, set_v, set_v_expr, set_highlighting,
         runtime_error,
         bool, int, float, lambda, new_arr, new_obj, arr,
         ArrayVal, empty_memory, empty_scope, heap_alloc, highlight,
         init_array_val, load, load_class_def, load_fun_def,
         load_heap, obj, ref, Scope,
         store, store_class_def, store_fun_def, store_heap, str,
         unt, get_arr_len, get_arr_el, get_class_def, get_fun_def,
         get_heap_v, get_v, pop_scope, push_scope, get_arr_el_expr, get_arr_len_expr } from "./Python/memory"
import { bool_to_boolcat, BoolCat, FalseCat, TrueCat, bool_plus, bool_times, float_div, float_expr, float_minus, float_plus, float_times,
         int_div, int_minus, int_plus, int_times, int_mod, bool_not,
         arr_expr, int_expr, lambda_expr, obj_expr, ref_expr, bool_expr,
         str_expr, unit_expr, val_expr, int_geq, string_plus, int_eq, int_lt } from "./Python/expressions"
import { done, dbg, if_then_else, while_do } from "./Python/basic_statements"
import { call_by_name, call_lambda, def_fun, ret } from "./Python/functions"
import { call_cons, call_method, declare_class, field_get, field_set, resolve_method, field_set_expr, field_get_expr, call_method_expr } from "./Python/classes"
import { mk_range } from "./source_range";

module ImpLanguageWithSuspend {
  let run_to_end = <S,E,A>() : CCC.Fun<Prod<Coroutine<S,E,A>, S>, CCC.Sum<E,CCC.Prod<A,S>>> => {
      let f : CCC.Fun<Prod<Coroutine<S,E,A>, S>, CCC.Sum<E,CCC.Prod<A,S>>> =
          CCC.fun(p => run_to_end<S,E,A>().f(p))
      return (co_run<S,E,A>().map_times(fun<S,S>(s => console.log("Intermediate step:", JSON.stringify(s)) ||
                s))).then(CCC.apply_pair<S, Co.CoPreRes<S,E,A>>()).then(
                CCC.inl<E,CCC.Prod<A,S>>().plus(
                  f.plus(CCC.inr<E,CCC.Prod<A,S>>())))
  }

export let test_imp = function () {

    let loop_test =
      set_v("s", str("")).then(_ =>
      set_v("i", int(20)).then(_ =>
      while_do(int_geq(get_v("i"), int_expr(0)),
        set_v_expr("i", int_minus(get_v("i"), int_expr(1))).then(_ =>
        set_v_expr("s", string_plus(get_v("s"), str_expr("*"))).then(_ =>
        if_then_else(int_eq(int_mod(get_v("i"), int_expr(5)), int_expr(0)),
          dbg(mk_range(9,0,10,0))(unt),
          done)
      )))
    ))

    let arr_test =
      set_v_expr("a", new_arr(10)).then(_ =>
      set_v("i", int(0)).then(_ =>
      while_do(int_lt(get_v("i"), get_arr_len_expr(get_v("a")))  , // get_v("i").then(i_val => bool_expr(i_val.v < a_len.v)),
        get_v("i").then(i_val => i_val.k != "i" ? runtime_error(`${i_val.v} is not a number`) :
        set_arr_el_expr(get_v("a"), get_v("i"), int_times(get_v("i"), int_expr(2))).then(_ =>
        set_v_expr("i", int_plus(get_v("i"), int_expr(1))).then(_ =>
        dbg(mk_range(9,0,10,0))(unt)
        ))))))

    let lambda_test =
      set_v("i", int(10)).then(_ =>
      call_lambda(
        { fst: dbg(mk_range(6,0,7,0))({}).then(_ => int_expr(1)), snd:["i"] },
        [int_expr(5)]).then(res =>
          dbg(mk_range(6,0,7,0))({})
      ))

    let fun_test =
      def_fun("f", dbg(mk_range(1,0,2,0))({}).then(_ => ret(int_expr(1)).then(dbg(mk_range(2,0,3,0)))), []).then(_ =>
      def_fun("g", dbg(mk_range(3,0,4,0))({}).then(_ => ret(int_expr(2)).then(dbg(mk_range(4,0,5,0)))), []).then(_ =>
      call_by_name("g", []).then(v =>
      dbg(mk_range(6,0,7,0))({}).then(_ =>
      set_v("i", v)
      ))))

    let vector2:Interface =
      {
        base:apply(inl<Interface, Unit>(),
          {
            base:apply(inr<Interface, Unit>(), {}),
            methods:
              Immutable.Map<Name, Lambda>([
                [ "to_string",
                  { fst:get_v("this").then(this_addr =>
                        this_addr.k != "ref" ? runtime_error(`"this" is not a reference when calling to_string`) :
                        field_get("x", this_addr).then(x_val =>
                        x_val.k != "i" ? runtime_error(`${x_val.v} is not a number`) :
                        field_get("y", this_addr).then(y_val =>
                        y_val.k != "i" ? runtime_error(`${y_val.v} is not a number`) :
                        str_expr(`(${x_val.v}, ${y_val.v})`)
                        ))),
                    snd:["this"] } ]
              ])
          }
        ),
        methods:
          Immutable.Map<Name, Lambda>([
            [ "scale",
              { fst:field_set_expr("x", int_times(field_get_expr("x", get_v("this")), get_v("k")), get_v("this")).then(_ =>
                    dbg(mk_range(6,0,7,0))(unt).then(_ =>
                    field_set_expr("y", int_times(field_get_expr("y", get_v("this")), get_v("k")), get_v("this")).then(_ =>
                    dbg(mk_range(6,0,7,0))(unt)
                    ))),
                snd:["k", "this"] } ],
            [ "constructor",
              { fst:field_set_expr("x", get_v("x"), get_v("this")).then(_ =>
                    field_set_expr("y", get_v("y"), get_v("this")).then(_ =>
                    unit_expr()
                    )),
                snd:["x", "y", "this"] }]
          ])
      }
    let class_test =
      declare_class("Vector2", vector2).then(_ =>
      call_cons("Vector2", [int_expr(10), int_expr(20)]).then(v2 =>
      set_v("v2", v2).then(_ =>
      call_method_expr("scale", get_v("v2"), [int_expr(2)]).then(_ =>
      set_v_expr("v2_s", call_method_expr("to_string", get_v("v2"), []))
      ))))


    let hrstart = process.hrtime()
    let p = class_test

    let res = apply((constant<Unit,Stmt>(p).times(constant<Unit,Mem>(empty_memory))).then(run_to_end()), {})
    let hrdiff = process.hrtime(hrstart)
    let time_in_ns = hrdiff[0] * 1e9 + hrdiff[1]
    console.log(`Timer: ${time_in_ns / 1000000}ms\n Result: `, JSON.stringify(res))
  }
}

ImpLanguageWithSuspend.test_imp()

// let incr = CCC.fun<number,number>(x => x + 1)
// let double = CCC.fun<number,number>(x => x * 2)
// console.log(CCC.apply(incr.then(double), 5))
// console.log(CCC.apply(incr.map_times(double), CCC.mk_pair<number,number>(5)(2)))
// console.log(CCC.apply(incr.map_plus(double), CCC.inl<number,number>().f(5)))
// console.log(CCC.apply(incr.plus(double), CCC.inr<number,number>().f(4)))
