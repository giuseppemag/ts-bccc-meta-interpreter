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
         get_heap_v, get_v, pop_scope, push_scope } from "./Python/memory"
import { bool_to_boolcat, BoolCat, FalseCat, TrueCat, bool_plus, bool_times, float_div, float_expr, float_minus, float_plus, float_times,
         int_div, int_minus, int_plus, int_times, int_mod, bool_not,
         arr_expr, int_expr, lambda_expr, obj_expr, ref_expr, bool_expr,
         str_expr, unit_expr, val_expr } from "./Python/expressions"
import { done, dbg, if_then_else, while_do } from "./Python/basic_statements"
import { call_by_name, call_lambda, def_fun, ret } from "./Python/functions"
import { call_cons, call_method, declare_class, field_get, field_set, resolve_method } from "./Python/classes"
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
      set_v("i", int(100)).then(_ =>
      while_do(get_v("i").then(n => bool_expr(n.v > 0)),
        get_v("i").then(n => n.k == "i" ? set_v("i", int(n.v - 1)) : runtime_error(`${n.v} is not a number`)).then(_ =>
        get_v("s").then(s => s.k == "s" ? set_v("s", str(s.v + "*")) : runtime_error(`${s.v} is not a string`))
      ))))

    let arr_test =
      new_arr(10).then(a_ref =>
      set_v("a", a_ref).then(_ =>
      set_v("i", int(0)).then(_ =>
      get_arr_len(a_ref).then(a_len => a_len.k != "i" ? runtime_error(`${a_len.v} is not a number`) :
      while_do(get_v("i").then(i_val => bool_expr(i_val.v < a_len.v)),
        get_v("i").then(i_val => i_val.k != "i" ? runtime_error(`${i_val.v} is not a number`) :
        set_arr_el(a_ref, i_val.v, int(i_val.v * 2)).then(_ =>
        set_v("i", int(i_val.v + 1)).then(_ =>
        dbg(mk_range(9,0,10,0))(unt)
        ))))))))

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
              { fst:get_v("this").then(this_addr =>
                    get_v("k").then(k_val =>
                    this_addr.k != "ref" || k_val.k != "i" ? runtime_error(`runtime type error`) :
                    field_get("x", this_addr).then(x_val =>
                    x_val.k != "i" ? runtime_error(`runtime type error`) :
                    field_get("y", this_addr).then(y_val =>
                    y_val.k != "i" ? runtime_error(`runtime type error`) :
                    dbg(mk_range(6,0,7,0))({}).then(_ =>
                    field_set("x", val_expr(int(x_val.v * k_val.v)), this_addr).then(_ =>
                    dbg(mk_range(6,0,7,0))({}).then(_ =>
                    field_set("y", val_expr(int(y_val.v * k_val.v)), this_addr).then(_ =>
                    dbg(mk_range(6,0,7,0))({}).then(_ =>
                    unit_expr()
                    ))))))))),
                snd:["k", "this"] } ],
            [ "constructor",
              { fst:get_v("this").then(this_addr =>
                    this_addr.k != "ref" ? runtime_error(`runtime type error`) :
                    get_v("x").then(x_val =>
                    x_val.k != "i" ? runtime_error(`runtime type error`) :
                    get_v("y").then(y_val =>
                    y_val.k != "i" ? runtime_error(`runtime type error`) :
                    field_set("x", val_expr(x_val), this_addr).then(_ =>
                    field_set("y", val_expr(y_val), this_addr).then(_ =>
                    unit_expr()
                    ))))),
                snd:["x", "y", "this"] }]
          ])
      }
    let class_test =
      declare_class("Vector2", vector2).then(_ =>
      call_cons("Vector2", [int_expr(10), int_expr(20)]).then(v2 =>
      set_v("v2", v2).then(_ =>
      call_method("scale", v2, [int_expr(2)]).then(_ =>
      call_method("to_string", v2, []).then(v2_s =>
      set_v("v2_s", v2_s).then(_ =>
      done
      ))))))


    let hrstart = process.hrtime()
    let p = loop_test

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
