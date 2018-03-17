import { co_run, co_unit, Coroutine, Fun, fun, Prod, Sum } from 'ts-bccc';
import * as CCC from 'ts-bccc';
import * as Co from 'ts-bccc';

import * as DebuggerStream from './csharp_debugger_stream';
import * as CSharp from './CSharpTypeChecker/csharp';
import * as Sem from './Python/python';
import { zero_range } from './source_range';
import { get_stream, DebuggerStreamStep } from './csharp_debugger_stream';
import { Bindings, MemRt } from './main';


console.log("Running tests")

let assert_equal = (a:any, b:any) : boolean => a == b ? true : console.log(`\x1b[31mtest "${JSON.stringify(a)}" and "${JSON.stringify(b)}" should be equal`) || false

type Check = { name:string, step:number } & ({ expected_kind:"error" } | { expected_kind:"bindings", check:(_:Bindings) => boolean } | { expected_kind:"memory", check:(_:MemRt) => boolean })

interface Test { source:string, checks:Array<Check>, name:string }

let run_checks = (tests:Array<Test>) => {
  console.clear()
  let num_checks = tests.map(t => t.checks.length).reduce((a,b) => a + b, 0)
  let check_index = 0
  tests.forEach(test => {
    let stream = get_stream(test.source)
    let steps = DebuggerStream.run_stream_to_end(stream).toArray()

    test.checks.forEach((check, check_i) => {
      if (steps.length < check.step) {
        console.log(`\x1b[31mtest "${test.name}"::"${check.name}" failed: the required step does not exist`)
        process.exit(1)
      }
      let step = steps[check.step]
      if (!(check.expected_kind == "bindings" && step.kind == "bindings" ? check.check(step.state.bindings)
            : check.expected_kind == "memory" && step.kind == "memory" ? check.check(step.memory)
            : check.expected_kind == "error" && step.kind == "message")) {
        console.log(`\x1b[31mtest "${test.name}"::"${check.name}" failed its check, ${JSON.stringify(step)}`)
        process.exit(1)
      }
      console.log(`\x1b[32m[${check_index++ + 1}/${num_checks}] test "${test.name}"::"${check.name}" succeeded`)
    })
  })
  console.log("\x1b[37mdone")
}


