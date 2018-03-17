"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DebuggerStream = require("./csharp_debugger_stream");
var csharp_debugger_stream_1 = require("./csharp_debugger_stream");
console.log("Running tests");
var assert_equal = function (a, b) { return a == b ? true : console.log("\u001B[31mtest \"" + JSON.stringify(a) + "\" and \"" + JSON.stringify(b) + "\" should be equal") || false; };
var run_checks = function (tests) {
    console.clear();
    var num_checks = tests.map(function (t) { return t.checks.length; }).reduce(function (a, b) { return a + b; }, 0);
    var check_index = 0;
    tests.forEach(function (test) {
        var stream = csharp_debugger_stream_1.get_stream(test.source);
        var steps = DebuggerStream.run_stream_to_end(stream).toArray();
        test.checks.forEach(function (check, check_i) {
            if (steps.length < check.step) {
                console.log("\u001B[31mtest \"" + test.name + "\"::\"" + check.name + "\" failed: the required step does not exist");
                process.exit(1);
            }
            var step = steps[check.step];
            if (!(check.expected_kind == "bindings" && step.kind == "bindings" ? check.check(step.state.bindings)
                : check.expected_kind == "memory" && step.kind == "memory" ? check.check(step.memory)
                    : check.expected_kind == "error" && step.kind == "message")) {
                console.log("\u001B[31mtest \"" + test.name + "\"::\"" + check.name + "\" failed its check, " + JSON.stringify(step));
                process.exit(1);
            }
            console.log("\u001B[32m[" + (check_index++ + 1) + "/" + num_checks + "] test \"" + test.name + "\"::\"" + check.name + "\" succeeded");
        });
    });
    console.log("\x1b[37mdone");
};
run_checks([
    { name: "primitives",
        source: "int x;\n    int y = 10;\n    bool z = true;\n    string s = \"Hello statically typed languages!\";\n    typechecker_debugger;",
        checks: [
            { name: "x is int", step: 0, expected_kind: "bindings", check: function (s) { return s.get("x").kind == "int"; } },
            { name: "s is string", step: 0, expected_kind: "bindings", check: function (s) { return s.get("s").kind == "string"; } }
        ] },
    { name: "primitives",
        source: "int x = 10;\n    int n = 1;\n    while(x > 0){\n      n  = n * x;\n      x  = x - 1;\n    }\n    typechecker_debugger;",
        checks: [
            { name: "x is int", step: 0, expected_kind: "bindings", check: function (s) { return s.get("x").kind == "int"; } },
            { name: "n is int", step: 0, expected_kind: "bindings", check: function (s) { return s.get("n").kind == "int"; } },
        ] },
    {
        name: "primitive error",
        source: "int x = 10;\n    int n = 1;\n    while (x > \"0\") {\n      n = n * x;\n      x = x - 1;\n    }",
        checks: [{ name: "does not compile", step: 0, expected_kind: "error" }]
    },
    {
        name: "square drawing",
        source: "string s = \"\";\n    int i = 0;\n    int h = 10;\n    while(i < 5){\n      s  = s + \"*****\\n\";\n      i  = i + 1;\n    }\n    typechecker_debugger;",
        checks: [
            { name: "h is int", step: 0, expected_kind: "bindings", check: function (s) { return assert_equal(s.get("h").kind, "int"); } },
            { name: "s is square", step: 2, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("s").v, "*****\\n*****\\n*****\\n*****\\n*****\\n"); } }
        ]
    },
    {
        name: "scope",
        source: "int x = 10;\n    if(x > 0){\n      int y = 2;\n      x  = x * y;\n      typechecker_debugger;\n      debugger;\n    }\n    else{\n      int z = 3;\n      x  = x * z;\n      typechecker_debugger;\n      debugger;\n    }\n    typechecker_debugger;\n    debugger;",
        checks: []
    },
    {
        name: "scope and loops",
        source: "string s = \"\";\n    int i = 0;\n    int h = 5;\n    int w = 5;\n    debugger;\n    while(i < h){\n      typechecker_debugger;\n      int j = 0;\n      while(j < w){\n        s  = s + \"*\";\n        j  = j + 1;\n      }\n      s  = s + \"\n\";\n      i  = i + 1;\n      typechecker_debugger;\n      debugger;\n    }\n    typechecker_debugger;\n    debugger;",
        checks: []
    },
    {
        name: "tuples",
        source: "(string,string) person = (\"John\",\"Doe\");\n    string name = person.Item1;\n    string surname = person.Item2;\n    typechecker_debugger;",
        checks: []
    },
    {
        name: "functions",
        source: "int quadratic (int a,int b,int c,int x){\n      debugger;\n      typechecker_debugger;\n      return a * x * x + b * x + c;\n    }\n    int y = quadratic (1, 2,3,4);\n    typechecker_debugger;",
        checks: []
    },
    {
        name: "functions",
        source: "string describe (int x){\n      typechecker_debugger;\n      debugger;\n      if(x % 2 == 0){\n        return \"even\";\n      }\n      else{\n        return \"odd\";\n      }\n    }\n    var s1 = describe (100);\n    var s2 = describe (101);\n    typechecker_debugger;",
        checks: []
    },
    {
        name: "recursion",
        source: "int factorial (int x){\n      typechecker_debugger;\n      debugger;\n      var res = 1;\n      if(x <= 0){\n        return res;\n      }\n      else{\n        var p = x;\n        var prev_x = x + -1;\n        var q =     factorial (prev_x);\n        typechecker_debugger;\n        res  = p * q;\n      }\n      typechecker_debugger;\n      return res;\n    }\n    var x = factorial (5);\n    typechecker_debugger;",
        checks: []
    },
    { name: "anonymous functions",
        source: "\n    Func<int,int> d = x => x * 2;\n    Func<int,int> p2 = x => x + 2;\n    Func<int,int> then (Func<int,int> f,Func<int,int> g){\n      typechecker_debugger;\n      return x => g (f (x));\n    }\n    Func<int,int> d_p2 = then (d,p2);\n    typechecker_debugger;",
        checks: [
            { name: "f is Func", step: 0, expected_kind: "bindings",
                check: function (s) {
                    var f = s.get("f");
                    return f.kind == "fun" && f.in.kind == "tuple" && f.in.args[0].kind == "int" && f.out.kind == "int";
                }
            }
        ]
    },
    {
        name: "currying and closures",
        source: "Func<int,Func<int,Func<int,int>>> add_mul = x => (y => (z => x * (y + z)));\n    Func<int,Func<int,int>> add_double = add_mul (2);\n    Func<int,Func<int,int>> add_triple = add_mul (3);\n    typechecker_debugger;\n    Func<int,int> f = add_double (4);\n    debugger;\n    int a = f (2);\n    debugger;\n    Func<int,int> g = add_triple (5);\n    debugger;\n    int b = g (1);\n    debugger;\n    typechecker_debugger;",
        checks: []
    },
    {
        name: "arrays",
        source: "int n = 5;\n    int[] fibo = new int[n];\n    fibo[0] = 0;\n    fibo[1] = 1;\n    for(int i = 2; i < n; i  = i + 1){\n      fibo[i] = fibo[i + -1] + fibo[i + -2];\n    }",
        checks: []
    },
    {
        name: "counter",
        source: "class Counter {\n      int cnt;\n      public  Counter(){\n        this.cnt = 0;\n        debugger;\n      }\n      public void tick(){\n        this.cnt = this.cnt + 1;\n        debugger;\n      }\n    }\n    typechecker_debugger;\n    Counter c = new Counter ();\n    c.tick ();\n    c.tick ();",
        checks: []
    },
    {
        name: "shared references",
        source: "class MyClass {\n      int field;\n      public  MyClass(int f){\n        this.field = f;\n      }\n      public void do_something(){\n        this.field = this.field * 2 + 1;\n      }\n    }\n    var c1 = new MyClass (10);\n    var c2 = c1;\n    debugger;\n    c1.do_something ();\n    debugger;\n    c2.do_something ();",
        checks: []
    },
    {
        name: "double counter (private field)",
        source: "class DoubleCounter {\n      private int cnt;\n      public  DoubleCounter(){\n        this.cnt = 0;\n      }\n      public int inspect(){\n        return this.cnt;\n      }\n     public void tick(){\n        typechecker_debugger;\n        this.cnt = this.cnt + 2;\n        typechecker_debugger;\n      }\n    }\n    var c = new DoubleCounter ();\n    c.tick ();\n    typechecker_debugger;\n    c.cnt = c.cnt + 1;\n    typechecker_debugger;",
        checks: []
    },
    {
        name: "counter or cat",
        source: "  class CounterOrCat {\n      private bool is_cat;\n      private int cnt;\n      public  CounterOrCat(bool is_cat){\n        this.cnt = 0;\n        this.is_cat = is_cat;\n      }\n      public int increment(){\n        if(this.is_cat){\n          return 0;\n        }\n        else{\n          return this.cnt;\n        }\n      }\n     public void tick(){\n        if(this.is_cat == false){\n          this.cnt = this.cnt + 1;\n        }\n      }\n     public string meow(){\n        if(this.is_cat){\n          return \"meow!\";\n        }\n        else{\n          return \"I cannot meow, I am a counter.\";\n        }\n      }\n    }\n    var cat = new CounterOrCat (true);\n    var cnt = new CounterOrCat (false);\n    var a = cat.meow ();\n    var b = cnt.meow ();\n    cat.tick ();\n    cnt.tick ();\n    debugger;",
        checks: []
    },
    {
        name: "cat class",
        source: "class Cat {\n      private string msg;\n      public  Cat(){\n        this.msg = \"meow!\";\n      }\n      public string meow(){\n        return this.msg;\n      }\n    }\n    var cat1 = new Cat ();\n    var cat2 = new Cat ();\n    debugger;\n    var a = cat1.meow ();\n    var b = cat2.meow ();\n    debugger;",
        checks: []
    }
]);
