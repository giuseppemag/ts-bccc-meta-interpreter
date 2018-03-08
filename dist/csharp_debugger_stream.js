"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Immutable = require("immutable");
var ts_bccc_1 = require("ts-bccc");
var source_range_1 = require("./source_range");
var Py = require("./Python/python");
var CSharp = require("./CSharpTypeChecker/csharp");
var ccc_aux_1 = require("./ccc_aux");
var grammar_1 = require("./CSharpTypeChecker/grammar");
var ast_operations_1 = require("./CSharpTypeChecker/ast-operations");
exports.get_stream = function (source) {
    var parse_result = CSharp.GrammarBasics.tokenize(source);
    if (parse_result.kind == "left") {
        var error_1 = parse_result.value;
        return { kind: "error", show: function () { return ({ kind: "message", message: error_1, range: source_range_1.mk_range(0, 0, 0, 0) }); } };
    }
    var tokens = Immutable.List(parse_result.value);
    var res = ccc_aux_1.co_run_to_end(CSharp.program_prs(), grammar_1.mk_parser_state(tokens));
    if (res.kind != "right") {
        var msg_1 = res.value.message;
        var range_1 = res.value.range;
        return { kind: "error", show: function () { return ({ kind: "message", message: msg_1, range: range_1 }); } };
    }
    var ast = res.value.fst;
    var p = ast_operations_1.ast_to_type_checker(ast)(ast_operations_1.global_calling_context)(CSharp.no_constraints);
    var runtime_stream = function (state) { return ({
        kind: "step",
        next: function () {
            var p = state.fst;
            var s = state.snd;
            var k = ts_bccc_1.apply(p.run, s);
            if (k.kind == "left") {
                var error_2 = k.value;
                return { kind: "error", show: function () { return ({ kind: "message", message: error_2, range: source_range_1.mk_range(0, 0, 0, 0) }); } };
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
                var error_3 = k.value;
                return { kind: "error", show: function () { return ({ kind: "message", message: error_3.message, range: error_3.range }); } };
            }
            if (k.value.kind == "left") {
                return typechecker_stream(k.value.value);
            }
            var initial_runtime_state = ts_bccc_1.apply(ts_bccc_1.constant(k.value.value.fst.sem).times(ts_bccc_1.constant(Py.empty_memory_rt)), {});
            var first_stream = runtime_stream(initial_runtime_state);
            // if (first_stream.kind == "step") {
            //   first_stream = first_stream.next()
            // }
            return first_stream;
        },
        show: function () { return ({ kind: "bindings", state: state.snd, ast: ast }); }
    }); };
    var initial_compiler_state = ts_bccc_1.apply(ts_bccc_1.constant(p).times(ts_bccc_1.constant(CSharp.empty_state)), {});
    var first_stream = typechecker_stream(initial_compiler_state);
    if (first_stream.kind == "step") {
        first_stream = first_stream.next();
    }
    return first_stream;
};
