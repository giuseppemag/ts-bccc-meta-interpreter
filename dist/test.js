"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts_bccc_1 = require("ts-bccc");
var CCC = require("ts-bccc");
var ts_bccc_2 = require("ts-bccc");
var DebuggerStream = require("./csharp_debugger_stream");
var ImpLanguageWithSuspend;
(function (ImpLanguageWithSuspend) {
    var run_to_end = function (log) {
        var f = CCC.fun(function (p) { return run_to_end(log).f(p); });
        return (ts_bccc_2.co_run().map_times(ts_bccc_1.fun(function (s) { return log("Intermediate step:", JSON.stringify(s)) ||
            s; }))).then(CCC.apply_pair()).then(CCC.inl().plus(f.plus(CCC.inr())));
    };
    ImpLanguageWithSuspend.get_stream = DebuggerStream.get_stream;
    ImpLanguageWithSuspend.test_parser = function () {
        var source = "\nclass C {\n  private int x;\n\n  public C() {\n  }\n}\n\nvar c = new C();\n\nint f(int z) { return z + 1; }\nint g(int z) { return z + 1; }\n\nvar x = 0.5f;\ntypechecker_debugger;\nvar y = -3.1f;\nvar z = -5;\nvar w = 134;\nif (x > y) {\n  z = z + 1;\n} else {\n  z = z - 1;\n}\n\n    ";
        // surface s = empty_surface 500 500 "white";
        // s = s + line 10 10 20 20 5 "red" 0;
        // s = s + text "This is some text!!!!1111" 100 100 20 "red" 0;
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
