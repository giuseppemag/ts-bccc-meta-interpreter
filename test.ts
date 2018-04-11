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
    let source = `
    class Vector2 {
      public double x;
      public double y;
      public Vector2(double x, double y){
        this.x = x;
        this.y = y;
      }
      public double Length(){
        return Math.sqrt(this.x * this.x + this.y * this.y);
      }
      public static Vector2 Plus(Vector2 v1, Vector2 v2){
        return new Vector2(v1.x + v2.x, v1.y + v2.y);
      }
      public static Vector2 Minus(Vector2 v1, Vector2 v2){
        return new Vector2(v1.x - v2.x, v1.y - v2.y);
      }
      public static Vector2 Times(Vector2 v1, double c){
        return new Vector2(v1.x * c, v1.y * c);
      }
      public static Vector2 Div(Vector2 v1, double c){
        return Vector2.Times(v1, 1.0 / c);
      }
    }

    var v1 = new Vector2(0.0,0.0);
    var v2 = new Vector2(10.0,5.0);
    var v3 = Vector2.Times(v1, 1.0);
    typechecker_debugger;
    debugger;`

// class C {
//   int f;
//   public C() {
//     this.f = 1;
//   }

//   public void M(float x, float y) {
//     this.f = this.f * x + y;
//   }

//   public void M(Func<int,int> f) {
//     this.f = f(this.f);
//   }

//   public void M(Func<int,int> f, int x) {
//     this.f = f(this.f) + x;
//   }
// }

// var c = new C();
// c.M(2, 3);
// c.M(x => x + 1);
// c.M(x => x * 3, 2);



/*
abstract class Animal{
  public abstract string MakeSound();
}
class Cat : Animal{
  public override string MakeSound(){
     return "miao";
  }
}

class LargeCat : Cat {
  public override string MakeSound(){
    return "MIAO";
 }
}

Cat c = new LargeCat();
var s = c.MakeSound();
*/

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

      //{ highlighting:SourceRange, globals:Scopes, heap:Scope, functions:Immutable.Map<ValueName,Lambda>, classes:Immutable.Map<ValueName, Interface>, stack:Immutable.Map<number, Scopes> }
      log("Step:", show.kind == "bindings" ? show.state : 
                   show.kind == "memory" ? {...show.memory, classes: show.memory.classes.filter(c => c != undefined && !c.is_internal).toMap() } :
                   show)
      stream = stream.next()
    }
    let show = stream.show()
    log("Step:", show.kind == "bindings" ? show.state : 
                 show.kind == "memory" ? {...show.memory, classes: show.memory.classes.filter(c => c != undefined && !c.is_internal).toMap() } :
                 show)

    return output
  }

}

// console.log(ImpLanguageWithSuspend.test_imp())
console.log(ImpLanguageWithSuspend.test_parser())
