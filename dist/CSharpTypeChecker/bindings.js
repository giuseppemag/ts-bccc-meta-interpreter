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
var Sem = require("../Python/python");
var ccc_aux_1 = require("../ccc_aux");
var main_1 = require("../main");
var types_1 = require("./types");
// Basic statements and expressions
var initial_value = function (type) {
    switch (type.kind) {
        case "bool": return Sem.mk_bool_val(false);
        case "double": return Sem.mk_float_val(0);
        case "float": return Sem.mk_float_val(0);
        case "int": return Sem.mk_int_val(0);
        case "tuple": return Sem.mk_tuple_val(type.args.map(initial_value));
        case "obj": return Sem.mk_obj_val(Immutable.Map(type.fields.toArray().map(function (f) { return initial_value(f.type); })));
        default: return Sem.mk_unit_val;
    }
};
exports.wrap_co_res = Co.value().then(Co.result());
exports.wrap_co = exports.wrap_co_res.then(Co.no_error());
exports.get_v = function (r, v) {
    var f = types_1.load.then(ts_bccc_1.constant({ range: r, message: "Error: variable " + v + " does not exist." }).map_plus((ts_bccc_1.id().times(ts_bccc_1.constant(Sem.get_v_rt(v)))).then(types_1.mk_typing_cat_full)));
    var g = ts_bccc_1.snd().times(f).then(ts_bccc_1.distribute_sum_prod());
    var g1 = g.then((ts_bccc_1.snd()).map_plus((ts_bccc_1.swap_prod().then(exports.wrap_co_res))));
    var h = ts_bccc_1.apply(ts_bccc_1.curry(g1), v);
    return function (_) { return ts_bccc_2.mk_coroutine(h); };
};
exports.decl_v = function (r, v, t, is_constant) {
    var f = types_1.store.then(ts_bccc_1.constant(types_1.mk_typing(types_1.unit_type, Sem.decl_v_rt(v, ts_bccc_1.apply(ts_bccc_1.inl(), initial_value(t))))).times(ts_bccc_1.id())).then(exports.wrap_co);
    var g = ts_bccc_1.curry(f);
    var args = ts_bccc_1.apply(ts_bccc_1.constant(v).times(ts_bccc_1.constant(__assign({}, t, { is_constant: is_constant != undefined ? is_constant : false }))), {});
    return function (_) {
        return ts_bccc_1.co_get_state().then(function (s) {
            return !s.bindings.has(v) ? ts_bccc_2.mk_coroutine(ts_bccc_1.apply(g, args))
                : ts_bccc_2.co_error({ range: r, message: "Error: cannot redeclare variable " + JSON.stringify(v) });
        });
    };
};
exports.decl_and_init_v = function (r, v, t, e, is_constant) {
    return function (_) { return e(ts_bccc_1.apply(ts_bccc_1.inl(), t)).then(function (e_val) {
        return ts_bccc_1.co_get_state().then(function (s) {
            if (s.bindings.has(v))
                return ts_bccc_2.co_error({ range: r, message: "Error: cannot redeclare variable " + JSON.stringify(v) });
            var actual_t = t.kind == "var" ? e_val.type : t;
            if (types_1.type_equals(e_val.type, actual_t)) {
                var f = types_1.store.then(ts_bccc_1.constant(types_1.mk_typing(types_1.unit_type, e_val.sem.then(function (e_val) { return Sem.decl_v_rt(v, ts_bccc_1.apply(ts_bccc_1.inl(), e_val.value)); }))).times(ts_bccc_1.id())).then(exports.wrap_co);
                var g = ts_bccc_1.curry(f);
                var args = ts_bccc_1.apply(ts_bccc_1.constant(v).times(ts_bccc_1.constant(__assign({}, actual_t, { is_constant: is_constant != undefined ? is_constant : false }))), {});
                return ts_bccc_2.mk_coroutine(ts_bccc_1.apply(g, args));
            }
            else {
                if (e_val.type.kind == "tuple" && actual_t.kind == "record" && types_1.type_equals(e_val.type, types_1.tuple_type(actual_t.args.toArray()))) {
                    var record_labels_1 = actual_t.args.keySeq().toArray();
                    var f = types_1.store.then(ts_bccc_1.constant(types_1.mk_typing(types_1.unit_type, e_val.sem.then(function (e_val) { return Sem.decl_v_rt(v, ts_bccc_1.apply(ts_bccc_1.inl(), main_1.tuple_to_record(e_val.value, record_labels_1))); }))).times(ts_bccc_1.id())).then(exports.wrap_co);
                    var g = ts_bccc_1.curry(f);
                    var args = ts_bccc_1.apply(ts_bccc_1.constant(v).times(ts_bccc_1.constant(__assign({}, actual_t, { is_constant: is_constant != undefined ? is_constant : false }))), {});
                    return ts_bccc_2.mk_coroutine(ts_bccc_1.apply(g, args));
                }
                else {
                    return ts_bccc_2.co_error({ range: r, message: "Error: cannot assign " + JSON.stringify(v) + " to " + JSON.stringify(e_val) + ": type " + JSON.stringify(actual_t) + " does not match " + JSON.stringify(e_val.type) });
                }
            }
        });
    }); };
};
exports.decl_const = function (r, c, t, e) {
    var f = types_1.store.then(ts_bccc_1.constant(types_1.mk_typing(types_1.unit_type, Sem.decl_v_rt(c, ts_bccc_1.apply(ts_bccc_1.inl(), Sem.mk_unit_val)))).times(ts_bccc_1.id())).then(exports.wrap_co);
    var g = ts_bccc_1.curry(f);
    var args = ts_bccc_1.apply(ts_bccc_1.constant(c).times(ts_bccc_1.constant(__assign({}, t, { is_constant: true }))), {});
    return function (_) { return ts_bccc_2.mk_coroutine(ts_bccc_1.apply(g, args)).then(function (_) {
        return e(types_1.no_constraints).then(function (e_val) {
            return exports.get_v(r, c)(types_1.no_constraints).then(function (c_val) {
                return types_1.type_equals(e_val.type, c_val.type) ?
                    ts_bccc_2.co_unit(types_1.mk_typing(types_1.unit_type, Sem.set_v_expr_rt(c, e_val.sem)))
                    : ts_bccc_2.co_error({ range: r, message: "Error: cannot assign " + JSON.stringify(c) + " to " + JSON.stringify(e) + ": type " + JSON.stringify(c_val.type) + " does not match " + JSON.stringify(e_val.type) });
            });
        });
    }); };
};
exports.set_v = function (r, v, e) {
    return function (_) { return exports.get_v(r, v)(types_1.no_constraints).then(function (v_val) {
        return e(ts_bccc_1.apply(ts_bccc_1.inl(), v_val.type)).then(function (e_val) {
            if (types_1.type_equals(e_val.type, v_val.type) && !v_val.type.is_constant) {
                return ts_bccc_2.co_unit(types_1.mk_typing(types_1.unit_type, Sem.set_v_expr_rt(v, e_val.sem)));
            }
            else if (v_val.type.is_constant) {
                return ts_bccc_2.co_error({ range: r, message: "Error: cannot assign anything to " + v + ": it is a constant." });
            }
            else if (e_val.type.kind == "tuple" && v_val.type.kind == "record" && types_1.type_equals(e_val.type, types_1.tuple_type(v_val.type.args.toArray()))) {
                var record_labels_2 = v_val.type.args.keySeq().toArray();
                var f = types_1.store.then(ts_bccc_1.constant(types_1.mk_typing(types_1.unit_type, e_val.sem.then(function (e_val) { return Sem.set_v_rt(v, ts_bccc_1.apply(ts_bccc_1.inl(), main_1.tuple_to_record(e_val.value, record_labels_2))); }))).times(ts_bccc_1.id())).then(exports.wrap_co);
                var g = ts_bccc_1.curry(f);
                var args = ts_bccc_1.apply(ts_bccc_1.constant(v).times(ts_bccc_1.constant(__assign({}, v_val.type, { is_constant: false }))), {});
                return ts_bccc_2.mk_coroutine(ts_bccc_1.apply(g, args));
            }
            else {
                return ts_bccc_2.co_error({ range: r, message: "Error: cannot assign " + JSON.stringify(v) + " to " + JSON.stringify(e) + ": type " + JSON.stringify(v_val.type) + " does not match " + JSON.stringify(e_val.type) });
            }
        });
    }); };
};
exports.bool = function (b) {
    return function (_) { return ts_bccc_2.co_unit(types_1.mk_typing(types_1.bool_type, Sem.bool_expr(b))); };
};
exports.str = function (s) {
    return function (_) { return ts_bccc_2.co_unit(types_1.mk_typing(types_1.string_type, Sem.str_expr(s))); };
};
exports.int = function (i) {
    return function (_) { return ts_bccc_2.co_unit(types_1.mk_typing(types_1.int_type, Sem.int_expr(i))); };
};
exports.float = function (i) {
    return function (_) { return ts_bccc_2.co_unit(types_1.mk_typing(types_1.float_type, Sem.float_expr(i))); };
};
exports.double = function (i) {
    return function (_) { return ts_bccc_2.co_unit(types_1.mk_typing(types_1.double_type, Sem.float_expr(i))); };
};
exports.tuple_value = function (r, args) {
    return function (constraints) {
        if (constraints.kind == "left" && constraints.value.kind == "record")
            constraints = ts_bccc_1.apply(ts_bccc_1.inl(), types_1.tuple_type(constraints.value.args.toArray()));
        // console.log("Typechecking tuple value with constraints", constraints)
        if (constraints.kind == "left" && constraints.value.kind != "tuple")
            return ts_bccc_2.co_error({ range: r, message: "Error: wrong constraints " + JSON.stringify(constraints) + " when typechecking tuple." });
        var check_args = ccc_aux_1.comm_list_coroutine(Immutable.List(args.map(function (a, a_i) {
            return a(constraints.kind == "left" && constraints.value.kind == "tuple" ? ts_bccc_1.apply(ts_bccc_1.inl(), constraints.value.args[a_i])
                : types_1.no_constraints);
        })));
        return check_args.then(function (arg_ts) { return ts_bccc_2.co_unit(types_1.mk_typing(types_1.tuple_type(arg_ts.toArray().map(function (a_t) { return a_t.type; })), Sem.tuple_expr_rt(arg_ts.toArray().map(function (a_t) { return a_t.sem; })))); });
    };
};
exports.gt = function (r, a, b) {
    return function (_) { return a(types_1.no_constraints).then(function (a_t) {
        return b(types_1.no_constraints).then(function (b_t) {
            return types_1.type_equals(a_t.type, b_t.type) ?
                types_1.type_equals(a_t.type, types_1.int_type) ?
                    ts_bccc_2.co_unit(types_1.mk_typing(types_1.bool_type, Sem.int_gt_rt(a_t.sem, b_t.sem)))
                    : types_1.type_equals(a_t.type, types_1.float_type) || types_1.type_equals(a_t.type, types_1.double_type) ?
                        ts_bccc_2.co_unit(types_1.mk_typing(types_1.bool_type, Sem.float_gt_rt(a_t.sem, b_t.sem)))
                        : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for operator (>)!" })
                : ts_bccc_2.co_error({ range: r, message: "Error: cannot compare expressions of different types!" });
        });
    }); };
};
exports.lt = function (r, a, b) {
    return function (_) { return a(types_1.no_constraints).then(function (a_t) {
        return b(types_1.no_constraints).then(function (b_t) {
            return types_1.type_equals(a_t.type, b_t.type) ?
                types_1.type_equals(a_t.type, types_1.int_type) ?
                    ts_bccc_2.co_unit(types_1.mk_typing(types_1.bool_type, Sem.int_lt_rt(a_t.sem, b_t.sem)))
                    : types_1.type_equals(a_t.type, types_1.float_type) || types_1.type_equals(a_t.type, types_1.double_type) ?
                        ts_bccc_2.co_unit(types_1.mk_typing(types_1.bool_type, Sem.float_lt_rt(a_t.sem, b_t.sem)))
                        : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for operator (<)!" })
                : ts_bccc_2.co_error({ range: r, message: "Error: cannot compare expressions of different types!" });
        });
    }); };
};
exports.geq = function (r, a, b) {
    return function (_) { return a(types_1.no_constraints).then(function (a_t) {
        return b(types_1.no_constraints).then(function (b_t) {
            return types_1.type_equals(a_t.type, b_t.type) ?
                types_1.type_equals(a_t.type, types_1.int_type) ?
                    ts_bccc_2.co_unit(types_1.mk_typing(types_1.bool_type, Sem.int_geq_rt(a_t.sem, b_t.sem)))
                    : types_1.type_equals(a_t.type, types_1.float_type) || types_1.type_equals(a_t.type, types_1.double_type) ?
                        ts_bccc_2.co_unit(types_1.mk_typing(types_1.bool_type, Sem.float_geq_rt(a_t.sem, b_t.sem)))
                        : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for operator (>=)!" })
                : ts_bccc_2.co_error({ range: r, message: "Error: cannot compare expressions of different types!" });
        });
    }); };
};
exports.leq = function (r, a, b) {
    return function (_) { return a(types_1.no_constraints).then(function (a_t) {
        return b(types_1.no_constraints).then(function (b_t) {
            return types_1.type_equals(a_t.type, b_t.type) ?
                types_1.type_equals(a_t.type, types_1.int_type) ?
                    ts_bccc_2.co_unit(types_1.mk_typing(types_1.bool_type, Sem.int_leq_rt(a_t.sem, b_t.sem)))
                    : types_1.type_equals(a_t.type, types_1.float_type) || types_1.type_equals(a_t.type, types_1.double_type) ?
                        ts_bccc_2.co_unit(types_1.mk_typing(types_1.bool_type, Sem.float_leq_rt(a_t.sem, b_t.sem)))
                        : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for operator (<=)!" })
                : ts_bccc_2.co_error({ range: r, message: "Error: cannot compare expressions of different types!" });
        });
    }); };
};
exports.eq = function (r, a, b) {
    return function (_) { return a(types_1.no_constraints).then(function (a_t) {
        return b(types_1.no_constraints).then(function (b_t) {
            return types_1.type_equals(a_t.type, b_t.type) ?
                types_1.type_equals(a_t.type, types_1.int_type) ?
                    ts_bccc_2.co_unit(types_1.mk_typing(types_1.bool_type, Sem.int_eq_rt(a_t.sem, b_t.sem)))
                    : types_1.type_equals(a_t.type, types_1.float_type) || types_1.type_equals(a_t.type, types_1.double_type) ?
                        ts_bccc_2.co_unit(types_1.mk_typing(types_1.bool_type, Sem.float_eq_rt(a_t.sem, b_t.sem)))
                        : types_1.type_equals(a_t.type, types_1.bool_type) ?
                            ts_bccc_2.co_unit(types_1.mk_typing(types_1.bool_type, Sem.bool_eq_rt(a_t.sem, b_t.sem)))
                            : types_1.type_equals(a_t.type, types_1.string_type) ?
                                ts_bccc_2.co_unit(types_1.mk_typing(types_1.bool_type, Sem.string_eq_rt(a_t.sem, b_t.sem)))
                                : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for operator (==)!" })
                : ts_bccc_2.co_error({ range: r, message: "Error: cannot compare expressions of different types!" });
        });
    }); };
};
exports.neq = function (r, a, b) {
    return function (_) { return a(types_1.no_constraints).then(function (a_t) {
        return b(types_1.no_constraints).then(function (b_t) {
            return types_1.type_equals(a_t.type, b_t.type) ?
                types_1.type_equals(a_t.type, types_1.int_type) ?
                    ts_bccc_2.co_unit(types_1.mk_typing(types_1.bool_type, Sem.int_neq_rt(a_t.sem, b_t.sem)))
                    : types_1.type_equals(a_t.type, types_1.float_type) || types_1.type_equals(a_t.type, types_1.double_type) ?
                        ts_bccc_2.co_unit(types_1.mk_typing(types_1.bool_type, Sem.float_neq_rt(a_t.sem, b_t.sem)))
                        : types_1.type_equals(a_t.type, types_1.string_type) ?
                            ts_bccc_2.co_unit(types_1.mk_typing(types_1.bool_type, Sem.string_neq_rt(a_t.sem, b_t.sem)))
                            : types_1.type_equals(a_t.type, types_1.bool_type) ?
                                ts_bccc_2.co_unit(types_1.mk_typing(types_1.bool_type, Sem.bool_neq_rt(a_t.sem, b_t.sem)))
                                : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for operator (!=)!" })
                : ts_bccc_2.co_error({ range: r, message: "Error: cannot compare expressions of different types!" });
        });
    }); };
};
exports.xor = function (r, a, b) {
    return function (_) { return a(types_1.no_constraints).then(function (a_t) {
        return b(types_1.no_constraints).then(function (b_t) {
            return types_1.type_equals(a_t.type, b_t.type) ?
                types_1.type_equals(a_t.type, types_1.bool_type) ?
                    ts_bccc_2.co_unit(types_1.mk_typing(types_1.bool_type, Sem.bool_neq_rt(a_t.sem, b_t.sem)))
                    : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for operator (^)!" })
                : ts_bccc_2.co_error({ range: r, message: "Error: cannot compare expressions of different types!" });
        });
    }); };
};
exports.mk_empty_surface = function (r, w, h, col) {
    return function (_) { return w(types_1.no_constraints).then(function (w_t) {
        return h(types_1.no_constraints).then(function (h_t) {
            return col(types_1.no_constraints).then(function (col_t) {
                return types_1.type_equals(w_t.type, types_1.double_type) && types_1.type_equals(h_t.type, types_1.double_type) && types_1.type_equals(col_t.type, types_1.string_type) ?
                    ts_bccc_2.co_unit(types_1.mk_typing(types_1.render_surface_type, Sem.mk_empty_render_surface_rt(w_t.sem, h_t.sem, col_t.sem)))
                    : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for empty surface creation." });
            });
        });
    }); };
};
exports.mk_circle = function (r, x, y, radius, col) {
    return function (_) { return x(types_1.no_constraints).then(function (x_t) {
        return y(types_1.no_constraints).then(function (y_t) {
            return radius(types_1.no_constraints).then(function (r_t) {
                return col(types_1.no_constraints).then(function (col_t) {
                    return types_1.type_equals(x_t.type, types_1.double_type) && types_1.type_equals(y_t.type, types_1.double_type) &&
                        types_1.type_equals(r_t.type, types_1.double_type) && types_1.type_equals(col_t.type, types_1.string_type) ?
                        ts_bccc_2.co_unit(types_1.mk_typing(types_1.circle_type, Sem.mk_circle_rt(x_t.sem, y_t.sem, r_t.sem, col_t.sem)))
                        : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for circle creation." });
                });
            });
        });
    }); };
};
exports.mk_square = function (r, x, y, radius, col, rot) {
    return function (_) { return x(types_1.no_constraints).then(function (x_t) {
        return y(types_1.no_constraints).then(function (y_t) {
            return radius(types_1.no_constraints).then(function (r_t) {
                return col(types_1.no_constraints).then(function (col_t) {
                    return rot(types_1.no_constraints).then(function (rot_t) {
                        return types_1.type_equals(x_t.type, types_1.double_type) && types_1.type_equals(y_t.type, types_1.double_type) &&
                            types_1.type_equals(r_t.type, types_1.double_type) && types_1.type_equals(col_t.type, types_1.string_type) &&
                            types_1.type_equals(rot_t.type, types_1.double_type) ?
                            ts_bccc_2.co_unit(types_1.mk_typing(types_1.square_type, Sem.mk_square_rt(x_t.sem, y_t.sem, r_t.sem, col_t.sem, rot_t.sem)))
                            : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for square creation." });
                    });
                });
            });
        });
    }); };
};
exports.mk_ellipse = function (r, x, y, w, h, col, rot) {
    return function (_) { return x(types_1.no_constraints).then(function (x_t) {
        return y(types_1.no_constraints).then(function (y_t) {
            return w(types_1.no_constraints).then(function (w_t) {
                return h(types_1.no_constraints).then(function (h_t) {
                    return col(types_1.no_constraints).then(function (col_t) {
                        return rot(types_1.no_constraints).then(function (rot_t) {
                            return types_1.type_equals(x_t.type, types_1.double_type) && types_1.type_equals(y_t.type, types_1.double_type) &&
                                types_1.type_equals(w_t.type, types_1.double_type) && types_1.type_equals(h_t.type, types_1.double_type) &&
                                types_1.type_equals(col_t.type, types_1.string_type) && types_1.type_equals(rot_t.type, types_1.double_type) ?
                                ts_bccc_2.co_unit(types_1.mk_typing(types_1.ellipse_type, Sem.mk_ellipse_rt(x_t.sem, y_t.sem, w_t.sem, h_t.sem, col_t.sem, rot_t.sem)))
                                : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for ellipse creation." });
                        });
                    });
                });
            });
        });
    }); };
};
exports.mk_rectangle = function (r, x, y, w, h, col, rot) {
    return function (_) { return x(types_1.no_constraints).then(function (x_t) {
        return y(types_1.no_constraints).then(function (y_t) {
            return w(types_1.no_constraints).then(function (w_t) {
                return h(types_1.no_constraints).then(function (h_t) {
                    return col(types_1.no_constraints).then(function (col_t) {
                        return rot(types_1.no_constraints).then(function (rot_t) {
                            return types_1.type_equals(x_t.type, types_1.double_type) && types_1.type_equals(y_t.type, types_1.double_type) &&
                                types_1.type_equals(w_t.type, types_1.double_type) && types_1.type_equals(h_t.type, types_1.double_type) &&
                                types_1.type_equals(col_t.type, types_1.string_type) && types_1.type_equals(rot_t.type, types_1.double_type) ?
                                ts_bccc_2.co_unit(types_1.mk_typing(types_1.rectangle_type, Sem.mk_rectangle_rt(x_t.sem, y_t.sem, w_t.sem, h_t.sem, col_t.sem, rot_t.sem)))
                                : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for rectangle creation." });
                        });
                    });
                });
            });
        });
    }); };
};
exports.mk_line = function (r, x1, y1, x2, y2, w, col, rot) {
    return function (_) { return x1(types_1.no_constraints).then(function (x1_t) {
        return y1(types_1.no_constraints).then(function (y1_t) {
            return x2(types_1.no_constraints).then(function (x2_t) {
                return y2(types_1.no_constraints).then(function (y2_t) {
                    return w(types_1.no_constraints).then(function (w_t) {
                        return col(types_1.no_constraints).then(function (col_t) {
                            return rot(types_1.no_constraints).then(function (rot_t) {
                                return types_1.type_equals(x1_t.type, types_1.double_type) && types_1.type_equals(y1_t.type, types_1.double_type) &&
                                    types_1.type_equals(x2_t.type, types_1.double_type) && types_1.type_equals(y2_t.type, types_1.double_type) &&
                                    types_1.type_equals(w_t.type, types_1.double_type) && types_1.type_equals(col_t.type, types_1.string_type) &&
                                    types_1.type_equals(rot_t.type, types_1.double_type) ?
                                    ts_bccc_2.co_unit(types_1.mk_typing(types_1.line_type, Sem.mk_line_rt(x1_t.sem, y1_t.sem, x2_t.sem, y2_t.sem, w_t.sem, col_t.sem, rot_t.sem)))
                                    : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for line creation." });
                            });
                        });
                    });
                });
            });
        });
    }); };
};
exports.mk_polygon = function (r, points, col, rot) {
    return function (_) { return points(types_1.no_constraints).then(function (points_t) {
        return rot(types_1.no_constraints).then(function (rot_t) {
            return col(types_1.no_constraints).then(function (col_t) {
                return types_1.type_equals(rot_t.type, types_1.double_type) && types_1.type_equals(points_t.type, types_1.arr_type(types_1.tuple_type([types_1.double_type, types_1.double_type]))) &&
                    types_1.type_equals(col_t.type, types_1.string_type) && types_1.type_equals(rot_t.type, types_1.double_type) ?
                    ts_bccc_2.co_unit(types_1.mk_typing(types_1.polygon_type, Sem.mk_polygon_rt(points_t.sem, col_t.sem, rot_t.sem)))
                    : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for polygon creation." });
            });
        });
    }); };
};
exports.mk_text = function (r, t, x, y, s, col, rot) {
    return function (_) { return t(types_1.no_constraints).then(function (t_t) {
        return x(types_1.no_constraints).then(function (x_t) {
            return y(types_1.no_constraints).then(function (y_t) {
                return s(types_1.no_constraints).then(function (s_t) {
                    return col(types_1.no_constraints).then(function (col_t) {
                        return rot(types_1.no_constraints).then(function (rot_t) {
                            return types_1.type_equals(t_t.type, types_1.string_type) &&
                                types_1.type_equals(x_t.type, types_1.double_type) && types_1.type_equals(y_t.type, types_1.double_type) &&
                                types_1.type_equals(s_t.type, types_1.double_type) && types_1.type_equals(col_t.type, types_1.string_type) &&
                                types_1.type_equals(rot_t.type, types_1.double_type) ?
                                ts_bccc_2.co_unit(types_1.mk_typing(types_1.text_type, Sem.mk_text_rt(t_t.sem, x_t.sem, y_t.sem, s_t.sem, col_t.sem, rot_t.sem)))
                                : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for text creation." });
                        });
                    });
                });
            });
        });
    }); };
};
exports.mk_sprite = function (r, sprite, x, y, w, h, rot) {
    return function (_) { return sprite(types_1.no_constraints).then(function (s_t) {
        return x(types_1.no_constraints).then(function (x_t) {
            return y(types_1.no_constraints).then(function (y_t) {
                return w(types_1.no_constraints).then(function (w_t) {
                    return h(types_1.no_constraints).then(function (h_t) {
                        return rot(types_1.no_constraints).then(function (rot_t) {
                            return types_1.type_equals(s_t.type, types_1.string_type) &&
                                types_1.type_equals(x_t.type, types_1.double_type) && types_1.type_equals(y_t.type, types_1.double_type) &&
                                types_1.type_equals(w_t.type, types_1.double_type) && types_1.type_equals(h_t.type, types_1.double_type) &&
                                types_1.type_equals(rot_t.type, types_1.double_type) ?
                                ts_bccc_2.co_unit(types_1.mk_typing(types_1.sprite_type, Sem.mk_sprite_rt(s_t.sem, x_t.sem, y_t.sem, w_t.sem, h_t.sem, rot_t.sem)))
                                : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for sprite creation." });
                        });
                    });
                });
            });
        });
    }); };
};
exports.mk_other_surface = function (r, s, dx, dy, sx, sy, rot) {
    return function (_) { return dx(types_1.no_constraints).then(function (dx_t) {
        return dy(types_1.no_constraints).then(function (dy_t) {
            return sx(types_1.no_constraints).then(function (sx_t) {
                return sy(types_1.no_constraints).then(function (sy_t) {
                    return s(types_1.no_constraints).then(function (s_t) {
                        return rot(types_1.no_constraints).then(function (rot_t) {
                            return types_1.type_equals(dx_t.type, types_1.double_type) && types_1.type_equals(dy_t.type, types_1.double_type) &&
                                types_1.type_equals(sx_t.type, types_1.double_type) && types_1.type_equals(sy_t.type, types_1.double_type) &&
                                types_1.type_equals(s_t.type, types_1.render_surface_type) ?
                                ts_bccc_2.co_unit(types_1.mk_typing(types_1.other_render_surface_type, Sem.mk_other_surface_rt(s_t.sem, dx_t.sem, dy_t.sem, sx_t.sem, sy_t.sem, rot_t.sem)))
                                : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for other surface displacement." });
                        });
                    });
                });
            });
        });
    }); };
};
// polymorphic plus: extract definition of plus for both sides
// try to cast both arguments to extracted definitions
// run both trials in parser_or
exports.plus = function (r, a, b) {
    var plus_from_type = function (a_t, b_t, t) {
        return exports.get_class(r, t).then(function (t_c) {
            if (!t_c.methods.has("+"))
                return ts_bccc_2.co_error({ range: r, message: "Error: type " + types_1.type_to_string(t) + " has no (+) operator." });
            var plus = t_c.methods.get("+");
            if (plus.typing.type.kind != "fun" || plus.typing.type.in.kind != "tuple" || plus.typing.type.in.args.length != 2)
                return ts_bccc_2.co_error({ range: r, message: "Error: type " + types_1.type_to_string(t) + " has a (+) operator, but it is malformed." });
            var args = plus.typing.type.in.args;
            var a1 = function (_) { return ts_bccc_2.co_unit(a_t); };
            var b1 = function (_) { return ts_bccc_2.co_unit(b_t); };
            var plus_stmt = function (_) { return ts_bccc_2.co_unit(types_1.mk_typing(plus.typing.type, Sem.static_method_get_expr_rt(types_1.type_to_string(a_t.type), "+"))); };
            return exports.coerce(r, a1)(ts_bccc_1.apply(ts_bccc_1.inl(), args[0])).then(function (a_f) {
                return exports.coerce(r, b1)(ts_bccc_1.apply(ts_bccc_1.inl(), args[1])).then(function (b_f) {
                    return exports.call_lambda(r, plus_stmt, [a1, b1])(types_1.no_constraints);
                });
            });
        });
    };
    return function (_) { return a(types_1.no_constraints).then(function (a_t) {
        return b(types_1.no_constraints).then(function (b_t) {
            return types_1.type_equals(a_t.type, types_1.render_surface_type) &&
                (types_1.type_equals(b_t.type, types_1.circle_type) || types_1.type_equals(b_t.type, types_1.square_type)
                    || types_1.type_equals(b_t.type, types_1.ellipse_type) || types_1.type_equals(b_t.type, types_1.rectangle_type)
                    || types_1.type_equals(b_t.type, types_1.sprite_type) || types_1.type_equals(b_t.type, types_1.line_type)
                    || types_1.type_equals(b_t.type, types_1.polygon_type) || types_1.type_equals(b_t.type, types_1.text_type)
                    || types_1.type_equals(b_t.type, types_1.other_render_surface_type)) ?
                ts_bccc_2.co_unit(types_1.mk_typing(types_1.render_surface_type, Sem.render_surface_plus_rt(a_t.sem, b_t.sem)))
                : ccc_aux_1.co_catch(function (e1, e2) { return console.log(JSON.stringify([e1, e2])) || ({ range: r, message: "Error: unsupported types for operator (+)!" }); })(plus_from_type(a_t, b_t, a_t.type))(plus_from_type(a_t, b_t, b_t.type));
        });
    }); };
};
exports.minus = function (r, a, b) {
    return function (_) { return a(types_1.no_constraints).then(function (a_t) {
        return b(types_1.no_constraints).then(function (b_t) {
            return types_1.type_equals(a_t.type, b_t.type) ?
                types_1.type_equals(a_t.type, types_1.int_type) ?
                    ts_bccc_2.co_unit(types_1.mk_typing(types_1.int_type, Sem.int_minus_rt(a_t.sem, b_t.sem)))
                    : types_1.type_equals(a_t.type, types_1.float_type) || types_1.type_equals(a_t.type, types_1.double_type) ?
                        ts_bccc_2.co_unit(types_1.mk_typing(a_t.type, Sem.float_minus_rt(a_t.sem, b_t.sem)))
                        : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for operator (-)!" })
                : ts_bccc_2.co_error({ range: r, message: "Error: cannot subtract expressions of different types!" });
        });
    }); };
};
exports.div = function (r, a, b) {
    return function (_) { return a(types_1.no_constraints).then(function (a_t) {
        return b(types_1.no_constraints).then(function (b_t) {
            return types_1.type_equals(a_t.type, b_t.type) ?
                types_1.type_equals(a_t.type, types_1.int_type) ?
                    ts_bccc_2.co_unit(types_1.mk_typing(types_1.int_type, Sem.int_div_rt(a_t.sem, b_t.sem)))
                    : types_1.type_equals(a_t.type, types_1.float_type) || types_1.type_equals(a_t.type, types_1.double_type) ?
                        ts_bccc_2.co_unit(types_1.mk_typing(a_t.type, Sem.float_div_rt(a_t.sem, b_t.sem)))
                        : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for operator (/)!" })
                : ts_bccc_2.co_error({ range: r, message: "Error: cannot divide expressions of different types!" });
        });
    }); };
};
exports.times = function (r, a, b, sr) {
    return function (_) { return a(types_1.no_constraints).then(function (a_t) {
        return b(types_1.no_constraints).then(function (b_t) {
            return types_1.type_equals(a_t.type, b_t.type) ?
                types_1.type_equals(a_t.type, types_1.int_type) ?
                    ts_bccc_2.co_unit(types_1.mk_typing(types_1.int_type, Sem.int_times_rt(a_t.sem, b_t.sem, sr)))
                    : types_1.type_equals(a_t.type, types_1.float_type) || types_1.type_equals(a_t.type, types_1.double_type) ?
                        ts_bccc_2.co_unit(types_1.mk_typing(a_t.type, Sem.float_times_rt(a_t.sem, b_t.sem, sr)))
                        : ts_bccc_2.co_error({ range: r, message: "Error (" + sr.to_string() + "): unsupported types for operator (*)!" })
                : ts_bccc_2.co_error({ range: r, message: "Error (" + sr.to_string() + "): cannot multiply expressions of incompatible types!" });
        });
    }); };
};
exports.mod = function (r, a, b) {
    return function (_) { return a(types_1.no_constraints).then(function (a_t) {
        return b(types_1.no_constraints).then(function (b_t) {
            return types_1.type_equals(a_t.type, b_t.type) ?
                types_1.type_equals(a_t.type, types_1.int_type) ?
                    ts_bccc_2.co_unit(types_1.mk_typing(types_1.int_type, Sem.int_mod_rt(a_t.sem, b_t.sem)))
                    : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for operator (-)!" })
                : ts_bccc_2.co_error({ range: r, message: "Error: cannot mod expressions of different types!" });
        });
    }); };
};
exports.minus_unary = function (r, a) {
    return function (_) { return a(types_1.no_constraints).then(function (a_t) {
        return types_1.type_equals(a_t.type, types_1.int_type) ?
            ts_bccc_2.co_unit(types_1.mk_typing(types_1.int_type, Sem.int_minus_unary_rt(a_t.sem)))
            : types_1.type_equals(a_t.type, types_1.float_type) || types_1.type_equals(a_t.type, types_1.double_type) ?
                ts_bccc_2.co_unit(types_1.mk_typing(types_1.float_type, Sem.float_minus_unary_rt(a_t.sem)))
                : ts_bccc_2.co_error({ range: r, message: "Error: unsupported type for unary operator (-)!" });
    }); };
};
exports.or = function (r, a, b) {
    return function (_) { return a(types_1.no_constraints).then(function (a_t) {
        return b(types_1.no_constraints).then(function (b_t) {
            return types_1.type_equals(a_t.type, b_t.type) && types_1.type_equals(a_t.type, types_1.bool_type) ?
                ts_bccc_2.co_unit(types_1.mk_typing(types_1.bool_type, Sem.bool_plus_rt(a_t.sem, b_t.sem)))
                : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for operator (||)!" });
        });
    }); };
};
exports.and = function (r, a, b) {
    return function (_) { return a(types_1.no_constraints).then(function (a_t) {
        return b(types_1.no_constraints).then(function (b_t) {
            return types_1.type_equals(a_t.type, b_t.type) && types_1.type_equals(a_t.type, types_1.bool_type) ?
                ts_bccc_2.co_unit(types_1.mk_typing(types_1.bool_type, Sem.bool_times_rt(a_t.sem, b_t.sem)))
                : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for operator (&&)!" });
        });
    }); };
};
exports.arrow = function (r, parameters, closure, body) {
    return function (constraints) {
        if (constraints.kind == "right")
            return ts_bccc_2.co_error({ range: r, message: "Error: empty context when defining anonymous function (=>)!" });
        var expected_type = constraints.value;
        if (expected_type.kind != "fun")
            return ts_bccc_2.co_error({ range: r, message: "Error: expected " + expected_type.kind + ", found function." });
        var input = expected_type.in.kind == "tuple" ? expected_type.in.args : [expected_type.in];
        var output = expected_type.out;
        var parameter_declarations = parameters.map(function (p, p_i) { return (__assign({}, p, { type: input[p_i] })); }).map(function (p) { return exports.decl_v(r, p.name, p.type, true); }).reduce(function (p, q) { return exports.semicolon(r, p, q); }, exports.done);
        return ccc_aux_1.co_stateless(parameter_declarations(types_1.no_constraints).then(function (decls) {
            return body(ts_bccc_1.apply(ts_bccc_1.inl(), output)).then(function (b_t) {
                return ts_bccc_2.co_unit(types_1.mk_typing(expected_type, Sem.mk_lambda_rt(b_t.sem, parameters.map(function (p) { return p.name; }), closure, r)));
            });
        }));
    };
};
exports.not = function (r, a) {
    return function (_) { return a(types_1.no_constraints).then(function (a_t) {
        return types_1.type_equals(a_t.type, types_1.bool_type) ?
            ts_bccc_2.co_unit(types_1.mk_typing(types_1.bool_type, Sem.bool_not_rt(a_t.sem)))
            : ts_bccc_2.co_error({ range: r, message: "Error: unsupported type for unary operator (!)!" });
    }); };
};
exports.length = function (r, a) {
    return function (_) { return a(types_1.no_constraints).then(function (a_t) {
        return types_1.type_equals(a_t.type, types_1.string_type) ?
            ts_bccc_2.co_unit(types_1.mk_typing(types_1.int_type, Sem.string_length_rt(a_t.sem)))
            : a_t.type.kind == "arr" ?
                ts_bccc_2.co_unit(types_1.mk_typing(types_1.int_type, a_t.sem.then(function (a_val) { return Sem.get_arr_len_rt(a_val.value); })))
                : ts_bccc_2.co_error({ range: r, message: "Error: unsupported type for unary operator (-)!" });
    }); };
};
exports.get_index = function (r, a, i) {
    return function (_) { return a(types_1.no_constraints).then(function (a_t) {
        return i(types_1.no_constraints).then(function (i_t) {
            return a_t.type.kind == "arr" && types_1.type_equals(i_t.type, types_1.int_type) ?
                ts_bccc_2.co_unit(types_1.mk_typing(a_t.type.arg, Sem.get_arr_el_expr_rt(a_t.sem, i_t.sem)))
                : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for array lookup!" });
        });
    }); };
};
exports.set_index = function (r, a, i, e) {
    return function (_) { return a(types_1.no_constraints).then(function (a_t) {
        return i(types_1.no_constraints).then(function (i_t) {
            return a_t.type.kind != "arr" ?
                ts_bccc_2.co_error({ range: r, message: "Error: array set operation is only permitted on arrays!" })
                : e(ts_bccc_1.apply(ts_bccc_1.inl(), a_t.type.arg)).then(function (e_t) {
                    return a_t.type.kind == "arr" && types_1.type_equals(i_t.type, types_1.int_type) && types_1.type_equals(e_t.type, a_t.type.arg) ?
                        ts_bccc_2.co_unit(types_1.mk_typing(a_t.type.arg, Sem.set_arr_el_expr_rt(a_t.sem, i_t.sem, e_t.sem)))
                        : ts_bccc_2.co_error({ range: r, message: "Error: unsupported types for writing in an array!" });
                });
        });
    }); };
};
// Debugger statements
exports.breakpoint = function (r) {
    return function (p) { return exports.semicolon(r, function (_) { return ts_bccc_2.co_unit(types_1.mk_typing(types_1.unit_type, Sem.dbg_rt(r)(ts_bccc_1.apply(ts_bccc_1.inl(), Sem.mk_unit_val)))); }, p); };
};
exports.typechecker_breakpoint = function (range) {
    return function (p) { return exports.semicolon(range, exports.semicolon(range, exports.set_highlighting(range), function (_) { return Co.suspend().then(function (_) { return ts_bccc_2.co_unit(types_1.mk_typing(types_1.unit_type, Sem.done_rt)); }); }), p); };
};
exports.highlight = ts_bccc_1.fun(function (x) { return (__assign({}, x.snd, { highlighting: x.fst })); });
exports.set_highlighting = function (r) {
    return function (_) { return ts_bccc_2.mk_coroutine(ts_bccc_1.constant(r).times(ts_bccc_1.id()).then(exports.highlight).then(ts_bccc_1.constant(types_1.mk_typing(types_1.unit_type, Sem.done_rt)).times(ts_bccc_1.id())).then(Co.value().then(Co.result().then(Co.no_error())))); };
};
// Control flow statements
exports.done = function (_) { return ts_bccc_2.co_unit(types_1.mk_typing(types_1.unit_type, Sem.done_rt)); };
exports.lub = function (t1, t2) {
    return types_1.type_equals(t1, t2) ? ts_bccc_1.apply(ts_bccc_1.inl(), t1) :
        t1.kind == "unit" ? ts_bccc_1.apply(ts_bccc_1.inl(), t2) :
            t2.kind == "unit" ? ts_bccc_1.apply(ts_bccc_1.inl(), t1) :
                ts_bccc_1.apply(ts_bccc_1.inr(), {});
};
exports.if_then_else = function (r, c, t, e) {
    return function (expected_type) { return c(types_1.no_constraints).then(function (c_t) {
        return c_t.type.kind != "bool" ? ts_bccc_2.co_error({ range: r, message: "Error: condition has the wrong type!" }) :
            ccc_aux_1.co_stateless(t(expected_type)).then(function (t_t) {
                return ccc_aux_1.co_stateless(e(expected_type)).then(function (e_t) {
                    var on_type = ts_bccc_1.fun(function (t_i) { return function (_) { return ts_bccc_2.co_unit(types_1.mk_typing(t_i, Sem.if_then_else_rt(c_t.sem, t_t.sem, e_t.sem))); }; });
                    var on_error = ts_bccc_1.constant(function (_) { return ts_bccc_2.co_error({ range: r, message: "Error: the branches of a conditional should have compatible types!" }); });
                    var res = ts_bccc_1.apply(on_type.plus(on_error), exports.lub(t_t.type, e_t.type));
                    return res(types_1.no_constraints);
                });
            });
    }); };
};
exports.while_do = function (r, c, b) {
    return function (_) { return ccc_aux_1.co_stateless(c(types_1.no_constraints).then(function (c_t) {
        return c_t.type.kind != "bool" ? ts_bccc_2.co_error({ range: r, message: "Error: condition has the wrong type!" }) :
            b(types_1.no_constraints).then(function (t_t) { return ts_bccc_2.co_unit(types_1.mk_typing(t_t.type, Sem.while_do_rt(c_t.sem, t_t.sem))); });
    })); };
};
exports.for_loop = function (r, i, c, s, b) {
    return function (_) { return ccc_aux_1.co_stateless(i(types_1.no_constraints).then(function (i_t) {
        return c(types_1.no_constraints).then(function (c_t) {
            return c_t.type.kind != "bool" ? ts_bccc_2.co_error({ range: r, message: "Error: condition has the wrong type!" }) :
                s(types_1.no_constraints).then(function (s_t) {
                    return b(types_1.no_constraints).then(function (b_t) { return ts_bccc_2.co_unit(types_1.mk_typing(b_t.type, Sem.for_loop_rt(i_t.sem, c_t.sem, s_t.sem, b_t.sem))); });
                });
        });
    })); };
};
exports.semicolon = function (r, p, q) {
    return function (constraints) { return p(constraints).then(function (p_t) {
        return q(constraints).then(function (q_t) {
            return ts_bccc_2.co_unit(types_1.mk_typing(q_t.type, p_t.sem.then(function (res) {
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
        return exports.semicolon(r, function (_) { return exports.get_v(r, cp)(types_1.no_constraints).then(function (cp_t) { return exports.decl_v(r, cp, cp_t.type, true)(types_1.no_constraints); }); }, acc);
    }, exports.done));
    return function (_) { return Co.co_get_state().then(function (initial_bindings) {
        return set_bindings(types_1.no_constraints).then(function (_) {
            return body(ts_bccc_1.apply(ts_bccc_1.inl(), return_t)).then(function (body_t) {
                return types_1.type_equals(body_t.type, return_t) ?
                    Co.co_set_state(initial_bindings).then(function (_) {
                        return ts_bccc_2.co_unit(types_1.mk_typing(types_1.fun_type(types_1.tuple_type(parameters.map(function (p) { return p.type; })), body_t.type, r), Sem.mk_lambda_rt(body_t.sem, parameters.map(function (p) { return p.name; }), closure_parameters, range)));
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
        return ts_bccc_1.co_set_state(__assign({}, s, { bindings: s.bindings.set(def.name, __assign({}, types_1.fun_type(types_1.tuple_type(def.parameters.map(function (p) { return p.type; })), def.return_t, r), { is_constant: true })) })).then(function (_) {
            return exports.mk_lambda(r, def, closure_parameters, def.range)(types_1.no_constraints).then(function (l) {
                return ts_bccc_1.co_set_state(s).then(function (_) {
                    return exports.decl_const(r, def.name, l.type, function (_) { return ts_bccc_2.co_unit(l); })(types_1.no_constraints);
                });
            });
        });
    }); };
};
exports.def_method = function (r, C_name, def) {
    var is_static = def.modifiers.some(function (m) { return m == "static"; });
    var parameters = def.parameters;
    // console.log("params", JSON.stringify(parameters))
    var return_t = def.return_t;
    var body = def.body;
    var set_bindings = (is_static ? parameters : parameters.concat([{ name: "this", type: types_1.ref_type(C_name) }]))
        .reduce(function (acc, par) { return exports.semicolon(r, exports.decl_v(r, par.name, par.type, false), acc); }, exports.done);
    return function (_) { return Co.co_get_state().then(function (initial_bindings) {
        return set_bindings(types_1.no_constraints).then(function (_) {
            return body(types_1.no_constraints).then(function (body_t) {
                return types_1.type_equals(body_t.type, return_t) ?
                    Co.co_set_state(initial_bindings).then(function (_) {
                        return is_static ?
                            ts_bccc_2.co_unit(types_1.mk_typing(types_1.fun_type(types_1.tuple_type(parameters.map(function (p) { return p.type; })), body_t.type, r), Sem.mk_lambda_rt(body_t.sem, parameters.map(function (p) { return p.name; }), [], def.range)))
                            : ts_bccc_2.co_unit(types_1.mk_typing(types_1.fun_type(types_1.tuple_type([types_1.ref_type(C_name)]), types_1.fun_type(types_1.tuple_type(parameters.map(function (p) { return p.type; })), body_t.type, r), r), Sem.mk_lambda_rt(Sem.mk_lambda_rt(body_t.sem, parameters.map(function (p) { return p.name; }), ["this"], def.range), ["this"], [], def.range)));
                    })
                    : ts_bccc_2.co_error({ range: r, message: "Error: return type does not match declaration" });
            });
        });
    }); };
};
exports.call_lambda = function (r, lambda, arg_values) {
    return function (_) { return lambda(types_1.no_constraints).then(function (lambda_t) {
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
                    !types_1.type_equals(arg_t.type, lambda_t.type.in.args[i]); }) ?
                ts_bccc_2.co_error({ range: r, message: "Error: parameter type mismatch when calling lambda expression " + JSON.stringify(lambda_t.type) + " with arguments " + JSON.stringify([args_t.toArray().map(function (a) { return a.type; })]) })
                :
                    ts_bccc_2.co_unit(types_1.mk_typing(lambda_t.type.out, Sem.call_lambda_expr_rt(lambda_t.sem, args_t.toArray().map(function (arg_t) { return arg_t.sem; }))));
        });
    }); };
};
exports.call_by_name = function (r, f_n, args) {
    return exports.call_lambda(r, exports.get_v(r, f_n), args);
};
exports.ret = function (r, p) {
    return function (constraints) { return p(constraints).then(function (p_t) {
        return ts_bccc_2.co_unit(types_1.mk_typing(p_t.type, Sem.return_rt(p_t.sem)));
    }); };
};
exports.new_array = function (r, type, len) {
    return function (_) { return len(types_1.no_constraints).then(function (len_t) {
        return types_1.type_equals(len_t.type, types_1.int_type) ?
            ts_bccc_2.co_unit(types_1.mk_typing(types_1.arr_type(type), Sem.new_arr_expr_rt(len_t.sem)))
            : ts_bccc_2.co_error({ range: r, message: "Error: argument of array constructor must be of type int" });
    }); };
};
exports.new_array_and_init = function (r, type, args) {
    return function (_) {
        var xs = Immutable.List(args.map(function (a) { return a(ts_bccc_1.apply(ts_bccc_1.inl(), type)); }));
        return ccc_aux_1.comm_list_coroutine(xs).then(function (xs_t) {
            var arg_types = xs_t.toArray().map(function (x_t) { return x_t.type; });
            // arg_types must all be of type `type`
            var arg_values = xs_t.toArray().map(function (x_t) { return x_t.sem; });
            return ts_bccc_2.co_unit(types_1.mk_typing(types_1.arr_type(type), Sem.new_arr_expr_with_values_rt(arg_values)));
            // return co_error<State,Err,Typing>({ range:r, message:`Error: argument of array constructor must be of type int`})
        });
    };
    // len(no_constraints).then(len_t =>
    //        type_equals(len_t.type, int_type) ?
    //          co_unit(mk_typing(arr_type(type), Sem.new_arr_expr_rt(len_t.sem)))
    //        : co_error<State,Err,Typing>({ range:r, message:`Error: argument of array constructor must be of type int`}))
};
exports.get_arr_len = function (r, a) {
    return function (_) { return a(types_1.no_constraints).then(function (a_t) {
        return a_t.type.kind == "arr" ?
            ts_bccc_2.co_unit(types_1.mk_typing(types_1.int_type, Sem.get_arr_len_expr_rt(a_t.sem)))
            : ts_bccc_2.co_error({ range: r, message: "Error: array length requires an array" });
    }); };
};
exports.get_arr_el = function (r, a, i) {
    return function (_) { return a(types_1.no_constraints).then(function (a_t) {
        return i(types_1.no_constraints).then(function (i_t) {
            return a_t.type.kind == "arr" && types_1.type_equals(i_t.type, types_1.int_type) ?
                ts_bccc_2.co_unit(types_1.mk_typing(a_t.type.arg, Sem.get_arr_el_expr_rt(a_t.sem, i_t.sem)))
                : ts_bccc_2.co_error({ range: r, message: "Error: array getter requires an array and an integer as arguments" });
        });
    }); };
};
exports.set_arr_el = function (r, a, i, e) {
    return function (_) { return a(types_1.no_constraints).then(function (a_t) {
        return i(types_1.no_constraints).then(function (i_t) {
            return e(types_1.no_constraints).then(function (e_t) {
                return a_t.type.kind == "arr" && types_1.type_equals(i_t.type, types_1.int_type) ?
                    types_1.type_equals(e_t.type, a_t.type.arg) ? ts_bccc_2.co_unit(types_1.mk_typing(types_1.unit_type, Sem.set_arr_el_expr_rt(a_t.sem, i_t.sem, e_t.sem)))
                        : a_t.type.arg.kind == "record" && types_1.type_equals(e_t.type, types_1.tuple_type(a_t.type.arg.args.toArray())) ?
                            ts_bccc_2.co_unit(types_1.mk_typing(types_1.unit_type, Sem.set_arr_el_expr_rt(a_t.sem, i_t.sem, e_t.sem.then(function (e_val) { return main_1.mk_expr_from_val(main_1.tuple_to_record(e_val.value, a_t.type.arg.args.keySeq().toArray())); }))))
                            : ts_bccc_2.co_error({ range: r, message: "Error: array setter requires an array and an integer as arguments" })
                    : ts_bccc_2.co_error({ range: r, message: "Error: array setter requires an array and an integer as arguments" });
            });
        });
    }); };
};
exports.def_class = function (r, C_name, methods_from_context, fields_from_context, is_internal) {
    if (is_internal === void 0) { is_internal = false; }
    var context = { kind: "class", C_name: C_name };
    var methods = methods_from_context.map(function (m) { return m(context); });
    var fields = fields_from_context.map(function (f) { return f(context); });
    var C_type_placeholder = {
        range: r,
        kind: "obj",
        is_internal: is_internal,
        C_name: C_name,
        methods: Immutable.Map(methods.map(function (m) {
            return [
                m.name,
                {
                    typing: types_1.mk_typing(types_1.fun_type(types_1.tuple_type((m.modifiers.filter(function (md) { return md == "static"; }).length == 0 ? [types_1.ref_type(C_name)] : []).concat(m.parameters.map(function (p) { return p.type; }))), m.return_t, m.range), Sem.done_rt),
                    modifiers: Immutable.Set(m.modifiers)
                }
            ];
        })),
        fields: Immutable.Map(fields.map(function (f) {
            return [
                f.name,
                {
                    type: f.type,
                    modifiers: Immutable.Set(f.modifiers),
                    initial_value: f.initial_value
                }
            ];
        }))
    };
    return function (_) { return ts_bccc_1.co_get_state().then(function (initial_bindings) {
        return ts_bccc_1.co_set_state(__assign({}, initial_bindings, { bindings: initial_bindings.bindings.set(C_name, __assign({}, C_type_placeholder, { is_constant: true })) })).then(function (_) {
            return ccc_aux_1.comm_list_coroutine(Immutable.List(methods.map(function (m) { return exports.def_method(m.range, C_name, m)(types_1.no_constraints); }))).then(function (methods_t) {
                var methods_full_t = methods_t.zipWith(function (m_t, m_d) { return ({ typ: m_t, def: m_d }); }, Immutable.Seq(methods)).toArray();
                var C_type = {
                    range: r,
                    kind: "obj",
                    is_internal: is_internal,
                    C_name: C_name,
                    methods: Immutable.Map(methods_full_t.map(function (m) { return [m.def.name, { typing: m.typ, modifiers: Immutable.Set(m.def.modifiers) }]; })),
                    fields: Immutable.Map(fields.filter(function (f) { return !f.modifiers.some(function (mod) { return mod == "static"; }); }).map(function (f) {
                        return [f.name,
                            { type: f.type, initial_value: f.initial_value, modifiers: Immutable.Set(f.modifiers) }];
                    }))
                };
                var static_fields = fields.filter(function (f) { return f.modifiers.some(function (mod) { return mod == "static"; }); });
                var C_int = {
                    range: r,
                    is_internal: is_internal,
                    base: ts_bccc_1.apply(ts_bccc_1.inr(), {}),
                    methods: Immutable.Map(methods_full_t.filter(function (m) { return !m.def.modifiers.some(function (mod) { return mod == "static"; }); }).map(function (m) {
                        var res = [
                            m.def.name,
                            m.typ.sem
                        ];
                        return res;
                    })),
                    static_methods: Immutable.Map(methods_full_t.filter(function (m) { return m.def.modifiers.some(function (mod) { return mod == "static"; }); }).map(function (m) {
                        var res = [
                            m.def.name,
                            m.typ.sem
                        ];
                        return res;
                    })),
                    static_fields: Immutable.Map(static_fields.map(function (f) {
                        return [f.name,
                            initial_value(f.type)
                        ];
                    }))
                };
                var init_static_fields = static_fields.map(function (f) {
                    if (f.initial_value.kind == "right")
                        return exports.done;
                    else {
                        var v_1 = f.initial_value.value;
                        return function (_) { return v_1(types_1.no_constraints).then(function (v_v) {
                            return !types_1.type_equals(v_v.type, f.type) ? ts_bccc_2.co_error({ range: r, message: "Invalid initial value for field " + C_name + "." + f.name + "." })
                                : ts_bccc_2.co_unit(types_1.mk_typing(types_1.unit_type, Sem.static_field_set_expr_rt(C_name, { att_name: f.name, kind: "att" }, v_v.sem)));
                        }); };
                    }
                }).reduce(function (a, b) { return exports.semicolon(r, a, b); }, exports.done);
                return ts_bccc_1.co_set_state(__assign({}, initial_bindings, { bindings: initial_bindings.bindings.set(C_name, __assign({}, C_type, { is_constant: true })) })).then(function (_) {
                    return init_static_fields(types_1.no_constraints).then(function (init_static_fields_t) {
                        return ts_bccc_2.co_unit(types_1.mk_typing(types_1.unit_type, Sem.declare_class_rt(C_name, C_int).then(function (_) { return init_static_fields_t.sem; })));
                    });
                });
            });
        });
    }); };
};
exports.field_get = function (r, context, this_ref, F_or_M_name) {
    return function (_) { return this_ref(types_1.no_constraints).then(function (this_ref_t) {
        return ts_bccc_1.co_get_state().then(function (bindings) {
            if (this_ref_t.type.kind == "arr") {
                if (F_or_M_name == "Length")
                    return ts_bccc_2.co_unit(types_1.mk_typing(types_1.int_type, Sem.get_arr_len_expr_rt(this_ref_t.sem)));
                else
                    return ts_bccc_2.co_error({ range: r, message: "Invalid array operation." });
            }
            else if (this_ref_t.type.kind != "ref" && this_ref_t.type.kind != "obj") {
                var item = /^Item/;
                var m = F_or_M_name.match(item);
                if (this_ref_t.type.kind == "tuple" && m != null && m.length != 0) {
                    try {
                        var item_index = parseInt(F_or_M_name.replace(item, "")) - 1;
                        return ts_bccc_2.co_unit(types_1.mk_typing(this_ref_t.type.args[item_index], Sem.tuple_get_rt(r, this_ref_t.sem, item_index)));
                    }
                    catch (error) {
                        return ts_bccc_2.co_error({ range: r, message: "Invalid field getter " + F_or_M_name + "." });
                    }
                }
                else {
                    // console.log("Checking getter on", JSON.stringify(this_ref_t.type))
                    if (this_ref_t.type.kind == "record" && this_ref_t.type.args.has(F_or_M_name)) {
                        try {
                            return ts_bccc_2.co_unit(types_1.mk_typing(this_ref_t.type.args.get(F_or_M_name), Sem.record_get_rt(r, this_ref_t.sem, F_or_M_name)));
                        }
                        catch (error) {
                            return ts_bccc_2.co_error({ range: r, message: "Invalid field getter " + F_or_M_name + "." });
                        }
                    }
                    else {
                        return ts_bccc_2.co_error({ range: r, message: "Error: expected reference or class name when getting field " + F_or_M_name + " from " + JSON.stringify(this_ref_t) + "." });
                    }
                }
            }
            var C_name = this_ref_t.type.C_name;
            if (!bindings.bindings.has(this_ref_t.type.C_name))
                return ts_bccc_2.co_error({ range: r, message: "Error: class " + this_ref_t.type.C_name + " is undefined" });
            var C_def = bindings.bindings.get(this_ref_t.type.C_name);
            if (C_def.kind != "obj")
                return ts_bccc_2.co_error({ range: r, message: "Error: " + this_ref_t.type.C_name + " is not a class" });
            if (C_def.fields.has(F_or_M_name)) {
                var F_def = C_def.fields.get(F_or_M_name);
                if (!F_def.modifiers.has("public")) {
                    if (context.kind == "global scope")
                        return ts_bccc_2.co_error({ range: r, message: "Error: cannot get non-public field " + JSON.stringify(F_or_M_name) + " from global scope" });
                    else if (context.C_name != C_name)
                        return ts_bccc_2.co_error({ range: r, message: "Error: cannot get non-public field " + C_name + "::" + JSON.stringify(F_or_M_name) + " from " + context.C_name });
                }
                return ts_bccc_2.co_unit(types_1.mk_typing(F_def.type, F_def.modifiers.has("static") ?
                    Sem.static_field_get_expr_rt(C_name, F_or_M_name)
                    : Sem.field_get_expr_rt(F_or_M_name, this_ref_t.sem)));
            }
            else if (C_def.methods.has(F_or_M_name)) {
                var M_def = C_def.methods.get(F_or_M_name);
                // console.log("This is the method", JSON.stringify(M_def), F_or_M_name)
                // console.log("This is this", JSON.stringify(this_ref_t))
                if (!M_def.modifiers.has("public")) {
                    if (context.kind == "global scope")
                        return ts_bccc_2.co_error({ range: r, message: "Error: cannot get non-public field " + JSON.stringify(F_or_M_name) + " from global scope" });
                    else if (context.C_name != C_name)
                        return ts_bccc_2.co_error({ range: r, message: "Error: cannot get non-public field " + C_name + "::" + JSON.stringify(F_or_M_name) + " from " + context.C_name });
                }
                if (M_def.typing.type.kind != "fun")
                    return ts_bccc_2.co_error({ range: r, message: "Error: method " + C_name + "::" + JSON.stringify(F_or_M_name) + " is not a lambda in " + (context.kind == "class" ? context.C_name : JSON.stringify(context)) });
                return ts_bccc_2.co_unit(types_1.mk_typing(M_def.modifiers.has("static") ? M_def.typing.type : M_def.typing.type.out, M_def.modifiers.has("static") ?
                    Sem.static_method_get_expr_rt(C_name, F_or_M_name)
                    :
                        //call_lambda
                        Sem.call_lambda_expr_rt(Sem.method_get_expr_rt(F_or_M_name, this_ref_t.sem), [this_ref_t.sem])));
            }
            return ts_bccc_2.co_error({ range: r, message: "Error: class " + this_ref_t.type.C_name + " does not contain field " + F_or_M_name });
        });
    }); };
};
exports.field_set = function (r, context, this_ref, F_name, new_value) {
    return function (_) { return this_ref(types_1.no_constraints).then(function (this_ref_t) {
        return (F_name.kind == "att_arr" ? F_name.index(types_1.no_constraints) : ts_bccc_2.co_unit(types_1.mk_typing(types_1.bool_type, Sem.bool_expr(false)))).then(function (maybe_index) {
            return ts_bccc_1.co_get_state().then(function (bindings) {
                if (this_ref_t.type.kind != "ref" && this_ref_t.type.kind != "obj") {
                    return ts_bccc_2.co_error({ range: r, message: "Error: expected reference or class name when setting field " + F_name.att_name + "." });
                }
                var C_name = this_ref_t.type.C_name;
                if (!bindings.bindings.has(C_name))
                    return ts_bccc_2.co_error({ range: r, message: "Error: class " + C_name + " is undefined" });
                var C_def = bindings.bindings.get(C_name);
                if (C_def.kind != "obj")
                    return ts_bccc_2.co_error({ range: r, message: "Error: type " + C_name + " is not a class" });
                if (!C_def.fields.has(F_name.att_name))
                    return ts_bccc_2.co_error({ range: r, message: "Error: class " + C_name + " does not contain field " + F_name.att_name });
                var F_def = C_def.fields.get(F_name.att_name);
                if (!F_def.modifiers.has("public")) {
                    if (context.kind == "global scope")
                        return ts_bccc_2.co_error({ range: r, message: "Error: cannot set non-public field " + JSON.stringify(F_name.att_name) + " from global scope" });
                    else if (context.C_name != C_name)
                        return ts_bccc_2.co_error({ range: r, message: "Error: cannot set non-public field " + C_name + "::" + JSON.stringify(F_name.att_name) + " from " + context.C_name });
                }
                return new_value(ts_bccc_1.apply(ts_bccc_1.inl(), F_def.type)).then(function (new_value_t) {
                    if (!types_1.type_equals(F_def.type, new_value_t.type))
                        return ts_bccc_2.co_error({ range: r, message: "Error: field " + C_name + "::" + F_name.att_name + " cannot be assigned to value of type " + JSON.stringify(new_value_t.type) });
                    return ts_bccc_2.co_unit(types_1.mk_typing(types_1.unit_type, F_def.modifiers.has("static") ?
                        Sem.static_field_set_expr_rt(C_name, F_name.kind == "att" ? F_name : __assign({}, F_name, { index: maybe_index.sem }), new_value_t.sem)
                        : Sem.field_set_expr_rt(F_name.kind == "att" ? F_name : __assign({}, F_name, { index: maybe_index.sem }), new_value_t.sem, this_ref_t.sem)));
                });
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
        var init_fields = C_def.fields.filter(function (f) { return !!f && !f.modifiers.has("static"); }).map(function (f, f_name) {
            if (f_name == undefined || f == undefined || f.initial_value.kind == "right")
                return exports.done;
            else {
                var v_2 = f.initial_value.value;
                return function (_) { return v_2(types_1.no_constraints).then(function (v_v) {
                    // !type_equals(v_v.type, f.type) ? co_error<State,Err,Typing>({ range:r, message:`Invalid initial value for field ${C_name}.${f.name}.`})
                    return ts_bccc_2.co_unit(types_1.mk_typing(types_1.unit_type, Sem.field_set_expr_rt({ att_name: f_name, kind: "att" }, v_v.sem, Sem.get_v_rt("this"))));
                }); };
            }
        }).toArray().reduce(function (a, b) { return exports.semicolon(r, a, b); }, exports.done);
        if (!lambda_t.modifiers.has("public")) {
            if (context.kind == "global scope")
                return ts_bccc_2.co_error({ range: r, message: "Error: cannot call non-public constructor " + C_name + " from global scope" });
            else if (context.C_name != C_name)
                return ts_bccc_2.co_error({ range: r, message: "Error: cannot call non-public constructor " + C_name + " from " + context.C_name });
        }
        return lambda_t.typing.type.kind == "fun" && lambda_t.typing.type.in.kind == "tuple" ?
            check_arguments.then(function (args_t) {
                return init_fields(types_1.no_constraints).then(function (init_fields_t) {
                    return lambda_t.typing.type.kind != "fun" || lambda_t.typing.type.in.kind != "tuple" ||
                        (lambda_t.typing.type.out.kind == "fun" &&
                            lambda_t.typing.type.out.in.kind == "tuple" &&
                            arg_values.length != lambda_t.typing.type.out.in.args.length) ||
                        args_t.some(function (arg_t, i) {
                            return lambda_t.typing.type.kind != "fun" || lambda_t.typing.type.in.kind != "tuple" || arg_t == undefined || i == undefined ||
                                lambda_t.typing.type.out.kind == "fun" &&
                                    lambda_t.typing.type.out.in.kind == "tuple" &&
                                    !types_1.type_equals(arg_t.type, lambda_t.typing.type.out.in.args[i]);
                        }) ?
                        ts_bccc_2.co_error({ range: r, message: "Error: parameter type mismatch when calling lambda expression " + JSON.stringify(lambda_t.typing.type) + " with arguments " + JSON.stringify(args_t) })
                        :
                            ts_bccc_2.co_unit(types_1.mk_typing(types_1.ref_type(C_name), Sem.call_cons_rt(C_name, args_t.toArray().map(function (arg_t) { return arg_t.sem; }), init_fields_t.sem)));
                });
            })
            : ts_bccc_2.co_error({ range: r, message: "Error: cannot invoke non-lambda expression of type " + JSON.stringify(lambda_t.typing.type) });
    }); };
};
exports.get_class = function (r, t) {
    return t.kind == "int" || t.kind == "float" || t.kind == "string" || t.kind == "double" || t.kind == "bool" ?
        ts_bccc_1.co_get_state().then(function (bindings) {
            if (!bindings.bindings.has(t.kind))
                return ts_bccc_2.co_error({ message: "Cannot find class for primitive type " + JSON.stringify(t), range: r });
            var t_t = bindings.bindings.get(t.kind);
            if (t_t.kind != "obj")
                ts_bccc_2.co_error({ message: "Malformed class for primitive type " + JSON.stringify(t), range: r });
            var t_obj = t_t;
            return ts_bccc_2.co_unit(t_obj);
        })
        : t.kind == "obj" ? ts_bccc_2.co_unit(t)
            : ts_bccc_2.co_error({ message: "Cannot get class for type " + JSON.stringify(t), range: r });
};
exports.coerce = function (r, e) {
    return function (t) { return e(types_1.no_constraints).then(function (e_v) { return exports.get_class(r, e_v.type).then(function (e_c) {
        if (t.kind == "right")
            return ts_bccc_2.co_error({ message: "Cannot coerce to unspecified type.", range: r });
        var t_name = types_1.type_to_string(t.value);
        var e_type_name = types_1.type_to_string(e_v.type);
        if (t_name == e_type_name)
            return ts_bccc_2.co_unit(e_v);
        var casting_operators = e_c.methods.filter(function (m) { return m != undefined && m.modifiers.some(function (mod) { return mod == "casting"; }) && m.modifiers.some(function (mod) { return mod == "operator"; }) && m.modifiers.some(function (mod) { return mod == "static"; }); }).map(function (c_op, c_op_name) { return ({ body: c_op, name: c_op_name }); }).toArray();
        var coercions = casting_operators.map(function (c_op) {
            var c_op_typing = function (_) { return ts_bccc_2.co_unit(types_1.mk_typing(c_op.body.typing.type, Sem.static_method_get_expr_rt(e_type_name, c_op.name))); };
            var coercion = exports.call_lambda(r, c_op_typing, [function (_) { return ts_bccc_2.co_unit(e_v); }]);
            if (c_op.name == t_name) {
                return coercion;
            }
            else {
                return function (_) { return exports.coerce(r, coercion)(t); };
            }
        });
        return ccc_aux_1.comm_list_coroutine(Immutable.List(coercions.map(function (c) { return c(types_1.no_constraints); }))).then(function (casts) {
            return !casts.isEmpty() ? ts_bccc_2.co_unit(casts.first())
                : ts_bccc_2.co_error({ message: "Cannot convert expression with type " + JSON.stringify(e_v.type) + " to " + t_name + ".", range: r });
        });
    }); }); };
};
