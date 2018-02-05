"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Immutable = require("immutable");
var ts_bccc_1 = require("ts-bccc");
var CCC = require("ts-bccc");
var ts_bccc_2 = require("ts-bccc");
var Py = require("./Python/python");
var CSharp = require("./CSharpTypeChecker/csharp");
var csharp_1 = require("./CSharpTypeChecker/csharp");
var DebuggerStream = require("./csharp_debugger_stream");
var grammar_1 = require("./CSharpTypeChecker/grammar");
var ImpLanguageWithSuspend;
(function (ImpLanguageWithSuspend) {
    var run_to_end = function () {
        var f = CCC.fun(function (p) { return run_to_end().f(p); });
        return (ts_bccc_2.co_run().map_times(ts_bccc_1.fun(function (s) { return console.log("Intermediate step:", JSON.stringify(s)) ||
            s; }))).then(CCC.apply_pair()).then(CCC.inl().plus(f.plus(CCC.inr())));
    };
    ImpLanguageWithSuspend.get_stream = DebuggerStream.get_stream;
    ImpLanguageWithSuspend.test_parser = function () {
        var source = "\nclass A {\n  static public int s_x;\n  static public void incr() {\n    A.s_x = A.s_x + 1;\n  }\n\n  private int x;\n\n  public A(int x) {\n    this.x = x;\n    while (x > 0) {\n      x = x - 1;\n    }\n  }\n\n  public void scale(int k) {\n    this.x = this.get_x() * k;\n  }\n\n  public int get_x() {\n    return this.x;\n  }\n}\n\nclass B {\n  public A a;\n\n  public B() {\n    this.a = new A(10);\n  }\n}\n\nA.s_x = 100;\nvar z = A.s_x;\nB b = new B();\nb.a.scale(2);\nA.incr();\n\nint f(int x) {\n  return x + A.s_x;\n}\n\nFunc<int, int> g = f;\n\nz = g(10);\n";
        var parse_result = CSharp.GrammarBasics.tokenize(source);
        if (parse_result.kind == "left")
            return parse_result.value;
        var tokens = Immutable.List(parse_result.value);
        // console.log(JSON.stringify(tokens.toArray())) // tokens
        var res = CSharp.program_prs().run.f(grammar_1.mk_parser_state(tokens));
        if (res.kind != "right" || res.value.kind != "right")
            return "Parse error: " + JSON.stringify(res.value);
        //console.log(JSON.stringify(res.value.value.fst)) // ast
        var hrstart = process.hrtime();
        var p = csharp_1.ast_to_type_checker(res.value.value.fst)(grammar_1.global_calling_context);
        var output = "";
        var log = function (s, x) {
            output = output + s + JSON.stringify(x) + "\n\n";
        };
        var compiler_res = ts_bccc_1.apply((ts_bccc_1.constant(p(CSharp.no_constraints)).times(ts_bccc_1.constant(CSharp.empty_state))).then(run_to_end()), {});
        if (compiler_res.kind == "left") {
            var hrdiff = process.hrtime(hrstart);
            var time_in_ns = hrdiff[0] * 1e9 + hrdiff[1];
            log("Timer: " + time_in_ns / 1000000 + "ms\n Compiler error: ", JSON.stringify(compiler_res.value));
        }
        else {
            var runtime_res = ts_bccc_1.apply((ts_bccc_1.constant(compiler_res.value.fst.sem).times(ts_bccc_1.constant(Py.empty_memory_rt))).then(run_to_end()), {});
            var hrdiff = process.hrtime(hrstart);
            var time_in_ns = hrdiff[0] * 1e9 + hrdiff[1];
            log("Compiler result: ", JSON.stringify(compiler_res.value.snd.bindings));
            log("Runtime result: ", JSON.stringify(runtime_res));
            log("Timer: " + time_in_ns / 1000000 + "ms\n ", "");
        }
        return output;
    };
})(ImpLanguageWithSuspend = exports.ImpLanguageWithSuspend || (exports.ImpLanguageWithSuspend = {}));
// console.log(ImpLanguageWithSuspend.test_imp())
console.log(ImpLanguageWithSuspend.test_parser());
