"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Immutable = require("immutable");
var ts_bccc_1 = require("ts-bccc");
var CCC = require("ts-bccc");
var ts_bccc_2 = require("ts-bccc");
var source_range_1 = require("./source_range");
var Py = require("./Python/python");
var CSharp = require("./CSharpTypeChecker/csharp");
var ccc_aux_1 = require("./ccc_aux");
var ImpLanguageWithSuspend;
(function (ImpLanguageWithSuspend) {
    var run_to_end = function () {
        var f = CCC.fun(function (p) { return run_to_end().f(p); });
        return (ts_bccc_2.co_run().map_times(ts_bccc_1.fun(function (s) { return console.log("Intermediate step:", JSON.stringify(s)) ||
            s; }))).then(CCC.apply_pair()).then(CCC.inl().plus(f.plus(CCC.inr())));
    };
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
        }, ["x"])), [CSharp.int(5)])), CSharp.done))))));
        var fun_test = CSharp.semicolon(CSharp.decl_v("x", CSharp.int_type), CSharp.semicolon(CSharp.decl_v("y", CSharp.int_type), CSharp.semicolon(CSharp.set_v("x", CSharp.int(2)), CSharp.semicolon(CSharp.set_v("y", CSharp.int(5)), CSharp.semicolon(CSharp.def_fun({ name: "f",
            body: (CSharp.ret(CSharp.plus(CSharp.get_v("i"), CSharp.get_v("x")))),
            parameters: [CSharp.mk_param("i", CSharp.int_type)],
            return_t: CSharp.int_type }, ["x"]), CSharp.semicolon(CSharp.def_fun({ name: "g",
            body: (CSharp.ret(CSharp.times(CSharp.get_v("j"), CSharp.get_v("x"), source_range_1.zero_range))),
            parameters: [CSharp.mk_param("j", CSharp.int_type)],
            return_t: CSharp.int_type }, ["x"]), CSharp.semicolon(CSharp.breakpoint(source_range_1.mk_range(3, 0, 4, 0))(CSharp.done), CSharp.semicolon(CSharp.set_v("x", CSharp.call_by_name("f", [CSharp.get_v("y")])), CSharp.semicolon(CSharp.breakpoint(source_range_1.mk_range(4, 0, 5, 0))(CSharp.done), CSharp.set_v("x", CSharp.call_by_name("g", [CSharp.get_v("y")])))))))))));
        var class_test = CSharp.semicolon(CSharp.def_class("Vector2", [{
                name: "Vector2",
                body: CSharp.semicolon(CSharp.field_set(CSharp.get_v("this"), "X", CSharp.get_v("x")), CSharp.semicolon(CSharp.field_set(CSharp.get_v("this"), "Y", CSharp.get_v("y")), CSharp.done)),
                parameters: [{ name: "x", type: CSharp.int_type },
                    { name: "y", type: CSharp.int_type }],
                return_t: CSharp.unit_type
            },
            {
                name: "Scale",
                body: CSharp.semicolon(CSharp.field_set(CSharp.get_v("this"), "X", CSharp.times(CSharp.field_get(CSharp.get_v("this"), "X"), CSharp.get_v("k"), source_range_1.zero_range)), CSharp.semicolon(CSharp.field_set(CSharp.get_v("this"), "Y", CSharp.times(CSharp.field_get(CSharp.get_v("this"), "Y"), CSharp.get_v("k"), source_range_1.zero_range)), CSharp.done)),
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
            var runtime_res = ts_bccc_1.apply((ts_bccc_1.constant(compiler_res.value.fst.sem).times(ts_bccc_1.constant(Py.empty_memory))).then(run_to_end()), {});
            var hrdiff = process.hrtime(hrstart);
            var time_in_ns = hrdiff[0] * 1e9 + hrdiff[1];
            log("Timer: " + time_in_ns / 1000000 + "ms\n Compiler result: ", JSON.stringify(compiler_res.value.snd.bindings));
            log("Runtime result: ", JSON.stringify(runtime_res));
        }
        return output;
    };
    ImpLanguageWithSuspend.ast_to_type_checker = function (n) {
        return n.ast.kind == "int" ? CSharp.int(n.ast.value)
            : n.ast.kind == "string" ? CSharp.str(n.ast.value)
                : n.ast.kind == ";" ? CSharp.semicolon(ImpLanguageWithSuspend.ast_to_type_checker(n.ast.l), ImpLanguageWithSuspend.ast_to_type_checker(n.ast.r))
                    : n.ast.kind == "*" ? CSharp.times(ImpLanguageWithSuspend.ast_to_type_checker(n.ast.l), ImpLanguageWithSuspend.ast_to_type_checker(n.ast.r), n.range)
                        : n.ast.kind == "+" ? CSharp.plus(ImpLanguageWithSuspend.ast_to_type_checker(n.ast.l), ImpLanguageWithSuspend.ast_to_type_checker(n.ast.r))
                            : n.ast.kind == "id" ? CSharp.get_v(n.ast.value)
                                : n.ast.kind == "." && n.ast.r.ast.kind == "id" ? CSharp.field_get(ImpLanguageWithSuspend.ast_to_type_checker(n.ast.l), n.ast.r.ast.value)
                                    : n.ast.kind == "=" && n.ast.l.ast.kind == "id" ? CSharp.set_v(n.ast.l.ast.value, ImpLanguageWithSuspend.ast_to_type_checker(n.ast.r))
                                        : n.ast.kind == "decl" && n.ast.l.ast.kind == "id" && n.ast.r.ast.kind == "id" ?
                                            n.ast.l.ast.value == "int" ? CSharp.decl_v(n.ast.r.ast.value, CSharp.int_type)
                                                : n.ast.l.ast.value == "RenderGrid" ? CSharp.decl_v(n.ast.r.ast.value, CSharp.render_grid_type)
                                                    : n.ast.l.ast.value == "RenderGridPixel" ? CSharp.decl_v(n.ast.r.ast.value, CSharp.render_grid_pixel_type)
                                                        : CSharp.decl_v(n.ast.r.ast.value, CSharp.ref_type(n.ast.l.ast.value))
                                            : n.ast.kind == "dbg" ?
                                                CSharp.breakpoint(n.range)(CSharp.done)
                                                : n.ast.kind == "tc-dbg" ?
                                                    CSharp.typechecker_breakpoint(n.range)(CSharp.done)
                                                    : n.ast.kind == "mk-empty-render-grid" ?
                                                        CSharp.mk_empty_render_grid(ImpLanguageWithSuspend.ast_to_type_checker(n.ast.w), ImpLanguageWithSuspend.ast_to_type_checker(n.ast.h))
                                                        : n.ast.kind == "mk-render-grid-pixel" ?
                                                            CSharp.mk_render_grid_pixel(ImpLanguageWithSuspend.ast_to_type_checker(n.ast.w), ImpLanguageWithSuspend.ast_to_type_checker(n.ast.h), ImpLanguageWithSuspend.ast_to_type_checker(n.ast.status))
                                                            : (function () { console.log("Error: unsupported ast node: " + JSON.stringify(n)); throw new Error("Unsupported ast node: " + JSON.stringify(n)); })();
    };
    ImpLanguageWithSuspend.get_stream = function (source) {
        var parse_result = CSharp.GrammarBasics.tokenize(source);
        if (parse_result.kind == "left") {
            var error_1 = parse_result.value;
            return { kind: "error", show: function () { return error_1; } };
        }
        var tokens = Immutable.List(parse_result.value);
        var res = ccc_aux_1.co_run_to_end(CSharp.program_prs(), tokens);
        if (res.kind != "right") {
            var error_2 = res.value;
            return { kind: "error", show: function () { return error_2; } };
        }
        var p = ImpLanguageWithSuspend.ast_to_type_checker(res.value.fst);
        var runtime_stream = function (state) { return ({
            kind: "step",
            next: function () {
                var p = state.fst;
                var s = state.snd;
                var k = ts_bccc_1.apply(p.run, s);
                if (k.kind == "left") {
                    var error_3 = k.value;
                    return { kind: "error", show: function () { return error_3; } };
                }
                if (k.value.kind == "left") {
                    return runtime_stream(k.value.value);
                }
                s = k.value.value.snd;
                return { kind: "done", show: function () { return s; } };
            },
            show: function () { return state.snd; }
        }); };
        var typechecker_stream = function (state) { return ({
            kind: "step",
            next: function () {
                var p = state.fst;
                var s = state.snd;
                var k = ts_bccc_1.apply(p.run, s);
                if (k.kind == "left") {
                    var error_4 = k.value;
                    return { kind: "error", show: function () { return error_4; } };
                }
                if (k.value.kind == "left") {
                    return typechecker_stream(k.value.value);
                }
                var initial_runtime_state = ts_bccc_1.apply(ts_bccc_1.constant(k.value.value.fst.sem).times(ts_bccc_1.constant(Py.empty_memory)), {});
                return runtime_stream(initial_runtime_state);
            },
            show: function () { return state.snd; }
        }); };
        var initial_compiler_state = ts_bccc_1.apply(ts_bccc_1.constant(p).times(ts_bccc_1.constant(CSharp.empty_state)), {});
        return typechecker_stream(initial_compiler_state);
    };
    ImpLanguageWithSuspend.test_parser = function () {
        var source = "\nRenderGrid g;\ng = empty_render_grid 16 16;\ntypechecker_debugger;\nint x;\nx = 0;\nx = x + 2;\ndebugger;\nx = x * 3;\ng = g + pixel 5 5 1;\n";
        var parse_result = CSharp.GrammarBasics.tokenize(source);
        if (parse_result.kind == "left")
            return parse_result.value;
        var tokens = Immutable.List(parse_result.value);
        // console.log(JSON.stringify(tokens.toArray()))
        var res = CSharp.program_prs().run.f(tokens);
        if (res.kind != "right" || res.value.kind != "right")
            return "Parse error: " + res.value;
        var hrstart = process.hrtime();
        var p = ImpLanguageWithSuspend.ast_to_type_checker(res.value.value.fst);
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
            var runtime_res = ts_bccc_1.apply((ts_bccc_1.constant(compiler_res.value.fst.sem).times(ts_bccc_1.constant(Py.empty_memory))).then(run_to_end()), {});
            var hrdiff = process.hrtime(hrstart);
            var time_in_ns = hrdiff[0] * 1e9 + hrdiff[1];
            log("Timer: " + time_in_ns / 1000000 + "ms\n Compiler result: ", JSON.stringify(compiler_res.value.snd.bindings));
            log("Runtime result: ", JSON.stringify(runtime_res));
        }
        return output;
    };
})(ImpLanguageWithSuspend = exports.ImpLanguageWithSuspend || (exports.ImpLanguageWithSuspend = {}));
// console.log(ImpLanguageWithSuspend.test_imp())
// console.log(ImpLanguageWithSuspend.test_parser())