run_checks([
  { name:"primitives",
    source:`int x;
    int y = 10;
    bool z = true;
    string s = "Hello statically typed languages!";
    typechecker_debugger;`,
    checks:[
      { name:"x is int", step:0, expected_kind:"bindings", check:(s:CSharp.Bindings) => s.get("x").kind == "int" },
      { name:"s is string", step:0, expected_kind:"bindings", check:(s:CSharp.Bindings) => s.get("s").kind == "string"  }
    ] },

  { name:"primitives",
    source:`int x = 10;
    int n = 1;
    while(x > 0){
      n  = n * x;
      x  = x - 1;
    }
    typechecker_debugger;`,
    checks:[
      { name:"x is int", step:0, expected_kind:"bindings", check:(s:CSharp.Bindings) => s.get("x").kind == "int" },
      { name:"n is int", step:0, expected_kind:"bindings", check:(s:CSharp.Bindings) => s.get("n").kind == "int" },
    ]},

  {
    name:"primitive error",
    source:`int x = 10;
    int n = 1;
    while (x > "0") {
      n = n * x;
      x = x - 1;
    }`,
    checks:[ { name:"does not compile", step:0, expected_kind:"error" }]
  },

  {
    name:"square drawing",
    source:`string s = "";
    int i = 0;
    int h = 10;
    while(i < 5){
      s  = s + "*****\\n";
      i  = i + 1;
    }
    typechecker_debugger;`,
    checks:[
      { name:"h is int", step:0, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(s.get("h").kind, "int") },
      { name:"s is square", step:2, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("s").v, "*****\\n*****\\n*****\\n*****\\n*****\\n") }
    ]
  },

  {
    name:"scope",
    source:`int x = 10;
    if(x > 0){
      int y = 2;
      x  = x * y;
      typechecker_debugger;
      debugger;
    }
    else{
      int z = 3;
      x  = x * z;
      typechecker_debugger;
      debugger;
    }
    typechecker_debugger;
    debugger;`,
    checks:[
    ]
  },

  {
    name:"scope and loops",
    source:`string s = "";
    int i = 0;
    int h = 5;
    int w = 5;
    debugger;
    while(i < h){
      typechecker_debugger;
      int j = 0;
      while(j < w){
        s  = s + "*";
        j  = j + 1;
      }
      s  = s + "\n";
      i  = i + 1;
      typechecker_debugger;
      debugger;
    }
    typechecker_debugger;
    debugger;`,
    checks:[
    ]
  },

  {
    name:"tuples",
    source:`(string,string) person = ("John","Doe");
    string name = person.Item1;
    string surname = person.Item2;
    typechecker_debugger;`,
    checks:[
    ]
  },

  {
    name:"functions",
    source:`int quadratic (int a,int b,int c,int x){
      debugger;
      typechecker_debugger;
      return a * x * x + b * x + c;
    }
    int y = quadratic (1, 2,3,4);
    typechecker_debugger;`,
    checks:[
    ]
  },

  {
    name:"functions",
    source:`string describe (int x){
      typechecker_debugger;
      debugger;
      if(x % 2 == 0){
        return "even";
      }
      else{
        return "odd";
      }
    }
    var s1 = describe (100);
    var s2 = describe (101);
    typechecker_debugger;`,
    checks:[
    ]
  },

  {
    name:"recursion",
    source:`int factorial (int x){
      typechecker_debugger;
      debugger;
      var res = 1;
      if(x <= 0){
        return res;
      }
      else{
        var p = x;
        var prev_x = x + -1;
        var q =     factorial (prev_x);
        typechecker_debugger;
        res  = p * q;
      }
      typechecker_debugger;
      return res;
    }
    var x = factorial (5);
    typechecker_debugger;`,
    checks:[
    ]
  },

  { name:"anonymous functions",
    source:`
    Func<int,int> d = x => x * 2;
    Func<int,int> p2 = x => x + 2;
    Func<int,int> then (Func<int,int> f,Func<int,int> g){
      typechecker_debugger;
      return x => g (f (x));
    }
    Func<int,int> d_p2 = then (d,p2);
    typechecker_debugger;`,
    checks:[
      { name:"f is Func", step:0, expected_kind:"bindings",
        check:(s:CSharp.Bindings) => {
          let f = s.get("f")
          return f.kind == "fun" && f.in.kind == "tuple" && f.in.args[0].kind == "int" && f.out.kind == "int"
        }
      } ]
  },

  {
    name:"currying and closures",
    source:`Func<int,Func<int,Func<int,int>>> add_mul = x => (y => (z => x * (y + z)));
    Func<int,Func<int,int>> add_double = add_mul (2);
    Func<int,Func<int,int>> add_triple = add_mul (3);
    typechecker_debugger;
    Func<int,int> f = add_double (4);
    debugger;
    int a = f (2);
    debugger;
    Func<int,int> g = add_triple (5);
    debugger;
    int b = g (1);
    debugger;
    typechecker_debugger;`,
    checks:[
    ]
  },

  {
    name:"arrays",
    source:`int n = 5;
    int[] fibo = new int[n];
    fibo[0] = 0;
    fibo[1] = 1;
    for(int i = 2; i < n; i  = i + 1){
      fibo[i] = fibo[i + -1] + fibo[i + -2];
    }`,
    checks:[
    ]
  },

  {
    name:"counter",
    source:`class Counter {
      int cnt;
      public  Counter(){
        this.cnt = 0;
        debugger;
      }
      public void tick(){
        this.cnt = this.cnt + 1;
        debugger;
      }
    }
    typechecker_debugger;
    Counter c = new Counter ();
    c.tick ();
    c.tick ();`,
    checks:[
    ]
  },

  {
    name:"shared references",
    source:`class MyClass {
      int field;
      public  MyClass(int f){
        this.field = f;
      }
      public void do_something(){
        this.field = this.field * 2 + 1;
      }
    }
    var c1 = new MyClass (10);
    var c2 = c1;
    debugger;
    c1.do_something ();
    debugger;
    c2.do_something ();`,
    checks:[
    ]
  },

  {
    name:"double counter (private field)",
    source:`class DoubleCounter {
      private int cnt;
      public  DoubleCounter(){
        this.cnt = 0;
      }
      public int inspect(){
        return this.cnt;
      }
     public void tick(){
        typechecker_debugger;
        this.cnt = this.cnt + 2;
        typechecker_debugger;
      }
    }
    var c = new DoubleCounter ();
    c.tick ();
    typechecker_debugger;
    c.cnt = c.cnt + 1;
    typechecker_debugger;`,
    checks:[
    ]
  },

  {
    name:"counter or cat",
    source:`  class CounterOrCat {
      private bool is_cat;
      private int cnt;
      public  CounterOrCat(bool is_cat){
        this.cnt = 0;
        this.is_cat = is_cat;
      }
      public int increment(){
        if(this.is_cat){
          return 0;
        }
        else{
          return this.cnt;
        }
      }
     public void tick(){
        if(this.is_cat == false){
          this.cnt = this.cnt + 1;
        }
      }
     public string meow(){
        if(this.is_cat){
          return "meow!";
        }
        else{
          return "I cannot meow, I am a counter.";
        }
      }
    }
    var cat = new CounterOrCat (true);
    var cnt = new CounterOrCat (false);
    var a = cat.meow ();
    var b = cnt.meow ();
    cat.tick ();
    cnt.tick ();
    debugger;`,
    checks:[
    ]
  },

  {
    name:"cat class",
    source:`class Cat {
      private string msg;
      public  Cat(){
        this.msg = "meow!";
      }
      public string meow(){
        return this.msg;
      }
    }
    var cat1 = new Cat ();
    var cat2 = new Cat ();
    debugger;
    var a = cat1.meow ();
    var b = cat2.meow ();
    debugger;`,
    checks:[
    ]
  }



])
