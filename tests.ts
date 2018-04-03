import { co_run, co_unit, Coroutine, Fun, fun, Prod, Sum } from 'ts-bccc';
import * as CCC from 'ts-bccc';
import * as Co from 'ts-bccc';

import * as DebuggerStream from './csharp_debugger_stream';
import * as CSharp from './CSharpTypeChecker/csharp';
import * as Sem from './Python/python';
import { zero_range } from './source_range';
import { get_stream, DebuggerStreamStep } from './csharp_debugger_stream';
import { MemRt, Lambda, ArrayVal, Scope } from './main';
import { Bindings } from './CSharpTypeChecker/types';


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

    console.log(`\x1b[32m test "${test.name} started`)

    let stream = get_stream(test.source)
    let steps = DebuggerStream.run_stream_to_end(stream).toArray()

    if(test.checks.length == 0){
      if(steps[0].kind == "message"){
        console.log(`\x1b[31mtest "${test.name} failed its check`)
        process.exit(1)
      }
    }

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
  { name:"operators",
    source:`var a = 2 + 5;
    var b = 5 * 1.5f;
    var c = 2.5 + (5 * 1.5f);
    var d = "a" + a;
    var e = !((d == "c") || (c > b));
    var f = (a <= c) && (b == c);

    typechecker_debugger;`,
    checks:[
      { name:"a is int", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => s.get("a").kind == "int" },
      { name:"b is float", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => s.get("b").kind == "float" },
      { name:"c is double", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => s.get("c").kind == "double" },
      { name:"d is string", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => s.get("d").kind == "string"  },
      { name:"e is bool", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => s.get("e").kind == "bool"  },
      { name:"f is bool", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => s.get("f").kind == "bool"  },
      { name:"a is 7", step:3, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("a").v, 7) },
      { name:"b is 7.5", step:3, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("b").v, 7.5) },
      { name:"c is 10", step:3, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("c").v, 10) },
      { name:`d is "a7"`, step:3, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("d").v, "a7") },
      { name:"e is false", step:3, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("e").v, false) },
      { name:"f is false", step:3, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("f").v, false) },
    ] },

    { name:"primitives",
    source:`int x;
    int y = 10;
    bool z = true;
    string s = "Hello statically typed languages!";
    typechecker_debugger;`,
    checks:[
      { name:"x is int", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => s.get("x").kind == "int" },
      { name:"s is string", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => s.get("s").kind == "string"  }
    ] },

  { name:"while loop",
    source:`int x = 10;
    int n = 1;
    while(x > 0){
      n  = n * x;
      x  = x - 1;
    }
    typechecker_debugger;`,
    checks:[
      { name:"x is int", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => s.get("x").kind == "int" },
      { name:"n is int", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => s.get("n").kind == "int" },
    ]},

  {
    name:"primitive error",
    source:`int x = 10;
    int n = 1;
    while (x > "0") {
      n = n * x;
      x = x - 1;
    }`,
    checks:[ { name:"does not compile", step:1, expected_kind:"error" }]
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
      { name:"h is int", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(s.get("h").kind, "int") },
      { name:"s is square", step:3, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("s").v, "*****\\n*****\\n*****\\n*****\\n*****\\n") }
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
      { name:"y is int", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => s.get("y").kind == "int" },
      { name:"z is int", step:2, expected_kind:"bindings", check:(s:CSharp.Bindings) => s.get("z").kind == "int" },
      { name:"y and z removed", step:3, expected_kind:"bindings", check:(s:CSharp.Bindings) => !(s.has("y") || s.has("z")) },
      { name:"y is 2", step:5, expected_kind:"memory", check:(s:MemRt) => s.globals.get(1).get("y").v == 2 },
      { name:"y removed", step:6, expected_kind:"memory", check:(s:MemRt) => s.globals.count() == 1 },
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
      { name:"initial scope empty", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => !s.has("j") },
      { name:"j added", step:2, expected_kind:"bindings", check:(s:CSharp.Bindings) => s.get("j").kind == "int" },
      { name:"j removed", step:3, expected_kind:"bindings", check:(s:CSharp.Bindings) => !s.has("j") },
      { name:"j is 5", step:6, expected_kind:"memory", check:(s:MemRt) => s.globals.get(1).get("j").v == 5 },
      { name:"j is 5 again", step:8, expected_kind:"memory", check:(s:MemRt) => s.globals.get(1).get("j").v == 5 },
      { name:"scope is popped", step:11, expected_kind:"memory", check:(s:MemRt) => s.globals.count() == 1 },
    ]
  },

  {
    name:"tuples",
    source:`(string,string) person = ("John","Doe");
    string name = person.Item1;
    string surname = person.Item2;
    typechecker_debugger;`,
    checks:[
      { name:"person is tuple", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(CSharp.type_to_string(s.get("person")), "(string,string)") },
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
      { name:"person is record", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(CSharp.type_to_string(s.get("person")), "(string Name,string Surname)") },
      { name:`name is "John"`, step:3, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("name").v, "John") },
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

    Func<float, float> f = x => x * 2.5f;
    var a = 5;
    var b = f(a);

    typechecker_debugger;
    debugger;`,
    checks:[
      { name:"x is int", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(s.get("x").kind, "int") },
      { name:"b is float", step:2, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(s.get("b").kind, "float") },
      { name:"x is removed", step:2, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(s.has("x"), false) },
      { name:"s1 is string", step:2, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(s.get("s1").kind, "string") },
      { name:"x is 100", step:4, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.stack.get(0).get(0).get("x").v, 100) },
      { name:"x is 101", step:5, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.stack.get(0).get(0).get("x").v, 101) },
      { name:`s2 is "odd"`, step:6, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("s2").v, "odd") },
      { name:`b is 12.5"`, step:6, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("b").v, 12.5) },
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
      { name:`x is "int"`, step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(s.get("x").kind, "int") },
      { name:`p is "int"`, step:2, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(s.get("p").kind, "int") },
      { name:`res is "int"`, step:3, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(s.get("res").kind, "int") },
      { name:`function scope cleaned up`, step:4, expected_kind:"bindings", check:(s:CSharp.Bindings) => s.has("factorial") && s.has("x") && !s.has("res") },
      { name:`stack has grown`, step:11, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.stack.count(), 6) && assert_equal(s.stack.get(3).get(0).get("x").v, 2) && assert_equal(s.stack.get(3).get(1).get("p").v, 2) },
      { name:`stack is cleaned up`, step:12, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.stack.count(), 0) && assert_equal(s.globals.get(0).get("x").v, 5 * 4 * 3 * 2) },
    ]
  },

  { name:"anonymous functions",
    source:`
    Func<int,int> d = x => x * 2;
    Func<int,int> p2 = x => x + 2;
    Func<int,int> then (Func<int,int> f, Func<int,int> g){
      typechecker_debugger;
      return x => g (f (x));
    }
    Func<int,int> d_p2 = then(d,p2);
    typechecker_debugger;
    var x = d_p2(10);
    debugger;`,
    checks:[
      { name:"f is Func", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(CSharp.type_to_string(s.get("f")), "Func<int,int>" ) },
      { name:"d is Func", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(CSharp.type_to_string(s.get("d")), "Func<int,int>" ) },
      { name:"then is Func", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(CSharp.type_to_string(s.get("then")), "Func<Func<int,int>,Func<int,int>,Func<int,int>>" ) },
      { name:"d_p2 is Func", step:2, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(CSharp.type_to_string(s.get("d_p2")), "Func<int,int>" ) },
      { name:"x is 22", step:4, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("x").v, 22) },
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
      { name:"add_double is Func^2", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(CSharp.type_to_string(s.get("add_double")), "Func<int,Func<int,int>>" ) },
      { name:"a is 12", step:5, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("a").v, 12) },
      { name:"f has 2 and 4 in closure", step:4, expected_kind:"memory", check:(s:MemRt) => {
        let f = (s.globals.get(0).get("f").v as Lambda)
        return assert_equal(f.closure.get("x").v, 2) && assert_equal(f.closure.get("y").v, 4)
      } },
      { name:"g has 3 and 5 in closure", step:6, expected_kind:"memory", check:(s:MemRt) => {
        let g = (s.globals.get(0).get("g").v as Lambda)
        return assert_equal(g.closure.get("x").v, 3) && assert_equal(g.closure.get("y").v, 5)
      } },
      { name:"b is 18", step:7, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("b").v, 18) },
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
      { name:`fibo is int[]`, step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(CSharp.type_to_string(s.get("fibo")), "int[]" ) },
      { name:`fibo is a reference`, step:3, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("fibo").v, "ref_0" ) },
      { name:`ref_0 contains the array`, step:3, expected_kind:"memory", check:(s:MemRt) => {
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
      { name:`c is Counter`, step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(CSharp.type_to_string(s.get("c")), "Counter" ) },
      { name:`cnt starts at -5`, step:3, expected_kind:"memory", check:(s:MemRt) => {
        let c = s.heap.get("ref_0").v as Scope
        return assert_equal(c.get("cnt").v, -5)
      } },
      { name:`this is a reference inside cons`, step:3, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.stack.get(0).get(0).get("this").v, "ref_0" ) },
      { name:`this is a reference inside "tick"`, step:5, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.stack.get(0).get(0).get("this").v, "ref_0" ) },
      { name:`c is a reference`, step:7, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("c").v, "ref_0" ) },
      { name:`cnt is 2`, step:7, expected_kind:"memory", check:(s:MemRt) => {
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
      { name:`c1 is a reference`, step:2, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("c1").v, "ref_0" ) },
      { name:`c2 is the same reference`, step:2, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("c2").v, "ref_0" ) },
      { name:`field is 21`, step:3, expected_kind:"memory", check:(s:MemRt) => {
        let c = s.heap.get("ref_0").v as Scope
        return assert_equal(c.get("field").v, 21 )
      } },
      { name:`field is 43`, step:4, expected_kind:"memory", check:(s:MemRt) => {
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
      { name:`c is "DoubleCounter"`, step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(CSharp.type_to_string(s.get("c")), "DoubleCounter" ) },
      { name:`access to "c.cnt" is prevented`, step:2, expected_kind:"error" },
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
      { name:`cnt is 15`, step:2, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.classes.get("StaticContainer").static_fields.get("cnt").v, 15 ) },
      { name:`y is 15`, step:2, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("y").v, 15 ) },
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
      { name:"quadratic is a function", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => assert_equal(CSharp.type_to_string(s.get("quadratic")), "Func<int,int,int,int,int>") },
      { name:"x is 4", step:4, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.stack.get(0).get(0).get("x").v, 4) },
      { name:"y is result", step:6, expected_kind:"memory", check:(s:MemRt) => assert_equal(s.globals.get(0).get("y").v, 1 * 4 * 4 + 2 * 4 + 3) },
    ]
  },


  {
    name:"Vector2",
    source:`class Vector2 {
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
debugger;`,
    checks:[{ name:"v1 is in scope", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => !s.has("v1") },
            { name:"v1 is in the runtime", step:3, expected_kind:"memory", check:(s:MemRt) => !s.globals.get(0).has("v1") }]
            
  },
  {
    name:"DataSet1",
    source:`class DataSet{
  (float, float, float)[] elems;
  public DataSet((float, float, float)[] elems){
    this.elems = elems;
  }
  public (float, float, float) ComputeAverage(){
    (float, float, float) acc = (0.0f,0.0f,0.0f);
    float total = 0.0f;
    for(int i = 0; i < this.elems.Length; i=i+1){
      var Item1 = this.elems[i].Item1 + acc.Item1;
      var Item2 = this.elems[i].Item2 + acc.Item2;
      var Item3 = this.elems[i].Item3 + acc.Item3;
      acc = (Item1, Item2, Item3);
      total = total + 1.0f;
    }
    return (acc.Item1 / total, acc.Item2 / total, acc.Item3 / total);
  }
}

(float, float, float)[] elems = new (float, float, float)[]{(1.0f,1.0f,1.0f), (2.0f,2.0f,2.0f)};
DataSet ds = new DataSet(elems);
var res = ds.ComputeAverage();
typechecker_debugger;
debugger;`,
    checks:[{ name:"elems is in scope", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => !s.has("elems") },
            { name:"elems is in the runtime", step:3, expected_kind:"memory", check:(s:MemRt) => !s.globals.get(0).has("elems") }]
  },
  {
    name:"DataSet2",
    source:`class DataSet{
  double[] elems;
  public DataSet(double[] elems){
    this.elems = elems;
  }
  public double Minimum(){
    double min = this.elems[0];
    for(int i = 1; i < this.elems.Length; i=i+1){
      if(this.elems[i] < min){
        min = this.elems[i];
      }
    }
    return min;
  }

  public double Maximum(){
    double max = this.elems[0];
    for(int i = 1; i < this.elems.Length; i=i+1){
      if(this.elems[i] > max){
        max = this.elems[i];
      }
    }
    return max;
  }
  public double MostFrequent(){
    int max_freq = 0;
    double most_freq = 0.0;
    for(int i = 0; i < this.elems.Length; i=i+1){
      int i_freq = 0;
      for(int j = 0; j < this.elems.Length; j=j+1){
        if(this.elems[i] == this.elems[j]){
          i_freq = i_freq + 1;
        }
      }
      if(i_freq > max_freq){
        max_freq = i_freq;
        most_freq = this.elems[i];
      }
    }
    return most_freq;
  }
}
double[] elems = new double[]{1.0,1.0,1.0,2.0,2.0,2.0};
DataSet ds = new DataSet(elems);
var res1 = ds.Minimum();
var res2 = ds.Maximum();
var res3 = ds.MostFrequent();
typechecker_debugger;
debugger;`,
checks:[{ name:"elems is in scope", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => !s.has("elems") },
        { name:"elems is in the runtime", step:3, expected_kind:"memory", check:(s:MemRt) => !s.globals.get(0).has("elems") }]
  },
  {
    name:"DataSet3",
    source:`class DataSet{
  double[] elems;
  public DataSet(double[] elems){
    this.elems = elems;
  }

  public DataSet Map(Func<double, double> f){
    double[] new_elems = new double[this.elems.Length];
    for(int i = 0; i < this.elems.Length; i=i+1){
      new_elems[i] = f(this.elems[i]);
    }
    return new DataSet(new_elems);
  }
  public void MutableMap(Func<double, double> f){
    for(int i = 0; i < this.elems.Length; i=i+1){
      this.elems[i] = f(this.elems[i]);
    }
  }
}
double[] elems = new double[]{1.0,1.0,1.0,2.0,2.0,2.0};
DataSet ds = new DataSet(elems);
var res1 = ds.Map(x => x + 1);
ds.MutableMap(x => x + 1);
typechecker_debugger;
debugger;`,
checks:[{ name:"elems is in scope", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => !s.has("elems") },
        { name:"elems is in the runtime", step:3, expected_kind:"memory", check:(s:MemRt) => !s.globals.get(0).has("elems") }]
  },
  {
    name:"Arrays",
    source:`var a = new int[] { 0, 1, 2, 3 };
var b = new int[] { 4, 5, 6, 7 };
var c = a;
if( c[0] >= 0 )
  c = b;
c[0] = 100;
typechecker_debugger;
debugger;`,
checks:[{ name:"b is in scope", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => !s.has("b") },
        { name:"b is in the runtime", step:3, expected_kind:"memory", check:(s:MemRt) => !s.globals.get(0).has("b") }]
  },
  {
    name:"Arrays",
    source:`Func<int, string[], string> f = (i, a) => a[i];
(string,string) v = ( f( 2, (new string[] { "a", "b", "c", "d" })), f( 1, (new string[] { "e", "f" })) );
debugger;
typechecker_debugger;
`,
checks:[{ name:"v is in scope", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => !s.has("v") },
        { name:"v is in the runtime", step:3, expected_kind:"memory", check:(s:MemRt) => !s.globals.get(0).has("v") }]
  },
  {
    name:"Classes",
    source:`class Dog {
  string name;

  public Dog(string n) {
    this.name = n;
  }
  public string bark() {
    debugger;
    return "whoof " + this.name;
  }
}

var dogs = new Dog[] { new Dog("Pedro"), new Dog("Avena") };
var s = dogs[1].bark();
typechecker_debugger;
debugger;
`,
checks:[{ name:"dogs is in scope", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => !s.has("dogs") },
        { name:"dogs is in the runtime", step:3, expected_kind:"memory", check:(s:MemRt) => !s.globals.get(0).has("dogs") }]
  },
  {
    name:"Functions and Closures",
    source:`Func<int, Func<int,int>, Func<int,int>, Func<int,int>> choose = (x, f, g) => x > 0 ? f : (y => g(x*y));

var l = choose(3, x => x+1, x => x*2);
var m = choose(-5, x => x-1, x => x/2);
var x = m(7);
typechecker_debugger;
debugger;
`,
checks:[{ name:"l is in scope", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => !s.has("l") },
        { name:"l is in the runtime", step:3, expected_kind:"memory", check:(s:MemRt) => !s.globals.get(0).has("l") }]
  },
  {
    name:"Classes",
    source:`class Vector2 {
  public double x;
  public double y;

  public Vector2(double x, double y) {
    this.x = x ;
    this.y = y;
  }

  public Vector2 Plus(Vector2 v) {
    return new Vector2(this.x + v.x, this.y + v.y);
  }
}

var v1 = new Vector2(10.0, 5.0);
var v2 = v1.Plus(new Vector2(1.0, 2.0));
typechecker_debugger;
debugger;
`,
checks:[{ name:"v1 is in scope", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => !s.has("v1") },
        { name:"v1 is in the runtime", step:3, expected_kind:"memory", check:(s:MemRt) => !s.globals.get(0).has("v1") }]
  },
  {
    name:"Arrays and classes",
    source:`class School {
  (string name, string desc, int points)[] courses;

  public School() {
    this.courses = new (string name, string desc, int points)[0];
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
`,
checks:[{ name:"hr is in scope", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => !s.has("hr") },
        { name:"hr is in the runtime", step:3, expected_kind:"memory", check:(s:MemRt) => !s.globals.get(0).has("hr") }]
  },
  {
    name:"Arrays and classes",
    source:`int AddArray(int[] a) {
  int sum = 0;
  for(int i = 0; i < a.Length; i = i + 1) {
    sum = sum + a[i];
  }
  return sum;
}

int MinArray(int[] a) {
  int min = a[0];
  for(int i = 1; i < a.Length; i = i + 1) {
    if(a[i] < min) { min = a[i]; }
  }
  return min;
}

Func<Func<int[],int>, Func<int[],int>, Func<bool, int>> f = (g,h) => b => b ? g(new int[]  { 1, 2, 3 }) : h(new int[] {4, 5, 6});

var l = f(AddArray, MinArray);
var res1 = l(true);
var res2 = l(false);
typechecker_debugger;
debugger;
`,
checks:[{ name:"res1 is in scope", step:1, expected_kind:"bindings", check:(s:CSharp.Bindings) => !s.has("res1") },
        { name:"res1 is in the runtime", step:3, expected_kind:"memory", check:(s:MemRt) => !s.globals.get(0).has("res1") }]
  },
])


