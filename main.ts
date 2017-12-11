import * as Immutable from "immutable"
import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair } from "ts-bccc"
import * as CCC from "ts-bccc"
import * as St from "ts-bccc"
import { mk_state, State } from "ts-bccc"
import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
import * as Co from "ts-bccc"
import { mk_range } from "./source_range";

import * as Py from "./Python/python"
import * as CSharp from "./CSharpTypeChecker/csharp"

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

    let loop_test_compiler =
      CSharp.semicolon(CSharp.decl_v("s", CSharp.string_type),
      CSharp.semicolon(CSharp.typechecker_breakpoint(mk_range(0,0,10,10)),
      CSharp.semicolon(CSharp.decl_v("i", CSharp.int_type),
      CSharp.semicolon(CSharp.set_v("s", CSharp.str("")),
      CSharp.semicolon(CSharp.set_v("i", CSharp.int(20)),
      CSharp.semicolon(CSharp.typechecker_breakpoint(mk_range(0,0,10,10)),
      CSharp.while_do(CSharp.gt(CSharp.get_v("i"), CSharp.int(0)),
        CSharp.semicolon(CSharp.set_v("i", CSharp.minus(CSharp.get_v("i"), CSharp.int(1))),
        CSharp.semicolon(CSharp.set_v("s", CSharp.plus(CSharp.get_v("s"), CSharp.str("*"))),
        CSharp.breakpoint(mk_range(0,0,10,10))
        //CSharp.done
        ))
      )))))))

    // let arr_test =
    //   set_v_expr("a", new_arr(10)).then(_ =>
    //   set_v("i", int(0)).then(_ =>
    //   while_do(int_lt(get_v("i"), get_arr_len_expr(get_v("a")))  , // get_v("i").then(i_val => bool_expr(i_val.v < a_len.v)),
    //     get_v("i").then(i_val => i_val.k != "i" ? runtime_error(`${i_val.v} is not a number`) :
    //     set_arr_el_expr(get_v("a"), get_v("i"), int_times(get_v("i"), int_expr(2))).then(_ =>
    //     set_v_expr("i", int_plus(get_v("i"), int_expr(1))).then(_ =>
    //     dbg(mk_range(9,0,10,0))(unt)
    //     ))))))

    let lambda_test =
      Py.set_v("i", Py.int(10)).then(_ =>
      Py.call_lambda(
        { body: Py.dbg(mk_range(6,0,7,0))({}).then(_ => Py.ret(Py.int_plus(Py.get_v("i"), Py.int_expr(1))).then(Py.dbg(mk_range(2,0,3,0)))), parameters:["i"], closure:Py.empty_scope },
        [Py.int_expr(5)]).then(res =>
          Py.dbg(mk_range(6,0,7,0))(Py.unt)
      ))

    // let fun_test =
    //   def_fun("f", dbg(mk_range(1,0,2,0))({}).then(_ => ret(int_expr(1)).then(dbg(mk_range(2,0,3,0)))), []).then(_ =>
    //   def_fun("g", dbg(mk_range(3,0,4,0))({}).then(_ => ret(int_expr(2)).then(dbg(mk_range(4,0,5,0)))), []).then(_ =>
    //   call_by_name("g", []).then(v =>
    //   dbg(mk_range(6,0,7,0))({}).then(_ =>
    //   set_v("i", v)
    //   ))))

    // let vector2:Interface =
    //   {
    //     base:apply(inl<Interface, Unit>(),
    //       {
    //         base:apply(inr<Interface, Unit>(), {}),
    //         methods:
    //           Immutable.Map<Name, Lambda>([
    //             [ "to_string",
    //               { fst:get_v("this").then(this_addr =>
    //                     this_addr.k != "ref" ? runtime_error(`"this" is not a reference when calling to_string`) :
    //                     field_get("x", this_addr).then(x_val =>
    //                     x_val.k != "i" ? runtime_error(`${x_val.v} is not a number`) :
    //                     field_get("y", this_addr).then(y_val =>
    //                     y_val.k != "i" ? runtime_error(`${y_val.v} is not a number`) :
    //                     str_expr(`(${x_val.v}, ${y_val.v})`)
    //                     ))),
    //                 snd:["this"] } ]
    //           ])
    //       }
    //     ),
    //     methods:
    //       Immutable.Map<Name, Lambda>([
    //         [ "scale",
    //           { fst:field_set_expr("x", int_times(field_get_expr("x", get_v("this")), get_v("k")), get_v("this")).then(_ =>
    //                 dbg(mk_range(6,0,7,0))(unt).then(_ =>
    //                 field_set_expr("y", int_times(field_get_expr("y", get_v("this")), get_v("k")), get_v("this")).then(_ =>
    //                 dbg(mk_range(6,0,7,0))(unt)
    //                 ))),
    //             snd:["k", "this"] } ],
    //         [ "constructor",
    //           { fst:field_set_expr("x", get_v("x"), get_v("this")).then(_ =>
    //                 field_set_expr("y", get_v("y"), get_v("this")).then(_ =>
    //                 unit_expr()
    //                 )),
    //             snd:["x", "y", "this"] }]
    //       ])
    //   }
    // let class_test =
    //   declare_class("Vector2", vector2).then(_ =>
    //   call_cons("Vector2", [int_expr(10), int_expr(20)]).then(v2 =>
    //   set_v("v2", v2).then(_ =>
    //   call_method_expr("scale", get_v("v2"), [int_expr(2)]).then(_ =>
    //   set_v_expr("v2_s", call_method_expr("to_string", get_v("v2"), []))
    //   ))))


    let hrstart = process.hrtime()
    let p = loop_test_compiler

    let compiler_res = apply((constant<Unit,CSharp.Stmt>(p).times(constant<Unit,CSharp.State>(CSharp.empty_state))).then(run_to_end()), {})
    if (compiler_res.kind == "left") {
      let hrdiff = process.hrtime(hrstart)
      let time_in_ns = hrdiff[0] * 1e9 + hrdiff[1]
      console.log(`Timer: ${time_in_ns / 1000000}ms\n Compiler error: `, JSON.stringify(compiler_res.value))

    } else {
      let runtime_res = apply((constant<Unit,Py.Stmt>(compiler_res.value.fst.sem).times(constant<Unit,Py.Mem>(Py.empty_memory))).then(run_to_end()), {})
      let hrdiff = process.hrtime(hrstart)
      let time_in_ns = hrdiff[0] * 1e9 + hrdiff[1]
      console.log(`Timer: ${time_in_ns / 1000000}ms\n Compiler result: `, JSON.stringify(compiler_res.value.snd.bindings))
      console.log(`Runtime result: `, JSON.stringify(runtime_res))
    }
  }
}

ImpLanguageWithSuspend.test_imp()
