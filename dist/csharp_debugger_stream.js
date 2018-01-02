"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Immutable = require("immutable");
var ts_bccc_1 = require("ts-bccc");
var Py = require("./Python/python");
var CSharp = require("./CSharpTypeChecker/csharp");
var ccc_aux_1 = require("./ccc_aux");
var csharp_1 = require("./CSharpTypeChecker/csharp");
exports.get_stream = function (source) {
    var parse_result = CSharp.GrammarBasics.tokenize(source);
    if (parse_result.kind == "left") {
        var error_1 = parse_result.value;
        return { kind: "error", show: function () { return ({ kind: "message", message: error_1 }); } };
    }
    var tokens = Immutable.List(parse_result.value);
    var res = ccc_aux_1.co_run_to_end(CSharp.program_prs(), tokens);
    if (res.kind != "right") {
        var error_2 = res.value;
        return { kind: "error", show: function () { return ({ kind: "message", message: error_2 }); } };
    }
    var p = csharp_1.ast_to_type_checker(res.value.fst);
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
            return { kind: "done", show: function () { return ({ kind: "memory", memory: s }); } };
        },
        show: function () { return ({ kind: "memory", memory: state.snd }); }
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
        show: function () { return ({ kind: "bindings", state: state.snd }); }
    }); };
    var initial_compiler_state = ts_bccc_1.apply(ts_bccc_1.constant(p).times(ts_bccc_1.constant(CSharp.empty_state)), {});
    return typechecker_stream(initial_compiler_state);
};
