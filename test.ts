import * as Immutable from "immutable"
import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair } from "ts-bccc"
import * as CCC from "ts-bccc"
import * as St from "ts-bccc"
import { mk_state, State } from "ts-bccc"
import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
import * as Co from "ts-bccc"
import { mk_range, zero_range } from "./source_range";

import * as Py from "./Python/python"
import * as CSharp from "./CSharpTypeChecker/csharp"
import { co_run_to_end } from "./ccc_aux";
import { ast_to_type_checker } from "./CSharpTypeChecker/csharp";
import * as DebuggerStream from "./csharp_debugger_stream"

export module ImpLanguageWithSuspend {
  let run_to_end = <S,E,A>() : CCC.Fun<Prod<Coroutine<S,E,A>, S>, CCC.Sum<E,CCC.Prod<A,S>>> => {
      let f : CCC.Fun<Prod<Coroutine<S,E,A>, S>, CCC.Sum<E,CCC.Prod<A,S>>> =
          CCC.fun(p => run_to_end<S,E,A>().f(p))
      return (co_run<S,E,A>().map_times(fun<S,S>(s => console.log("Intermediate step:", JSON.stringify(s)) ||
                s))).then(CCC.apply_pair<S, Co.CoPreRes<S,E,A>>()).then(
                CCC.inl<E,CCC.Prod<A,S>>().plus(
                  f.plus(CCC.inr<E,CCC.Prod<A,S>>())))
  }

export let get_stream = DebuggerStream.get_stream

export let test_imp = function () {
  let loop_test =
    CSharp.semicolon(CSharp.decl_v("s", CSharp.string_type),
    CSharp.semicolon(CSharp.typechecker_breakpoint(mk_range(0,0,10,10))(CSharp.done),
    CSharp.semicolon(CSharp.decl_v("i", CSharp.int_type),
    CSharp.semicolon(CSharp.set_v("s", CSharp.str("")),
    CSharp.semicolon(CSharp.set_v("i", CSharp.int(20)),
    CSharp.semicolon(CSharp.typechecker_breakpoint(mk_range(0,0,10,10))(CSharp.done),
    CSharp.while_do(CSharp.gt(CSharp.get_v("i"), CSharp.int(0)),
      CSharp.semicolon(CSharp.set_v("i", CSharp.minus(CSharp.get_v("i"), CSharp.int(1))),
      CSharp.semicolon(CSharp.set_v("s", CSharp.plus(CSharp.get_v("s"), CSharp.str("*"))),
      CSharp.breakpoint(mk_range(0,0,10,10))(CSharp.done)
      ))
    )))))))

    let arr_test =
      CSharp.semicolon(CSharp.decl_v("a", CSharp.arr_type(CSharp.int_type)),
      CSharp.semicolon(CSharp.set_v("a", CSharp.new_array(CSharp.int_type, CSharp.int(10))),
      CSharp.semicolon(CSharp.decl_v("i", CSharp.int_type),
      CSharp.semicolon(CSharp.set_v("i", CSharp.int(0)),
      CSharp.semicolon(CSharp.typechecker_breakpoint(mk_range(0,0,0,0))(CSharp.done),
      CSharp.while_do(CSharp.lt(CSharp.get_v("i"), CSharp.get_arr_len(CSharp.get_v("a"))),
        CSharp.semicolon(CSharp.set_arr_el(CSharp.get_v("a"), CSharp.get_v("i"), CSharp.times(CSharp.get_v("i"), CSharp.int(2), zero_range)),
        CSharp.semicolon(CSharp.set_v("i", CSharp.plus(CSharp.get_v("i"), CSharp.int(1))),
        //CSharp.breakpoint(mk_range(1,1,1,1))(
          CSharp.done
        //)
        )))
      )))))

  let lambda_test =
    CSharp.semicolon(CSharp.decl_v("i", CSharp.int_type),
    CSharp.semicolon(CSharp.decl_v("x", CSharp.int_type),
    CSharp.semicolon(CSharp.decl_v("y", CSharp.int_type),
    CSharp.semicolon(CSharp.set_v("i", CSharp.int(10)),
    CSharp.semicolon(CSharp.set_v("x", CSharp.int(1)),
    CSharp.semicolon(CSharp.set_v("y", CSharp.call_lambda(
        CSharp.breakpoint(mk_range(0,0,0,0))(
          CSharp.mk_lambda({
            body:CSharp.breakpoint(mk_range(1,1,1,1))(CSharp.ret(CSharp.plus(CSharp.get_v("i"), CSharp.get_v("x")))),
            parameters: [CSharp.mk_param("i", CSharp.int_type)],
            return_t: CSharp.int_type
          }, ["x"])),
        [CSharp.int(5)]
      )),
    CSharp.done
    ))))))

    let fun_test =
      CSharp.semicolon(CSharp.decl_v("x", CSharp.int_type),
      CSharp.semicolon(CSharp.decl_v("y", CSharp.int_type),
      CSharp.semicolon(CSharp.set_v("x", CSharp.int(2)),
      CSharp.semicolon(CSharp.set_v("y", CSharp.int(5)),
      CSharp.semicolon(CSharp.def_fun({ name:"f",
        body:(CSharp.ret(CSharp.plus(CSharp.get_v("i"), CSharp.get_v("x")))),
        parameters:[CSharp.mk_param("i", CSharp.int_type)],
        return_t:CSharp.int_type }, ["x"]),
      CSharp.semicolon(CSharp.def_fun({ name:"g",
        body:(CSharp.ret(CSharp.times(CSharp.get_v("j"), CSharp.get_v("x"), zero_range))),
        parameters:[CSharp.mk_param("j", CSharp.int_type)],
        return_t:CSharp.int_type }, ["x"]),
      CSharp.semicolon(CSharp.breakpoint(mk_range(3,0,4,0))(CSharp.done),
      CSharp.semicolon(CSharp.set_v("x", CSharp.call_by_name("f", [CSharp.get_v("y")])),
      CSharp.semicolon(CSharp.breakpoint(mk_range(4,0,5,0))(CSharp.done),
      CSharp.set_v("x", CSharp.call_by_name("g", [CSharp.get_v("y")]))
      )))))))))

      let class_test =
        CSharp.semicolon(CSharp.def_class("Vector2",
          [{
            name:"Vector2",
            body:CSharp.semicolon(CSharp.field_set(CSharp.get_v("this"), "X", CSharp.get_v("x")),
                 CSharp.semicolon(CSharp.field_set(CSharp.get_v("this"), "Y", CSharp.get_v("y")),
                 CSharp.done)),
            parameters:[{ name:"x", type:CSharp.int_type},
                        { name:"y", type:CSharp.int_type}],
            return_t:CSharp.unit_type
          },
          {
            name:"Scale",
            body:CSharp.semicolon(CSharp.field_set(CSharp.get_v("this"), "X", CSharp.times(CSharp.field_get(CSharp.get_v("this"), "X"), CSharp.get_v("k"), zero_range)),
                 CSharp.semicolon(CSharp.field_set(CSharp.get_v("this"), "Y", CSharp.times(CSharp.field_get(CSharp.get_v("this"), "Y"), CSharp.get_v("k"), zero_range)),
                 CSharp.done)),
            parameters:[{ name:"k", type:CSharp.int_type}],
            return_t:CSharp.unit_type
          }],
          [{ name:"X", type:CSharp.int_type},
           { name:"Y", type:CSharp.int_type}]),
        CSharp.semicolon(CSharp.decl_v("v2", CSharp.ref_type("Vector2")),
        CSharp.semicolon(CSharp.set_v("v2", CSharp.call_cons("Vector2", [CSharp.int(10), CSharp.int(20)])),
        CSharp.semicolon(CSharp.call_method(CSharp.get_v("v2"), "Scale", [CSharp.int(2)]),
        CSharp.done))))

    let hrstart = process.hrtime()
    let p = class_test

    let output = ""
    let log = function(s:string,x:any) {
      output = output + s + JSON.stringify(x) + "\n\n"
    }

    let compiler_res = apply((constant<Unit,CSharp.Stmt>(p).times(constant<Unit,CSharp.State>(CSharp.empty_state))).then(run_to_end()), {})
    if (compiler_res.kind == "left") {
      let hrdiff = process.hrtime(hrstart)
      let time_in_ns = hrdiff[0] * 1e9 + hrdiff[1]
      log(`Timer: ${time_in_ns / 1000000}ms\n Compiler error: `, JSON.stringify(compiler_res.value))

    } else {
      let runtime_res = apply((constant<Unit,Py.Stmt>(compiler_res.value.fst.sem).times(constant<Unit,Py.Mem>(Py.empty_memory))).then(run_to_end()), {})
      let hrdiff = process.hrtime(hrstart)
      let time_in_ns = hrdiff[0] * 1e9 + hrdiff[1]
      log(`Timer: ${time_in_ns / 1000000}ms\n Compiler result: `, JSON.stringify(compiler_res.value.snd.bindings))
      log(`Runtime result: `, JSON.stringify(runtime_res))
    }
    return output
  }

