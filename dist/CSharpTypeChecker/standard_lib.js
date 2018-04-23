"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts_bccc_1 = require("ts-bccc");
var CSharp = require("./csharp");
var Sem = require("../Python/python");
var source_range_1 = require("../source_range");
var csharp_1 = require("./csharp");
var python_1 = require("../Python/python");
var from_js = function (t, sem) { return function (_) { return ts_bccc_1.co_unit(CSharp.mk_typing(t, sem)); }; };
var to_string = function (t, op) {
    return function (_) { return ({ modifiers: ["public", "static"], is_constructor: false, range: source_range_1.minus_two_range,
        return_t: CSharp.string_type, name: "ToString", parameters: [{ name: "a", type: t }],
        params_base_call: ts_bccc_1.apply(ts_bccc_1.inr(), {}),
        body: from_js(CSharp.string_type, Sem.get_v_rt(source_range_1.minus_two_range, "a").then(function (a_v) {
            return Sem.return_rt(Sem.val_expr(ts_bccc_1.apply(ts_bccc_1.inl(), op(a_v.value))));
        })) }); };
};
var unary_operator = function (name, t, op) {
    return function (_) { return ({ modifiers: ["static", "public", "operator"], is_constructor: false, range: source_range_1.minus_two_range,
        return_t: t, name: name, parameters: [{ name: "a", type: t }],
        params_base_call: ts_bccc_1.apply(ts_bccc_1.inr(), {}),
        body: from_js(t, Sem.get_v_rt(source_range_1.minus_two_range, "a").then(function (a_v) {
            return Sem.return_rt(Sem.val_expr(ts_bccc_1.apply(ts_bccc_1.inl(), op(a_v.value))));
        })) }); };
};
var binary_operator = function (name, t, op) {
    return function (_) { return ({ modifiers: ["static", "public", "operator"], is_constructor: false, range: source_range_1.minus_two_range,
        return_t: t, name: name, parameters: [{ name: "a", type: t }, { name: "b", type: t }],
        params_base_call: ts_bccc_1.apply(ts_bccc_1.inr(), {}),
        body: from_js(t, Sem.get_v_rt(source_range_1.minus_two_range, "a").then(function (a_v) { return Sem.get_v_rt(source_range_1.minus_two_range, "b").then(function (b_v) {
            return Sem.return_rt(Sem.val_expr(ts_bccc_1.apply(ts_bccc_1.inl(), op(a_v.value, b_v.value))));
        }); })) }); };
};
var comparison_operator = function (name, t, op) {
    return function (_) { return ({ modifiers: ["static", "public", "operator"], is_constructor: false, range: source_range_1.minus_two_range,
        return_t: CSharp.bool_type, name: name, parameters: [{ name: "a", type: t }, { name: "b", type: t }],
        params_base_call: ts_bccc_1.apply(ts_bccc_1.inr(), {}),
        body: from_js(CSharp.bool_type, Sem.get_v_rt(source_range_1.minus_two_range, "a").then(function (a_v) { return Sem.get_v_rt(source_range_1.minus_two_range, "b").then(function (b_v) {
            return Sem.return_rt(Sem.val_expr(ts_bccc_1.apply(ts_bccc_1.inl(), op(a_v.value, b_v.value))));
        }); })) }); };
};
var casting_operator = function (name, from_t, to_t, conv) {
    return function (_) { return ({ modifiers: ["static", "public", "casting", "operator"], is_constructor: false, range: source_range_1.minus_two_range,
        return_t: to_t, name: name, parameters: [{ name: "a", type: from_t }],
        params_base_call: ts_bccc_1.apply(ts_bccc_1.inr(), {}),
        body: from_js(to_t, Sem.get_v_rt(source_range_1.minus_two_range, "a").then(function (a_v) {
            return Sem.return_rt(Sem.val_expr(ts_bccc_1.apply(ts_bccc_1.inl(), conv(a_v.value))));
        })) }); };
};
var bool = CSharp.def_class(source_range_1.minus_two_range, [], "normal", "bool", [], [
    casting_operator("string", CSharp.bool_type, CSharp.string_type, function (a_v) { return Sem.mk_string_val(a_v.v.toString()); }),
    to_string(CSharp.bool_type, function (a_v) { return Sem.mk_string_val(a_v.v.toString()); }),
    unary_operator("!", CSharp.bool_type, function (a_v) { return Sem.mk_bool_val(!a_v.v); }),
    binary_operator("^", CSharp.bool_type, function (a_v, b_v) { return Sem.mk_bool_val(a_v.v != b_v.v); }),
    binary_operator("&&", CSharp.bool_type, function (a_v, b_v) { return Sem.mk_bool_val(a_v.v && b_v.v); }),
    binary_operator("||", CSharp.bool_type, function (a_v, b_v) { return Sem.mk_bool_val(a_v.v || b_v.v); }),
], [], true);
var int = CSharp.def_class(source_range_1.minus_two_range, [], "normal", "int", [], [
    casting_operator("string", CSharp.int_type, CSharp.string_type, function (a_v) { return Sem.mk_string_val(a_v.v.toString()); }),
    to_string(CSharp.int_type, function (a_v) { return Sem.mk_string_val(a_v.v.toString()); }),
    casting_operator("float", CSharp.int_type, CSharp.float_type, function (a_v) { return Sem.mk_float_val(a_v.v); }),
    binary_operator("+", CSharp.int_type, function (a_v, b_v) { return Sem.mk_int_val(a_v.v + b_v.v); }),
    binary_operator("-", CSharp.int_type, function (a_v, b_v) { return Sem.mk_int_val(a_v.v - b_v.v); }),
    // unary_operator("-", CSharp.int_type, (a_v) => Sem.mk_int_val(-(a_v.v as number))),
    binary_operator("*", CSharp.int_type, function (a_v, b_v) { return Sem.mk_int_val(a_v.v * b_v.v); }),
    binary_operator("/", CSharp.int_type, function (a_v, b_v) { return Sem.mk_int_val(a_v.v / b_v.v); }),
    binary_operator("%", CSharp.int_type, function (a_v, b_v) { return Sem.mk_int_val(a_v.v % b_v.v); }),
    comparison_operator(">", CSharp.int_type, function (a_v, b_v) { return Sem.mk_bool_val(a_v.v > b_v.v); }),
    comparison_operator("<", CSharp.int_type, function (a_v, b_v) { return Sem.mk_bool_val(a_v.v < b_v.v); }),
    comparison_operator(">=", CSharp.int_type, function (a_v, b_v) { return Sem.mk_bool_val(a_v.v >= b_v.v); }),
    comparison_operator("<=", CSharp.int_type, function (a_v, b_v) { return Sem.mk_bool_val(a_v.v <= b_v.v); }),
    comparison_operator("==", CSharp.int_type, function (a_v, b_v) { return Sem.mk_bool_val(a_v.v == b_v.v); }),
    comparison_operator("!=", CSharp.int_type, function (a_v, b_v) { return Sem.mk_bool_val(a_v.v != b_v.v); }),
], [], true);
exports.float = CSharp.def_class(source_range_1.minus_two_range, [], "normal", "float", [], [
    casting_operator("string", CSharp.float_type, CSharp.string_type, function (a_v) { return Sem.mk_string_val(a_v.v.toString()); }),
    to_string(CSharp.float_type, function (a_v) { return Sem.mk_string_val(a_v.v.toString()); }),
    casting_operator("double", CSharp.float_type, CSharp.double_type, function (a_v) { return Sem.mk_float_val(a_v.v); }),
    binary_operator("+", CSharp.float_type, function (a_v, b_v) { return Sem.mk_float_val(a_v.v + b_v.v); }),
    binary_operator("-", CSharp.float_type, function (a_v, b_v) { return Sem.mk_float_val(a_v.v - b_v.v); }),
    // unary_operator("-", CSharp.float_type, (a_v) => Sem.mk_float_val(-(a_v.v as number))),
    binary_operator("*", CSharp.float_type, function (a_v, b_v) { return Sem.mk_float_val(a_v.v * b_v.v); }),
    binary_operator("/", CSharp.float_type, function (a_v, b_v) { return Sem.mk_float_val(a_v.v / b_v.v); }),
    comparison_operator(">", CSharp.float_type, function (a_v, b_v) { return Sem.mk_bool_val(a_v.v > b_v.v); }),
    comparison_operator("<", CSharp.float_type, function (a_v, b_v) { return Sem.mk_bool_val(a_v.v < b_v.v); }),
    comparison_operator(">=", CSharp.float_type, function (a_v, b_v) { return Sem.mk_bool_val(a_v.v >= b_v.v); }),
    comparison_operator("<=", CSharp.float_type, function (a_v, b_v) { return Sem.mk_bool_val(a_v.v <= b_v.v); }),
    comparison_operator("==", CSharp.float_type, function (a_v, b_v) { return Sem.mk_bool_val(a_v.v == b_v.v); }),
    comparison_operator("!=", CSharp.float_type, function (a_v, b_v) { return Sem.mk_bool_val(a_v.v != b_v.v); }),
], [], true);
exports.double = CSharp.def_class(source_range_1.minus_two_range, [], "normal", "double", [], [
    casting_operator("string", CSharp.double_type, CSharp.string_type, function (a_v) { return Sem.mk_string_val(a_v.v.toString()); }),
    to_string(CSharp.double_type, function (a_v) { return Sem.mk_string_val(a_v.v.toString()); }),
    binary_operator("+", CSharp.double_type, function (a_v, b_v) { return Sem.mk_float_val(a_v.v + b_v.v); }),
    // unary_operator("-", CSharp.double_type, (a_v) => Sem.mk_float_val(-(a_v.v as number))),
    binary_operator("-", CSharp.double_type, function (a_v, b_v) { return Sem.mk_float_val(a_v.v - b_v.v); }),
    binary_operator("*", CSharp.double_type, function (a_v, b_v) { return Sem.mk_float_val(a_v.v * b_v.v); }),
    binary_operator("/", CSharp.double_type, function (a_v, b_v) { return Sem.mk_float_val(a_v.v / b_v.v); }),
    comparison_operator(">", CSharp.double_type, function (a_v, b_v) { return Sem.mk_bool_val(a_v.v > b_v.v); }),
    comparison_operator("<", CSharp.double_type, function (a_v, b_v) { return Sem.mk_bool_val(a_v.v < b_v.v); }),
    comparison_operator(">=", CSharp.double_type, function (a_v, b_v) { return Sem.mk_bool_val(a_v.v >= b_v.v); }),
    comparison_operator("<=", CSharp.double_type, function (a_v, b_v) { return Sem.mk_bool_val(a_v.v <= b_v.v); }),
    comparison_operator("==", CSharp.double_type, function (a_v, b_v) { return Sem.mk_bool_val(a_v.v == b_v.v); }),
    comparison_operator("!=", CSharp.double_type, function (a_v, b_v) { return Sem.mk_bool_val(a_v.v != b_v.v); }),
], [], true);
var string = CSharp.def_class(source_range_1.minus_two_range, [], "normal", "string", [], [
    to_string(CSharp.string_type, function (a_v) { return Sem.mk_string_val(a_v.v); }),
    binary_operator("+", CSharp.string_type, function (a_v, b_v) { return Sem.mk_string_val(a_v.v + b_v.v); }),
    comparison_operator("==", CSharp.string_type, function (a_v, b_v) { return Sem.mk_bool_val(a_v.v == b_v.v); }),
    comparison_operator("!=", CSharp.string_type, function (a_v, b_v) { return Sem.mk_bool_val(a_v.v != b_v.v); }),
], [], true);
var unit = CSharp.def_class(source_range_1.minus_two_range, [], "normal", "unit", [], [
    to_string(CSharp.unit_type, function (a_v) { return Sem.mk_string_val(""); }),
], [], true);
var math = CSharp.def_class(source_range_1.minus_two_range, [], "normal", "Math", [], [
    function (_) { return ({ modifiers: ["static", "public"], is_constructor: false, range: source_range_1.minus_two_range,
        return_t: CSharp.double_type, name: "sqrt", parameters: [{ name: "a", type: CSharp.double_type }],
        params_base_call: ts_bccc_1.apply(ts_bccc_1.inr(), {}),
        body: from_js(CSharp.double_type, Sem.get_v_rt(source_range_1.minus_two_range, "a").then(function (a_v) {
            return Sem.return_rt(Sem.float_expr(Math.sqrt(a_v.value.v)));
        })) }); },
    function (_) { return ({ modifiers: ["static", "public"], is_constructor: false, range: source_range_1.minus_two_range,
        return_t: CSharp.double_type, name: "pow", parameters: [{ name: "a", type: CSharp.double_type },
            { name: "b", type: CSharp.double_type }],
        params_base_call: ts_bccc_1.apply(ts_bccc_1.inr(), {}),
        body: from_js(CSharp.double_type, Sem.get_v_rt(source_range_1.minus_two_range, "a").then(function (a_v) {
            return Sem.get_v_rt(source_range_1.minus_two_range, "b").then(function (b_v) {
                return Sem.return_rt(Sem.float_expr(Math.pow(a_v.value.v, b_v.value.v)));
            });
        })) }); },
    function (_) { return ({ modifiers: ["static", "public"], is_constructor: false, range: source_range_1.minus_two_range,
        return_t: CSharp.double_type, name: "min", parameters: [{ name: "a", type: CSharp.double_type },
            { name: "b", type: CSharp.double_type }],
        params_base_call: ts_bccc_1.apply(ts_bccc_1.inr(), {}),
        body: from_js(CSharp.double_type, Sem.get_v_rt(source_range_1.minus_two_range, "a").then(function (a_v) {
            return Sem.get_v_rt(source_range_1.minus_two_range, "b").then(function (b_v) {
                return Sem.return_rt(Sem.float_expr(Math.min(a_v.value.v, b_v.value.v)));
            });
        })) }); },
    function (_) { return ({ modifiers: ["static", "public"], is_constructor: false, range: source_range_1.minus_two_range,
        return_t: CSharp.double_type, name: "max", parameters: [{ name: "a", type: CSharp.double_type },
            { name: "b", type: CSharp.double_type }],
        params_base_call: ts_bccc_1.apply(ts_bccc_1.inr(), {}),
        body: from_js(CSharp.double_type, Sem.get_v_rt(source_range_1.minus_two_range, "a").then(function (a_v) {
            return Sem.get_v_rt(source_range_1.minus_two_range, "b").then(function (b_v) {
                return Sem.return_rt(Sem.float_expr(Math.max(a_v.value.v, b_v.value.v)));
            });
        })) }); },
], [], true);
var file_read_all_text = function (_) { return ({
    modifiers: ["static", "public"],
    is_constructor: false,
    range: source_range_1.minus_two_range,
    return_t: csharp_1.string_type,
    name: "ReadAllText",
    parameters: [{ name: "path", type: csharp_1.string_type }],
    params_base_call: ts_bccc_1.apply(ts_bccc_1.inr(), {}),
    body: from_js(csharp_1.string_type, Sem.return_rt(Sem.get_file(source_range_1.minus_two_range, Sem.get_v_rt(source_range_1.minus_two_range, "path"))))
}); };
var file_write_all_text = function (_) { return ({
    modifiers: ["static", "public"],
    is_constructor: false,
    range: source_range_1.minus_two_range,
    return_t: csharp_1.unit_type,
    name: "WriteAllText",
    parameters: [
        { name: "path", type: csharp_1.string_type },
        { name: "contents", type: csharp_1.string_type }
    ],
    params_base_call: ts_bccc_1.apply(ts_bccc_1.inr(), {}),
    body: from_js(csharp_1.string_type, Sem.return_rt(Sem.set_file(source_range_1.minus_two_range, Sem.get_v_rt(source_range_1.minus_two_range, "path"), Sem.get_v_rt(source_range_1.minus_two_range, "contents"))))
}); };
var file_exists = function (_) { return ({
    modifiers: ["static", "public"],
    is_constructor: false,
    range: source_range_1.minus_two_range,
    return_t: csharp_1.bool_type,
    name: "Exists",
    parameters: [{ name: "path", type: csharp_1.string_type }],
    params_base_call: ts_bccc_1.apply(ts_bccc_1.inr(), {}),
    body: from_js(csharp_1.string_type, Sem.return_rt(Sem.exists(Sem.get_v_rt(source_range_1.minus_two_range, "path"))))
}); };
var file_copy = function (_) { return ({
    modifiers: ["static", "public"],
    is_constructor: false,
    range: source_range_1.minus_two_range,
    return_t: csharp_1.bool_type,
    name: "Copy",
    parameters: [
        { name: "path_to", type: csharp_1.string_type },
        { name: "path_from", type: csharp_1.string_type },
    ],
    params_base_call: ts_bccc_1.apply(ts_bccc_1.inr(), {}),
    body: from_js(csharp_1.string_type, Sem.return_rt(Sem.copy_file(source_range_1.minus_two_range, Sem.get_v_rt(source_range_1.minus_two_range, "path_to"), Sem.get_v_rt(source_range_1.minus_two_range, "path_from"))))
}); };
var file_create = function (_) { return ({
    modifiers: ["static", "public"],
    is_constructor: false,
    range: source_range_1.minus_two_range,
    return_t: csharp_1.bool_type,
    name: "Create",
    parameters: [
        { name: "path", type: csharp_1.string_type }
    ],
    params_base_call: ts_bccc_1.apply(ts_bccc_1.inr(), {}),
    body: from_js(csharp_1.string_type, Sem.return_rt(Sem.set_file(source_range_1.minus_two_range, Sem.get_v_rt(source_range_1.minus_two_range, "path"), ts_bccc_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), python_1.mk_string_val(""))))))
}); };
var file_delete = function (_) { return ({
    modifiers: ["static", "public"],
    is_constructor: false,
    range: source_range_1.minus_two_range,
    return_t: csharp_1.bool_type,
    name: "Delete",
    parameters: [
        { name: "path", type: csharp_1.string_type }
    ],
    params_base_call: ts_bccc_1.apply(ts_bccc_1.inr(), {}),
    body: from_js(csharp_1.string_type, Sem.return_rt(Sem.delete_file(source_range_1.minus_two_range, Sem.get_v_rt(source_range_1.minus_two_range, "path"))))
}); };
var file_move = function (_) { return ({
    modifiers: ["static", "public"],
    is_constructor: false,
    range: source_range_1.minus_two_range,
    return_t: csharp_1.unit_type,
    name: "Move",
    parameters: [
        { name: "path_to", type: csharp_1.string_type },
        { name: "path_from", type: csharp_1.string_type }
    ],
    params_base_call: ts_bccc_1.apply(ts_bccc_1.inr(), {}),
    body: from_js(csharp_1.string_type, Sem.return_rt(Sem.move_file(source_range_1.minus_two_range, Sem.get_v_rt(source_range_1.minus_two_range, "path_to"), Sem.get_v_rt(source_range_1.minus_two_range, "path_from"))))
}); };
exports.path = CSharp.def_class(source_range_1.minus_two_range, [], "normal", "Path", [], [
    file_copy,
    file_create,
    file_delete,
    file_exists,
    file_move,
    file_read_all_text,
    file_write_all_text,
], []);
exports.standard_lib = function () {
    return CSharp.semicolon(source_range_1.minus_two_range, int, CSharp.semicolon(source_range_1.minus_two_range, exports.float, CSharp.semicolon(source_range_1.minus_two_range, exports.double, CSharp.semicolon(source_range_1.minus_two_range, string, CSharp.semicolon(source_range_1.minus_two_range, bool, CSharp.semicolon(source_range_1.minus_two_range, unit, CSharp.semicolon(source_range_1.minus_two_range, math, exports.path)))))));
};
