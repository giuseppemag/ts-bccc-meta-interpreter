"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts_bccc_1 = require("ts-bccc");
var CSharp = require("./csharp");
var Sem = require("../Python/python");
var source_range_1 = require("../source_range");
var from_js = function (t, sem) { return function (_) { return ts_bccc_1.co_unit(CSharp.mk_typing(t, sem)); }; };
exports.int = CSharp.def_class(source_range_1.minus_two_range, "int", [
    function (_) { return ({ modifiers: ["static", "public", "operator"], is_constructor: false, range: source_range_1.minus_two_range,
        return_t: CSharp.int_type, name: "string", parameters: [{ name: "a", type: CSharp.int_type }],
        body: from_js(CSharp.int_type, Sem.get_v_rt("a").then(function (a_v) {
            return Sem.return_rt(Sem.str_expr(a_v.value.v.toString()));
        })) }); },
    function (_) { return ({ modifiers: ["static", "public", "operator"], is_constructor: false, range: source_range_1.minus_two_range,
        return_t: CSharp.int_type, name: "float", parameters: [{ name: "a", type: CSharp.int_type }],
        body: from_js(CSharp.int_type, Sem.get_v_rt("a").then(function (a_v) {
            return Sem.return_rt(Sem.float_expr(a_v.value.v));
        })) }); },
    function (_) { return ({ modifiers: ["static", "public", "operator"], is_constructor: false, range: source_range_1.minus_two_range,
        return_t: CSharp.int_type, name: "+", parameters: [{ name: "a", type: CSharp.int_type }, { name: "b", type: CSharp.int_type }],
        body: from_js(CSharp.int_type, Sem.get_v_rt("a").then(function (a_v) { return Sem.get_v_rt("b").then(function (b_v) {
            return Sem.return_rt(Sem.int_expr(a_v.value.v + b_v.value.v));
        }); })) }); },
    function (_) { return ({ modifiers: ["static", "public", "operator"], is_constructor: false, range: source_range_1.minus_two_range,
        return_t: CSharp.int_type, name: "-", parameters: [{ name: "a", type: CSharp.int_type }, { name: "b", type: CSharp.int_type }],
        body: from_js(CSharp.int_type, Sem.get_v_rt("a").then(function (a_v) { return Sem.get_v_rt("b").then(function (b_v) {
            return Sem.return_rt(Sem.int_expr(a_v.value.v - b_v.value.v));
        }); })) }); },
], [], true);
exports.math = CSharp.def_class(source_range_1.minus_two_range, "Math", [
    function (_) { return ({ modifiers: ["static", "public"], is_constructor: false, range: source_range_1.minus_two_range,
        return_t: CSharp.double_type, name: "sqrt", parameters: [{ name: "a", type: CSharp.double_type }],
        body: from_js(CSharp.double_type, Sem.get_v_rt("a").then(function (a_v) {
            return Sem.return_rt(Sem.float_expr(Math.sqrt(a_v.value.v)));
        })) }); },
], [], true);
exports.standard_lib = function () { return CSharp.semicolon(source_range_1.minus_two_range, exports.int, exports.math); };
