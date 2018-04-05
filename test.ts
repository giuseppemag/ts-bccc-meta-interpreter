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
    let source = `class School {
  (string name, string desc, int points)[] courses;

  public School() {
    this.courses = new (string name, string desc, int points)[0];
    typechecker_debugger;
    debugger;
  }

  public int TotalPoints() {
    int tot = 0;
    for(int i = 0; i < this.courses.Length; i = i + 1) {
      tot = tot + this.courses[i].points;
    }
    return tot;
  }

  public void AddCourse(string n, string d, int p) {
    var newAmountCourses = this.courses.Length + 1;
    (string name, string desc, int points)[] newCourses = new (string name, string desc, int points)[newAmountCourses];
    for(int i = 0; i < this.courses.Length; i = i + 1) {
      newCourses[i] = this.courses[i];
    }
    newCourses[newAmountCourses-1] = (n, d, p);
    this.courses = newCourses;
  }
}
var hr = new School();
hr.AddCourse("Dev1", "Basics of programming", 4);
hr.AddCourse("Dev5", "Basics of web development", 4);
var tot_p = hr.TotalPoints();
typechecker_debugger;
debugger;
`

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
