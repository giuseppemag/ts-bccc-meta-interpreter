"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Immutable = require("immutable");
var ts_bccc_1 = require("ts-bccc");
var Py = require("./Python/python");
var CSharp = require("./CSharpTypeChecker/csharp");
var ccc_aux_1 = require("./ccc_aux");
var csharp_1 = require("./CSharpTypeChecker/csharp");
var grammar_1 = require("./CSharpTypeChecker/grammar");
exports.get_stream = function (source) {
    var parse_result = CSharp.GrammarBasics.tokenize(source);
    if (parse_result.kind == "left") {
        var error_1 = parse_result.value;
        return { kind: "error", show: function () { return ({ kind: "message", message: error_1 }); } };
    }
    var tokens = Immutable.List(parse_result.value);
    var res = ccc_aux_1.co_run_to_end(CSharp.program_prs(), grammar_1.mk_parser_state(tokens));
    if (res.kind != "right") {
        var error_2 = "Parser error (" + res.value.range.to_string() + "): " + res.value.message;
        return { kind: "error", show: function () { return ({ kind: "message", message: error_2 }); } };
    }
    var ast = res.value.fst;
    var p = csharp_1.ast_to_type_checker(ast)(grammar_1.global_calling_context);
    var runtime_stream = function (state) { return ({
        kind: "step",
        next: function () {
            var p = state.fst;
            var s = state.snd;
            var k = ts_bccc_1.apply(p.run, s);
            if (k.kind == "left") {
                var error_3 = k.value;
                return { kind: "error", show: function () { return ({ kind: "message", message: error_3 }); } };
            }
            if (k.value.kind == "left") {
                return runtime_stream(k.value.value);
            }
            s = k.value.value.snd;
            return { kind: "done", show: function () { return ({ kind: "memory", memory: s, ast: ast }); } };
        },
        show: function () { return ({ kind: "memory", memory: state.snd, ast: ast }); }
    }); };
    var typechecker_stream = function (state) { return ({
        kind: "step",
        next: function () {
            var p = state.fst;
            var s = state.snd;
            var k = ts_bccc_1.apply(p.run, s);
            if (k.kind == "left") {
                var error_4 = k.value;
                return { kind: "error", show: function () { return ({ kind: "message", message: error_4 }); } };
            }
            if (k.value.kind == "left") {
                return typechecker_stream(k.value.value);
            }
            var initial_runtime_state = ts_bccc_1.apply(ts_bccc_1.constant(k.value.value.fst.sem).times(ts_bccc_1.constant(Py.empty_memory_rt)), {});
            return runtime_stream(initial_runtime_state);
        },
        show: function () { return ({ kind: "bindings", state: state.snd, ast: ast }); }
    }); };
    var initial_compiler_state = ts_bccc_1.apply(ts_bccc_1.constant(p).times(ts_bccc_1.constant(CSharp.empty_state)), {});
    return typechecker_stream(initial_compiler_state);
};
