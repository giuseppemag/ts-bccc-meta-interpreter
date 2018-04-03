"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts_bccc_1 = require("ts-bccc");
var CCC = require("ts-bccc");
var DebuggerStream = require("./csharp_debugger_stream");
var ImpLanguageWithSuspend;
(function (ImpLanguageWithSuspend) {
    var run_to_end = function (log) {
        var f = CCC.fun(function (p) { return run_to_end(log).f(p); });
        return (ts_bccc_1.co_run().map_times(ts_bccc_1.fun(function (s) { return log("Intermediate step:", JSON.stringify(s)) ||
            s; }))).then(CCC.apply_pair()).then(CCC.inl().plus(f.plus(CCC.inr())));
    };
    ImpLanguageWithSuspend.get_stream = DebuggerStream.get_stream;
    ImpLanguageWithSuspend.test_parser = function () {
        var source = "\n    int AddArray(int[] a) {\n      int sum = 0;\n      for(int i = 0; i < a.Length; i = i + 1) {\n        sum = sum + a[i];\n      }\n      return sum;\n    }\n    \n    int MinArray(int[] a) {\n      int min = a[0];\n      for(int i = 1; i < a.Length; i = i + 1) {\n        if(a[i] < min) { min = a[i]; } \n      }\n      return min;\n    }\n    \n    Func<Func<int[],int>, Func<int[],int>, Func<bool, int>> f = (g,h) => b => b ? g(new int[]  { 1, 2, 3 }) : h(new int[] {4, 5, 6});\n    \n    var l = f(AddArray, MinArray);\n    var res1 = l(true);\n    debugger;\n    var res2 = l(false);\n    typechecker_debugger;\n    debugger;\n";
        // let hrstart = process.hrtime()
        var output = "";
        var log = function (s, x) {
            output = output + s + JSON.stringify(x) + "\n\n";
        };
        // let hrdiff = process.hrtime(hrstart)
        // let time_in_ns = hrdiff[0] * 1e9 + hrdiff[1]
        // log(`Timer: ${time_in_ns / 1000000}ms\n Compiler error: `, JSON.stringify(compiler_res.value))
        var stream = ImpLanguageWithSuspend.get_stream(source);
        while (stream.kind == "step") {
            var show_1 = stream.show();
            log("Step:", show_1.kind == "bindings" ? show_1.state : show_1.kind == "memory" ? show_1.memory : show_1);
            stream = stream.next();
        }
        var show = stream.show();
        log("Step:", show.kind == "bindings" ? show.state : show.kind == "memory" ? show.memory : show);
        return output;
    };
})(ImpLanguageWithSuspend = exports.ImpLanguageWithSuspend || (exports.ImpLanguageWithSuspend = {}));
// console.log(ImpLanguageWithSuspend.test_imp())
console.log(ImpLanguageWithSuspend.test_parser());
