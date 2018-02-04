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
  let run_to_end = <S,E,A>() : CCC.Fun<Prod<Coroutine<S,E,A>, S>, CCC.Sum<E,CCC.Prod<A,S>>> => {
      let f : CCC.Fun<Prod<Coroutine<S,E,A>, S>, CCC.Sum<E,CCC.Prod<A,S>>> =
          CCC.fun(p => run_to_end<S,E,A>().f(p))
      return (co_run<S,E,A>().map_times(fun<S,S>(s => console.log("Intermediate step:", JSON.stringify(s)) ||
                s))).then(CCC.apply_pair<S, Co.CoPreRes<S,E,A>>()).then(
                CCC.inl<E,CCC.Prod<A,S>>().plus(
                  f.plus(CCC.inr<E,CCC.Prod<A,S>>())))
  }

export let get_stream = DebuggerStream.get_stream

export let test_parser = () => {
    let source = `
class A {
  static public int s_x;
  static public void incr() {
    A.s_x = A.s_x + 1;
  }

  private int x;

  public A(int x) {
    this.x = x;
    while (x > 0) {
      x = x - 1;
    }
  }

  public void scale(int k) {
    this.x = this.get_x() * k;
  }

  public int get_x() {
    return this.x;
  }
}

class B {
  public A a;

  public B() {
    this.a = new A(10);
  }
}

A.s_x = 100;
var z = A.s_x;
B b = new B();
b.a.scale(2);
A.incr();

int f(int x) {
  return x + A.s_x;
}

Func<int, int> g = f;

z = g(10);
`
    let parse_result = CSharp.GrammarBasics.tokenize(source)
    if (parse_result.kind == "left") return parse_result.value

    let tokens = Immutable.List<CSharp.Token>(parse_result.value)
    // console.log(JSON.stringify(tokens.toArray())) // tokens
    let res = CSharp.program_prs().run.f(mk_parser_state(tokens))
    if (res.kind != "right" || res.value.kind != "right") return `Parse error: ${JSON.stringify(res.value)}`

    //console.log(JSON.stringify(res.value.value.fst)) // ast
    let hrstart = process.hrtime()
    let p = ast_to_type_checker(res.value.value.fst)(global_calling_context)

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
      let runtime_res = apply((constant<Unit,Py.StmtRt>(compiler_res.value.fst.sem).times(constant<Unit,Py.MemRt>(Py.empty_memory_rt))).then(run_to_end()), {})
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
