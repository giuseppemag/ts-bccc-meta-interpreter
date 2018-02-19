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
var Co = require("ts-bccc");
var source_range_1 = require("../source_range");
var Sem = require("../Python/python");
var ccc_aux_1 = require("../ccc_aux");
exports.render_grid_type = { kind: "render-grid" };
exports.render_grid_pixel_type = { kind: "render-grid-pixel" };
exports.render_surface_type = { kind: "render surface" };
exports.circle_type = { kind: "circle" };
exports.square_type = { kind: "square" };
exports.ellipse_type = { kind: "ellipse" };
exports.rectangle_type = { kind: "rectangle" };
exports.other_render_surface_type = { kind: "other surface" };
exports.unit_type = { kind: "unit" };
exports.int_type = { kind: "int" };
exports.var_type = { kind: "var" };
exports.string_type = { kind: "string" };
exports.bool_type = { kind: "bool" };
exports.float_type = { kind: "float" };
exports.fun_type = function (i, o) { return ({ kind: "fun", in: i, out: o }); };
exports.arr_type = function (arg) { return ({ kind: "arr", arg: arg }); };
exports.tuple_type = function (args) { return ({ kind: "tuple", args: args }); };
exports.ref_type = function (C_name) { return ({ kind: "ref", C_name: C_name }); };
exports.generic_type_decl = function (f, args) { return ({ kind: "generic type decl", f: f, args: args }); };
var mk_typing = function (t, s, is_constant) { return ({ type: __assign({}, t, { is_constant: is_constant == undefined ? false : is_constant }), sem: s }); };
var mk_typing_cat = ts_bccc_1.fun2(mk_typing);
var mk_typing_cat_full = ts_bccc_1.fun2(function (t, s) { return mk_typing(t, s, t.is_constant); });
exports.empty_state = { highlighting: source_range_1.zero_range, bindings: Immutable.Map() };
exports.load = ts_bccc_1.fun(function (x) {
    return x.snd.bindings.has(x.fst) ?
        ts_bccc_1.apply(ts_bccc_1.inr(), x.snd.bindings.get(x.fst))
        : ts_bccc_1.apply(ts_bccc_1.inl(), {});
});
exports.store = ts_bccc_1.fun(function (x) {
    return (__assign({}, x.snd, { bindings: x.snd.bindings.set(x.fst.fst, x.fst.snd) }));
});
var type_equals = function (t1, t2) {
    return (t1.kind == "fun" && t2.kind == "fun" && type_equals(t1.in, t2.in) && type_equals(t1.out, t2.out))
        || (t1.kind == "tuple" && t2.kind == "tuple" && t1.args.length == t2.args.length && t1.args.every(function (t1_arg, i) { return type_equals(t1_arg, t2.args[i]); }))
        || (t1.kind == "arr" && t2.kind == "arr" && type_equals(t1.arg, t2.arg))
        || (t1.kind == "obj" && t2.kind == "obj" &&
            !t1.methods.some(function (v1, k1) { return v1 == undefined || k1 == undefined || !t2.methods.has(k1) || !type_equals(t2.methods.get(k1).typing.type, v1.typing.type); }) &&
            !t2.methods.some(function (v2, k2) { return v2 == undefined || k2 == undefined || !t1.methods.has(k2); }))
        || t1.kind == t2.kind;
};
// Basic statements and expressions
var wrap_co_res = Co.value().then(Co.result());
var wrap_co = wrap_co_res.then(Co.no_error());
exports.no_constraints = ts_bccc_1.inr().f({});
exports.get_v = function (r, v) {
    var f = exports.load.then(ts_bccc_1.constant({ range: r, message: "Error: variable " + v + " does not exist." }).map_plus((ts_bccc_1.id().times(ts_bccc_1.constant(Sem.get_v_rt(v)))).then(mk_typing_cat_full)));
    var g = ts_bccc_1.snd().times(f).then(ts_bccc_1.distribute_sum_prod());
    var g1 = g.then((ts_bccc_1.snd()).map_plus((ts_bccc_1.swap_prod().then(wrap_co_res))));
    var h = ts_bccc_1.apply(ts_bccc_1.curry(g1), v);
    return function (_) { return ts_bccc_2.mk_coroutine(h); };
};
exports.decl_v = function (r, v, t, is_constant) {
    var f = exports.store.then(ts_bccc_1.constant(mk_typing(exports.unit_type, Sem.decl_v_rt(v, ts_bccc_1.apply(ts_bccc_1.inl(), Sem.mk_unit_val)))).times(ts_bccc_1.id())).then(wrap_co);
    var g = ts_bccc_1.curry(f);
    var args = ts_bccc_1.apply(ts_bccc_1.constant(v).times(ts_bccc_1.constant(__assign({}, t, { is_constant: is_constant != undefined ? is_constant : false }))), {});
    return function (_) { return ts_bccc_2.mk_coroutine(ts_bccc_1.apply(g, args)); };
};
exports.decl_and_init_v = function (r, v, t, e, is_constant) {
    return function (_) { return e(ts_bccc_1.apply(ts_bccc_1.inl(), t)).then(function (e_val) {
        var f = exports.store.then(ts_bccc_1.constant(mk_typing(exports.unit_type, e_val.sem.then(function (e_val) { return Sem.decl_v_rt(v, ts_bccc_1.apply(ts_bccc_1.inl(), e_val.value)); }))).times(ts_bccc_1.id())).then(wrap_co);
        var g = ts_bccc_1.curry(f);
        var actual_t = t.kind == "var" ? e_val.type : t;
        var args = ts_bccc_1.apply(ts_bccc_1.constant(v).times(ts_bccc_1.constant(__assign({}, actual_t, { is_constant: is_constant != undefined ? is_constant : false }))), {});
        return type_equals(e_val.type, actual_t) ? ts_bccc_2.mk_coroutine(ts_bccc_1.apply(g, args))
            : ts_bccc_2.co_error({ range: r, message: "Error: cannot assign " + JSON.stringify(v) + " to " + JSON.stringify(e_val) + ": type " + JSON.stringify(actual_t) + " does not match " + JSON.stringify(e_val.type) });
    }); };
};
exports.decl_const = function (r, c, t, e) {
    var f = exports.store.then(ts_bccc_1.constant(mk_typing(exports.unit_type, Sem.decl_v_rt(c, ts_bccc_1.apply(ts_bccc_1.inl(), Sem.mk_unit_val)))).times(ts_bccc_1.id())).then(wrap_co);
    var g = ts_bccc_1.curry(f);
    var args = ts_bccc_1.apply(ts_bccc_1.constant(c).times(ts_bccc_1.constant(__assign({}, t, { is_constant: true }))), {});
    return function (_) { return ts_bccc_2.mk_coroutine(ts_bccc_1.apply(g, args)).then(function (_) {
        return e(exports.no_constraints).then(function (e_val) {
            return exports.get_v(r, c)(exports.no_constraints).then(function (c_val) {
                return type_equals(e_val.type, c_val.type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.unit_type, Sem.set_v_expr_rt(c, e_val.sem)))
                    : ts_bccc_2.co_error({ range: r, message: "Error: cannot assign " + JSON.stringify(c) + " to " + JSON.stringify(e) + ": type " + JSON.stringify(c_val.type) + " does not match " + JSON.stringify(e_val.type) });
            });
        });
    }); };
};
exports.set_v = function (r, v, e) {
    return function (_) { return e(exports.no_constraints).then(function (e_val) {
        return exports.get_v(r, v)(exports.no_constraints).then(function (v_val) {
            // console.log(`Assigning ${v} (${JSON.stringify(v_val.type)})`) ||
            return type_equals(e_val.type, v_val.type) && !v_val.type.is_constant ?
                ts_bccc_2.co_unit(mk_typing(exports.unit_type, Sem.set_v_expr_rt(v, e_val.sem)))
                : v_val.type.is_constant ?
                    ts_bccc_2.co_error({ range: r, message: "Error: cannot assign anything to " + v + ": it is a constant." })
                    : ts_bccc_2.co_error({ range: r, message: "Error: cannot assign " + JSON.stringify(v) + " to " + JSON.stringify(e) + ": type " + JSON.stringify(v_val.type) + " does not match " + JSON.stringify(e_val.type) });
        });
    }); };
};
exports.bool = function (b) {
    return function (_) { return ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.bool_expr(b))); };
};
exports.str = function (s) {
    return function (_) { return ts_bccc_2.co_unit(mk_typing(exports.string_type, Sem.str_expr(s))); };
};
exports.int = function (i) {
    return function (_) { return ts_bccc_2.co_unit(mk_typing(exports.int_type, Sem.int_expr(i))); };
};
exports.tuple_value = function (r, args) {
    return function (constraints) {
        // console.log("Typechecking tuple value with constraints", constraints)
        if (constraints.kind == "left" && constraints.value.kind != "tuple")
            return ts_bccc_2.co_error({ range: r, message: "Error: wrong constraints " + constraints + " when typechecking tuple." });
        var check_args = ccc_aux_1.comm_list_coroutine(Immutable.List(args.map(function (a, a_i) {
            return a(constraints.kind == "left" && constraints.value.kind == "tuple" ? ts_bccc_1.apply(ts_bccc_1.inl(), constraints.value.args[a_i])
                : exports.no_constraints);
        })));
        return check_args.then(function (arg_ts) { return ts_bccc_2.co_unit(mk_typing(exports.tuple_type(arg_ts.toArray().map(function (a_t) { return a_t.type; })), Sem.tuple_expr_rt(arg_ts.toArray().map(function (a_t) { return a_t.sem; })))); });
    };
};
exports.gt = function (r, a, b) {
    return function (_) { return a(exports.no_constraints).then(function (a_t) {
        return b(exports.no_constraints).then(function (b_t) {
            return type_equals(a_t.type, b_t.type) ?
                type_equals(a_t.type, exports.int_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.int_gt_rt(a_t.sem, b_t.sem)))
                    : type_equals(a_t.type, exports.float_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.float_type, Sem.float_gt_rt(a_t.sem, b_t.sem)))
                        : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for operator (>)!" })
                : ts_bccc_2.co_error({ range: r, message: "Error: cannot compare expressions of different types!" });
        });
    }); };
};
exports.lt = function (r, a, b) {
    return function (_) { return a(exports.no_constraints).then(function (a_t) {
        return b(exports.no_constraints).then(function (b_t) {
            return type_equals(a_t.type, b_t.type) ?
                type_equals(a_t.type, exports.int_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.int_lt_rt(a_t.sem, b_t.sem)))
                    : type_equals(a_t.type, exports.float_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.float_type, Sem.float_lt_rt(a_t.sem, b_t.sem)))
                        : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for operator (<)!" })
                : ts_bccc_2.co_error({ range: r, message: "Error: cannot compare expressions of different types!" });
        });
    }); };
};
exports.geq = function (r, a, b) {
    return function (_) { return a(exports.no_constraints).then(function (a_t) {
        return b(exports.no_constraints).then(function (b_t) {
            return type_equals(a_t.type, b_t.type) ?
                type_equals(a_t.type, exports.int_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.int_geq_rt(a_t.sem, b_t.sem)))
                    : type_equals(a_t.type, exports.float_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.float_type, Sem.float_geq_rt(a_t.sem, b_t.sem)))
                        : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for operator (>=)!" })
                : ts_bccc_2.co_error({ range: r, message: "Error: cannot compare expressions of different types!" });
        });
    }); };
};
exports.leq = function (r, a, b) {
    return function (_) { return a(exports.no_constraints).then(function (a_t) {
        return b(exports.no_constraints).then(function (b_t) {
            return type_equals(a_t.type, b_t.type) ?
                type_equals(a_t.type, exports.int_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.int_leq_rt(a_t.sem, b_t.sem)))
                    : type_equals(a_t.type, exports.float_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.float_type, Sem.float_leq_rt(a_t.sem, b_t.sem)))
                        : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for operator (<=)!" })
                : ts_bccc_2.co_error({ range: r, message: "Error: cannot compare expressions of different types!" });
        });
    }); };
};
exports.eq = function (r, a, b) {
    return function (_) { return a(exports.no_constraints).then(function (a_t) {
        return b(exports.no_constraints).then(function (b_t) {
            return type_equals(a_t.type, b_t.type) ?
                type_equals(a_t.type, exports.int_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.int_eq_rt(a_t.sem, b_t.sem)))
                    : type_equals(a_t.type, exports.float_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.float_eq_rt(a_t.sem, b_t.sem)))
                        : type_equals(a_t.type, exports.bool_type) ?
                            ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.bool_eq_rt(a_t.sem, b_t.sem)))
                            : type_equals(a_t.type, exports.string_type) ?
                                ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.string_eq_rt(a_t.sem, b_t.sem)))
                                : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for operator (==)!" })
                : ts_bccc_2.co_error({ range: r, message: "Error: cannot compare expressions of different types!" });
        });
    }); };
};
exports.neq = function (r, a, b) {
    return function (_) { return a(exports.no_constraints).then(function (a_t) {
        return b(exports.no_constraints).then(function (b_t) {
            return type_equals(a_t.type, b_t.type) ?
                type_equals(a_t.type, exports.int_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.int_neq_rt(a_t.sem, b_t.sem)))
                    : type_equals(a_t.type, exports.float_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.float_neq_rt(a_t.sem, b_t.sem)))
                        : type_equals(a_t.type, exports.string_type) ?
                            ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.string_neq_rt(a_t.sem, b_t.sem)))
                            : type_equals(a_t.type, exports.bool_type) ?
                                ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.bool_neq_rt(a_t.sem, b_t.sem)))
                                : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for operator (!=)!" })
                : ts_bccc_2.co_error({ range: r, message: "Error: cannot compare expressions of different types!" });
        });
    }); };
};
exports.xor = function (r, a, b) {
    return function (_) { return a(exports.no_constraints).then(function (a_t) {
        return b(exports.no_constraints).then(function (b_t) {
            return type_equals(a_t.type, b_t.type) ?
                type_equals(a_t.type, exports.bool_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.bool_neq_rt(a_t.sem, b_t.sem)))
                    : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for operator (^)!" })
                : ts_bccc_2.co_error({ range: r, message: "Error: cannot compare expressions of different types!" });
        });
    }); };
};
exports.mk_empty_render_grid = function (r, w, h) {
    return function (_) { return w(exports.no_constraints).then(function (w_t) {
        return h(exports.no_constraints).then(function (h_t) {
            return type_equals(w_t.type, exports.int_type) && type_equals(h_t.type, exports.int_type) ?
                ts_bccc_2.co_unit(mk_typing(exports.render_grid_type, Sem.mk_empty_render_grid_rt(w_t.sem, h_t.sem)))
                : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for empty grid creation." });
        });
    }); };
};
exports.mk_render_grid_pixel = function (r, w, h, st) {
    return function (_) { return w(exports.no_constraints).then(function (w_t) {
        return h(exports.no_constraints).then(function (h_t) {
            return st(exports.no_constraints).then(function (st_t) {
                return type_equals(w_t.type, exports.int_type) && type_equals(h_t.type, exports.int_type) && type_equals(st_t.type, exports.bool_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.render_grid_pixel_type, Sem.mk_render_grid_pixel_rt(w_t.sem, h_t.sem, st_t.sem)))
                    : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for empty grid creation." });
            });
        });
    }); };
};
exports.mk_empty_surface = function (r, w, h, col) {
    return function (_) { return w(exports.no_constraints).then(function (w_t) {
        return h(exports.no_constraints).then(function (h_t) {
            return col(exports.no_constraints).then(function (col_t) {
                return type_equals(w_t.type, exports.int_type) && type_equals(h_t.type, exports.int_type) && type_equals(col_t.type, exports.string_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.render_surface_type, Sem.mk_empty_render_surface_rt(w_t.sem, h_t.sem, col_t.sem)))
                    : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for empty grid creation." });
            });
        });
    }); };
};
exports.mk_circle = function (r, x, y, radius, col) {
    return function (_) { return x(exports.no_constraints).then(function (x_t) {
        return y(exports.no_constraints).then(function (y_t) {
            return radius(exports.no_constraints).then(function (r_t) {
                return col(exports.no_constraints).then(function (col_t) {
                    return type_equals(x_t.type, exports.int_type) && type_equals(y_t.type, exports.int_type) &&
                        type_equals(r_t.type, exports.int_type) && type_equals(col_t.type, exports.string_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.circle_type, Sem.mk_circle_rt(x_t.sem, y_t.sem, r_t.sem, col_t.sem)))
                        : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for circle creation." });
                });
            });
        });
    }); };
};
exports.mk_square = function (r, x, y, radius, col) {
    return function (_) { return x(exports.no_constraints).then(function (x_t) {
        return y(exports.no_constraints).then(function (y_t) {
            return radius(exports.no_constraints).then(function (r_t) {
                return col(exports.no_constraints).then(function (col_t) {
                    return type_equals(x_t.type, exports.int_type) && type_equals(y_t.type, exports.int_type) &&
                        type_equals(r_t.type, exports.int_type) && type_equals(col_t.type, exports.string_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.square_type, Sem.mk_square_rt(x_t.sem, y_t.sem, r_t.sem, col_t.sem)))
                        : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for square creation." });
                });
            });
        });
    }); };
};
exports.mk_ellipse = function (r, x, y, w, h, col) {
    return function (_) { return x(exports.no_constraints).then(function (x_t) {
        return y(exports.no_constraints).then(function (y_t) {
            return w(exports.no_constraints).then(function (w_t) {
                return h(exports.no_constraints).then(function (h_t) {
                    return col(exports.no_constraints).then(function (col_t) {
                        return type_equals(x_t.type, exports.int_type) && type_equals(y_t.type, exports.int_type) &&
                            type_equals(w_t.type, exports.int_type) && type_equals(h_t.type, exports.int_type) &&
                            type_equals(col_t.type, exports.string_type) ?
                            ts_bccc_2.co_unit(mk_typing(exports.ellipse_type, Sem.mk_ellipse_rt(x_t.sem, y_t.sem, w_t.sem, h_t.sem, col_t.sem)))
                            : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for ellipse creation." });
                    });
                });
            });
        });
    }); };
};
exports.mk_rectangle = function (r, x, y, w, h, col) {
    return function (_) { return x(exports.no_constraints).then(function (x_t) {
        return y(exports.no_constraints).then(function (y_t) {
            return w(exports.no_constraints).then(function (w_t) {
                return h(exports.no_constraints).then(function (h_t) {
                    return col(exports.no_constraints).then(function (col_t) {
                        return type_equals(x_t.type, exports.int_type) && type_equals(y_t.type, exports.int_type) &&
                            type_equals(w_t.type, exports.int_type) && type_equals(h_t.type, exports.int_type) &&
                            type_equals(col_t.type, exports.string_type) ?
                            ts_bccc_2.co_unit(mk_typing(exports.rectangle_type, Sem.mk_rectangle_rt(x_t.sem, y_t.sem, w_t.sem, h_t.sem, col_t.sem)))
                            : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for rectangle creation." });
                    });
                });
            });
        });
    }); };
};
exports.mk_other_surface = function (r, s, dx, dy, sx, sy) {
    return function (_) { return dx(exports.no_constraints).then(function (dx_t) {
        return dy(exports.no_constraints).then(function (dy_t) {
            return sx(exports.no_constraints).then(function (sx_t) {
                return sy(exports.no_constraints).then(function (sy_t) {
                    return s(exports.no_constraints).then(function (s_t) {
                        return type_equals(dx_t.type, exports.int_type) && type_equals(dy_t.type, exports.int_type) &&
                            type_equals(sx_t.type, exports.int_type) && type_equals(sy_t.type, exports.int_type) &&
                            type_equals(s_t.type, exports.render_surface_type) ?
                            ts_bccc_2.co_unit(mk_typing(exports.other_render_surface_type, Sem.mk_other_surface_rt(s_t.sem, dx_t.sem, dy_t.sem, sx_t.sem, sy_t.sem)))
                            : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for other surface displacement." });
                    });
                });
            });
        });
    }); };
};
exports.plus = function (r, a, b) {
    return function (_) { return a(exports.no_constraints).then(function (a_t) {
        return b(exports.no_constraints).then(function (b_t) {
            return type_equals(a_t.type, b_t.type) ?
                type_equals(a_t.type, exports.int_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.int_type, Sem.int_plus_rt(a_t.sem, b_t.sem)))
                    : type_equals(a_t.type, exports.float_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.int_type, Sem.float_plus_rt(a_t.sem, b_t.sem)))
                        : type_equals(a_t.type, exports.string_type) ?
                            ts_bccc_2.co_unit(mk_typing(exports.string_type, Sem.string_plus_rt(a_t.sem, b_t.sem)))
                            : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for operator (+)!" })
                : type_equals(a_t.type, exports.render_grid_type) && type_equals(b_t.type, exports.render_grid_pixel_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.render_grid_type, Sem.render_grid_plus_rt(a_t.sem, b_t.sem)))
                    : type_equals(a_t.type, exports.render_surface_type) &&
                        (type_equals(b_t.type, exports.circle_type) || type_equals(b_t.type, exports.square_type)
                            || type_equals(b_t.type, exports.ellipse_type) || type_equals(b_t.type, exports.rectangle_type)
                            || type_equals(b_t.type, exports.other_render_surface_type)) ?
                        ts_bccc_2.co_unit(mk_typing(exports.render_surface_type, Sem.render_surface_plus_rt(a_t.sem, b_t.sem)))
                        : ts_bccc_2.co_error({ range: r, message: "Error: cannot sum expressions of non-compatible types! (" + a_t.type.kind + "," + b_t.type.kind + ")" });
        });
    }); };
};
exports.minus = function (r, a, b) {
    return function (_) { return a(exports.no_constraints).then(function (a_t) {
        return b(exports.no_constraints).then(function (b_t) {
            return type_equals(a_t.type, b_t.type) ?
                type_equals(a_t.type, exports.int_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.int_type, Sem.int_minus_rt(a_t.sem, b_t.sem)))
                    : type_equals(a_t.type, exports.float_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.float_type, Sem.float_minus_rt(a_t.sem, b_t.sem)))
                        : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for operator (-)!" })
                : ts_bccc_2.co_error({ range: r, message: "Error: cannot subtract expressions of different types!" });
        });
    }); };
};
exports.div = function (r, a, b) {
    return function (_) { return a(exports.no_constraints).then(function (a_t) {
        return b(exports.no_constraints).then(function (b_t) {
            return type_equals(a_t.type, b_t.type) ?
                type_equals(a_t.type, exports.int_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.int_type, Sem.int_div_rt(a_t.sem, b_t.sem)))
                    : type_equals(a_t.type, exports.float_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.float_type, Sem.float_div_rt(a_t.sem, b_t.sem)))
                        : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for operator (/)!" })
                : ts_bccc_2.co_error({ range: r, message: "Error: cannot divide expressions of different types!" });
        });
    }); };
};
exports.times = function (r, a, b, sr) {
    return function (_) { return a(exports.no_constraints).then(function (a_t) {
        return b(exports.no_constraints).then(function (b_t) {
            return type_equals(a_t.type, b_t.type) ?
                type_equals(a_t.type, exports.int_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.int_type, Sem.int_times_rt(a_t.sem, b_t.sem, sr)))
                    : type_equals(a_t.type, exports.float_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.float_type, Sem.float_times_rt(a_t.sem, b_t.sem, sr)))
                        : ts_bccc_2.co_error({ range: r, message: "Error (" + sr.to_string() + "): unsupported types for operator (*)!" })
                : ts_bccc_2.co_error({ range: r, message: "Error (" + sr.to_string() + "): cannot multiply expressions of incompatible types!" });
        });
    }); };
};
exports.mod = function (r, a, b) {
    return function (_) { return a(exports.no_constraints).then(function (a_t) {
        return b(exports.no_constraints).then(function (b_t) {
            return type_equals(a_t.type, b_t.type) ?
                type_equals(a_t.type, exports.int_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.int_type, Sem.int_mod_rt(a_t.sem, b_t.sem)))
                    : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for operator (-)!" })
                : ts_bccc_2.co_error({ range: r, message: "Error: cannot mod expressions of different types!" });
        });
    }); };
};
exports.minus_unary = function (r, a) {
    return function (_) { return a(exports.no_constraints).then(function (a_t) {
        return type_equals(a_t.type, exports.int_type) ?
            ts_bccc_2.co_unit(mk_typing(exports.int_type, Sem.int_minus_unary_rt(a_t.sem)))
            : type_equals(a_t.type, exports.float_type) ?
                ts_bccc_2.co_unit(mk_typing(exports.float_type, Sem.float_minus_unary_rt(a_t.sem)))
                : ts_bccc_2.co_error({ range: r, message: "Error: unsupported type for unary operator (-)!" });
    }); };
};
exports.or = function (r, a, b) {
    return function (_) { return a(exports.no_constraints).then(function (a_t) {
        return b(exports.no_constraints).then(function (b_t) {
            return type_equals(a_t.type, b_t.type) && type_equals(a_t.type, exports.bool_type) ?
                ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.bool_plus_rt(a_t.sem, b_t.sem)))
                : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for operator (||)!" });
        });
    }); };
};
exports.and = function (r, a, b) {
    return function (_) { return a(exports.no_constraints).then(function (a_t) {
        return b(exports.no_constraints).then(function (b_t) {
            return type_equals(a_t.type, b_t.type) && type_equals(a_t.type, exports.bool_type) ?
                ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.bool_times_rt(a_t.sem, b_t.sem)))
                : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for operator (&&)!" });
        });
    }); };
};
exports.arrow = function (r, parameters, closure, body) {
    return function (constraints) {
        if (constraints.kind == "right")
            return ts_bccc_2.co_error({ range: r, message: "Error: wrong context when defining anonymous function (=>)!" });
        var expected_type = constraints.value;
        if (expected_type.kind != "fun")
            return ts_bccc_2.co_error({ range: r, message: "Error: expected " + expected_type.kind + ", found function." });
        var input = expected_type.in.kind == "tuple" ? expected_type.in.args : [expected_type.in];
        var output = expected_type.out;
        var parameter_declarations = parameters.map(function (p, p_i) { return (__assign({}, p, { type: input[p_i] })); }).map(function (p) { return exports.decl_v(r, p.name, p.type, true); }).reduce(function (p, q) { return exports.semicolon(r, p, q); }, exports.done);
        return ccc_aux_1.co_stateless(parameter_declarations(exports.no_constraints).then(function (decls) {
            return body(ts_bccc_1.apply(ts_bccc_1.inl(), output)).then(function (b_t) {
                return ts_bccc_2.co_unit(mk_typing(expected_type, Sem.mk_lambda_rt(b_t.sem, parameters.map(function (p) { return p.name; }), closure, r)));
            });
        }));
    };
};
exports.not = function (r, a) {
    return function (_) { return a(exports.no_constraints).then(function (a_t) {
        return type_equals(a_t.type, exports.bool_type) ?
            ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.bool_not_rt(a_t.sem)))
            : ts_bccc_2.co_error({ range: r, message: "Error: unsupported type for unary operator (!)!" });
    }); };
};
exports.length = function (r, a) {
    return function (_) { return a(exports.no_constraints).then(function (a_t) {
        return type_equals(a_t.type, exports.string_type) ?
            ts_bccc_2.co_unit(mk_typing(exports.int_type, Sem.string_length_rt(a_t.sem)))
            : a_t.type.kind == "arr" ?
                ts_bccc_2.co_unit(mk_typing(exports.int_type, a_t.sem.then(function (a_val) { return Sem.get_arr_len_rt(a_val.value); })))
                : ts_bccc_2.co_error({ range: r, message: "Error: unsupported type for unary operator (-)!" });
    }); };
};
exports.get_index = function (r, a, i) {
    return function (_) { return a(exports.no_constraints).then(function (a_t) {
        return i(exports.no_constraints).then(function (i_t) {
            return a_t.type.kind == "arr" && type_equals(i_t.type, exports.int_type) ?
                ts_bccc_2.co_unit(mk_typing(a_t.type.arg, Sem.get_arr_el_expr_rt(a_t.sem, i_t.sem)))
                : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for array lookup!" });
        });
    }); };
};
exports.set_index = function (r, a, i, e) {
    return function (_) { return a(exports.no_constraints).then(function (a_t) {
        return i(exports.no_constraints).then(function (i_t) {
            return e(exports.no_constraints).then(function (e_t) {
                return a_t.type.kind == "arr" && type_equals(i_t.type, exports.int_type) && type_equals(e_t.type, a_t.type.arg) ?
                    ts_bccc_2.co_unit(mk_typing(a_t.type.arg, Sem.set_arr_el_expr_rt(a_t.sem, i_t.sem, e_t.sem)))
                    : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for writing in an array!" });
            });
        });
    }); };
};
// Debugger statements
exports.breakpoint = function (r) {
    return function (p) { return exports.semicolon(r, function (_) { return ts_bccc_2.co_unit(mk_typing(exports.unit_type, Sem.dbg_rt(r)(ts_bccc_1.apply(ts_bccc_1.inl(), Sem.mk_unit_val)))); }, p); };
};
exports.typechecker_breakpoint = function (range) {
    return function (p) { return exports.semicolon(range, exports.semicolon(range, exports.set_highlighting(range), function (_) { return Co.suspend().then(function (_) { return ts_bccc_2.co_unit(mk_typing(exports.unit_type, Sem.done_rt)); }); }), p); };
};
exports.highlight = ts_bccc_1.fun(function (x) { return (__assign({}, x.snd, { highlighting: x.fst })); });
exports.set_highlighting = function (r) {
    return function (_) { return ts_bccc_2.mk_coroutine(ts_bccc_1.constant(r).times(ts_bccc_1.id()).then(exports.highlight).then(ts_bccc_1.constant(mk_typing(exports.unit_type, Sem.done_rt)).times(ts_bccc_1.id())).then(Co.value().then(Co.result().then(Co.no_error())))); };
};
// Control flow statements
exports.done = function (_) { return ts_bccc_2.co_unit(mk_typing(exports.unit_type, Sem.done_rt)); };
exports.lub = function (t1, t2) {
    return type_equals(t1, t2) ? ts_bccc_1.apply(ts_bccc_1.inl(), t1) :
        t1.kind == "unit" ? ts_bccc_1.apply(ts_bccc_1.inl(), t2) :
            t2.kind == "unit" ? ts_bccc_1.apply(ts_bccc_1.inl(), t1) :
                ts_bccc_1.apply(ts_bccc_1.inr(), {});
};
exports.if_then_else = function (r, c, t, e) {
    return function (_) { return c(exports.no_constraints).then(function (c_t) {
        return c_t.type.kind != "bool" ? ts_bccc_2.co_error({ range: r, message: "Error: condition has the wrong type!" }) :
            ccc_aux_1.co_stateless(t(exports.no_constraints)).then(function (t_t) {
                return ccc_aux_1.co_stateless(e(exports.no_constraints)).then(function (e_t) {
                    var on_type = ts_bccc_1.fun(function (t_i) { return function (_) { return ts_bccc_2.co_unit(mk_typing(t_i, Sem.if_then_else_rt(c_t.sem, t_t.sem, e_t.sem))); }; });
                    var on_error = ts_bccc_1.constant(function (_) { return ts_bccc_2.co_error({ range: r, message: "Error: the branches of a conditional should have compatible types!" }); });
                    var res = ts_bccc_1.apply(on_type.plus(on_error), exports.lub(t_t.type, e_t.type));
                    return res(exports.no_constraints);
                });
            });
    }); };
};
exports.while_do = function (r, c, b) {
    return function (_) { return ccc_aux_1.co_stateless(c(exports.no_constraints).then(function (c_t) {
        return c_t.type.kind != "bool" ? ts_bccc_2.co_error({ range: r, message: "Error: condition has the wrong type!" }) :
            b(exports.no_constraints).then(function (t_t) { return ts_bccc_2.co_unit(mk_typing(t_t.type, Sem.while_do_rt(c_t.sem, t_t.sem))); });
    })); };
};
exports.for_loop = function (r, i, c, s, b) {
    return function (_) { return ccc_aux_1.co_stateless(i(exports.no_constraints).then(function (i_t) {
        return c(exports.no_constraints).then(function (c_t) {
            return c_t.type.kind != "bool" ? ts_bccc_2.co_error({ range: r, message: "Error: condition has the wrong type!" }) :
                s(exports.no_constraints).then(function (s_t) {
                    return b(exports.no_constraints).then(function (b_t) { return ts_bccc_2.co_unit(mk_typing(b_t.type, Sem.for_loop_rt(i_t.sem, c_t.sem, s_t.sem, b_t.sem))); });
                });
        });
    })); };
};
exports.semicolon = function (r, p, q) {
    return function (constraints) { return p(constraints).then(function (p_t) {
        return q(constraints).then(function (q_t) {
            return ts_bccc_2.co_unit(mk_typing(q_t.type, p_t.sem.then(function (res) {
                var f = ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inr(), res.value));
                return res.kind == "left" ? q_t.sem : f;
            })));
        });
    }); };
};
exports.mk_param = function (name, type) {
    return { name: name, type: type };
};
exports.mk_lambda = function (r, def, closure_parameters, range) {
    var parameters = def.parameters;
    var return_t = def.return_t;
    var body = def.body;
    var set_bindings = parameters.reduce(function (acc, par) { return exports.semicolon(r, exports.decl_v(r, par.name, par.type, false), acc); }, closure_parameters.reduce(function (acc, cp) {
        return exports.semicolon(r, function (_) { return exports.get_v(r, cp)(exports.no_constraints).then(function (cp_t) { return exports.decl_v(r, cp, cp_t.type, true)(exports.no_constraints); }); }, acc);
    }, exports.done));
    return function (_) { return Co.co_get_state().then(function (initial_bindings) {
        return set_bindings(exports.no_constraints).then(function (_) {
            return body(ts_bccc_1.apply(ts_bccc_1.inl(), return_t)).then(function (body_t) {
                return type_equals(body_t.type, return_t) ?
                    Co.co_set_state(initial_bindings).then(function (_) {
                        return ts_bccc_2.co_unit(mk_typing(exports.fun_type(exports.tuple_type(parameters.map(function (p) { return p.type; })), body_t.type), Sem.mk_lambda_rt(body_t.sem, parameters.map(function (p) { return p.name; }), closure_parameters, range)));
                    })
                    :
                        ts_bccc_2.co_error({ range: r, message: "Error: return type does not match declaration" });
            });
        });
    }); };
};
// export interface Bindings extends Immutable.Map<Name, TypeInformation> {}
// export interface State { highlighting:SourceRange, bindings:Bindings }
exports.def_fun = function (r, def, closure_parameters) {
    return function (_) { return ts_bccc_1.co_get_state().then(function (s) {
        return ts_bccc_1.co_set_state(__assign({}, s, { bindings: s.bindings.set(def.name, __assign({}, exports.fun_type(exports.tuple_type(def.parameters.map(function (p) { return p.type; })), def.return_t), { is_constant: true })) })).then(function (_) {
            return exports.mk_lambda(r, def, closure_parameters, def.range)(exports.no_constraints).then(function (l) {
                return ts_bccc_1.co_set_state(s).then(function (_) {
                    return exports.decl_const(r, def.name, l.type, function (_) { return ts_bccc_2.co_unit(l); })(exports.no_constraints);
                });
            });
        });
    }); };
};
exports.def_method = function (r, C_name, def) {
    def.parameters = def.modifiers.some(function (m) { return m == "static"; }) ? def.parameters
        : def.parameters.concat(Array({ name: "this", type: exports.ref_type(C_name) }));
    var parameters = def.parameters;
    var return_t = def.return_t;
    var body = def.body;
    var set_bindings = parameters.reduce(function (acc, par) { return exports.semicolon(r, exports.decl_v(r, par.name, par.type, false), acc); }, exports.done);
    return function (_) { return Co.co_get_state().then(function (initial_bindings) {
        return set_bindings(exports.no_constraints).then(function (_) {
            return body(exports.no_constraints).then(function (body_t) {
                return type_equals(body_t.type, return_t) ?
                    Co.co_set_state(initial_bindings).then(function (_) {
                        return ts_bccc_2.co_unit(mk_typing(exports.fun_type(exports.tuple_type(parameters.map(function (p) { return p.type; })), body_t.type), Sem.mk_lambda_rt(body_t.sem, parameters.map(function (p) { return p.name; }), [], def.range)));
                    })
                    :
                        ts_bccc_2.co_error({ range: r, message: "Error: return type does not match declaration" });
            });
        });
    }); };
};
exports.call_lambda = function (r, lambda, arg_values) {
    return function (_) { return lambda(exports.no_constraints).then(function (lambda_t) {
        if (lambda_t.type.kind != "fun" || lambda_t.type.in.kind != "tuple")
            return ts_bccc_2.co_error({ range: r, message: "Error: invalid lambda type " + JSON.stringify(lambda_t.type) });
        var expected_args = lambda_t.type.in.args;
        var check_arguments = arg_values.reduce(function (args, arg, arg_i) {
            return arg(ts_bccc_1.apply(ts_bccc_1.inl(), expected_args[arg_i])).then(function (arg_t) {
                return args.then(function (args_t) {
                    return ts_bccc_2.co_unit(args_t.push(arg_t));
                });
            });
        }, ts_bccc_2.co_unit(Immutable.List()));
        return check_arguments.then(function (args_t) {
            return lambda_t.type.kind != "fun" || lambda_t.type.in.kind != "tuple" ||
                arg_values.length != lambda_t.type.in.args.length ||
                args_t.some(function (arg_t, i) { return lambda_t.type.kind != "fun" || lambda_t.type.in.kind != "tuple" || arg_t == undefined || i == undefined ||
                    !type_equals(arg_t.type, lambda_t.type.in.args[i]); }) ?
                ts_bccc_2.co_error({ range: r, message: "Error: parameter type mismatch when calling lambda expression " + JSON.stringify(lambda_t.type) })
                :
                    ts_bccc_2.co_unit(mk_typing(lambda_t.type.out, Sem.call_lambda_expr_rt(lambda_t.sem, args_t.toArray().map(function (arg_t) { return arg_t.sem; }))));
        });
    }); };
};
exports.call_by_name = function (r, f_n, args) {
    return exports.call_lambda(r, exports.get_v(r, f_n), args);
};
exports.ret = function (r, p) {
    return function (constraints) { return p(constraints).then(function (p_t) {
        return ts_bccc_2.co_unit(mk_typing(p_t.type, Sem.return_rt(p_t.sem)));
    }); };
};
exports.new_array = function (r, type, len) {
    return function (_) { return len(exports.no_constraints).then(function (len_t) {
        return type_equals(len_t.type, exports.int_type) ?
            ts_bccc_2.co_unit(mk_typing(exports.arr_type(type), Sem.new_arr_expr_rt(len_t.sem)))
            : ts_bccc_2.co_error({ range: r, message: "Error: argument of array constructor must be of type int" });
    }); };
};
exports.get_arr_len = function (r, a) {
    return function (_) { return a(exports.no_constraints).then(function (a_t) {
        return a_t.type.kind == "arr" ?
            ts_bccc_2.co_unit(mk_typing(exports.int_type, Sem.get_arr_len_expr_rt(a_t.sem)))
            : ts_bccc_2.co_error({ range: r, message: "Error: array length requires an array" });
    }); };
};
exports.get_arr_el = function (r, a, i) {
    return function (_) { return a(exports.no_constraints).then(function (a_t) {
        return i(exports.no_constraints).then(function (i_t) {
            return a_t.type.kind == "arr" && type_equals(i_t.type, exports.int_type) ?
                ts_bccc_2.co_unit(mk_typing(a_t.type.arg, Sem.get_arr_el_expr_rt(a_t.sem, i_t.sem)))
                : ts_bccc_2.co_error({ range: r, message: "Error: array getter requires an array and an integer as arguments" });
        });
    }); };
};
exports.set_arr_el = function (r, a, i, e) {
    return function (_) { return a(exports.no_constraints).then(function (a_t) {
        return i(exports.no_constraints).then(function (i_t) {
            return e(exports.no_constraints).then(function (e_t) {
                return a_t.type.kind == "arr" && type_equals(i_t.type, exports.int_type) && type_equals(e_t.type, a_t.type.arg) ?
                    ts_bccc_2.co_unit(mk_typing(exports.unit_type, Sem.set_arr_el_expr_rt(a_t.sem, i_t.sem, e_t.sem)))
                    : ts_bccc_2.co_error({ range: r, message: "Error: array setter requires an array and an integer as arguments" });
            });
        });
    }); };
};
exports.def_class = function (r, C_name, methods_from_context, fields_from_context) {
    var context = { kind: "class", C_name: C_name };
    var methods = methods_from_context.map(function (m) { return m(context); });
    var fields = fields_from_context.map(function (f) { return f(context); });
    var C_type_placeholder = {
        kind: "obj",
        C_name: C_name,
        methods: Immutable.Map(methods.map(function (m) {
            return [
                m.name,
                {
                    typing: mk_typing(exports.fun_type(exports.tuple_type([exports.ref_type(C_name)].concat(m.parameters.map(function (p) { return p.type; }))), m.return_t), Sem.done_rt),
                    modifiers: Immutable.Set(m.modifiers)
                }
            ];
        })),
        fields: Immutable.Map(fields.map(function (f) {
            return [
                f.name,
                {
                    type: f.type,
                    modifiers: Immutable.Set(f.modifiers)
                }
            ];
        }))
    };
    return function (_) { return ts_bccc_1.co_get_state().then(function (initial_bindings) {
        return ts_bccc_1.co_set_state(__assign({}, initial_bindings, { bindings: initial_bindings.bindings.set(C_name, __assign({}, C_type_placeholder, { is_constant: true })) })).then(function (_) {
            return ccc_aux_1.comm_list_coroutine(Immutable.List(methods.map(function (m) { return exports.def_method(m.range, C_name, m)(exports.no_constraints); }))).then(function (methods_t) {
                var methods_full_t = methods_t.zipWith(function (m_t, m_d) { return ({ typ: m_t, def: m_d }); }, Immutable.Seq(methods)).toArray();
                var C_type = {
                    kind: "obj",
                    C_name: C_name,
                    methods: Immutable.Map(methods_full_t.map(function (m) { return [m.def.name, { typing: m.typ, modifiers: Immutable.Set(m.def.modifiers) }]; })),
                    fields: Immutable.Map(fields.map(function (f) {
                        return [f.name,
                            { type: f.type, modifiers: Immutable.Set(f.modifiers) }];
                    }))
                };
                var C_int = {
                    base: ts_bccc_1.apply(ts_bccc_1.inr(), {}),
                    methods: Immutable.Map(methods_full_t.map(function (m) {
                        var res = [
                            m.def.name,
                            m.typ.sem
                        ];
                        return res;
                    })),
                    static_methods: Immutable.Map(),
                    static_fields: Immutable.Map()
                };
                return ts_bccc_1.co_set_state(__assign({}, initial_bindings, { bindings: initial_bindings.bindings.set(C_name, __assign({}, C_type, { is_constant: true })) })).then(function (_) {
                    return ts_bccc_2.co_unit(mk_typing(exports.unit_type, Sem.declare_class_rt(C_name, C_int)));
                });
            });
        });
    }); };
};
exports.field_get = function (r, context, this_ref, F_name) {
    return function (_) { return this_ref(exports.no_constraints).then(function (this_ref_t) {
        return ts_bccc_1.co_get_state().then(function (bindings) {
            if (this_ref_t.type.kind != "ref" && this_ref_t.type.kind != "obj") {
                var item = /^Item/;
                var m = F_name.match(item);
                if (this_ref_t.type.kind == "tuple" && m != null && m.length != 0) {
                    try {
                        var item_index = parseInt(F_name.replace(item, "")) - 1;
                        return ts_bccc_2.co_unit(mk_typing(this_ref_t.type.args[item_index], Sem.tuple_get_rt(r, this_ref_t.sem, item_index)));
                    }
                    catch (error) {
                        return ts_bccc_2.co_error({ range: r, message: "Invalid field getter " + F_name + "." });
                    }
                }
                else {
                    return ts_bccc_2.co_error({ range: r, message: "Error: expected reference or class name when getting field " + F_name + "." });
                }
            }
            var C_name = this_ref_t.type.C_name;
            if (!bindings.bindings.has(this_ref_t.type.C_name))
                return ts_bccc_2.co_error({ range: r, message: "Error: class " + this_ref_t.type.C_name + " is undefined" });
            var C_def = bindings.bindings.get(this_ref_t.type.C_name);
            if (C_def.kind != "obj")
                return ts_bccc_2.co_error({ range: r, message: "Error: " + this_ref_t.type.C_name + " is not a class" });
            if (!C_def.fields.has(F_name))
                return ts_bccc_2.co_error({ range: r, message: "Error: class " + this_ref_t.type.C_name + " does not contain field " + F_name });
            var F_def = C_def.fields.get(F_name);
            if (!F_def.modifiers.has("public")) {
                if (context.kind == "global scope")
                    return ts_bccc_2.co_error({ range: r, message: "Error: cannot get non-public field " + JSON.stringify(F_name) + " from global scope" });
                else if (context.C_name != C_name)
                    return ts_bccc_2.co_error({ range: r, message: "Error: cannot get non-public field " + C_name + "::" + JSON.stringify(F_name) + " from " + context.C_name });
            }
            return ts_bccc_2.co_unit(mk_typing(F_def.type, F_def.modifiers.has("static") ?
                Sem.static_field_get_expr_rt(C_name, F_name)
                : Sem.field_get_expr_rt(F_name, this_ref_t.sem)));
        });
    }); };
};
exports.field_set = function (r, context, this_ref, F_name, new_value) {
    return function (_) { return this_ref(exports.no_constraints).then(function (this_ref_t) {
        return new_value(exports.no_constraints).then(function (new_value_t) {
            return ts_bccc_1.co_get_state().then(function (bindings) {
                if (this_ref_t.type.kind != "ref" && this_ref_t.type.kind != "obj") {
                    return ts_bccc_2.co_error({ range: r, message: "Error: expected reference or class name when setting field " + F_name + "." });
                }
                var C_name = this_ref_t.type.C_name;
                if (!bindings.bindings.has(C_name))
                    return ts_bccc_2.co_error({ range: r, message: "Error: class " + C_name + " is undefined" });
                var C_def = bindings.bindings.get(C_name);
                if (C_def.kind != "obj")
                    return ts_bccc_2.co_error({ range: r, message: "Error: type " + C_name + " is not a class" });
                if (!C_def.fields.has(F_name))
                    return ts_bccc_2.co_error({ range: r, message: "Error: class " + C_name + " does not contain field " + F_name });
                var F_def = C_def.fields.get(F_name);
                if (!F_def.modifiers.has("public")) {
                    if (context.kind == "global scope")
                        return ts_bccc_2.co_error({ range: r, message: "Error: cannot set non-public field " + JSON.stringify(F_name) + " from global scope" });
                    else if (context.C_name != C_name)
                        return ts_bccc_2.co_error({ range: r, message: "Error: cannot set non-public field " + C_name + "::" + JSON.stringify(F_name) + " from " + context.C_name });
                }
                if (!type_equals(F_def.type, new_value_t.type))
                    return ts_bccc_2.co_error({ range: r, message: "Error: field " + this_ref_t.type.C_name + "::" + F_name + " cannot be assigned to value of type " + JSON.stringify(new_value_t.type) });
                return ts_bccc_2.co_unit(mk_typing(exports.unit_type, F_def.modifiers.has("static") ?
                    Sem.static_field_set_expr_rt(C_name, F_name, new_value_t.sem)
                    : Sem.field_set_expr_rt(F_name, new_value_t.sem, this_ref_t.sem)));
            });
        });
    }); };
};
exports.call_cons = function (r, context, C_name, arg_values) {
    return function (_) { return ts_bccc_1.co_get_state().then(function (bindings) {
        if (!bindings.bindings.has(C_name))
            return ts_bccc_2.co_error({ range: r, message: "Error: class " + C_name + " is undefined" });
        var C_def = bindings.bindings.get(C_name);
        if (C_def.kind != "obj")
            return ts_bccc_2.co_error({ range: r, message: "Error: type  " + C_name + " is not a class" });
        if (!C_def.methods.has(C_name)) {
            return ts_bccc_2.co_error({ range: r, message: "Error: class " + C_name + " does not have constructors" });
        }
        var lambda_t = C_def.methods.get(C_name);
        if (lambda_t.typing.type.kind != "fun" || lambda_t.typing.type.in.kind != "tuple")
            return ts_bccc_2.co_error({ range: r, message: "Error: invalid constructor type " + JSON.stringify(lambda_t.typing.type) });
        var expected_args = lambda_t.typing.type.in.args;
        var check_arguments = arg_values.reduce(function (args, arg, arg_i) {
            return arg(ts_bccc_1.apply(ts_bccc_1.inl(), expected_args[arg_i])).then(function (arg_t) {
                return args.then(function (args_t) {
                    return ts_bccc_2.co_unit(args_t.push(arg_t));
                });
            });
        }, ts_bccc_2.co_unit(Immutable.List()));
        if (!lambda_t.modifiers.has("public")) {
            if (context.kind == "global scope")
                return ts_bccc_2.co_error({ range: r, message: "Error: cannot call non-public constructor " + C_name + " from global scope" });
            else if (context.C_name != C_name)
                return ts_bccc_2.co_error({ range: r, message: "Error: cannot call non-public constructor " + C_name + " from " + context.C_name });
        }
        return lambda_t.typing.type.kind == "fun" && lambda_t.typing.type.in.kind == "tuple" ?
            check_arguments.then(function (args_t) {
                return lambda_t.typing.type.kind != "fun" || lambda_t.typing.type.in.kind != "tuple" ||
                    arg_values.length != lambda_t.typing.type.in.args.length - 1 ||
                    args_t.some(function (arg_t, i) { return lambda_t.typing.type.kind != "fun" || lambda_t.typing.type.in.kind != "tuple" || arg_t == undefined || i == undefined ||
                        !type_equals(arg_t.type, lambda_t.typing.type.in.args[i]); }) ?
                    ts_bccc_2.co_error({ range: r, message: "Error: parameter type mismatch when calling lambda expression " + JSON.stringify(lambda_t.typing.type) + " with arguments " + JSON.stringify(args_t) })
                    :
                        ts_bccc_2.co_unit(mk_typing(exports.ref_type(C_name), Sem.call_cons_rt(C_name, args_t.toArray().map(function (arg_t) { return arg_t.sem; }))));
            })
            : ts_bccc_2.co_error({ range: r, message: "Error: cannot invoke non-lambda expression of type " + JSON.stringify(lambda_t.typing.type) });
    }); };
};
exports.call_method = function (r, context, this_ref, M_name, arg_values) {
    return function (_) { return this_ref(exports.no_constraints).then(function (this_ref_t) {
        return ts_bccc_1.co_get_state().then(function (bindings) {
            if (this_ref_t.type.kind != "ref" && this_ref_t.type.kind != "obj") {
                return ts_bccc_2.co_error({ range: r, message: "Error: expected reference or class name when calling method " + M_name + "." });
            }
            var C_name = this_ref_t.type.C_name;
            if (!bindings.bindings.has(C_name))
                return ts_bccc_2.co_error({ range: r, message: "Error: class " + C_name + " is undefined" });
            var C_def = bindings.bindings.get(C_name);
            if (C_def.kind != "obj")
                return ts_bccc_2.co_error({ range: r, message: "Error: type  " + C_name + " is not a class" });
            if (!C_def.methods.has(M_name))
                return ts_bccc_2.co_error({ range: r, message: "Error: class " + C_name + " does not have method " + M_name });
            var lambda_t = C_def.methods.get(M_name);
            if (lambda_t.typing.type.kind != "fun" || lambda_t.typing.type.in.kind != "tuple")
                return ts_bccc_2.co_error({ range: r, message: "Error: invalid method type " + JSON.stringify(lambda_t.typing.type) });
            var expected_args = lambda_t.typing.type.in.args;
            var check_arguments = arg_values.reduce(function (args, arg, arg_i) {
                return arg(ts_bccc_1.apply(ts_bccc_1.inl(), expected_args[arg_i])).then(function (arg_t) {
                    return args.then(function (args_t) {
                        return ts_bccc_2.co_unit(args_t.push(arg_t));
                    });
                });
            }, ts_bccc_2.co_unit(Immutable.List()));
            if (!lambda_t.modifiers.has("public")) {
                if (context.kind == "global scope")
                    return ts_bccc_2.co_error({ range: r, message: "Error: cannot call non-public method " + JSON.stringify(M_name) + " from global scope" });
                else if (context.C_name != C_name)
                    return ts_bccc_2.co_error({ range: r, message: "Error: cannot call non-public method " + C_name + "::" + JSON.stringify(M_name) + " from " + context.C_name });
            }
            if (lambda_t.modifiers.has("static") && this_ref_t.type.kind == "ref") {
                return ts_bccc_2.co_error({ range: r, message: "Error: cannot call static method " + JSON.stringify(M_name) + " from reference." });
            }
            return lambda_t.typing.type.kind == "fun" && lambda_t.typing.type.in.kind == "tuple" ?
                check_arguments.then(function (args_t) {
                    return lambda_t.typing.type.kind != "fun" || lambda_t.typing.type.in.kind != "tuple" ||
                        arg_values.length != (lambda_t.modifiers.has("static") ? lambda_t.typing.type.in.args.length : lambda_t.typing.type.in.args.length - 1) ||
                        args_t.some(function (arg_t, i) { return lambda_t.typing.type.kind != "fun" || lambda_t.typing.type.in.kind != "tuple" || arg_t == undefined || i == undefined ||
                            !type_equals(arg_t.type, lambda_t.typing.type.in.args[i]); }) ?
                        ts_bccc_2.co_error({ range: r, message: "Error: parameter type mismatch when calling method " + JSON.stringify(lambda_t.typing.type) + " with arguments " + JSON.stringify(args_t) })
                        :
                            ts_bccc_2.co_unit(mk_typing(lambda_t.typing.type.out, lambda_t.modifiers.has("static") ?
                                Sem.call_static_method_expr_rt(C_name, M_name, args_t.toArray().map(function (arg_t) { return arg_t.sem; }))
                                :
                                    Sem.call_method_expr_rt(M_name, this_ref_t.sem, args_t.toArray().map(function (arg_t) { return arg_t.sem; }))));
                })
                : ts_bccc_2.co_error({ range: r, message: "Error: cannot invoke non-lambda expression of type " + JSON.stringify(lambda_t.typing.type) });
        });
    }); };
};
