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
var ts_bccc_2 = require("ts-bccc");
var memory_1 = require("./memory");
var python_1 = require("./python");
exports.FalseCat = ts_bccc_1.unit().then(ts_bccc_1.inl());
exports.TrueCat = ts_bccc_1.unit().then(ts_bccc_1.inr());
exports.bool_to_boolcat = ts_bccc_1.fun(function (b) { return b ? exports.TrueCat : exports.FalseCat; });
exports.unit_expr = function () { return (ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), memory_1.mk_unit_val))); };
exports.str_expr = function (s) { return (ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), memory_1.mk_string_val(s)))); };
exports.float_expr = function (n) { return (ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), memory_1.mk_float_val(n)))); };
exports.int_expr = function (n) { return (ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), memory_1.mk_int_val(n)))); };
exports.arr_expr = function (a) { return (ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), memory_1.mk_arr_val(a)))); };
exports.bool_expr = function (s) { return (ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), memory_1.mk_bool_val(s)))); };
exports.lambda_expr = function (l) { return (ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), memory_1.mk_lambda_val(l)))); };
exports.obj_expr = function (o) { return (ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), memory_1.mk_obj_val(o)))); };
exports.ref_expr = function (r) { return (ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), memory_1.mk_ref_val(r)))); };
exports.val_expr = function (v) { return (ts_bccc_2.co_unit(v)); };
exports.render_grid_expr = function (v) { return (ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), python_1.mk_render_grid_val(v)))); };
exports.render_grid_pixel_expr = function (v) { return (ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), python_1.mk_render_grid_pixel_val(v)))); };
var lift_binary_operation = function (a, b, check_types, actual_operation, operator_name) {
    return a.then(function (a_val) { return b.then(function (b_val) {
        return ts_bccc_1.apply(ts_bccc_1.fun(check_types).then((ts_bccc_1.fun(actual_operation).then(ts_bccc_1.inl()).then(ts_bccc_1.fun(ts_bccc_2.co_unit))).plus(ts_bccc_1.constant(memory_1.runtime_error("Type error: cannot perform " + operator_name + " on " + a_val.value.v + " and " + b_val.value.v + ".")))), { fst: a_val.value, snd: b_val.value });
    }); });
};
exports.mk_empty_render_grid_rt = function (width, height) {
    return width.then(function (w) { return height.then(function (h) {
        return w.value.k == "i" && h.value.k == "i" ? exports.render_grid_expr({ width: w.value.v, height: h.value.v, pixels: Immutable.Map() })
            : memory_1.runtime_error("Type error: cannot create empty render grid with width and height " + w.value.v + " and " + h.value.v + ".");
    }); });
};
exports.mk_render_grid_pixel_rt = function (x, y, status) {
    return x.then(function (x_val) { return y.then(function (y_val) { return status.then(function (status_val) {
        return x_val.value.k == "i" && y_val.value.k == "i" && status_val.value.k == "b" ?
            exports.render_grid_pixel_expr({ x: x_val.value.v, y: y_val.value.v, status: status_val.value.v })
            : memory_1.runtime_error("Type error: cannot create render grid pixel with x,y, and status " + x_val.value.v + ", " + y_val.value.v + ", and " + status_val.value.v + ".");
    }); }); });
};
exports.render_grid_plus_rt = function (r, p) {
    return lift_binary_operation(r, p, function (ab) { return ab.fst.k != "render-grid" || ab.snd.k != "render-grid-pixel" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) {
        var rg = ab_val.fst;
        var p = ab_val.snd;
        var pixels = rg.pixels;
        if (p.status) {
            if (!pixels.has(p.x))
                pixels = pixels.set(p.x, Immutable.Set().add(p.y));
            else
                pixels = pixels.set(p.x, pixels.get(p.x).add(p.y));
        }
        else {
            if (pixels.has(p.x)) {
                var new_row = pixels.get(p.x).remove(p.y);
                if (new_row.isEmpty())
                    pixels = pixels.remove(p.x);
                else
                    pixels = pixels.set(p.x, new_row);
            }
        }
        return python_1.mk_render_grid_val(__assign({}, rg, { pixels: pixels }));
    }, "(+)");
};
exports.bool_times_rt = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "b" || ab.snd.k != "b" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.mk_bool_val(ab_val.fst && ab_val.snd); }, "(&&)");
};
exports.bool_plus_rt = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "b" || ab.snd.k != "b" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.mk_bool_val(ab_val.fst || ab_val.snd); }, "(||)");
};
exports.int_plus_rt = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "i" || ab.snd.k != "i" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.mk_int_val(ab_val.fst + ab_val.snd); }, "(+)");
};
exports.int_minus_rt = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "i" || ab.snd.k != "i" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.mk_int_val(ab_val.fst - ab_val.snd); }, "(-)");
};
exports.int_times_rt = function (a, b, sr) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "i" || ab.snd.k != "i" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.mk_int_val(ab_val.fst * ab_val.snd); }, "(*) at " + sr.to_string());
};
exports.int_div_rt = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "i" || ab.snd.k != "i" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.mk_int_val(Math.floor(ab_val.fst / ab_val.snd)); }, "(/)");
};
exports.int_mod_rt = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "i" || ab.snd.k != "i" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.mk_int_val(ab_val.fst % ab_val.snd); }, "(%)");
};
exports.int_gt_rt = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "i" || ab.snd.k != "i" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.mk_bool_val(ab_val.fst > ab_val.snd); }, "(>)");
};
exports.int_lt_rt = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "i" || ab.snd.k != "i" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.mk_bool_val(ab_val.fst < ab_val.snd); }, "(<)");
};
exports.int_geq_rt = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "i" || ab.snd.k != "i" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.mk_bool_val(ab_val.fst >= ab_val.snd); }, "(>=)");
};
exports.int_leq_rt = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "i" || ab.snd.k != "i" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.mk_bool_val(ab_val.fst <= ab_val.snd); }, "(<=)");
};
exports.int_eq_rt = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "i" || ab.snd.k != "i" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.mk_bool_val(ab_val.fst == ab_val.snd); }, "(==)");
};
exports.int_neq_rt = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "i" || ab.snd.k != "i" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.mk_bool_val(ab_val.fst != ab_val.snd); }, "(!=)");
};
exports.bool_neq_rt = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "b" || ab.snd.k != "b" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.mk_bool_val(ab_val.fst != ab_val.snd); }, "(!=)");
};
exports.float_plus_rt = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "f" || ab.snd.k != "f" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.mk_float_val(ab_val.fst + ab_val.snd); }, "(+)");
};
exports.float_minus_rt = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "f" || ab.snd.k != "f" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.mk_float_val(ab_val.fst - ab_val.snd); }, "(-)");
};
exports.float_times_rt = function (a, b, sr) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "f" || ab.snd.k != "f" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.mk_float_val(ab_val.fst * ab_val.snd); }, "(*) at " + sr.to_string());
};
exports.float_div_rt = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "f" || ab.snd.k != "f" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.mk_float_val(ab_val.fst / ab_val.snd); }, "(/)");
};
exports.float_gt_rt = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "f" || ab.snd.k != "f" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.mk_bool_val(ab_val.fst > ab_val.snd); }, "(>)");
};
exports.float_lt_rt = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "f" || ab.snd.k != "f" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.mk_bool_val(ab_val.fst < ab_val.snd); }, "(<)");
};
exports.float_geq_rt = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "f" || ab.snd.k != "f" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.mk_bool_val(ab_val.fst >= ab_val.snd); }, "(>=)");
};
exports.float_leq_rt = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "f" || ab.snd.k != "f" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.mk_bool_val(ab_val.fst <= ab_val.snd); }, "(<=)");
};
exports.float_eq_rt = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "f" || ab.snd.k != "f" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.mk_bool_val(ab_val.fst == ab_val.snd); }, "(==)");
};
exports.float_neq_rt = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "f" || ab.snd.k != "f" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.mk_bool_val(ab_val.fst != ab_val.snd); }, "(!=)");
};
exports.string_plus_rt = function (a, b) {
    return lift_binary_operation(a, b, function (ab) { return ab.fst.k != "s" || ab.snd.k != "s" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return memory_1.mk_string_val(ab_val.fst + ab_val.snd); }, "(+)");
};
var lift_unary_operation = function (a, check_type, actual_operation, operator_name) {
    return a.then(function (a_val) {
        return ts_bccc_1.apply(ts_bccc_1.fun(check_type).then((ts_bccc_1.fun(actual_operation).then(ts_bccc_1.inl()).then(ts_bccc_1.fun(ts_bccc_2.co_unit))).plus(ts_bccc_1.constant(memory_1.runtime_error("Type error: cannot perform " + operator_name + " on value " + a_val.value.v + ".")))), a_val.value);
    });
};
exports.bool_not_rt = function (a) {
    return lift_unary_operation(a, function (ab) { return ab.k != "b" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f(ab.v); }, function (ab_val) { return memory_1.mk_bool_val(!ab_val); }, "(!)");
};
exports.int_minus_unary_rt = function (a) {
    return lift_unary_operation(a, function (ab) { return ab.k != "i" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f(ab.v); }, function (ab_val) { return memory_1.mk_int_val(-ab_val); }, "(-)");
};
exports.float_minus_unary_rt = function (a) {
    return lift_unary_operation(a, function (ab) { return ab.k != "f" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f(ab.v); }, function (ab_val) { return memory_1.mk_float_val(-ab_val); }, "(-)");
};
exports.string_length_rt = function (a) {
    return lift_unary_operation(a, function (ab) { return ab.k != "s" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f(ab.v); }, function (ab_val) { return memory_1.mk_int_val(ab_val.length); }, "(length)");
};
