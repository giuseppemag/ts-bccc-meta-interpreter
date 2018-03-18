"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
                console.log("\u001B[31mtest \"" + test.name + "\"::\"" + check.name + "\" failed its check at step " + JSON.stringify(step.kind == "memory" ? step.memory : step.kind == "bindings" ? step.state.bindings : step.message));
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
        checks: [
            { name: "y is int", step: 0, expected_kind: "bindings", check: function (s) { return s.get("y").kind == "int"; } },
            { name: "z is int", step: 1, expected_kind: "bindings", check: function (s) { return s.get("z").kind == "int"; } },
            { name: "y and z removed", step: 2, expected_kind: "bindings", check: function (s) { return !(s.has("y") || s.has("z")); } },
            { name: "y is 2", step: 4, expected_kind: "memory", check: function (s) { return s.globals.get(1).get("y").v == 2; } },
            { name: "y removed", step: 5, expected_kind: "memory", check: function (s) { return s.globals.count() == 1; } },
        ]
    },
    {
        name: "scope and loops",
        source: "string s = \"\";\n    int i = 0;\n    int h = 5;\n    int w = 5;\n    debugger;\n    while(i < h){\n      typechecker_debugger;\n      int j = 0;\n      while(j < w){\n        s  = s + \"*\";\n        j  = j + 1;\n      }\n      s  = s + \"\\n\";\n      i  = i + 1;\n      typechecker_debugger;\n      debugger;\n    }\n    typechecker_debugger;\n    debugger;",
        checks: [
            { name: "initial scope empty", step: 0, expected_kind: "bindings", check: function (s) { return !s.has("j"); } },
            { name: "j added", step: 1, expected_kind: "bindings", check: function (s) { return s.get("j").kind == "int"; } },
            { name: "j removed", step: 2, expected_kind: "bindings", check: function (s) { return !s.has("j"); } },
            { name: "j is 5", step: 5, expected_kind: "memory", check: function (s) { return s.globals.get(1).get("j").v == 5; } },
            { name: "j is 5 again", step: 7, expected_kind: "memory", check: function (s) { return s.globals.get(1).get("j").v == 5; } },
            { name: "scope is popped", step: 10, expected_kind: "memory", check: function (s) { return s.globals.count() == 1; } },
        ]
    },
    {
        name: "tuples",
        source: "(string,string) person = (\"John\",\"Doe\");\n    string name = person.Item1;\n    string surname = person.Item2;\n    typechecker_debugger;",
        checks: [
            { name: "person is tuple", step: 0, expected_kind: "bindings", check: function (s) { return assert_equal(CSharp.type_to_string(s.get("person")), "(string,string)"); } },
        ]
    },
    {
        name: "records",
        source: "(string Name,string Surname) person = (\"John\",\"Doe\");\n    string name = person.Name;\n    string surname = person.Surname;\n    typechecker_debugger;\n    debugger;",
        checks: [
            { name: "person is record", step: 0, expected_kind: "bindings", check: function (s) { return assert_equal(CSharp.type_to_string(s.get("person")), "(string Name,string Surname)"); } },
            { name: "name is \"John\"", step: 2, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("name").v, "John"); } },
        ]
    },
    {
        name: "functions",
        source: "string describe (int x){\n      typechecker_debugger;\n      debugger;\n      if(x % 2 == 0){\n        return \"even\";\n      }\n      else{\n        return \"odd\";\n      }\n    }\n    var s1 = describe (100);\n    var s2 = describe (101);\n    typechecker_debugger;\n    debugger;",
        checks: [
            { name: "x is int", step: 0, expected_kind: "bindings", check: function (s) { return assert_equal(s.get("x").kind, "int"); } },
            { name: "x is removed", step: 1, expected_kind: "bindings", check: function (s) { return assert_equal(s.has("x"), false); } },
            { name: "s1 is string", step: 1, expected_kind: "bindings", check: function (s) { return assert_equal(s.get("s1").kind, "string"); } },
            { name: "x is 100", step: 3, expected_kind: "memory", check: function (s) { return assert_equal(s.stack.get(0).get(0).get("x").v, 100); } },
            { name: "x is 101", step: 4, expected_kind: "memory", check: function (s) { return assert_equal(s.stack.get(0).get(0).get("x").v, 101); } },
            { name: "s2 is \"odd\"", step: 5, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("s2").v, "odd"); } },
        ]
    },
    {
        name: "recursion",
        source: "int factorial (int x){\n      typechecker_debugger;\n      debugger;\n      var res = 1;\n      if(x <= 0){\n        return res;\n      }\n      else{\n        var p = x;\n        var prev_x = x + -1;\n        var q =     factorial (prev_x);\n        typechecker_debugger;\n        res  = p * q;\n      }\n      typechecker_debugger;\n      return res;\n    }\n    var x = factorial (5);\n    typechecker_debugger;\n    debugger;",
        checks: [
            { name: "x is \"int\"", step: 0, expected_kind: "bindings", check: function (s) { return assert_equal(s.get("x").kind, "int"); } },
            { name: "p is \"int\"", step: 1, expected_kind: "bindings", check: function (s) { return assert_equal(s.get("p").kind, "int"); } },
            { name: "res is \"int\"", step: 2, expected_kind: "bindings", check: function (s) { return assert_equal(s.get("res").kind, "int"); } },
            { name: "function scope cleaned up", step: 3, expected_kind: "bindings", check: function (s) { return assert_equal(s.count(), 2) && s.has("factorial") && s.has("x"); } },
            { name: "stack has grown", step: 10, expected_kind: "memory", check: function (s) { return assert_equal(s.stack.count(), 6) && assert_equal(s.stack.get(3).get(0).get("x").v, 2) && assert_equal(s.stack.get(3).get(1).get("p").v, 2); } },
            { name: "stack is cleaned up", step: 11, expected_kind: "memory", check: function (s) { return assert_equal(s.stack.count(), 0) && assert_equal(s.globals.get(0).get("x").v, 5 * 4 * 3 * 2); } },
        ]
    },
    { name: "anonymous functions",
        source: "\n    Func<int,int> d = x => x * 2;\n    Func<int,int> p2 = x => x + 2;\n    Func<int,int> then (Func<int,int> f,Func<int,int> g){\n      typechecker_debugger;\n      return x => g (f (x));\n    }\n    Func<int,int> d_p2 = then (d,p2);\n    typechecker_debugger;\n    var x = d_p2(10);\n    debugger;",
        checks: [
            { name: "f is Func", step: 0, expected_kind: "bindings", check: function (s) { return assert_equal(CSharp.type_to_string(s.get("f")), "Func<int,int>"); } },
            { name: "d is Func", step: 0, expected_kind: "bindings", check: function (s) { return assert_equal(CSharp.type_to_string(s.get("d")), "Func<int,int>"); } },
            { name: "then is Func", step: 0, expected_kind: "bindings", check: function (s) { return assert_equal(CSharp.type_to_string(s.get("then")), "Func<Func<int,int>,Func<int,int>,Func<int,int>>"); } },
            { name: "d_p2 is Func", step: 1, expected_kind: "bindings", check: function (s) { return assert_equal(CSharp.type_to_string(s.get("d_p2")), "Func<int,int>"); } },
            { name: "x is 22", step: 3, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("x").v, 22); } },
        ]
    },
    {
        name: "currying and closures",
        source: "Func<int,Func<int,Func<int,int>>> add_mul = x => (y => (z => x * (y + z)));\n    Func<int,Func<int,int>> add_double = add_mul (2);\n    Func<int,Func<int,int>> add_triple = add_mul (3);\n    typechecker_debugger;\n    Func<int,int> f = add_double (4);\n    debugger;\n    int a = f (2);\n    debugger;\n    Func<int,int> g = add_triple (5);\n    debugger;\n    int b = g (1);\n    debugger;\n    typechecker_debugger;",
        checks: [
            { name: "add_double is Func^2", step: 0, expected_kind: "bindings", check: function (s) { return assert_equal(CSharp.type_to_string(s.get("add_double")), "Func<int,Func<int,int>>"); } },
            { name: "a is 12", step: 4, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("a").v, 12); } },
            { name: "f has 2 and 4 in closure", step: 3, expected_kind: "memory", check: function (s) {
                    var f = s.globals.get(0).get("f").v;
                    return assert_equal(f.closure.get("x").v, 2) && assert_equal(f.closure.get("y").v, 4);
                } },
            { name: "g has 3 and 5 in closure", step: 5, expected_kind: "memory", check: function (s) {
                    var g = s.globals.get(0).get("g").v;
                    return assert_equal(g.closure.get("x").v, 3) && assert_equal(g.closure.get("y").v, 5);
                } },
            { name: "b is 18", step: 6, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("b").v, 18); } },
        ]
    },
    {
        name: "arrays",
        source: "int n = 8;\n    int[] fibo = new int[n];\n    fibo[0] = 0;\n    fibo[1] = 1;\n    for(int i = 2; i < n; i  = i + 1){\n      fibo[i] = fibo[i + -1] + fibo[i + -2];\n    }\n    typechecker_debugger;\n    debugger;\n    ",
        checks: [
            { name: "fibo is int[]", step: 0, expected_kind: "bindings", check: function (s) { return assert_equal(CSharp.type_to_string(s.get("fibo")), "int[]"); } },
            { name: "fibo is a reference", step: 2, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("fibo").v, "ref_0"); } },
            { name: "ref_0 contains the array", step: 2, expected_kind: "memory", check: function (s) {
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
            { name: "c is Counter", step: 0, expected_kind: "bindings", check: function (s) { return assert_equal(CSharp.type_to_string(s.get("c")), "Counter"); } },
            { name: "cnt starts at -5", step: 2, expected_kind: "memory", check: function (s) {
                    var c = s.heap.get("ref_0").v;
                    return assert_equal(c.get("cnt").v, -5);
                } },
            { name: "this is a reference inside cons", step: 2, expected_kind: "memory", check: function (s) { return assert_equal(s.stack.get(0).get(0).get("this").v, "ref_0"); } },
            { name: "this is a reference inside \"tick\"", step: 4, expected_kind: "memory", check: function (s) { return assert_equal(s.stack.get(0).get(0).get("this").v, "ref_0"); } },
            { name: "c is a reference", step: 6, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("c").v, "ref_0"); } },
            { name: "cnt is 2", step: 6, expected_kind: "memory", check: function (s) {
                    var c = s.heap.get("ref_0").v;
                    return assert_equal(c.get("cnt").v, 2);
                } },
        ]
    },
    {
        name: "shared references",
        source: "class MyClass {\n      int field;\n      public  MyClass(int f){\n        this.field = f;\n      }\n      public void do_something(){\n        this.field = this.field * 2 + 1;\n      }\n    }\n    var c1 = new MyClass (10);\n    var c2 = c1;\n    debugger;\n    c1.do_something ();\n    debugger;\n    c2.do_something ();\n    debugger;",
        checks: [
            { name: "c1 is a reference", step: 1, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("c1").v, "ref_0"); } },
            { name: "c2 is the same reference", step: 1, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("c2").v, "ref_0"); } },
            { name: "field is 21", step: 2, expected_kind: "memory", check: function (s) {
                    var c = s.heap.get("ref_0").v;
                    return assert_equal(c.get("field").v, 21);
                } },
            { name: "field is 43", step: 3, expected_kind: "memory", check: function (s) {
                    var c = s.heap.get("ref_0").v;
                    return assert_equal(c.get("field").v, 43);
                } },
        ]
    },
    {
        name: "double counter (private field)",
        source: "class DoubleCounter {\n      private int cnt;\n      public  DoubleCounter(){\n        this.cnt = 0;\n      }\n      public int inspect(){\n        return this.cnt;\n      }\n     public void tick(){\n        this.cnt = this.cnt + 2;\n      }\n    }\n    var c = new DoubleCounter ();\n    typechecker_debugger;\n    c.cnt = 10;\n    typechecker_debugger;",
        checks: [
            { name: "c is \"DoubleCounter\"", step: 0, expected_kind: "bindings", check: function (s) { return assert_equal(CSharp.type_to_string(s.get("c")), "DoubleCounter"); } },
            { name: "access to \"c.cnt\" is prevented", step: 1, expected_kind: "error" },
        ]
    },
    {
        name: "static fields and methods",
        source: "class StaticContainer {\n      static private int cnt = 5;\n      static public int incr(int dx) {\n        StaticContainer.cnt = StaticContainer.cnt + dx;\n        return StaticContainer.cnt;\n      }\n    }\n    var y = StaticContainer.incr(10);\n    debugger;\n    ",
        checks: [
            { name: "cnt is 15", step: 1, expected_kind: "memory", check: function (s) { return assert_equal(s.classes.get("StaticContainer").static_fields.get("cnt").v, 15); } },
            { name: "y is 15", step: 1, expected_kind: "memory", check: function (s) { return assert_equal(s.globals.get(0).get("y").v, 15); } },
        ]
    },
    {
        name: "quadratic function",
        source: "int quadratic (int a,int b,int c,int x){\n      debugger;\n      typechecker_debugger;\n      return a * x * x + b * x + c;\n    }\n    var y = quadratic (1,2,3,4);\n    typechecker_debugger;\n    debugger;",
        checks: [
            { name: "quadratic is a function", step: 0, expected_kind: "bindings", check: function (s) { return assert_equal(CSharp.type_to_string(s.get("quadratic")), "Func<int,int,int,int,int>"); } },
            { name: "x is 4", step: 3, expected_kind: "memory", check: function (s) { return assert_equal(s.stack.get(0).get(0).get("x").v, 4); } },
            { name: "y is result", step: 4, expected_kind: "memory", check: function (s) { return console.log(JSON.stringify(s)) || assert_equal(s.stack.get(0).get(0).get("y").v, 1 * 4 * 4 + 2 * 4 + 3); } },
        ]
    },
]);
