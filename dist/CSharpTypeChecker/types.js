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
var source_range_1 = require("../source_range");
exports.type_to_string = function (t) {
    return t.kind == "unit" ? "void"
        : t.kind == "int" || t.kind == "double" || t.kind == "float" || t.kind == "string" || t.kind == "var" || t.kind == "bool" ? t.kind
            : t.kind == "ref" ? t.C_name
                : t.kind == "tuple" ? "(" + t.args.map(function (t) { return t && exports.type_to_string(t); }).reduce(function (a, b) { return a + "," + b; }) + ")"
                    : t.kind == "record" ? "(" + t.args.map(function (t, l) { return t && exports.type_to_string(t) + " " + l; }).reduce(function (a, b) { return a + "," + b; }) + ")"
                        : t.kind == "fun" && t.in.kind == "tuple" ? "Func<" + (t.in.args.length == 0 ? "" : t.in.args.map(function (t) { return t && exports.type_to_string(t); }).reduce(function (a, b) { return a + "," + b; })) + "," + exports.type_to_string(t.out) + ">"
                            : t.kind == "fun" ? "Func<" + exports.type_to_string(t.in) + "," + exports.type_to_string(t.out) + ">"
                                : t.kind == "arr" ? exports.type_to_string(t.arg) + "[]"
                                    : t.kind == "generic type instance" ? t.C_name + "<" + t.args.map(function (t) { return t && exports.type_to_string(t); }).reduce(function (a, b) { return a + "," + b; }) + ">"
                                        : "not implemented";
};
exports.render_grid_type = { kind: "render-grid" };
exports.render_grid_pixel_type = { kind: "render-grid-pixel" };
exports.render_surface_type = { kind: "render surface" };
exports.circle_type = { kind: "circle" };
exports.square_type = { kind: "square" };
exports.ellipse_type = { kind: "ellipse" };
exports.rectangle_type = { kind: "rectangle" };
exports.line_type = { kind: "line" };
exports.polygon_type = { kind: "polygon" };
exports.text_type = { kind: "text" };
exports.sprite_type = { kind: "sprite" };
exports.other_render_surface_type = { kind: "other surface" };
exports.unit_type = { kind: "unit" };
exports.int_type = { kind: "int" };
exports.var_type = { kind: "var" };
exports.string_type = { kind: "string" };
exports.bool_type = { kind: "bool" };
exports.float_type = { kind: "float" };
exports.double_type = { kind: "double" };
exports.fun_type = function (i, o, range) { return ({ kind: "fun", in: i, out: o, range: range }); };
exports.fun_stmts_type = function (i, o, range) { return ({ kind: "fun_with_input_as_stmts", in: i, out: o, range: range }); };
exports.arr_type = function (arg) { return ({ kind: "arr", arg: arg }); };
exports.tuple_type = function (args) { return ({ kind: "tuple", args: args }); };
exports.record_type = function (args) { return ({ kind: "record", args: args }); };
exports.generic_type_instance = function (C_name, args) { return ({ kind: "generic type instance", C_name: C_name, args: args }); };
exports.ref_type = function (C_name) { return ({ kind: "ref", C_name: C_name }); };
exports.generic_type_decl = function (instantiate, params, C_name) { return ({ kind: "generic type decl", instantiate: instantiate, params: params, C_name: C_name }); };
exports.mk_typing = function (t, s, is_constant) { return ({ type: __assign({}, t, { is_constant: is_constant == undefined ? false : is_constant }), sem: s }); };
exports.mk_typing_cat = ts_bccc_1.fun2(exports.mk_typing);
exports.mk_typing_cat_full = ts_bccc_1.fun2(function (t, s) { return exports.mk_typing(t, s, t.is_constant); });
exports.empty_state = { highlighting: source_range_1.zero_range, bindings: Immutable.Map() };
exports.load = ts_bccc_1.fun(function (x) {
    return x.snd.bindings.has(x.fst) ?
        ts_bccc_1.apply(ts_bccc_1.inr(), x.snd.bindings.get(x.fst))
        : ts_bccc_1.apply(ts_bccc_1.inl(), {});
});
exports.store = ts_bccc_1.fun(function (x) {
    return (__assign({}, x.snd, { bindings: x.snd.bindings.set(x.fst.fst, x.fst.snd) }));
});
exports.type_equals = function (t1, t2) {
    if (t1.kind == "fun" && t2.kind == "fun")
        return exports.type_equals(t1.in, t2.in) && exports.type_equals(t1.out, t2.out);
    if (t1.kind == "tuple" && t2.kind == "tuple")
        return t1.args.length == t2.args.length &&
            t1.args.every(function (t1_arg, i) { return exports.type_equals(t1_arg, t2.args[i]); });
    if (t1.kind == "record" && t2.kind == "record")
        return t1.args.count() == t2.args.count() &&
            t1.args.every(function (t1_arg, i) { return t1_arg != undefined && i != undefined && t2.args.has(i) && exports.type_equals(t1_arg, t2.args.get(i)); });
    if (t1.kind == "arr" && t2.kind == "arr")
        return exports.type_equals(t1.arg, t2.arg);
    if (t1.kind == "obj" && t2.kind == "obj")
        return t1.C_name == t2.C_name;
    if (t1.kind == "ref" && t2.kind == "ref")
        return t1.C_name == t2.C_name;
    if (t1.kind != t2.kind &&
        (t1.kind == "var" || t2.kind == "var"))
        return true;
    return t1.kind == t2.kind;
};
exports.no_constraints = ts_bccc_1.inr().f({});
