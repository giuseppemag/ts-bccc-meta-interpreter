"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var Immutable = require("immutable");
var ts_bccc_1 = require("ts-bccc");
var source_range_1 = require("./source_range");
var Py = require("./Python/python");
var CSharp = require("./CSharpTypeChecker/csharp");
var ccc_aux_1 = require("./ccc_aux");
var grammar_1 = require("./CSharpTypeChecker/grammar");
var ast_operations_1 = require("./CSharpTypeChecker/ast-operations");
var standard_lib_1 = require("./CSharpTypeChecker/standard_lib");
exports.run_stream_to_end = function (s) {
    var run_stream_to_end = function (s) {
        return s.kind != "step" ? Immutable.List([s.show()])
            : run_stream_to_end(s.next()).push(s.show());
    };
    return run_stream_to_end(s).reverse().toList();
};
exports.get_stream = function (source, custom_alert) {
    try {
        var parse_result = CSharp.GrammarBasics.tokenize(source);
        if (parse_result.kind == "left") {
            var error_1 = parse_result.value;
            return { kind: "error", show: function () { return ({ kind: "message", message: error_1.message, range: error_1.range }); } };
        }
        var tokens = Immutable.List(parse_result.value);
        var res = ccc_aux_1.co_run_to_end(CSharp.program_prs(), grammar_1.mk_parser_state(tokens));
        if (res.kind != "right") {
            var msg_1 = res.value.message;
            var range_1 = res.value.range;
            return { kind: "error", show: function () { return ({ kind: "message", message: msg_1, range: range_1 }); } };
        }
        var ast_1 = res.value.fst;
        // console.log("AST:", JSON.stringify(ast))
        var p = (CSharp.semicolon(source_range_1.zero_range, standard_lib_1.standard_lib(), ast_operations_1.ast_to_type_checker(Immutable.Map())(ast_1)(ast_operations_1.global_calling_context)))(CSharp.no_constraints);
        var run_step_1 = function (p, s) {
            if (p.run.kind == "run") {
                var q_1 = p.run.run(s);
                if (q_1.kind == "e")
                    return { kind: "err", e: q_1.e };
                if (q_1.kind == "v")
                    return { kind: "end", s: q_1.s };
                if (q_1.kind == "k")
                    return { kind: "k", s: q_1.s, k: q_1.k };
                return run_step_pre_1(q_1.pre, q_1.p, q_1.s);
                // return { kind:"k", s:q.s, k:q.pre.combine(q.p) }
            }
            var q = run_step_pre_1(p.run.pre, p.run.p, s);
            if (q.kind == "k")
                return __assign({}, q, { k: q.k });
            return q;
        };
        var run_step_pre_1 = function (pre, p, s) {
            if (pre.run.kind == "run") {
                var q_2 = pre.run.run(s);
                if (q_2.kind == "e")
                    return { kind: "err", e: q_2.e };
                if (q_2.kind == "v")
                    return run_step_1(p, q_2.s);
                if (q_2.kind == "k")
                    return { kind: "k", s: q_2.s, k: q_2.k.combine(p) };
                // return { kind:"k", s:q.s, k:q.pre.combine(q.p).combine(p) }
                return run_step_pre_1(q_2.pre, q_2.p.combine(p), q_2.s);
            }
            var q = run_step_pre_1(pre.run.pre, pre.run.p.combine(p), s);
            if (q.kind == "k")
                return __assign({}, q, { k: q.k });
            return q;
        };
        var runtime_stream_1 = function (state) { return ({
            kind: "step",
            next: function () {
                var p = state.fst;
                var s = state.snd;
                var q = run_step_1(p, s);
                if (q.kind == "err") {
                    var error_2 = q.e;
                    return { kind: "error", show: function () { return ({ kind: "message", message: error_2.message, range: error_2.range }); } };
                }
                if (q.kind == "end") {
                    s = q.s;
                    return { kind: "done", show: function () { return ({ kind: "memory", memory: s, ast: ast_1 }); } };
                }
                return runtime_stream_1({ fst: q.k, snd: q.s });
            },
            show: function () { return ({ kind: "memory", memory: state.snd, ast: ast_1 }); }
        }); };
        var typechecker_stream_1 = function (state) { return ({
            kind: "step",
            next: function () {
                var p = state.fst;
                var s = state.snd;
                var k = ts_bccc_1.apply(p.run, s);
                if (k.kind == "left") {
                    var error_3 = k.value;
                    return { kind: "error", show: function () { return ({ kind: "message", message: error_3.message, range: error_3.range }); } };
                }
                if (k.value.kind == "left") {
                    return typechecker_stream_1(k.value.value);
                }
                var initial_runtime_state = ts_bccc_1.apply(ts_bccc_1.constant(k.value.value.fst.sem).times(ts_bccc_1.constant(Py.empty_memory_rt(custom_alert.kind == "left" ? custom_alert.value : function (s) { return true; }))), {});
                var first_stream = runtime_stream_1(initial_runtime_state);
                // if (first_stream.kind == "step") {
                //   first_stream = first_stream.next()
                // }
                return first_stream;
            },
            show: function () { return ({ kind: "bindings", state: state.snd, ast: ast_1 }); }
        }); };
        var initial_compiler_state = ts_bccc_1.apply(ts_bccc_1.constant(p).times(ts_bccc_1.constant(CSharp.empty_state)), {});
        var first_stream = typechecker_stream_1(initial_compiler_state);
        // if (first_stream.kind == "step") {
        //   first_stream = first_stream.next()
        // }
        return first_stream;
    }
    catch (e) {
        console.log(e);
        return { kind: "error", show: function () { return ({ kind: "message", message: "Internal error: " + e + "\n}", range: source_range_1.mk_range(0, 0, 0, 0) }); } };
    }
};
