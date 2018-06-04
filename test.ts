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
    int invokeFuncs(Func<int[], int>[] functions, int[] arguments) {
      var sum = 0;
    
      for(int i = 0; i < functions.Length; i = i + 1) {
        var currFunc = functions[i]; 
        var currRes = currFunc(arguments); 
        sum = sum + currRes;
      }
    
      return sum;
    }
    
    int f1(int[] array) {
      var sum = 0;
      for(int i = 0; i < array.Length; i = i + 1) {
        sum = sum + array[i];
      }
      return sum;
    }
     
    int f2(int[] array) {
      var prod = 1;
      for(int i = 0; i < array.Length; i = i + 1) {
        prod = prod * array[i];
      }
      return prod;
    }
     
    int f3(int[] array) {
      var sum = f1(array);
      var average = sum/array.Length;
    } 
    
    
    var f = new Func<int[],int>[3];
    f[0] = f3;
    f[1] = f2; 
    f[2] = f1;
    var args = new int[] { 1, 2, 3 };
    var res = invokeFuncs(f, args);
    
    debugger;
    typechecker_debugger;
`

// interface Option<a> {
//   bool has_value();
//   a get_value();
// }

// class None<a> : Option<a> {
//   public override bool has_value(){
//     return false;
//   }
// }

// class Some<a> : Option<a> {
//   a value;
//   public Some(a value){
//     this.value = value;
//   }
//   public override a get_value(){
//     return this.value;
//   }
// }
// typechecker_debugger;
// debugger;

// class C<a,b> {
//   a x;
//   public C(a x) { this.x = x; }
//   public (a,b) get_x(b y) { return (this.x,y); }
// }

// C<int, bool> c = new C<int, bool>(10);
// var y = c.get_x(true);
// typechecker_debugger;

// test 2
// interface I
// {
//   bool M(int x, string y);
// }

// class C<a> : I where a : I {
//   public bool M(int x, string y)
//   {
//     return x > y.Length;
//   }

//   public bool N(a x, a y) {
//     return x.M(10, "dieci") && y.M(11, "undici");
//   }
// }

// test 3
// interface I<a>
// {
//   bool cmp(a other);
// }

// class C<a> where a : I<a> {
//   public bool N(a x, a y) {
//     return x.cmp(y);
//   }
// }


    // let hrstart = process.hrtime()

    let output = ""
    let log = function(s:string,x:any) {
      output = output + s + JSON.stringify(x) + "\n\n"
    }

    // let hrdiff = process.hrtime(hrstart)
    // let time_in_ns = hrdiff[0] * 1e9 + hrdiff[1]
    // log(`Timer: ${time_in_ns / 1000000}ms\n Compiler error: `, JSON.stringify(compiler_res.value))

    let stream = get_stream(source,  CCC.apply(CCC.inr(), {}))
    while (stream.kind == "step") {
      let show = stream.show()

      //{ highlighting:SourceRange, globals:Scopes, heap:Scope, functions:Immutable.Map<ValueName,Lambda>, classes:Immutable.Map<ValueName, Interface>, stack:Immutable.Map<number, Scopes> }


      log("Step:",
      show.kind == "bindings" ? show.state.bindings.filter(c => c != undefined && (c.kind != "obj" || !c.is_internal)) :
      show.kind == "memory" ? {...show.memory, classes: show.memory.classes.filter(c => c != undefined && !c.is_internal).toMap() } :
      show)
      stream = stream.next()
    }
    let show = stream.show()
    log("Step:", show.kind == "bindings" ? show.state :
    show.kind == "memory" ? {...show.memory, classes: show.memory.classes.filter(c => c != undefined && !c.is_internal).toMap() } :
    show)

    // if (show.kind == "memory")
    //   console.log(show.memory.classes.map((c, C_name) => c != undefined && C_name != undefined ? [C_name, c.is_internal] : []))

    return output
  }

}

// console.log(ImpLanguageWithSuspend.test_imp())
console.log(ImpLanguageWithSuspend.test_parser())
