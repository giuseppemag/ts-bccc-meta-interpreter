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
        //  let from_js  = (t:CSharp.Type, sem:Sem.StmtRt) : CSharp.Stmt => _ => co_unit(CSharp.mk_typing(t, sem))
        //  let p = CSharp.def_class(zero_range, "int", [
        //      _ => ({ modifiers:["static", "public", "operator"], is_constructor:false, range:zero_range,
        //              return_t:CSharp.int_type, name:"+", parameters:[{ name:"a", type:CSharp.int_type }, { name:"b", type:CSharp.int_type }],
        //              body:from_js(
        //                    CSharp.int_type,
        //                    Sem.get_v_rt("a").then(a_v => Sem.get_v_rt("b").then(b_v =>
        //                    Sem.return_rt(Sem.int_expr((a_v.value.v as number) + (b_v.value.v as number)))
        //                    ))) }),
        //      _ => ({ modifiers:["static", "public", "operator"], is_constructor:false, range:zero_range,
        //              return_t:CSharp.int_type, name:"-", parameters:[{ name:"a", type:CSharp.int_type }, { name:"b", type:CSharp.int_type }],
        //              body:from_js(
        //                    CSharp.int_type,
        //                    Sem.get_v_rt("a").then(a_v => Sem.get_v_rt("b").then(b_v =>
        //                    Sem.return_rt(Sem.int_expr((a_v.value.v as number) - (b_v.value.v as number)))
        //                    ))) }),
        //    ],
        //  [])
        var source = "\ndebugger;\nsurface s;\nfor (int i = 0; i < 150; i = i + 1) {\n  s = empty_surface 500 500 \"darkblue\";\n  s = s + sprite \"spaceship\" (10 + i * 2) (10 + i * 3) 50 50 (i * 5);\n}\n";
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
