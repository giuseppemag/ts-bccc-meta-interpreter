"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts_bccc_1 = require("ts-bccc");
var DebuggerStream = require("./csharp_debugger_stream");
var CSharp = require("./CSharpTypeChecker/csharp");
var csharp_debugger_stream_1 = require("./csharp_debugger_stream");
console.log("Running tests");
var assert_equal = function (a, b) { return a == b ? true : console.log("\u001B[31m assertion: \"" + JSON.stringify(a) + "\" and \"" + JSON.stringify(b) + "\" should be equal") || false; };
var run_checks = function (tests, only_test) {
    //console.clear()
    var num_checks = tests.map(function (t) { return t.checks.length; }).reduce(function (a, b) { return a + b; }, 0);
    var check_index = 0;
    tests.forEach(function (test) {
        if (only_test && test.name != only_test)
            return;
        console.log("\u001B[32m test \"" + test.name + "\" started");
        var stream = csharp_debugger_stream_1.get_stream(test.source, ts_bccc_1.apply(ts_bccc_1.inr(), {}));
        var steps = DebuggerStream.run_stream_to_end(stream).toArray();
        if (test.checks.length == 0) {
            if (steps[0].kind == "message") {
                console.log("\u001B[31mtest \"" + test.name + " failed its check");
                process.exit(1);
            }
        }
        test.checks.forEach(function (check, check_i) {
            if (steps.length < check.step) {
                console.log("\u001B[31mtest \"" + test.name + "\"::\"" + check.name + "\" failed: the required step does not exist");
                process.exit(1);
            }
            var step = steps[check.step];
            if (!(check.expected_kind == "bindings" && step.kind == "bindings" ? check.check(step.state.bindings)
                : check.expected_kind == "memory" && step.kind == "memory" ? check.check(step.memory)
                    : check.expected_kind == "error" && step.kind == "message")) {
                console.log("\u001B[31mtest \"" + test.name + "\"::\"" + check.name + "\" failed its check at step " + JSON.stringify(step.kind == "memory" ? step.memory : step.kind == "bindings" ? step.state.bindings : step.message));
                process.exit(1);
            }
            console.log("\u001B[32m[" + (check_index++ + 1) + "/" + num_checks + "] test \"" + test.name + "\"::\"" + check.name + "\" succeeded");
        });
    });
    console.log("\x1b[37mdone");
};
run_checks([
    { name: "operators",
        source: "var a = 2 + 5;\n    var b = 5 * 1.5f;\n    var c = 2.5 + (5 * 1.5f);\n    var d = \"a\" + a;\n    var e = !((d == \"c\") || (c > b));\n    var f = (a <= c) && (b == c);\n\n    typechecker_debugger;",
        checks: [
            { name: "a is int", step: 1, expected_kind: "bindings", check: function (s) { return s.get("a").kind == "int"; } },
            { name: "b is float", step: 1, expected_kind: "bindings", check: function (s) { return s.get("b").kind == "float"; } },
            { name: "c is double", step: 1, expected_kind: "bindings", check: function (s) { return s.get("c").kind == "double"; } },
            { name: "d is string", step: 1, expected_kind: "bindings", check: function (s) { return s.get("d").kind == "string"; } },
            { name: "e is bool", step: 1, expected_kind: "bindings", check: function (s) { return s.get("e").kind == "bool"; } },
            { name: "f is bool", step: 1, expected_kind: "bindings", check: function (s) { return s.get("f").kind == "bool"; } },
            { name: "a is 7", step: 3, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("a").v, 7); } },
            { name: "b is 7.5", step: 3, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("b").v, 7.5); } },
            { name: "c is 10", step: 3, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("c").v, 10); } },
            { name: "d is \"a7\"", step: 3, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("d").v, "a7"); } },
            { name: "e is false", step: 3, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("e").v, false); } },
            { name: "f is false", step: 3, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("f").v, false); } },
        ] },
    { name: "primitives",
        source: "int x;\n    int y = 10;\n    bool z = true;\n    string s = \"Hello statically typed languages!\";\n    typechecker_debugger;",
        checks: [
            { name: "x is int", step: 1, expected_kind: "bindings", check: function (s) { return s.get("x").kind == "int"; } },
            { name: "s is string", step: 1, expected_kind: "bindings", check: function (s) { return s.get("s").kind == "string"; } }
        ] },
    { name: "primitive casting",
        source: "var x = 10 as string;\n    typechecker_debugger;",
        checks: [
            { name: "x is int", step: 1, expected_kind: "bindings", check: function (s) { return s.get("x").kind == "string"; } },
        ] },
    { name: "while loop",
        source: "int x = 10;\n    int n = 1;\n    while(x > 0){\n      n  = n * x;\n      x  = x - 1;\n    }\n    typechecker_debugger;",
        checks: [
            { name: "x is int", step: 1, expected_kind: "bindings", check: function (s) { return s.get("x").kind == "int"; } },
            { name: "n is int", step: 1, expected_kind: "bindings", check: function (s) { return s.get("n").kind == "int"; } },
        ] },
    {
        name: "primitive error",
        source: "int x = 10;\n    int n = 1;\n    while (x > \"0\") {\n      n = n * x;\n      x = x - 1;\n    }",
        checks: [{ name: "does not compile", step: 1, expected_kind: "error" }]
    },
    {
        name: "square drawing",
        source: "string s = \"\";\n    int i = 0;\n    int h = 10;\n    while(i < 5){\n      s  = s + \"*****\\n\";\n      i  = i + 1;\n    }\n    typechecker_debugger;",
        checks: [
            { name: "h is int", step: 1, expected_kind: "bindings", check: function (s) { return assert_equal(s.get("h").kind, "int"); } },
            { name: "s is square", step: 3, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("s").v, "*****\\n*****\\n*****\\n*****\\n*****\\n"); } }
        ]
    },
    {
        name: "scope",
        source: "int x = 10;\n    if(x > 0){\n      int y = 2;\n      x  = x * y;\n      typechecker_debugger;\n      debugger;\n    }\n    else{\n      int z = 3;\n      x  = x * z;\n      typechecker_debugger;\n      debugger;\n    }\n    typechecker_debugger;\n    debugger;",
        checks: [
            { name: "y is int", step: 1, expected_kind: "bindings", check: function (s) { return s.get("y").kind == "int"; } },
            { name: "z is int", step: 2, expected_kind: "bindings", check: function (s) { return s.get("z").kind == "int"; } },
            { name: "y and z removed", step: 3, expected_kind: "bindings", check: function (s) { return !(s.has("y") || s.has("z")); } },
            { name: "y is 2", step: 5, expected_kind: "memory", check: function (s) { return s.globals.get(1).get("y").v == 2; } },
            { name: "y removed", step: 6, expected_kind: "memory", check: function (s) { return s.globals.count() == 1; } },
        ]
    },
    {
        name: "scope and loops",
        source: "string s = \"\";\n    int i = 0;\n    int h = 5;\n    int w = 5;\n    debugger;\n    while(i < h){\n      typechecker_debugger;\n      int j = 0;\n      while(j < w){\n        s  = s + \"*\";\n        j  = j + 1;\n      }\n      s  = s + \"\\n\";\n      i  = i + 1;\n      typechecker_debugger;\n      debugger;\n    }\n    typechecker_debugger;\n    debugger;",
        checks: [
            { name: "initial scope empty", step: 1, expected_kind: "bindings", check: function (s) { return !s.has("j"); } },
            { name: "j added", step: 2, expected_kind: "bindings", check: function (s) { return s.get("j").kind == "int"; } },
            { name: "j removed", step: 3, expected_kind: "bindings", check: function (s) { return !s.has("j"); } },
            { name: "j is 5", step: 6, expected_kind: "memory", check: function (s) { return s.globals.get(1).get("j").v == 5; } },
            { name: "j is 5 again", step: 8, expected_kind: "memory", check: function (s) { return s.globals.get(1).get("j").v == 5; } },
            { name: "scope is popped", step: 11, expected_kind: "memory", check: function (s) { return s.globals.count() == 1; } },
        ]
    },
    {
        name: "tuples",
        source: "(string,string) person = (\"John\",\"Doe\");\n    string name = person.Item1;\n    string surname = person.Item2;\n    typechecker_debugger;",
        checks: [
            { name: "person is tuple", step: 1, expected_kind: "bindings", check: function (s) { return assert_equal(CSharp.type_to_string(s.get("person")), "(string,string)"); } },
        ]
    },
    {
        name: "records",
        source: "(string Name,string Surname) person = (\"John\",\"Doe\");\n    string name = person.Name;\n    string surname = person.Surname;\n    typechecker_debugger;\n    debugger;",
        checks: [
            { name: "person is record", step: 1, expected_kind: "bindings", check: function (s) { return assert_equal(CSharp.type_to_string(s.get("person")), "(string Name,string Surname)"); } },
            { name: "name is \"John\"", step: 3, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("name").v, "John"); } },
        ]
    },
    {
        name: "functions",
        source: "string describe (int x){\n      typechecker_debugger;\n      debugger;\n      if(x % 2 == 0){\n        return \"even\";\n      }\n      else{\n        return \"odd\";\n      }\n    }\n    var s1 = describe (100);\n    var s2 = describe (101);\n\n    Func<float, float> f = x => x * 2.5f;\n    var a = 5;\n    var b = f(a);\n\n    typechecker_debugger;\n    debugger;",
        checks: [
            { name: "x is int", step: 1, expected_kind: "bindings", check: function (s) { return assert_equal(s.get("x").kind, "int"); } },
            { name: "b is float", step: 2, expected_kind: "bindings", check: function (s) { return assert_equal(s.get("b").kind, "float"); } },
            { name: "x is removed", step: 2, expected_kind: "bindings", check: function (s) { return assert_equal(s.has("x"), false); } },
            { name: "s1 is string", step: 2, expected_kind: "bindings", check: function (s) { return assert_equal(s.get("s1").kind, "string"); } },
            { name: "x is 100", step: 4, expected_kind: "memory", check: function (s) { return assert_equal(s.stack.get(0).get(0).get("x").v, 100); } },
            { name: "x is 101", step: 5, expected_kind: "memory", check: function (s) { return assert_equal(s.stack.get(0).get(0).get("x").v, 101); } },
            { name: "s2 is \"odd\"", step: 6, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("s2").v, "odd"); } },
            { name: "b is 12.5\"", step: 6, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("b").v, 12.5); } },
        ]
    },
    {
        name: "recursion",
        source: "int factorial (int x){\n      typechecker_debugger;\n      debugger;\n      var res = 1;\n      if(x <= 0){\n        return res;\n      }\n      else{\n        var p = x;\n        var prev_x = x + -1;\n        var q =     factorial (prev_x);\n        typechecker_debugger;\n        res  = p * q;\n      }\n      typechecker_debugger;\n      return res;\n    }\n    var x = factorial (5);\n    typechecker_debugger;\n    debugger;",
        checks: [
            { name: "x is \"int\"", step: 1, expected_kind: "bindings", check: function (s) { return assert_equal(s.get("x").kind, "int"); } },
            { name: "p is \"int\"", step: 2, expected_kind: "bindings", check: function (s) { return assert_equal(s.get("p").kind, "int"); } },
            { name: "res is \"int\"", step: 3, expected_kind: "bindings", check: function (s) { return assert_equal(s.get("res").kind, "int"); } },
            { name: "function scope cleaned up", step: 4, expected_kind: "bindings", check: function (s) { return s.has("factorial") && s.has("x") && !s.has("res"); } },
            { name: "stack has grown", step: 11, expected_kind: "memory", check: function (s) { return assert_equal(s.stack.count(), 6) && assert_equal(s.stack.get(3).get(0).get("x").v, 2) && assert_equal(s.stack.get(3).get(1).get("p").v, 2); } },
            { name: "stack is cleaned up", step: 12, expected_kind: "memory", check: function (s) { return assert_equal(s.stack.count(), 0) && assert_equal(s.globals.get(0).get("x").v, 5 * 4 * 3 * 2); } },
        ]
    },
    { name: "anonymous functions",
        source: "\n    Func<int,int> d = x => x * 2;\n    Func<int,int> p2 = x => x + 2;\n    Func<int,int> then (Func<int,int> f, Func<int,int> g){\n      typechecker_debugger;\n      return x => g (f (x));\n    }\n    Func<int,int> d_p2 = then(d,p2);\n    typechecker_debugger;\n    var x = d_p2(10);\n    debugger;",
        checks: [
            { name: "f is Func", step: 1, expected_kind: "bindings", check: function (s) { return assert_equal(CSharp.type_to_string(s.get("f")), "Func<int,int>"); } },
            { name: "d is Func", step: 1, expected_kind: "bindings", check: function (s) { return assert_equal(CSharp.type_to_string(s.get("d")), "Func<int,int>"); } },
            { name: "then is Func", step: 1, expected_kind: "bindings", check: function (s) { return assert_equal(CSharp.type_to_string(s.get("then")), "Func<Func<int,int>,Func<int,int>,Func<int,int>>"); } },
            { name: "d_p2 is Func", step: 2, expected_kind: "bindings", check: function (s) { return assert_equal(CSharp.type_to_string(s.get("d_p2")), "Func<int,int>"); } },
            { name: "x is 22", step: 4, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("x").v, 22); } },
        ]
    },
    {
        name: "currying and closures",
        source: "Func<int,Func<int,Func<int,int>>> add_mul = x => (y => (z => x * (y + z)));\n    Func<int,Func<int,int>> add_double = add_mul (2);\n    Func<int,Func<int,int>> add_triple = add_mul (3);\n    typechecker_debugger;\n    Func<int,int> f = add_double (4);\n    debugger;\n    int a = f (2);\n    debugger;\n    Func<int,int> g = add_triple (5);\n    debugger;\n    int b = g (1);\n    debugger;\n    typechecker_debugger;",
        checks: [
            { name: "add_double is Func^2", step: 1, expected_kind: "bindings", check: function (s) { return assert_equal(CSharp.type_to_string(s.get("add_double")), "Func<int,Func<int,int>>"); } },
            { name: "a is 12", step: 5, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("a").v, 12); } },
            { name: "f has 2 and 4 in closure", step: 4, expected_kind: "memory", check: function (s) {
                    var f = s.globals.get(0).get("f").v;
                    return assert_equal(f.closure.get("x").v, 2) && assert_equal(f.closure.get("y").v, 4);
                } },
            { name: "g has 3 and 5 in closure", step: 6, expected_kind: "memory", check: function (s) {
                    var g = s.globals.get(0).get("g").v;
                    return assert_equal(g.closure.get("x").v, 3) && assert_equal(g.closure.get("y").v, 5);
                } },
            { name: "b is 18", step: 7, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("b").v, 18); } },
        ]
    },
    {
        name: "arrays",
        source: "int n = 8;\n    int[] fibo = new int[n];\n    fibo[0] = 0;\n    fibo[1] = 1;\n    for(int i = 2; i < n; i  = i + 1){\n      fibo[i] = fibo[i + -1] + fibo[i + -2];\n    }\n    typechecker_debugger;\n    debugger;\n    ",
        checks: [
            { name: "fibo is int[]", step: 1, expected_kind: "bindings", check: function (s) { return assert_equal(CSharp.type_to_string(s.get("fibo")), "int[]"); } },
            { name: "fibo is a reference", step: 3, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("fibo").v, "ref_0"); } },
            { name: "ref_0 contains the array", step: 3, expected_kind: "memory", check: function (s) {
                    var fibo = s.heap.get("ref_0").v;
                    return assert_equal(fibo.length, 8) && assert_equal(fibo.elements.get(0).v, 0) &&
                        assert_equal(fibo.elements.get(7).v, 13);
                } },
        ]
    },
    {
        name: "counter",
        source: "class Counter {\n      private int cnt = -5;\n      public Counter() {\n        debugger;\n        this.cnt = 0;\n        debugger;\n      }\n      public void tick() {\n        this.cnt = this.cnt + 1;\n        debugger;\n      }\n    }\n    Counter c = new Counter ();\n    typechecker_debugger;\n    c.tick ();\n    c.tick ();\n    debugger;",
        checks: [
            { name: "c is Counter", step: 1, expected_kind: "bindings", check: function (s) { return assert_equal(CSharp.type_to_string(s.get("c")), "Counter"); } },
            { name: "cnt starts at -5", step: 3, expected_kind: "memory", check: function (s) {
                    var c = s.heap.get("ref_0").v;
                    return assert_equal(c.get("cnt").v, -5);
                } },
            { name: "this is a reference inside cons", step: 3, expected_kind: "memory", check: function (s) { return assert_equal(s.stack.get(0).get(0).get("this").v, "ref_0"); } },
            { name: "this is a reference inside \"tick\"", step: 5, expected_kind: "memory", check: function (s) { return assert_equal(s.stack.get(0).get(0).get("this").v, "ref_0"); } },
            { name: "c is a reference", step: 7, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("c").v, "ref_0"); } },
            { name: "cnt is 2", step: 7, expected_kind: "memory", check: function (s) {
                    var c = s.heap.get("ref_0").v;
                    return assert_equal(c.get("cnt").v, 2);
                } },
        ]
    },
    {
        name: "shared references",
        source: "class MyClass {\n      int field;\n      public  MyClass(int f){\n        this.field = f;\n      }\n      public void do_something(){\n        this.field = this.field * 2 + 1;\n      }\n    }\n    var c1 = new MyClass (10);\n    var c2 = c1;\n    debugger;\n    c1.do_something ();\n    debugger;\n    c2.do_something ();\n    debugger;",
        checks: [
            { name: "c1 is a reference", step: 2, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("c1").v, "ref_0"); } },
            { name: "c2 is the same reference", step: 2, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("c2").v, "ref_0"); } },
            { name: "field is 21", step: 3, expected_kind: "memory", check: function (s) {
                    var c = s.heap.get("ref_0").v;
                    return assert_equal(c.get("field").v, 21);
                } },
            { name: "field is 43", step: 4, expected_kind: "memory", check: function (s) {
                    var c = s.heap.get("ref_0").v;
                    return assert_equal(c.get("field").v, 43);
                } },
        ]
    },
    {
        name: "double counter (private field)",
        source: "class DoubleCounter {\n      private int cnt;\n      public  DoubleCounter(){\n        this.cnt = 0;\n      }\n      public int inspect(){\n        return this.cnt;\n      }\n     public void tick(){\n        this.cnt = this.cnt + 2;\n      }\n    }\n    var c = new DoubleCounter ();\n    typechecker_debugger;\n    c.cnt = 10;\n    typechecker_debugger;",
        checks: [
            { name: "c is \"DoubleCounter\"", step: 1, expected_kind: "bindings", check: function (s) { return assert_equal(CSharp.type_to_string(s.get("c")), "DoubleCounter"); } },
            { name: "access to \"c.cnt\" is prevented", step: 2, expected_kind: "error" },
        ]
    },
    {
        name: "static fields and methods",
        source: "class StaticContainer {\n      static private int cnt = 5;\n      static public int incr(int dx) {\n        StaticContainer.cnt = StaticContainer.cnt + dx;\n        return StaticContainer.cnt;\n      }\n    }\n    var y = StaticContainer.incr(10);\n    debugger;\n    ",
        checks: [
            { name: "cnt is 15", step: 2, expected_kind: "memory", check: function (s) { return assert_equal(s.classes.get("StaticContainer").static_fields.get("cnt").v, 15); } },
            { name: "y is 15", step: 2, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("y").v, 15); } },
        ]
    },
    {
        name: "quadratic function",
        source: "int quadratic (int a,int b,int c,int x){\n      debugger;\n      typechecker_debugger;\n      return a * x * x + b * x + c;\n    }\n    var y = quadratic (1,2,3,4);\n    typechecker_debugger;\n    debugger;",
        checks: [
            { name: "quadratic is a function", step: 1, expected_kind: "bindings", check: function (s) { return assert_equal(CSharp.type_to_string(s.get("quadratic")), "Func<int,int,int,int,int>"); } },
            { name: "x is 4", step: 4, expected_kind: "memory", check: function (s) { return assert_equal(s.stack.get(0).get(0).get("x").v, 4); } },
            { name: "y is result", step: 6, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("y").v, 1 * 4 * 4 + 2 * 4 + 3); } },
        ]
    },
    {
        name: "Vector2",
        source: "class Vector2 {\n  public double x;\n  public double y;\n  public Vector2(double x, double y){\n    this.x = x;\n    this.y = y;\n  }\n  public double Length(){\n    return Math.sqrt(this.x * this.x + this.y * this.y);\n  }\n  public static Vector2 Plus(Vector2 v1, Vector2 v2){\n    return new Vector2(v1.x + v2.x, v1.y + v2.y);\n  }\n  public static Vector2 Minus(Vector2 v1, Vector2 v2){\n    return new Vector2(v1.x - v2.x, v1.y - v2.y);\n  }\n  public static Vector2 Times(Vector2 v1, double c){\n    return new Vector2(v1.x * c, v1.y * c);\n  }\n  public static Vector2 Div(Vector2 v1, double c){\n    return Vector2.Times(v1, 1.0 / c);\n  }\n}\n\nvar v1 = new Vector2(0.0,0.0);\nvar v2 = new Vector2(10.0,5.0);\nvar v3 = Vector2.Times(v1, 1.0);\ntypechecker_debugger;\ndebugger;",
        checks: [{ name: "v1 is in scope", step: 1, expected_kind: "bindings", check: function (s) { return s.has("v1"); } },
            { name: "v1 is in the runtime", step: 3, expected_kind: "memory", check: function (s) { return s.globals.get(0).has("v1"); } }]
    },
    {
        name: "DataSet1",
        source: "class DataSet{\n  (float, float, float)[] elems;\n  public DataSet((float, float, float)[] elems){\n    this.elems = elems;\n  }\n  public (float, float, float) ComputeAverage(){\n    (float, float, float) acc = (0.0f,0.0f,0.0f);\n    float total = 0.0f;\n    for(int i = 0; i < this.elems.Length; i=i+1){\n      var Item1 = this.elems[i].Item1 + acc.Item1;\n      var Item2 = this.elems[i].Item2 + acc.Item2;\n      var Item3 = this.elems[i].Item3 + acc.Item3;\n      acc = (Item1, Item2, Item3);\n      total = total + 1.0f;\n    }\n    return (acc.Item1 / total, acc.Item2 / total, acc.Item3 / total);\n  }\n}\n\n(float, float, float)[] elems = new (float, float, float)[]{(1.0f,1.0f,1.0f), (2.0f,2.0f,2.0f)};\nDataSet ds = new DataSet(elems);\nvar res = ds.ComputeAverage();\ntypechecker_debugger;\ndebugger;",
        checks: [{ name: "elems is in scope", step: 1, expected_kind: "bindings", check: function (s) { return s.has("elems"); } },
            { name: "elems is in the runtime", step: 3, expected_kind: "memory", check: function (s) { return s.globals.get(0).has("elems"); } }]
    },
    {
        name: "DataSet2",
        source: "class DataSet{\n  double[] elems;\n  public DataSet(double[] elems){\n    this.elems = elems;\n  }\n  public double Minimum(){\n    double min = this.elems[0];\n    for(int i = 1; i < this.elems.Length; i=i+1){\n      if(this.elems[i] < min){\n        min = this.elems[i];\n      }\n    }\n    return min;\n  }\n\n  public double Maximum(){\n    double max = this.elems[0];\n    for(int i = 1; i < this.elems.Length; i=i+1){\n      if(this.elems[i] > max){\n        max = this.elems[i];\n      }\n    }\n    return max;\n  }\n  public double MostFrequent(){\n    int max_freq = 0;\n    double most_freq = 0.0;\n    for(int i = 0; i < this.elems.Length; i=i+1){\n      int i_freq = 0;\n      for(int j = 0; j < this.elems.Length; j=j+1){\n        if(this.elems[i] == this.elems[j]){\n          i_freq = i_freq + 1;\n        }\n      }\n      if(i_freq > max_freq){\n        max_freq = i_freq;\n        most_freq = this.elems[i];\n      }\n    }\n    return most_freq;\n  }\n}\ndouble[] elems = new double[]{1.0,1.0,1.0,2.0,2.0,2.0};\nDataSet ds = new DataSet(elems);\nvar res1 = ds.Minimum();\nvar res2 = ds.Maximum();\nvar res3 = ds.MostFrequent();\ntypechecker_debugger;\ndebugger;",
        checks: [{ name: "elems is in scope", step: 1, expected_kind: "bindings", check: function (s) { return s.has("elems"); } },
            { name: "elems is in the runtime", step: 3, expected_kind: "memory", check: function (s) { return s.globals.get(0).has("elems"); } }]
    },
    {
        name: "DataSet3",
        source: "class DataSet{\n  double[] elems;\n  public DataSet(double[] elems){\n    this.elems = elems;\n  }\n\n  public DataSet Map(Func<double, double> f){\n    double[] new_elems = new double[this.elems.Length];\n    for(int i = 0; i < this.elems.Length; i=i+1){\n      new_elems[i] = f(this.elems[i]);\n    }\n    return new DataSet(new_elems);\n  }\n  public void MutableMap(Func<double, double> f){\n    for(int i = 0; i < this.elems.Length; i=i+1){\n      this.elems[i] = f(this.elems[i]);\n    }\n  }\n}\ndouble[] elems = new double[]{1.0,1.0,1.0,2.0,2.0,2.0};\nDataSet ds = new DataSet(elems);\nvar res1 = ds.Map(x => x + 1);\nds.MutableMap(x => x + 1);\ntypechecker_debugger;\ndebugger;",
        checks: [{ name: "elems is in scope", step: 1, expected_kind: "bindings", check: function (s) { return s.has("elems"); } },
            { name: "elems is in the runtime", step: 3, expected_kind: "memory", check: function (s) { return s.globals.get(0).has("elems"); } }]
    },
    {
        name: "Arrays",
        source: "var a = new int[] { 0, 1, 2, 3 };\nvar b = new int[] { 4, 5, 6, 7 };\nvar c = a;\nif( c[0] >= 0 )\n  c = b;\nc[0] = 100;\ntypechecker_debugger;\ndebugger;",
        checks: [{ name: "b is in scope", step: 1, expected_kind: "bindings", check: function (s) { return s.has("b"); } },
            { name: "b is in the runtime", step: 3, expected_kind: "memory", check: function (s) { return s.globals.get(0).has("b"); } }]
    },
    {
        name: "Arrays",
        source: "Func<int, string[], string> f = (i, a) => a[i];\n(string,string) v = ( f( 2, (new string[] { \"a\", \"b\", \"c\", \"d\" })), f( 1, (new string[] { \"e\", \"f\" })) );\ndebugger;\ntypechecker_debugger;\n",
        checks: [{ name: "v is in scope", step: 1, expected_kind: "bindings", check: function (s) { return s.has("v"); } },
            { name: "v is in the runtime", step: 3, expected_kind: "memory", check: function (s) { return s.globals.get(0).has("v"); } }]
    },
    {
        name: "Classes",
        source: "class Dog {\n  string name;\n\n  public Dog(string n) {\n    this.name = n;\n  }\n  public string bark() {\n    debugger;\n    return \"whoof \" + this.name;\n  }\n}\n\nvar dogs = new Dog[] { new Dog(\"Pedro\"), new Dog(\"Avena\") };\nvar s = dogs[1].bark();\ntypechecker_debugger;\ndebugger;\n",
        checks: [{ name: "dogs is in scope", step: 1, expected_kind: "bindings", check: function (s) { return s.has("dogs"); } },
            { name: "dogs is in the runtime", step: 3, expected_kind: "memory", check: function (s) { return s.globals.get(0).has("dogs"); } }]
    },
    {
        name: "Functions and Closures",
        source: "Func<int, Func<int,int>, Func<int,int>, Func<int,int>> choose = (x, f, g) => x > 0 ? f : (y => g(x*y));\n\nvar l = choose(3, x => x+1, x => x*2);\nvar m = choose(-5, x => x-1, x => x/2);\nvar x = m(7);\ntypechecker_debugger;\ndebugger;\n",
        checks: [{ name: "l is in scope", step: 1, expected_kind: "bindings", check: function (s) { return s.has("l"); } },
            { name: "l is in the runtime", step: 3, expected_kind: "memory", check: function (s) { return s.globals.get(0).has("l"); } }]
    },
    {
        name: "Classes",
        source: "class Vector2 {\n  public double x;\n  public double y;\n\n  public Vector2(double x, double y) {\n    this.x = x ;\n    this.y = y;\n  }\n\n  public Vector2 Plus(Vector2 v) {\n    return new Vector2(this.x + v.x, this.y + v.y);\n  }\n}\n\nvar v1 = new Vector2(10.0, 5.0);\nvar v2 = v1.Plus(new Vector2(1.0, 2.0));\ntypechecker_debugger;\ndebugger;\n",
        checks: [{ name: "v1 is in scope", step: 1, expected_kind: "bindings", check: function (s) { return s.has("v1"); } },
            { name: "v1 is in the runtime", step: 3, expected_kind: "memory", check: function (s) { return s.globals.get(0).has("v1"); } }]
    },
    {
        name: "Arrays and classes",
        source: "class School {\n  (string name, string desc, int points)[] courses;\n\n  public School() {\n    this.courses = new (string name, string desc, int points)[0];\n  }\n\n  public int TotalPoints() {\n    int tot = 0;\n    for(int i = 0; i < this.courses.Length; i = i + 1) {\n      tot = tot + this.courses[i].points;\n    }\n    return tot;\n  }\n\n  public void AddCourse(string n, string d, int p) {\n    var newAmountCourses = this.courses.Length + 1;\n    (string name, string desc, int points)[] newCourses = new (string name, string desc, int points)[newAmountCourses];\n    for(int i = 0; i < this.courses.Length; i = i + 1) {\n      newCourses[i] = this.courses[i];\n    }\n    newCourses[newAmountCourses-1] = (n, d, p);\n    this.courses = newCourses;\n  }\n}\nvar hr = new School();\nhr.AddCourse(\"Dev1\", \"Basics of programming\", 4);\nhr.AddCourse(\"Dev5\", \"Basics of web development\", 4);\nvar tot_p = hr.TotalPoints();\ntypechecker_debugger;\ndebugger;\n",
        checks: [{ name: "hr is in scope", step: 1, expected_kind: "bindings", check: function (s) { return s.has("hr"); } },
            { name: "hr is in the runtime", step: 3, expected_kind: "memory", check: function (s) { return s.globals.get(0).has("hr"); } }]
    },
    {
        name: "Arrays and classes",
        source: "int AddArray(int[] a) {\n  int sum = 0;\n  for(int i = 0; i < a.Length; i = i + 1) {\n    sum = sum + a[i];\n  }\n  return sum;\n}\n\nint MinArray(int[] a) {\n  int min = a[0];\n  for(int i = 1; i < a.Length; i = i + 1) {\n    if(a[i] < min) { min = a[i]; }\n  }\n  return min;\n}\n\nFunc<Func<int[],int>, Func<int[],int>, Func<bool, int>> f = (g,h) => b => b ? g(new int[]  { 1, 2, 3 }) : h(new int[] {4, 5, 6});\n\nvar l = f(AddArray, MinArray);\nvar res1 = l(true);\nvar res2 = l(false);\ntypechecker_debugger;\ndebugger;\n",
        checks: [{ name: "res1 is in scope", step: 1, expected_kind: "bindings", check: function (s) { return s.has("res1"); } },
            { name: "res1 is in the runtime", step: 3, expected_kind: "memory", check: function (s) { return s.globals.get(0).has("res1"); } }]
    },
    {
        name: "Lambda's in different contexts",
        source: "  class C {\n    Func<int,int> f;\n    public C() {\n      this.f = a => a * 3;\n    }\n\n    public void reset(Func<int,int> f) {\n      this.f = f;\n    }\n\n    public int invoke(int arg) {\n      return this.f(arg);\n    }\n  }\n\n\n  var a = new Func<int,int>[2];\n  a[0] = x => x + 1;\n  a[1] = x => x * 2;\n\n  var y1 = a[1](4);\n\n  var c = new C();\n  var y2 = c.invoke(5);\n  c.reset(x => x / 2);\n  var y3 = c.invoke(20);\n  debugger;",
        checks: [
            { name: "y1 is 8", step: 2, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("y1").v, 8); } },
            { name: "y2 is 15", step: 2, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("y2").v, 15); } },
            { name: "y3 is 10", step: 2, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("y3").v, 10); } },
        ]
    },
    {
        name: "Simple method overloading",
        source: "class A {\n      public int Run(){\n        return 10000000000;\n      }\n      public int Run(int x){\n        return 90000000000 * x;\n      }\n      public string Run(int x){\n        return \"9000\";\n      }\n    }\n    A a = new A();\n    int res1 = a.Run(5);\n    int res2 = a.Run();\n    string res3 = a.Run(1);\n    debugger;",
        checks: [
            { name: "res1 is 450000000000", step: 2, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("res1").v, 450000000000); } },
            { name: "res2 is 10000000000", step: 2, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("res2").v, 10000000000); } },
            { name: "res3 is 9000", step: 2, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("res3").v, "9000"); } },
        ]
    },
    {
        name: "Fields/methods overloading",
        source: "  class A {\n      double a;\n      public A(int a, int x){\n        this.a = a;\n        this.b = 10;\n      }\n      protected int b;\n      protected int GetB(){\n        return this.b;\n      }\n      public virtual double GetA(){\n        return this.a;\n      }\n    }\n\n    class AAA : A {\n      int aaa;\n      public AAA (int aaa) : base(aaa, 5){\n        this.aaa = aaa;\n      }\n      public override double GetA(){\n        return this.aaa;\n      }\n    }\n\n    AAA aaa = new AAA(555);\n    double _aaa = aaa.GetA();\n    int x = aaa.b;\n    int y = aaa.GetB();\n    debugger;",
        checks: [
            { name: "x is 10", step: 2, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("x").v, 10); } },
            { name: "y is 10", step: 2, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("y").v, 10); } },
        ]
    },
    {
        name: "Star trek",
        source: "class Vector2 {\n      public double x;\n      double y;\n      public Vector2(double x, double y){\n        this.x = x;\n        this.y = y;\n      }\n      public Vector2 Mul(double c){\n        return new Vector2(this.x * c, this.y * c);\n      }\n      public void Sum(Vector2 v1){\n        this.x = this.x + v1.x;\n        this.y = this.y + v1.y;\n      }\n    }\n    interface Ship {\n      void Update(double delta_time);\n    }\n\n    class SimpleSpaceShip : Ship {\n      public Vector2 position;\n      Vector2 velocity;\n\n      public SimpleSpaceShip(Vector2 pos, Vector2 vel){\n        this.position = pos;\n        this.velocity = vel;\n      }\n\n      public override void Update(double dt){\n        this.position.Sum(this.velocity.Mul(dt));\n      }\n    }\n\n    class WarpEngine{\n      double current_warp_factor;\n      double max_warp;\n      public WarpEngine(){\n        this.current_warp_factor = 0.0;\n        this.max_warp = 5.0;\n      }\n      public void SetWarpFactor(double factor){\n        this.current_warp_factor = Math.min(factor, this.max_warp);\n      }\n      public double GetWarpSpeed(){\n        var warp_factor = this.current_warp_factor;\n        var speed_light = 1.0;\n        return speed_light / Math.pow(warp_factor, 10.0/3.0);\n      }\n    }\n\n\n\n    abstract ShipDecorator : Ship {\n      public Ship ship;\n      public ShipDecorator(Ship ship){\n        this.ship = ship;\n      }\n    }\n\n\n    class EnterpriseNX01 : ShipDecorator {\n      private WarpEngine warp_engine;\n      public EnterpriseNX01(Ship ship):base(ship){\n        this.ship = ship;\n        this.warp_engine = new WarpEngine();\n      }\n      public void GoToWarp(double factor){\n        this.warp_engine.SetWarpFactor(factor);\n      }\n      public override void Update(double dt){\n        var multiplier = this.warp_engine.GetWarpSpeed();\n        this.ship.Update(dt * multiplier);\n      }\n    }\n\n    var p1 = new Vector2(0.0,0.0);\n    var v1 = new Vector2(10.0,10.0);\n    SimpleSpaceShip s = new SimpleSpaceShip(p1, v1);\n    EnterpriseNX01 nx1 = new EnterpriseNX01(s);\n    nx1.GoToWarp(3.0);\n\n    var p2 = new Vector2(0.0,100.0);\n    var v2 = new Vector2(10.0,10.0);\n    Ship tv = new SimpleSpaceShip(p2, v2);\n\n    Ship[] fleet = new Ship[]{ nx1, tv };\n    for(int i = 0; i < fleet.Length; i = i + 1 ){\n      fleet[i].Update(0.16);\n    }\n    double res = s.position.x;\n    debugger;",
        checks: [
            { name: "res is 0.04108807551707464", step: 2, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("res").v, 0.04108807551707464); } }
        ]
    },
    {
        name: "Classes: storage of partially applied this in method lambda's",
        source: "class C {\n      int x;\n      public C(int x) { this.x = x; }\n      public int m(int y) { return this.x + y; }\n    }\n\n    var c1 = new C(1);\n    var c2 = new C(2);\n    var m1 = c1.m;\n    var m2 = c2.m;\n    var r1 = m1(10);\n    var r2 = m2(10);\n    ",
        checks: [
            { name: "r1 is 11.", step: 2, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("r1").v, 11); } },
            { name: "r2 is 12.", step: 2, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("r2").v, 12); } }
        ]
    },
    {
        name: "Filesystem: Special syntax",
        source: "filesystem {\n      fsfile \"/hello_world\" {\n        \"content\": \"hello world!\"\n      }\n\n      fsfile \"/a\" {\n        \"content\": \"1\"\n      }\n      fsfile \"/a\" {\n        \"content\": \"2\"\n      }\n    }",
        checks: [
            { name: "A fsfile should be assigned.", step: 2, expected_kind: "memory", check: function (s) { return s.fs.has("/hello_world"); } },
            { name: "A fsfile should have the correct contents.", step: 2, expected_kind: "memory", check: function (s) { return assert_equal(s.fs.get("/hello_world").content, "hello world!"); } },
            { name: "A fsfile will be overwritten if specified twice.", step: 2, expected_kind: "memory", check: function (s) { return assert_equal(s.fs.get("/a").content, "2"); } },
        ]
    },
    {
        name: "Filesystem: Standard Library",
        source: "\n    Path.WriteAllText(\"/b\", \"2\");\n    var exists_a = Path.Exists(\"/a\");\n    var exists_b = Path.Exists(\"/b\");\n    var b = Path.ReadAllText(\"/b\");\n    Path.Copy(\"/b\", \"/c\");\n    Path.Create(\"/d\");\n\n    Path.Create(\"/e\");\n    Path.Delete(\"/e\");\n\n    Path.WriteAllText(\"/f\", \"0\");\n    Path.Move(\"/f\", \"/g\");\n    ",
        checks: [
            {
                name: "WriteAllText writes file into fs",
                step: 2,
                expected_kind: "memory",
                check: function (s) { return s.fs.get("/b").content == "2"; }
            },
            {
                name: "Exists returns false if file does not exist",
                step: 2,
                expected_kind: "memory",
                check: function (s) {
                    return assert_equal(s.globals.get(0).get("exists_a").v, false);
                }
            },
            {
                name: "Exists returns true if file does exist",
                step: 2,
                expected_kind: "memory",
                check: function (s) {
                    return assert_equal(s.globals.get(0).get("exists_b").v, true);
                }
            },
            {
                name: "ReadAllText reads file from fs",
                step: 2,
                expected_kind: "memory",
                check: function (s) { return s.globals.get(0).get("b").v == "2"; }
            },
            {
                name: "Copy copies file",
                step: 2,
                expected_kind: "memory",
                check: function (s) { return s.fs.get("/c").content == "2"; }
            },
            {
                name: "Create creates empty file",
                step: 2,
                expected_kind: "memory",
                check: function (s) { return s.fs.has("/d") && s.fs.get("/d").content == ""; }
            },
            {
                name: "Delete deletes file",
                step: 2,
                expected_kind: "memory",
                check: function (s) {
                    return !s.fs.has("/e");
                }
            },
            {
                name: "Move moves file",
                step: 2,
                expected_kind: "memory",
                check: function (s) {
                    return !s.fs.has("/f")
                        && s.fs.has("/g")
                        && s.fs.get("/g").content == "0";
                }
            },
        ]
    },
]);