  export let test_parser = () => {
    let source = `
    bool x;
    x = false ^ false;
   
`
    let parse_result = CSharp.GrammarBasics.tokenize(source)
    if (parse_result.kind == "left") return parse_result.value

    let tokens = Immutable.List<CSharp.Token>(parse_result.value)
    console.log(JSON.stringify(tokens.toArray())) // tokens
    let res = CSharp.program_prs().run.f(tokens)
    if (res.kind != "right" || res.value.kind != "right") return `Parse error: ${res.value}`

    console.log(JSON.stringify(res.value.value.fst)) // ast
    let hrstart = process.hrtime()
    let p = ast_to_type_checker(res.value.value.fst)

    let output = ""
    let log = function(s:string,x:any) {
      output = output + s + JSON.stringify(x) + "\n\n"
    }

    let compiler_res = apply((constant<Unit,CSharp.Stmt>(p).times(constant<Unit,CSharp.State>(CSharp.empty_state))).then(run_to_end()), {})
    if (compiler_res.kind == "left") {
      let hrdiff = process.hrtime(hrstart)
      let time_in_ns = hrdiff[0] * 1e9 + hrdiff[1]
      log(`Timer: ${time_in_ns / 1000000}ms\n Compiler error: `, JSON.stringify(compiler_res.value))

    } else {
      let runtime_res = apply((constant<Unit,Py.Stmt>(compiler_res.value.fst.sem).times(constant<Unit,Py.Mem>(Py.empty_memory))).then(run_to_end()), {})
      let hrdiff = process.hrtime(hrstart)
      let time_in_ns = hrdiff[0] * 1e9 + hrdiff[1]
      log(`Compiler result: `, JSON.stringify(compiler_res.value.snd.bindings))
      log(`Runtime result: `, JSON.stringify(runtime_res))
      log(`Timer: ${time_in_ns / 1000000}ms\n `, "")
    }
    return output
  }

}

// console.log(ImpLanguageWithSuspend.test_imp())
console.log(ImpLanguageWithSuspend.test_parser())
