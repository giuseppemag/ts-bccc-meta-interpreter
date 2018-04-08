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
var ccc_aux_1 = require("../ccc_aux");
exports.FalseCat = ts_bccc_1.unit().then(ts_bccc_1.inl());
exports.TrueCat = ts_bccc_1.unit().then(ts_bccc_1.inr());
exports.bool_to_boolcat = ts_bccc_1.fun(function (b) { return b ? exports.TrueCat : exports.FalseCat; });
exports.unit_expr = function () { return (ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), memory_1.mk_unit_val))); };
exports.str_expr = function (s) { return (ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), memory_1.mk_string_val(s)))); };
exports.float_expr = function (n) { return (ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), memory_1.mk_float_val(n)))); };
exports.int_expr = function (n) { return (ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), memory_1.mk_int_val(n)))); };
exports.arr_expr = function (a) { return (ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), memory_1.mk_arr_val(a)))); };
exports.tuple_expr = function (a) { return (ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), memory_1.mk_tuple_val(a)))); };
exports.bool_expr = function (s) { return (ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), memory_1.mk_bool_val(s)))); };
exports.lambda_expr = function (l) { return (ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), memory_1.mk_lambda_val(l)))); };
exports.obj_expr = function (o) { return (ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), memory_1.mk_obj_val(o)))); };
exports.ref_expr = function (r) { return (ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), memory_1.mk_ref_val(r)))); };
exports.val_expr = function (v) { return (ts_bccc_2.co_unit(v)); };
exports.render_surface_expr = function (v) { return (ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), python_1.mk_render_surface_val(v)))); };
exports.render_surface_operation_expr = function (v) { return (ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), python_1.mk_render_surface_operation_val(v)))); };
var lift_binary_operation = function (a, b, check_types, actual_operation, operator_name) {
    return a.then(function (a_val) { return b.then(function (b_val) {
        return ts_bccc_1.apply(ts_bccc_1.fun(check_types).then((ts_bccc_1.fun(actual_operation).then(ts_bccc_1.inl()).then(ts_bccc_1.fun(ts_bccc_2.co_unit))).plus(ts_bccc_1.constant(memory_1.runtime_error("Type error: cannot perform " + operator_name + " on " + a_val.value.v + " and " + b_val.value.v + ".")))), { fst: a_val.value, snd: b_val.value });
    }); });
};
exports.tuple_expr_rt = function (args) {
    var eval_args = ccc_aux_1.comm_list_coroutine(Immutable.List(args));
    return eval_args.then(function (arg_vals) { return (ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), memory_1.mk_tuple_val(arg_vals.toArray().map(function (a) { return a.value; }))))); });
};
exports.tuple_get_rt = function (r, t, item_index) {
    return t.then(function (t_val) {
        return t_val.value.k == "tuple" ? ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), t_val.value.v[item_index]))
            : memory_1.runtime_error("Type error (tuple): cannot lookup item " + item_index + " on non-tuple value " + t_val.value + ".");
    });
};
exports.record_get_rt = function (r, t, F_name) {
    return t.then(function (t_val) {
        return t_val.value.k == "record" && t_val.value.v.has(F_name) ? ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), t_val.value.v.get(F_name)))
            : memory_1.runtime_error("Type error (record): cannot lookup item " + F_name + " on " + JSON.stringify(t_val.value) + ".");
    });
};
exports.render_surface_plus_rt = function (r, p) {
    return lift_binary_operation(r, p, function (ab) { return ab.fst.k != "render surface" || ab.snd.k != "render surface operation" ? ts_bccc_1.inr().f({}) : ts_bccc_1.inl().f({ fst: ab.fst.v, snd: ab.snd.v }); }, function (ab_val) { return python_1.mk_render_surface_val(__assign({}, ab_val.fst, { operations: ab_val.fst.operations.push(ab_val.snd) })); }, "(+)");
};
exports.mk_empty_render_surface_rt = function (width, height, color) {
    return width.then(function (w) { return height.then(function (h) { return color.then(function (col) {
        return w.value.k == "f" && h.value.k == "f" && col.value.k == "s" ?
            exports.render_surface_expr({ width: w.value.v, height: h.value.v, operations: Immutable.List([{ kind: "rectangle", x: 0, y: 0, width: w.value.v, height: h.value.v, color: col.value.v, rotation: 0 }]) })
            : memory_1.runtime_error("Type error: cannot create empty render surface with " + w.value.v + ", " + h.value.v + ", and " + col.value.v + ".");
    }); }); });
};
exports.mk_circle_rt = function (x, y, r, color) {
    return x.then(function (x_v) { return y.then(function (y_v) { return r.then(function (r_v) { return color.then(function (col) {
        return x_v.value.k == "f" && y_v.value.k == "f" && r_v.value.k == "f" && col.value.k == "s" ?
            exports.render_surface_operation_expr(python_1.mk_circle_op(x_v.value.v, y_v.value.v, r_v.value.v, col.value.v))
            : memory_1.runtime_error("Type error: cannot create circle with " + x_v.value.v + ", " + y_v.value.v + ", " + r_v.value.v + " and " + col.value.v + ".");
    }); }); }); });
};
exports.mk_square_rt = function (x, y, s, color, rot) {
    return x.then(function (x_v) { return y.then(function (y_v) { return s.then(function (s_v) { return color.then(function (col) { return rot.then(function (rot_v) {
        return x_v.value.k == "f" && y_v.value.k == "f" && s_v.value.k == "f" && col.value.k == "s" && rot_v.value.k == "f" ?
            exports.render_surface_operation_expr(python_1.mk_square_op(x_v.value.v, y_v.value.v, s_v.value.v, col.value.v, rot_v.value.v))
            : memory_1.runtime_error("Type error: cannot create square with " + x_v.value.v + ", " + y_v.value.v + ", " + s_v.value.v + " and " + col.value.v + ".");
    }); }); }); }); });
};
exports.mk_rectangle_rt = function (x, y, w, h, color, rot) {
    return x.then(function (x_v) { return y.then(function (y_v) { return w.then(function (w_v) { return h.then(function (h_v) { return color.then(function (col) { return rot.then(function (rot_v) {
        return x_v.value.k == "f" && y_v.value.k == "f" && w_v.value.k == "f" && h_v.value.k == "f" && col.value.k == "s" && rot_v.value.k == "f" ?
            exports.render_surface_operation_expr(python_1.mk_rectangle_op(x_v.value.v, y_v.value.v, w_v.value.v, h_v.value.v, col.value.v, rot_v.value.v))
            : memory_1.runtime_error("Type error: cannot create rectangle with " + x_v.value.v + ", " + y_v.value.v + ", " + w_v.value.v + ", " + h_v.value.v + " and " + col.value.v + ".");
    }); }); }); }); }); });
};
exports.mk_line_rt = function (x1, y1, x2, y2, w, color, rot) {
    return x1.then(function (x1_v) { return y1.then(function (y1_v) { return x2.then(function (x2_v) { return y2.then(function (y2_v) { return w.then(function (w_v) { return color.then(function (col) { return rot.then(function (rot_v) {
        return x1_v.value.k == "f" && y1_v.value.k == "f" && x2_v.value.k == "f" && y2_v.value.k == "f" && w_v.value.k == "f" && col.value.k == "s" && rot_v.value.k == "f" ?
            exports.render_surface_operation_expr(python_1.mk_line_op(x1_v.value.v, y1_v.value.v, x2_v.value.v, y2_v.value.v, w_v.value.v, col.value.v, rot_v.value.v))
            : memory_1.runtime_error("Type error: cannot create line with " + x1_v.value.v + ", " + y1_v.value.v + ", " + x2_v.value.v + ", " + y2_v.value.v + ", " + w_v.value.v + ", and " + col.value.v + ".");
    }); }); }); }); }); }); });
};
exports.mk_polygon_rt = function (points, col, rot) {
    return points.then(function (points_v) {
        return col.then(function (col_v) {
            return rot.then(function (rot_v) {
                return points_v.value.k != "ref" ? memory_1.runtime_error("Type error: cannot create polygon with " + points_v.value.v + ", " + col_v.value.v + ", and " + rot_v.value.v + ".")
                    :
                        memory_1.get_heap_v_rt(points_v.value.v).then(function (points_arr_v) {
                            return col_v.value.k == "s" && rot_v.value.k == "f" && points_arr_v.value.k == "arr" ?
                                exports.render_surface_operation_expr(python_1.mk_polygon_op(points_arr_v.value.v.elements.toArray().map(function (e) {
                                    return e.k == "tuple" && e.v[0].k == "f" && e.v[1].k == "f" ? ({ x: e.v[0].v, y: e.v[1].v }) :
                                        ({ x: 0, y: 0 });
                                }), col_v.value.v, rot_v.value.v))
                                : memory_1.runtime_error("Type error: cannot create polygon with " + points_v.value.v + ", " + col_v.value.v + ", and " + rot_v.value.v + ".");
                        });
            });
        });
    });
};
exports.mk_text_rt = function (text, x, y, s, color, rotation) {
    return text.then(function (t_v) { return x.then(function (x_v) { return y.then(function (y_v) { return s.then(function (s_v) { return color.then(function (col) { return rotation.then(function (rot) {
        return t_v.value.k == "s" && x_v.value.k == "f" && y_v.value.k == "f" && s_v.value.k == "f" && col.value.k == "s" && rot.value.k == "f" ?
            exports.render_surface_operation_expr(python_1.mk_text_op(t_v.value.v, x_v.value.v, y_v.value.v, s_v.value.v, col.value.v, rot.value.v))
            : memory_1.runtime_error("Type error: cannot create text with " + t_v.value.v + ", " + x_v.value.v + ", " + y_v.value.v + ", " + s_v.value.v + ", " + col.value.v + " and " + rot.value.v + ".");
    }); }); }); }); }); });
};
exports.mk_sprite_rt = function (sprite, x, y, w, h, rot) {
    return sprite.then(function (sprite_v) { return x.then(function (x_v) { return y.then(function (y_v) { return w.then(function (w_v) { return h.then(function (h_v) { return rot.then(function (rot_v) {
        return sprite_v.value.k == "s" && x_v.value.k == "f" && y_v.value.k == "f" && w_v.value.k == "f" && h_v.value.k == "f" && rot_v.value.k == "f" ?
            exports.render_surface_operation_expr(python_1.mk_sprite_op(sprite_v.value.v, x_v.value.v, y_v.value.v, w_v.value.v, h_v.value.v, rot_v.value.v))
            : memory_1.runtime_error("Type error: cannot create sprite with " + x_v.value.v + ", " + y_v.value.v + ", " + w_v.value.v + ", " + h_v.value.v + " and " + rot_v.value.v + ".");
    }); }); }); }); }); });
};
exports.mk_ellipse_rt = function (x, y, w, h, color, rot) {
    return x.then(function (x_v) { return y.then(function (y_v) { return w.then(function (w_v) { return h.then(function (h_v) { return color.then(function (col) { return rot.then(function (rot_v) {
        return x_v.value.k == "f" && y_v.value.k == "f" && w_v.value.k == "f" && h_v.value.k == "f" && col.value.k == "s" && rot_v.value.k == "f" ?
            exports.render_surface_operation_expr(python_1.mk_ellipse_op(x_v.value.v, y_v.value.v, w_v.value.v, h_v.value.v, col.value.v, rot_v.value.v))
            : memory_1.runtime_error("Type error: cannot create ellipse with " + x_v.value.v + ", " + y_v.value.v + ", " + w_v.value.v + ", " + h_v.value.v + " and " + col.value.v + ".");
    }); }); }); }); }); });
};
exports.mk_other_surface_rt = function (s, dx, dy, sx, sy, rot) {
    return dx.then(function (dx_v) { return dy.then(function (dy_v) { return sx.then(function (sx_v) { return sy.then(function (sy_v) { return s.then(function (s_v) { return rot.then(function (rot_v) {
        return dx_v.value.k == "f" && dy_v.value.k == "f" && sx_v.value.k == "f" && sy_v.value.k == "f" && s_v.value.k == "render surface" && rot_v.value.k == "f" ?
            exports.render_surface_operation_expr(python_1.mk_other_surface_op(s_v.value.v, dx_v.value.v, dy_v.value.v, sx_v.value.v, sy_v.value.v, rot_v.value.v))
            : memory_1.runtime_error("Type error: cannot create other surface with " + dx_v.value.v + ", " + dy_v.value.v + ", " + sx_v.value.v + ", " + sy_v.value.v + ", " + s_v.value.v + ", and " + rot_v.value.v + ".");
    }); }); }); }); }); });
};
var lift_unary_operation = function (a, check_type, actual_operation, operator_name) {
    return a.then(function (a_val) {
        return ts_bccc_1.apply(ts_bccc_1.fun(check_type).then((ts_bccc_1.fun(actual_operation).then(ts_bccc_1.inl()).then(ts_bccc_1.fun(ts_bccc_2.co_unit))).plus(ts_bccc_1.constant(memory_1.runtime_error("Type error: cannot perform " + operator_name + " on value " + a_val.value.v + ".")))), a_val.value);
    });
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
