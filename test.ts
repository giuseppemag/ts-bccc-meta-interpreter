import { co_run, co_unit, Coroutine, Fun, fun, Prod, Sum } from 'ts-bccc';
import * as CCC from 'ts-bccc';
import * as Co from 'ts-bccc';

import * as DebuggerStream from './csharp_debugger_stream';
import * as CSharp from './CSharpTypeChecker/csharp';
import * as Sem from './Python/python';
import { zero_range } from './source_range';

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
   let from_js  = (t:CSharp.Type, sem:Sem.StmtRt) : CSharp.Stmt => _ => co_unit(CSharp.mk_typing(t, sem))

  //  let p = CSharp.def_class(zero_range, "int", [
  //      _ => ({ modifiers:["static", "public", "operator"], is_constructor:false, range:zero_range,
  //              return_t:CSharp.int_type, name:"+", parameters:[{ name:"a", type:CSharp.int_type }, { name:"b", type:CSharp.int_type }],
  //              body:from_js(
  //                    CSharp.int_type,
  //                    Sem.get_v_rt("a").then(a_v => Sem.get_v_rt("b").then(b_v =>
  //                    Sem.return_rt(Sem.int_expr((a_v.value.v as number) + (b_v.value.v as number)))
  //                    ))) }),
  //      _ => ({ modifiers:["static", "public", "operator"], is_constructor:false, range:zero_range,
  //              return_t:CSharp.int_type, name:"-", parameters:[{ name:"a", type:CSharp.int_type }, { name:"b", type:CSharp.int_type }],
  //              body:from_js(
  //                    CSharp.int_type,
  //                    Sem.get_v_rt("a").then(a_v => Sem.get_v_rt("b").then(b_v =>
  //                    Sem.return_rt(Sem.int_expr((a_v.value.v as number) - (b_v.value.v as number)))
  //                    ))) }),
  //    ],
  //  [])

    let source = `
int x;
string s;
bool b;
int[] a;
float f;
double d;
debugger;
`
// class StaticContainer {
//   static private int cnt;
//   static public int incr(int dx) {
//     int x = dx;
//     return x;
//   }
// }
// var y = StaticContainer.incr(10);

    // let hrstart = process.hrtime()

    let output = ""
    let log = function(s:string,x:any) {
      output = output + s + JSON.stringify(x) + "\n\n"
    }

    // let hrdiff = process.hrtime(hrstart)
    // let time_in_ns = hrdiff[0] * 1e9 + hrdiff[1]
    // log(`Timer: ${time_in_ns / 1000000}ms\n Compiler error: `, JSON.stringify(compiler_res.value))

    let stream = get_stream(source)
    while (stream.kind == "step") {
      let show = stream.show()
      log("Step:", show.kind == "bindings" ? show.state : show.kind == "memory" ? show.memory : show)
      stream = stream.next()
    }
    let show = stream.show()
    log("Step:", show.kind == "bindings" ? show.state : show.kind == "memory" ? show.memory : show)

    return output
  }

}

// console.log(ImpLanguageWithSuspend.test_imp())
console.log(ImpLanguageWithSuspend.test_parser())
