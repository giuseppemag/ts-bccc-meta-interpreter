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
    var run_to_end = function (log) {
        var f = CCC.fun(function (p) { return run_to_end(log).f(p); });
        return (ts_bccc_2.co_run().map_times(ts_bccc_1.fun(function (s) { return log("Intermediate step:", JSON.stringify(s)) ||
            s; }))).then(CCC.apply_pair()).then(CCC.inl().plus(f.plus(CCC.inr())));
    };
    ImpLanguageWithSuspend.get_stream = DebuggerStream.get_stream;
    ImpLanguageWithSuspend.test_parser = function () {
        var source = "\nFunc<int, Func<int,int>> f = x => (y => x + y);\n\nvar g = f(10);\nvar z = g(2);\nvar w = g(3);\n\nint hof(Func<int,int> h) {\n  return h(2);\n}\n\nvar p = hof(g);\n";
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
        // log("\n\nStarting typechecking\n\n", {})
        var compiler_res = ts_bccc_1.apply((ts_bccc_1.constant(p(CSharp.no_constraints)).times(ts_bccc_1.constant(CSharp.empty_state))).then(run_to_end(log)), {});
        if (compiler_res.kind == "left") {
            var hrdiff = process.hrtime(hrstart);
            var time_in_ns = hrdiff[0] * 1e9 + hrdiff[1];
            log("Timer: " + time_in_ns / 1000000 + "ms\n Compiler error: ", JSON.stringify(compiler_res.value));
        }
        else {
            log("Compiler result: ", JSON.stringify(compiler_res.value.snd.bindings));
            // log("\n\nStarting runtime\n\n", "")
            var runtime_res = ts_bccc_1.apply((ts_bccc_1.constant(compiler_res.value.fst.sem).times(ts_bccc_1.constant(Py.empty_memory_rt))).then(run_to_end(log)), {});
            var hrdiff = process.hrtime(hrstart);
            var time_in_ns = hrdiff[0] * 1e9 + hrdiff[1];
            log("Runtime result: ", JSON.stringify(runtime_res));
            log("Timer: " + time_in_ns / 1000000 + "ms\n ", "");
        }
        return output;
    };
})(ImpLanguageWithSuspend = exports.ImpLanguageWithSuspend || (exports.ImpLanguageWithSuspend = {}));
// console.log(ImpLanguageWithSuspend.test_imp())
console.log(ImpLanguageWithSuspend.test_parser());
