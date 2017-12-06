"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts_bccc_1 = require("ts-bccc");
var ts_bccc_2 = require("ts-bccc");
var memory_1 = require("./memory");
exports.FalseCat = ts_bccc_1.unit().then(ts_bccc_1.inl());
exports.TrueCat = ts_bccc_1.unit().then(ts_bccc_1.inr());
exports.bool_to_boolcat = ts_bccc_1.fun(function (b) { return b ? exports.TrueCat : exports.FalseCat; });
exports.unit_expr = function () { return (ts_bccc_2.co_unit(memory_1.unt)); };
exports.str_expr = function (s) { return (ts_bccc_2.co_unit(memory_1.str(s))); };
exports.float_expr = function (n) { return (ts_bccc_2.co_unit(memory_1.float(n))); };
exports.int_expr = function (n) { return (ts_bccc_2.co_unit(memory_1.int(n))); };
exports.arr_expr = function (a) { return (ts_bccc_2.co_unit(memory_1.arr(a))); };
exports.bool_expr = function (s) { return (ts_bccc_2.co_unit(memory_1.bool(s))); };
exports.lambda_expr = function (l) { return (ts_bccc_2.co_unit(memory_1.lambda(l))); };
exports.obj_expr = function (o) { return (ts_bccc_2.co_unit(memory_1.obj(o))); };
exports.ref_expr = function (r) { return (ts_bccc_2.co_unit(memory_1.ref(r))); };
exports.val_expr = function (v) { return (ts_bccc_2.co_unit(v)); };
var lift_binary_operation = function (a, b, check_types, actual_operation, operator_name) {
    return a.then(function (a_val) { return b.then(function (b_val) {
        return ts_bccc_1.apply(ts_bccc_1.fun(check_types).then((ts_bccc_1.fun(actual_operation).then(ts_bccc_1.fun(ts_bccc_2.co_unit))).plus(ts_bccc_1.constant(memory_1.runtime_error("Type error: cannot perform " + operator_name + " on " + a_val.v + " and " + b_val.v + ".")))), { fst: a_val, snd: b_val });
    }); });
};
exports.bool_times = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "b" || ab.snd.k != "b" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.bool(ab_val.fst && ab_val.snd); }, "(&&)");
};
exports.bool_plus = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "b" || ab.snd.k != "b" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.bool(ab_val.fst || ab_val.snd); }, "(||)");
};
exports.int_plus = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "i" || ab.snd.k != "i" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.int(ab_val.fst + ab_val.snd); }, "(+)");
};
exports.int_minus = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "i" || ab.snd.k != "i" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.int(ab_val.fst - ab_val.snd); }, "(-)");
};
exports.int_times = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "i" || ab.snd.k != "i" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.int(ab_val.fst * ab_val.snd); }, "(*)");
};
exports.int_div = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "i" || ab.snd.k != "i" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.int(Math.floor(ab_val.fst / ab_val.snd)); }, "(/)");
};
exports.int_mod = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "i" || ab.snd.k != "i" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.int(ab_val.fst % ab_val.snd); }, "(%)");
};
exports.float_plus = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "f" || ab.snd.k != "f" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.float(ab_val.fst + ab_val.snd); }, "(+)");
};
exports.float_minus = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "f" || ab.snd.k != "f" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.float(ab_val.fst - ab_val.snd); }, "(-)");
};
exports.float_times = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "f" || ab.snd.k != "f" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.float(ab_val.fst * ab_val.snd); }, "(*)");
};
exports.float_div = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "f" || ab.snd.k != "f" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.float(ab_val.fst / ab_val.snd); }, "(/)");
};
exports.string_plus = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "s" || ab.snd.k != "s" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.str(ab_val.fst + ab_val.snd); }, "(+)");
};
var lift_unary_operation = function (a, check_type, actual_operation, operator_name) {
    return a.then(function (a_val) {
        return ts_bccc_1.apply(ts_bccc_1.fun(check_type).then((ts_bccc_1.fun(actual_operation).then(ts_bccc_1.fun(ts_bccc_2.co_unit))).plus(ts_bccc_1.constant(memory_1.runtime_error("Type error: cannot perform " + operator_name + " on value " + a_val.v + ".")))), a_val);
    });
};
exports.bool_not = function (a) {
    return lift_unary_operation(a, function (ab) { return ab.k != "b" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f(ab.v); }, function (ab_val) { return memory_1.bool(!ab_val); }, "(!)");
};
exports.int_minus_unary = function (a) {
    return lift_unary_operation(a, function (ab) { return ab.k != "i" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f(ab.v); }, function (ab_val) { return memory_1.int(-ab_val); }, "(-)");
};
exports.float_minus_unary = function (a) {
    return lift_unary_operation(a, function (ab) { return ab.k != "f" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f(ab.v); }, function (ab_val) { return memory_1.float(-ab_val); }, "(-)");
};
exports.string_length = function (a) {
    return lift_unary_operation(a, function (ab) { return ab.k != "s" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f(ab.v); }, function (ab_val) { return memory_1.int(ab_val.length); }, "(length)");
};
