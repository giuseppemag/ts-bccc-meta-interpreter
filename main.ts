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

export module ImpLanguageWithSuspend {
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

  export let ast_to_type_checker : (_:CSharp.ParserRes) => CSharp.Stmt = n =>
    n.ast.kind == "int" ? CSharp.int(n.ast.value)
    : n.ast.kind == "string" ? CSharp.str(n.ast.value)
    : n.ast.kind == ";" ? CSharp.semicolon(ast_to_type_checker(n.ast.l), ast_to_type_checker(n.ast.r))
    : n.ast.kind == "*" ? CSharp.times(ast_to_type_checker(n.ast.l), ast_to_type_checker(n.ast.r), n.range)
    : n.ast.kind == "+" ? CSharp.plus(ast_to_type_checker(n.ast.l), ast_to_type_checker(n.ast.r))
    : n.ast.kind == "id" ? CSharp.get_v(n.ast.value)
    : n.ast.kind == "." && n.ast.r.ast.kind == "id" ? CSharp.field_get(ast_to_type_checker(n.ast.l), n.ast.r.ast.value)
    : n.ast.kind == "=" && n.ast.l.ast.kind == "id" ? CSharp.set_v(n.ast.l.ast.value, ast_to_type_checker(n.ast.r))
    : n.ast.kind == "decl" && n.ast.l.ast.kind == "id" && n.ast.r.ast.kind == "id" ?
      n.ast.l.ast.value == "int" ? CSharp.decl_v(n.ast.r.ast.value, CSharp.int_type)
      : n.ast.l.ast.value == "RenderGrid" ? CSharp.decl_v(n.ast.r.ast.value, CSharp.render_grid_type)
      : n.ast.l.ast.value == "RenderGridPixel" ? CSharp.decl_v(n.ast.r.ast.value, CSharp.render_grid_pixel_type)
      : CSharp.decl_v(n.ast.r.ast.value, CSharp.ref_type(n.ast.l.ast.value))
    : n.ast.kind == "dbg" ?
      CSharp.breakpoint(n.range)(CSharp.done)
    : n.ast.kind == "tc-dbg" ?
      CSharp.typechecker_breakpoint(n.range)(CSharp.done)
    : n.ast.kind == "mk-empty-render-grid" ?
      CSharp.mk_empty_render_grid(ast_to_type_checker(n.ast.w), ast_to_type_checker(n.ast.h))
    : n.ast.kind == "mk-render-grid-pixel" ?
      CSharp.mk_render_grid_pixel(ast_to_type_checker(n.ast.w), ast_to_type_checker(n.ast.h), ast_to_type_checker(n.ast.status))
    : (() => { console.log(`Error: unsupported ast node: ${JSON.stringify(n)}`); throw new Error(`Unsupported ast node: ${JSON.stringify(n)}`)})()


  export type DebuggerStream = ({ kind:"error"|"done" } | { kind:"step", next:() => DebuggerStream }) & { show:() => any }
  export let get_stream = (source:string) : DebuggerStream => {
    let parse_result = CSharp.GrammarBasics.tokenize(source)
    if (parse_result.kind == "left") {
      let error = parse_result.value
      return { kind:"error", show:() => error }
    }

    let tokens = Immutable.List<CSharp.Token>(parse_result.value)
    let res = co_run_to_end(CSharp.program_prs(), tokens)
    if (res.kind != "right") {
      let error = res.value
      return { kind:"error", show:() => error }
    }

    let p = ast_to_type_checker(res.value.fst)

    let runtime_stream = (state:Prod<Py.Stmt,Py.Mem>) : DebuggerStream => ({
      kind:"step",
      next:() => {
        let p = state.fst
        let s = state.snd
        let k = apply(p.run, s)
        if (k.kind == "left") {
          let error = k.value
          return { kind:"error", show:() => error }
        }
        if (k.value.kind == "left") {
          return runtime_stream(k.value.value)
        }
        s = k.value.value.snd
        return { kind:"done", show:() => s }
      },
      show:() => state.snd
    })

    let typechecker_stream = (state:Prod<CSharp.Stmt,CSharp.State>) : DebuggerStream => ({
      kind:"step",
      next:() => {
        let p = state.fst
        let s = state.snd
        let k = apply(p.run, s)
        if (k.kind == "left") {
          let error = k.value
          return { kind:"error", show:() => error }
        }
        if (k.value.kind == "left") {
          return typechecker_stream(k.value.value)
        }
        let initial_runtime_state = apply(constant<Unit,Py.Stmt>(k.value.value.fst.sem).times(constant<Unit,Py.Mem>(Py.empty_memory)), {})
        return runtime_stream(initial_runtime_state)
      },
      show:() => state.snd
    })

    let initial_compiler_state = apply(constant<Unit,CSharp.Stmt>(p).times(constant<Unit,CSharp.State>(CSharp.empty_state)), {})
    return typechecker_stream(initial_compiler_state)
  }

  export let test_parser = () => {
    let source = `
RenderGrid g;
g = empty_render_grid 16 16;
typechecker_debugger;
int x;
x = 0;
debugger;
x = x + 2;
debugger;
x = x * 3;
g = g + pixel 5 5 1;
`
    let parse_result = CSharp.GrammarBasics.tokenize(source)
    if (parse_result.kind == "left") return parse_result.value

    let tokens = Immutable.List<CSharp.Token>(parse_result.value)
    // console.log(JSON.stringify(tokens.toArray()))
    let res = CSharp.program_prs().run.f(tokens)
    if (res.kind != "right" || res.value.kind != "right") return `Parse error: ${res.value}`

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
      log(`Timer: ${time_in_ns / 1000000}ms\n Compiler result: `, JSON.stringify(compiler_res.value.snd.bindings))
      log(`Runtime result: `, JSON.stringify(runtime_res))
    }
    return output
  }

}

// console.log(ImpLanguageWithSuspend.test_imp())
console.log(ImpLanguageWithSuspend.test_parser())
