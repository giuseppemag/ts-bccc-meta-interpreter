"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Immutable = require("immutable");
var ts_bccc_1 = require("ts-bccc");
var CCC = require("ts-bccc");
var ts_bccc_2 = require("ts-bccc");
var source_range_1 = require("./source_range");
var Py = require("./Python/python");
var CSharp = require("./CSharpTypeChecker/csharp");
var csharp_1 = require("./CSharpTypeChecker/csharp");
var DebuggerStream = require("./csharp_debugger_stream");
var ImpLanguageWithSuspend;
(function (ImpLanguageWithSuspend) {
    var run_to_end = function () {
        var f = CCC.fun(function (p) { return run_to_end().f(p); });
        return (ts_bccc_2.co_run().map_times(ts_bccc_1.fun(function (s) { return console.log("Intermediate step:", JSON.stringify(s)) ||
            s; }))).then(CCC.apply_pair()).then(CCC.inl().plus(f.plus(CCC.inr())));
    };
    ImpLanguageWithSuspend.get_stream = DebuggerStream.get_stream;
    ImpLanguageWithSuspend.test_imp = function () {
        var loop_test = CSharp.semicolon(CSharp.decl_v("s", CSharp.string_type), CSharp.semicolon(CSharp.typechecker_breakpoint(source_range_1.mk_range(0, 0, 10, 10))(CSharp.done), CSharp.semicolon(CSharp.decl_v("i", CSharp.int_type), CSharp.semicolon(CSharp.set_v("s", CSharp.str("")), CSharp.semicolon(CSharp.set_v("i", CSharp.int(20)), CSharp.semicolon(CSharp.typechecker_breakpoint(source_range_1.mk_range(0, 0, 10, 10))(CSharp.done), CSharp.while_do(CSharp.gt(CSharp.get_v("i"), CSharp.int(0)), CSharp.semicolon(CSharp.set_v("i", CSharp.minus(CSharp.get_v("i"), CSharp.int(1))), CSharp.semicolon(CSharp.set_v("s", CSharp.plus(CSharp.get_v("s"), CSharp.str("*"))), CSharp.breakpoint(source_range_1.mk_range(0, 0, 10, 10))(CSharp.done))))))))));
        var arr_test = CSharp.semicolon(CSharp.decl_v("a", CSharp.arr_type(CSharp.int_type)), CSharp.semicolon(CSharp.set_v("a", CSharp.new_array(CSharp.int_type, CSharp.int(10))), CSharp.semicolon(CSharp.decl_v("i", CSharp.int_type), CSharp.semicolon(CSharp.set_v("i", CSharp.int(0)), CSharp.semicolon(CSharp.typechecker_breakpoint(source_range_1.mk_range(0, 0, 0, 0))(CSharp.done), CSharp.while_do(CSharp.lt(CSharp.get_v("i"), CSharp.get_arr_len(CSharp.get_v("a"))), CSharp.semicolon(CSharp.set_arr_el(CSharp.get_v("a"), CSharp.get_v("i"), CSharp.times(CSharp.get_v("i"), CSharp.int(2), source_range_1.zero_range)), CSharp.semicolon(CSharp.set_v("i", CSharp.plus(CSharp.get_v("i"), CSharp.int(1))), 
        //CSharp.breakpoint(mk_range(1,1,1,1))(
        CSharp.done
        //)
        ))))))));
        var lambda_test = CSharp.semicolon(CSharp.decl_v("i", CSharp.int_type), CSharp.semicolon(CSharp.decl_v("x", CSharp.int_type), CSharp.semicolon(CSharp.decl_v("y", CSharp.int_type), CSharp.semicolon(CSharp.set_v("i", CSharp.int(10)), CSharp.semicolon(CSharp.set_v("x", CSharp.int(1)), CSharp.semicolon(CSharp.set_v("y", CSharp.call_lambda(CSharp.breakpoint(source_range_1.mk_range(0, 0, 0, 0))(CSharp.mk_lambda({
            body: CSharp.breakpoint(source_range_1.mk_range(1, 1, 1, 1))(CSharp.ret(CSharp.plus(CSharp.get_v("i"), CSharp.get_v("x")))),
            parameters: [CSharp.mk_param("i", CSharp.int_type)],
            return_t: CSharp.int_type
        }, ["x"], source_range_1.mk_range(1, 1, 1, 1))), [CSharp.int(5)])), CSharp.done))))));
        var fun_test = CSharp.semicolon(CSharp.decl_v("x", CSharp.int_type), CSharp.semicolon(CSharp.decl_v("y", CSharp.int_type), CSharp.semicolon(CSharp.set_v("x", CSharp.int(2)), CSharp.semicolon(CSharp.set_v("y", CSharp.int(5)), CSharp.semicolon(CSharp.def_fun({ name: "f",
            body: (CSharp.ret(CSharp.plus(CSharp.get_v("i"), CSharp.get_v("x")))),
            parameters: [CSharp.mk_param("i", CSharp.int_type)],
            return_t: CSharp.int_type,
            range: source_range_1.mk_range(1, 1, 1, 1) }, ["x"]), CSharp.semicolon(CSharp.def_fun({ name: "g",
            body: (CSharp.ret(CSharp.times(CSharp.get_v("j"), CSharp.get_v("x"), source_range_1.zero_range))),
            parameters: [CSharp.mk_param("j", CSharp.int_type)],
            return_t: CSharp.int_type,
            range: source_range_1.mk_range(1, 1, 1, 1) }, ["x"]), CSharp.semicolon(CSharp.breakpoint(source_range_1.mk_range(3, 0, 4, 0))(CSharp.done), CSharp.semicolon(CSharp.set_v("x", CSharp.call_by_name("f", [CSharp.get_v("y")])), CSharp.semicolon(CSharp.breakpoint(source_range_1.mk_range(4, 0, 5, 0))(CSharp.done), CSharp.set_v("x", CSharp.call_by_name("g", [CSharp.get_v("y")])))))))))));
        var class_test = CSharp.semicolon(CSharp.def_class("Vector2", [{
                name: "Vector2",
                body: CSharp.semicolon(CSharp.field_set(CSharp.get_v("this"), "X", CSharp.get_v("x")), CSharp.semicolon(CSharp.field_set(CSharp.get_v("this"), "Y", CSharp.get_v("y")), CSharp.done)),
                range: source_range_1.mk_range(1, 1, 1, 1),
                parameters: [{ name: "x", type: CSharp.int_type },
                    { name: "y", type: CSharp.int_type }],
                return_t: CSharp.unit_type
            },
            {
                name: "Scale",
                body: CSharp.semicolon(CSharp.field_set(CSharp.get_v("this"), "X", CSharp.times(CSharp.field_get(CSharp.get_v("this"), "X"), CSharp.get_v("k"), source_range_1.zero_range)), CSharp.semicolon(CSharp.field_set(CSharp.get_v("this"), "Y", CSharp.times(CSharp.field_get(CSharp.get_v("this"), "Y"), CSharp.get_v("k"), source_range_1.zero_range)), CSharp.done)),
                range: source_range_1.mk_range(1, 1, 1, 1),
                parameters: [{ name: "k", type: CSharp.int_type }],
                return_t: CSharp.unit_type
            }], [{ name: "X", type: CSharp.int_type },
            { name: "Y", type: CSharp.int_type }]), CSharp.semicolon(CSharp.decl_v("v2", CSharp.ref_type("Vector2")), CSharp.semicolon(CSharp.set_v("v2", CSharp.call_cons("Vector2", [CSharp.int(10), CSharp.int(20)])), CSharp.semicolon(CSharp.call_method(CSharp.get_v("v2"), "Scale", [CSharp.int(2)]), CSharp.done))));
        var hrstart = process.hrtime();
        var p = class_test;
        var output = "";
        var log = function (s, x) {
            output = output + s + JSON.stringify(x) + "\n\n";
        };
        var compiler_res = ts_bccc_1.apply((ts_bccc_1.constant(p).times(ts_bccc_1.constant(CSharp.empty_state))).then(run_to_end()), {});
        if (compiler_res.kind == "left") {
            var hrdiff = process.hrtime(hrstart);
            var time_in_ns = hrdiff[0] * 1e9 + hrdiff[1];
            log("Timer: " + time_in_ns / 1000000 + "ms\n Compiler error: ", JSON.stringify(compiler_res.value));
        }
        else {
            var runtime_res = ts_bccc_1.apply((ts_bccc_1.constant(compiler_res.value.fst.sem).times(ts_bccc_1.constant(Py.empty_memory_rt))).then(run_to_end()), {});
            var hrdiff = process.hrtime(hrstart);
            var time_in_ns = hrdiff[0] * 1e9 + hrdiff[1];
            log("Timer: " + time_in_ns / 1000000 + "ms\n Compiler result: ", JSON.stringify(compiler_res.value.snd.bindings));
            log("Runtime result: ", JSON.stringify(runtime_res));
        }
        return output;
    };
    ImpLanguageWithSuspend.test_parser = function () {
        var source = "\nbool b;\nb = false != !false;\n";
        var parse_result = CSharp.GrammarBasics.tokenize(source);
        if (parse_result.kind == "left")
            return parse_result.value;
        var tokens = Immutable.List(parse_result.value);
        // console.log(JSON.stringify(tokens.toArray())) // tokens
        var res = CSharp.program_prs().run.f(tokens);
        if (res.kind != "right" || res.value.kind != "right")
            return "Parse error: " + res.value;
        //console.log(JSON.stringify(res.value.value.fst)) // ast
        var hrstart = process.hrtime();
        var p = csharp_1.ast_to_type_checker(res.value.value.fst);
        var output = "";
        var log = function (s, x) {
            output = output + s + JSON.stringify(x) + "\n\n";
        };
        var compiler_res = ts_bccc_1.apply((ts_bccc_1.constant(p).times(ts_bccc_1.constant(CSharp.empty_state))).then(run_to_end()), {});
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
