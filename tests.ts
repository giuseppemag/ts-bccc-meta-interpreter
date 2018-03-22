import { co_run, co_unit, Coroutine, Fun, fun, Prod, Sum } from 'ts-bccc';
import * as CCC from 'ts-bccc';
import * as Co from 'ts-bccc';

import * as DebuggerStream from './csharp_debugger_stream';
import * as CSharp from './CSharpTypeChecker/csharp';
import * as Sem from './Python/python';
import { zero_range } from './source_range';
import { get_stream, DebuggerStreamStep } from './csharp_debugger_stream';
import { Bindings, MemRt, Lambda, ArrayVal, Scope } from './main';


console.log("Running tests")

let assert_equal = (a:any, b:any) : boolean => a == b ? true : console.log(`\x1b[31m assertion: "${JSON.stringify(a)}" and "${JSON.stringify(b)}" should be equal`) || false

type Check = { name:string, step:number } & ({ expected_kind:"error" } | { expected_kind:"bindings", check:(_:Bindings) => boolean } | { expected_kind:"memory", check:(_:MemRt) => boolean })

interface Test { source:string, checks:Array<Check>, name:string }

let run_checks = (tests:Array<Test>, only_test?:string) => {
  //console.clear()
  let num_checks = tests.map(t => t.checks.length).reduce((a,b) => a + b, 0)
  let check_index = 0
  tests.forEach(test => {
    if (only_test && test.name != only_test) return

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
        console.log(`\x1b[31mtest "${test.name}"::"${check.name}" failed its check at step ${JSON.stringify(step.kind == "memory" ? step.memory : step.kind == "bindings" ? step.state.bindings : step.message)}`)
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
      { name:"y is int", step:0, expected_kind:"bindings", check:(s:CSharp.Bindings) => s.get("y").kind == "int" },
      { name:"z is int", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => s.get("z").kind == "int" },
      { name:"y and z removed", step:2, expected_kind:"bindings", check:(s:CSharp.Bindings) => !(s.has("y") || s.has("z")) },
      { name:"y is 2", step:4, expected_kind:"memory", check:(s:MemRt) => s.globals.get(1).get("y").v == 2 },
      { name:"y removed", step:5, expected_kind:"memory", check:(s:MemRt) => s.globals.count() == 1 },
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
      s  = s + "\\n";
      i  = i + 1;
      typechecker_debugger;
      debugger;
    }
    typechecker_debugger;
    debugger;`,
    checks:[
      { name:"initial scope empty", step:0, expected_kind:"bindings", check:(s:CSharp.Bindings) => !s.has("j") },
      { name:"j added", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => s.get("j").kind == "int" },
      { name:"j removed", step:2, expected_kind:"bindings", check:(s:CSharp.Bindings) => !s.has("j") },
      { name:"j is 5", step:5, expected_kind:"memory", check:(s:MemRt) => s.globals.get(1).get("j").v == 5 },
      { name:"j is 5 again", step:7, expected_kind:"memory", check:(s:MemRt) => s.globals.get(1).get("j").v == 5 },
      { name:"scope is popped", step:10, expected_kind:"memory", check:(s:MemRt) => s.globals.count() == 1 },
    ]
  },

  {
    name:"tuples",
    source:`(string,string) person = ("John","Doe");
    string name = person.Item1;
    string surname = person.Item2;
    typechecker_debugger;`,
    checks:[
      { name:"person is tuple", step:0, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(CSharp.type_to_string(s.get("person")), "(string,string)") },
    ]
  },

  {
    name:"records",
    source:`(string Name,string Surname) person = ("John","Doe");
    string name = person.Name;
    string surname = person.Surname;
    typechecker_debugger;
    debugger;`,
    checks:[
      { name:"person is record", step:0, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(CSharp.type_to_string(s.get("person")), "(string Name,string Surname)") },
      { name:`name is "John"`, step:2, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("name").v, "John") },
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
    typechecker_debugger;
    debugger;`,
    checks:[
      { name:"x is int", step:0, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(s.get("x").kind, "int") },
      { name:"x is removed", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(s.has("x"), false) },
      { name:"s1 is string", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(s.get("s1").kind, "string") },
      { name:"x is 100", step:3, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.stack.get(0).get(0).get("x").v, 100) },
      { name:"x is 101", step:4, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.stack.get(0).get(0).get("x").v, 101) },
      { name:`s2 is "odd"`, step:5, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("s2").v, "odd") },
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
    typechecker_debugger;
    debugger;`,
    checks:[
      { name:`x is "int"`, step:0, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(s.get("x").kind, "int") },
      { name:`p is "int"`, step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(s.get("p").kind, "int") },
      { name:`res is "int"`, step:2, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(s.get("res").kind, "int") },
      { name:`function scope cleaned up`, step:3, expected_kind:"bindings", check:(s:CSharp.Bindings) => s.has("factorial") && s.has("x") && !s.has("res") },
      { name:`stack has grown`, step:10, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.stack.count(), 6) && assert_equal(s.stack.get(3).get(0).get("x").v, 2) && assert_equal(s.stack.get(3).get(1).get("p").v, 2) },
      { name:`stack is cleaned up`, step:11, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.stack.count(), 0) && assert_equal(s.globals.get(0).get("x").v, 5 * 4 * 3 * 2) },
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
    typechecker_debugger;
    var x = d_p2(10);
    debugger;`,
    checks:[
      { name:"f is Func", step:0, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(CSharp.type_to_string(s.get("f")), "Func<int,int>" ) },
      { name:"d is Func", step:0, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(CSharp.type_to_string(s.get("d")), "Func<int,int>" ) },
      { name:"then is Func", step:0, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(CSharp.type_to_string(s.get("then")), "Func<Func<int,int>,Func<int,int>,Func<int,int>>" ) },
      { name:"d_p2 is Func", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(CSharp.type_to_string(s.get("d_p2")), "Func<int,int>" ) },
      { name:"x is 22", step:3, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("x").v, 22) },
    ]
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
      { name:"add_double is Func^2", step:0, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(CSharp.type_to_string(s.get("add_double")), "Func<int,Func<int,int>>" ) },
      { name:"a is 12", step:4, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("a").v, 12) },
      { name:"f has 2 and 4 in closure", step:3, expected_kind:"memory", check:(s:MemRt) => {
        let f = (s.globals.get(0).get("f").v as Lambda)
        return assert_equal(f.closure.get("x").v, 2) && assert_equal(f.closure.get("y").v, 4)
      } },
      { name:"g has 3 and 5 in closure", step:5, expected_kind:"memory", check:(s:MemRt) => {
        let g = (s.globals.get(0).get("g").v as Lambda)
        return assert_equal(g.closure.get("x").v, 3) && assert_equal(g.closure.get("y").v, 5)
      } },
      { name:"b is 18", step:6, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("b").v, 18) },
    ]
  },

  {
    name:"arrays",
    source:`int n = 8;
    int[] fibo = new int[n];
    fibo[0] = 0;
    fibo[1] = 1;
    for(int i = 2; i < n; i  = i + 1){
      fibo[i] = fibo[i + -1] + fibo[i + -2];
    }
    typechecker_debugger;
    debugger;
    `,
    checks:[
      { name:`fibo is int[]`, step:0, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(CSharp.type_to_string(s.get("fibo")), "int[]" ) },
      { name:`fibo is a reference`, step:2, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("fibo").v, "ref_0" ) },
      { name:`ref_0 contains the array`, step:2, expected_kind:"memory", check:(s:MemRt) => {
        let fibo = s.heap.get("ref_0").v as ArrayVal
        return assert_equal(fibo.length, 8) && assert_equal(fibo.elements.get(0).v, 0) &&
                assert_equal(fibo.elements.get(7).v, 13)
      } },
    ]
  },

  {
    name:"counter",
    source:`class Counter {
      private int cnt = -5;
      public Counter() {
        debugger;
        this.cnt = 0;
        debugger;
      }
      public void tick() {
        this.cnt = this.cnt + 1;
        debugger;
      }
    }
    Counter c = new Counter ();
    typechecker_debugger;
    c.tick ();
    c.tick ();
    debugger;`,
    checks:[
      { name:`c is Counter`, step:0, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(CSharp.type_to_string(s.get("c")), "Counter" ) },
      { name:`cnt starts at -5`, step:2, expected_kind:"memory", check:(s:MemRt) => {
        let c = s.heap.get("ref_0").v as Scope
        return assert_equal(c.get("cnt").v, -5)
      } },
      { name:`this is a reference inside cons`, step:2, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.stack.get(0).get(0).get("this").v, "ref_0" ) },
      { name:`this is a reference inside "tick"`, step:4, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.stack.get(0).get(0).get("this").v, "ref_0" ) },
      { name:`c is a reference`, step:6, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("c").v, "ref_0" ) },
      { name:`cnt is 2`, step:6, expected_kind:"memory", check:(s:MemRt) => {
        let c = s.heap.get("ref_0").v as Scope
        return assert_equal(c.get("cnt").v, 2 )
      } },
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
    c2.do_something ();
    debugger;`,
    checks:[
      { name:`c1 is a reference`, step:1, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("c1").v, "ref_0" ) },
      { name:`c2 is the same reference`, step:1, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("c2").v, "ref_0" ) },
      { name:`field is 21`, step:2, expected_kind:"memory", check:(s:MemRt) => {
        let c = s.heap.get("ref_0").v as Scope
        return assert_equal(c.get("field").v, 21 )
      } },
      { name:`field is 43`, step:3, expected_kind:"memory", check:(s:MemRt) => {
        let c = s.heap.get("ref_0").v as Scope
        return assert_equal(c.get("field").v, 43 )
      } },
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
        this.cnt = this.cnt + 2;
      }
    }
    var c = new DoubleCounter ();
    typechecker_debugger;
    c.cnt = 10;
    typechecker_debugger;`,
    checks:[
      { name:`c is "DoubleCounter"`, step:0, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(CSharp.type_to_string(s.get("c")), "DoubleCounter" ) },
      { name:`access to "c.cnt" is prevented`, step:1, expected_kind:"error" },
    ]
  },

  {
    name:"static fields and methods",
    source:`class StaticContainer {
      static private int cnt = 5;
      static public int incr(int dx) {
        StaticContainer.cnt = StaticContainer.cnt + dx;
        return StaticContainer.cnt;
      }
    }
    var y = StaticContainer.incr(10);
    debugger;
    `,
    checks:[
      { name:`cnt is 15`, step:1, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.classes.get("StaticContainer").static_fields.get("cnt").v, 15 ) },
      { name:`y is 15`, step:1, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("y").v, 15 ) },
    ]
  },

  {
    name:"quadratic function",
    source:`int quadratic (int a,int b,int c,int x){
      debugger;
      typechecker_debugger;
      return a * x * x + b * x + c;
    }
    var y = quadratic (1,2,3,4);
    typechecker_debugger;
    debugger;`,
    checks:[
      { name:"quadratic is a function", step:0, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(CSharp.type_to_string(s.get("quadratic")), "Func<int,int,int,int,int>") },
      { name:"x is 4", step:3, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.stack.get(0).get(0).get("x").v, 4) },
      { name:"y is result", step:5, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("y").v, 1 * 4 * 4 + 2 * 4 + 3) },
    ]
  },


  {
    name:"Vector2",
    source:`class Vector2 {
  public float x;
  public float y;
  public Vector2(float x, float y){
    this.x = x;
    this.y = y;
  }
  public static Vector2 Plus(Vector2 v1, Vector2 v2){
    return new Vector2(v1.x + v2.x, v1.y + v2.y);
  }
}

var v1 = new Vector2(0.0f,0.0f);
var v2 = new Vector2(10.0f,5.0f);
var v3 = Vector2.Plus(v1, v2);
typechecker_debugger;
debugger;`,
    checks:[]
  },
])


