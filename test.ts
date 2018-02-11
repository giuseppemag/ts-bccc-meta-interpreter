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
import { mk_parser_state, global_calling_context } from "./CSharpTypeChecker/grammar";
import { CallingContext } from "./main";

export module ImpLanguageWithSuspend {
  let run_to_end = <S,E,A>(log:(s:string,x:any) => void) : CCC.Fun<Prod<Coroutine<S,E,A>, S>, CCC.Sum<E,CCC.Prod<A,S>>> => {
      let f : CCC.Fun<Prod<Coroutine<S,E,A>, S>, CCC.Sum<E,CCC.Prod<A,S>>> =
          CCC.fun(p => run_to_end<S,E,A>(log).f(p))
      return (co_run<S,E,A>().map_times(fun<S,S>(s => log("Intermediate step:", JSON.stringify(s)) ||
                s))).then(CCC.apply_pair<S, Co.CoPreRes<S,E,A>>()).then(
                CCC.inl<E,CCC.Prod<A,S>>().plus(
                  f.plus(CCC.inr<E,CCC.Prod<A,S>>())))
  }

export let get_stream = DebuggerStream.get_stream

export let test_parser = () => {
    let source = `
Func<int, Func<int,int>> f = x => (y => x + y);

var g = f(10);
var z = g(2);
var w = g(3);

int hof(Func<int,int> h) {
  return h(2);
}

var p = hof(g);

(string,string,(string,Func<int,Func<int,int>>)) v = ("Hello", "world", ("!",(x => (y => x * y))));
var h = v.Item3.Item2;
var whoa = h(2);
var wwhoa = whoa(3);

Func<(string,string),string> fst = p => p.Item1;
var a = fst(("first item", "second item"));
`
    let parse_result = CSharp.GrammarBasics.tokenize(source)
    if (parse_result.kind == "left") return parse_result.value

    let tokens = Immutable.List<CSharp.Token>(parse_result.value)
    // console.log(JSON.stringify(tokens.toArray())) // tokens
    let res = CSharp.program_prs().run.f(mk_parser_state(tokens))
    if (res.kind != "right" || res.value.kind != "right") return `Parse error: ${JSON.stringify(res.value)}`

    // console.log(JSON.stringify(res.value.value.fst)) // ast
    let hrstart = process.hrtime()
    let p = ast_to_type_checker(res.value.value.fst)(global_calling_context)

    let output = ""
    let log = function(s:string,x:any) {
      output = output + s + JSON.stringify(x) + "\n\n"
    }

    // log("\n\nStarting typechecking\n\n", {})
    let compiler_res = apply((constant<Unit,Coroutine<CSharp.State, CSharp.Err, CSharp.Typing>>(p(CSharp.no_constraints)).times(constant<Unit,CSharp.State>(CSharp.empty_state))).then(run_to_end(log)), {})
    if (compiler_res.kind == "left") {
      let hrdiff = process.hrtime(hrstart)
      let time_in_ns = hrdiff[0] * 1e9 + hrdiff[1]
      log(`Timer: ${time_in_ns / 1000000}ms\n Compiler error: `, JSON.stringify(compiler_res.value))

    } else {
      log(`Compiler result: `, JSON.stringify(compiler_res.value.snd.bindings))
      // log("\n\nStarting runtime\n\n", "")
      let runtime_res = apply((constant<Unit,Py.StmtRt>(compiler_res.value.fst.sem).times(constant<Unit,Py.MemRt>(Py.empty_memory_rt))).then(run_to_end(log)), {})
      let hrdiff = process.hrtime(hrstart)
      let time_in_ns = hrdiff[0] * 1e9 + hrdiff[1]
      log(`Runtime result: `, JSON.stringify(runtime_res))
      log(`Timer: ${time_in_ns / 1000000}ms\n `, "")
    }
    return output
  }

}

// console.log(ImpLanguageWithSuspend.test_imp())
console.log(ImpLanguageWithSuspend.test_parser())
