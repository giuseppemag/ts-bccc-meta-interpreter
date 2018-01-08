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
exports.unit_type = { kind: "unit" };
exports.int_type = { kind: "int" };
exports.string_type = { kind: "string" };
exports.bool_type = { kind: "bool" };
exports.float_type = { kind: "float" };
exports.fun_type = function (i, o) { return ({ kind: "fun", in: i, out: o }); };
exports.arr_type = function (arg) { return ({ kind: "arr", arg: arg }); };
exports.tuple_type = function (args) { return ({ kind: "tuple", args: args }); };
exports.ref_type = function (C_name) { return ({ kind: "ref", C_name: C_name }); };
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
            !t1.methods.some(function (v1, k1) { return v1 == undefined || k1 == undefined || !t2.methods.has(k1) || !type_equals(t2.methods.get(k1).type, v1.type); }) &&
            !t2.methods.some(function (v2, k2) { return v2 == undefined || k2 == undefined || !t1.methods.has(k2); }))
        || t1.kind == t2.kind;
};
// Basic statements and expressions
var wrap_co_res = Co.value().then(Co.result());
var wrap_co = wrap_co_res.then(Co.no_error());
exports.get_v = function (v) {
    var f = exports.load.then(ts_bccc_1.constant("Error: variable " + v + " does not exist.").map_plus((ts_bccc_1.id().times(ts_bccc_1.constant(Sem.get_v_rt(v)))).then(mk_typing_cat_full)));
    var g = ts_bccc_1.snd().times(f).then(ts_bccc_1.distribute_sum_prod());
    var g1 = g.then((ts_bccc_1.snd()).map_plus((ts_bccc_1.swap_prod().then(wrap_co_res))));
    var h = ts_bccc_1.apply(ts_bccc_1.curry(g1), v);
    return ts_bccc_2.mk_coroutine(h);
};
exports.decl_v = function (v, t, is_constant) {
    var f = exports.store.then(ts_bccc_1.constant(mk_typing(exports.unit_type, Sem.decl_v_rt(v, ts_bccc_1.apply(ts_bccc_1.inl(), Sem.mk_unit_val)))).times(ts_bccc_1.id())).then(wrap_co);
    var g = ts_bccc_1.curry(f);
    var args = ts_bccc_1.apply(ts_bccc_1.constant(v).times(ts_bccc_1.constant(__assign({}, t, { is_constant: is_constant != undefined ? is_constant : false }))), {});
    return ts_bccc_2.mk_coroutine(ts_bccc_1.apply(g, args));
};
exports.decl_const = function (c, t, e) {
    var f = exports.store.then(ts_bccc_1.constant(mk_typing(exports.unit_type, Sem.decl_v_rt(c, ts_bccc_1.apply(ts_bccc_1.inl(), Sem.mk_unit_val)))).times(ts_bccc_1.id())).then(wrap_co);
    var g = ts_bccc_1.curry(f);
    var args = ts_bccc_1.apply(ts_bccc_1.constant(c).times(ts_bccc_1.constant(__assign({}, t, { is_constant: true }))), {});
    return ts_bccc_2.mk_coroutine(ts_bccc_1.apply(g, args)).then(function (_) {
        return e.then(function (e_val) {
            return exports.get_v(c).then(function (c_val) {
                // console.log(`Initialising constant ${v} (${JSON.stringify(v_val.type)})`) ||
                return type_equals(e_val.type, c_val.type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.unit_type, Sem.set_v_expr_rt(c, e_val.sem)))
                    : ts_bccc_2.co_error("Error: cannot assign " + JSON.stringify(c) + " to " + JSON.stringify(e) + ": type " + JSON.stringify(c_val.type) + " does not match " + JSON.stringify(e_val.type));
            });
        });
    });
};
exports.set_v = function (v, e) {
    return e.then(function (e_val) {
        return exports.get_v(v).then(function (v_val) {
            // console.log(`Assigning ${v} (${JSON.stringify(v_val.type)})`) ||
            return type_equals(e_val.type, v_val.type) && !v_val.type.is_constant ?
                ts_bccc_2.co_unit(mk_typing(exports.unit_type, Sem.set_v_expr_rt(v, e_val.sem)))
                : v_val.type.is_constant ?
                    ts_bccc_2.co_error("Error: cannot assign anything to " + v + ": it is a constant.")
                    : ts_bccc_2.co_error("Error: cannot assign " + JSON.stringify(v) + " to " + JSON.stringify(e) + ": type " + JSON.stringify(v_val.type) + " does not match " + JSON.stringify(e_val.type));
        });
    });
};
exports.bool = function (b) {
    return ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.bool_expr(b)));
};
exports.str = function (s) {
    return ts_bccc_2.co_unit(mk_typing(exports.string_type, Sem.str_expr(s)));
};
exports.int = function (i) {
    return ts_bccc_2.co_unit(mk_typing(exports.int_type, Sem.int_expr(i)));
};
exports.gt = function (a, b) {
    return a.then(function (a_t) {
        return b.then(function (b_t) {
            return type_equals(a_t.type, b_t.type) ?
                type_equals(a_t.type, exports.int_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.int_gt_rt(a_t.sem, b_t.sem)))
                    : type_equals(a_t.type, exports.float_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.float_type, Sem.float_gt_rt(a_t.sem, b_t.sem)))
                        : ts_bccc_2.co_error("Error: unsupported types for operator (>)!")
                : ts_bccc_2.co_error("Error: cannot compare expressions of different types!");
        });
    });
};
exports.lt = function (a, b) {
    return a.then(function (a_t) {
        return b.then(function (b_t) {
            return type_equals(a_t.type, b_t.type) ?
                type_equals(a_t.type, exports.int_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.int_lt_rt(a_t.sem, b_t.sem)))
                    : type_equals(a_t.type, exports.float_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.float_type, Sem.float_lt_rt(a_t.sem, b_t.sem)))
                        : ts_bccc_2.co_error("Error: unsupported types for operator (<)!")
                : ts_bccc_2.co_error("Error: cannot compare expressions of different types!");
        });
    });
};
exports.geq = function (a, b) {
    return a.then(function (a_t) {
        return b.then(function (b_t) {
            return type_equals(a_t.type, b_t.type) ?
                type_equals(a_t.type, exports.int_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.int_geq_rt(a_t.sem, b_t.sem)))
                    : type_equals(a_t.type, exports.float_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.float_type, Sem.float_geq_rt(a_t.sem, b_t.sem)))
                        : ts_bccc_2.co_error("Error: unsupported types for operator (>=)!")
                : ts_bccc_2.co_error("Error: cannot compare expressions of different types!");
        });
    });
};
exports.leq = function (a, b) {
    return a.then(function (a_t) {
        return b.then(function (b_t) {
            return type_equals(a_t.type, b_t.type) ?
                type_equals(a_t.type, exports.int_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.int_leq_rt(a_t.sem, b_t.sem)))
                    : type_equals(a_t.type, exports.float_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.float_type, Sem.float_leq_rt(a_t.sem, b_t.sem)))
                        : ts_bccc_2.co_error("Error: unsupported types for operator (<=)!")
                : ts_bccc_2.co_error("Error: cannot compare expressions of different types!");
        });
    });
};
exports.eq = function (a, b) {
    return a.then(function (a_t) {
        return b.then(function (b_t) {
            return type_equals(a_t.type, b_t.type) ?
                type_equals(a_t.type, exports.int_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.int_eq_rt(a_t.sem, b_t.sem)))
                    : type_equals(a_t.type, exports.float_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.float_type, Sem.float_eq_rt(a_t.sem, b_t.sem)))
                        : ts_bccc_2.co_error("Error: unsupported types for operator (==)!")
                : ts_bccc_2.co_error("Error: cannot compare expressions of different types!");
        });
    });
};
exports.neq = function (a, b) {
    return a.then(function (a_t) {
        return b.then(function (b_t) {
            return type_equals(a_t.type, b_t.type) ?
                type_equals(a_t.type, exports.int_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.int_neq_rt(a_t.sem, b_t.sem)))
                    : type_equals(a_t.type, exports.float_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.float_type, Sem.float_neq_rt(a_t.sem, b_t.sem)))
                        : ts_bccc_2.co_error("Error: unsupported types for operator (!=)!")
                : ts_bccc_2.co_error("Error: cannot compare expressions of different types!");
        });
    });
};
exports.xor = function (a, b) {
    return a.then(function (a_t) {
        return b.then(function (b_t) {
            return type_equals(a_t.type, b_t.type) ?
                type_equals(a_t.type, exports.bool_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.bool_neq_rt(a_t.sem, b_t.sem)))
                    : ts_bccc_2.co_error("Error: unsupported types for operator (^)!")
                : ts_bccc_2.co_error("Error: cannot compare expressions of different types!");
        });
    });
};
exports.mk_empty_render_grid = function (w, h) {
    return w.then(function (w_t) {
        return h.then(function (h_t) {
            return type_equals(w_t.type, exports.int_type) && type_equals(h_t.type, exports.int_type) ?
                ts_bccc_2.co_unit(mk_typing(exports.render_grid_type, Sem.mk_empty_render_grid_rt(w_t.sem, h_t.sem)))
                : ts_bccc_2.co_error("Error: unsupported types for empty grid creation.");
        });
    });
};
exports.mk_render_grid_pixel = function (w, h, st) {
    return w.then(function (w_t) {
        return h.then(function (h_t) {
            return st.then(function (st_t) {
                return type_equals(w_t.type, exports.int_type) && type_equals(h_t.type, exports.int_type) && type_equals(st_t.type, exports.bool_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.render_grid_pixel_type, Sem.mk_render_grid_pixel_rt(w_t.sem, h_t.sem, st_t.sem)))
                    : ts_bccc_2.co_error("Error: unsupported types for empty grid creation.");
            });
        });
    });
};
exports.plus = function (a, b) {
    return a.then(function (a_t) {
        return b.then(function (b_t) {
            return type_equals(a_t.type, b_t.type) ?
                type_equals(a_t.type, exports.int_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.int_type, Sem.int_plus_rt(a_t.sem, b_t.sem)))
                    : type_equals(a_t.type, exports.float_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.int_type, Sem.float_plus_rt(a_t.sem, b_t.sem)))
                        : type_equals(a_t.type, exports.string_type) ?
                            ts_bccc_2.co_unit(mk_typing(exports.string_type, Sem.string_plus_rt(a_t.sem, b_t.sem)))
                            : ts_bccc_2.co_error("Error: unsupported types for operator (+)!")
                : type_equals(a_t.type, exports.render_grid_type) && type_equals(b_t.type, exports.render_grid_pixel_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.render_grid_type, Sem.render_grid_plus_rt(a_t.sem, b_t.sem)))
                    : ts_bccc_2.co_error("Error: cannot sum expressions of non-compatible types!");
        });
    });
};
exports.minus = function (a, b) {
    return a.then(function (a_t) {
        return b.then(function (b_t) {
            return type_equals(a_t.type, b_t.type) ?
                type_equals(a_t.type, exports.int_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.int_type, Sem.int_minus_rt(a_t.sem, b_t.sem)))
                    : type_equals(a_t.type, exports.float_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.float_type, Sem.float_minus_rt(a_t.sem, b_t.sem)))
                        : ts_bccc_2.co_error("Error: unsupported types for operator (-)!")
                : ts_bccc_2.co_error("Error: cannot subtract expressions of different types!");
        });
    });
};
exports.div = function (a, b) {
    return a.then(function (a_t) {
        return b.then(function (b_t) {
            return type_equals(a_t.type, b_t.type) ?
                type_equals(a_t.type, exports.int_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.int_type, Sem.int_div_rt(a_t.sem, b_t.sem)))
                    : type_equals(a_t.type, exports.float_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.float_type, Sem.float_div_rt(a_t.sem, b_t.sem)))
                        : ts_bccc_2.co_error("Error: unsupported types for operator (/)!")
                : ts_bccc_2.co_error("Error: cannot divide expressions of different types!");
        });
    });
};
exports.times = function (a, b, sr) {
    return a.then(function (a_t) {
        return b.then(function (b_t) {
            return type_equals(a_t.type, b_t.type) ?
                type_equals(a_t.type, exports.int_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.int_type, Sem.int_times_rt(a_t.sem, b_t.sem, sr)))
                    : type_equals(a_t.type, exports.float_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.float_type, Sem.float_times_rt(a_t.sem, b_t.sem, sr)))
                        : ts_bccc_2.co_error("Error (" + sr.to_string() + "): unsupported types for operator (*)!")
                : ts_bccc_2.co_error("Error (" + sr.to_string() + "): cannot multiply expressions of incompatible types!");
        });
    });
};
exports.mod = function (a, b) {
    return a.then(function (a_t) {
        return b.then(function (b_t) {
            return type_equals(a_t.type, b_t.type) ?
                type_equals(a_t.type, exports.int_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.int_type, Sem.int_mod_rt(a_t.sem, b_t.sem)))
                    : ts_bccc_2.co_error("Error: unsupported types for operator (-)!")
                : ts_bccc_2.co_error("Error: cannot mod expressions of different types!");
        });
    });
};
exports.minus_unary = function (a) {
    return a.then(function (a_t) {
        return type_equals(a_t.type, exports.int_type) ?
            ts_bccc_2.co_unit(mk_typing(exports.int_type, Sem.int_minus_unary_rt(a_t.sem)))
            : type_equals(a_t.type, exports.float_type) ?
                ts_bccc_2.co_unit(mk_typing(exports.float_type, Sem.float_minus_unary_rt(a_t.sem)))
                : ts_bccc_2.co_error("Error: unsupported type for unary operator (-)!");
    });
};
exports.or = function (a, b) {
    return a.then(function (a_t) {
        return b.then(function (b_t) {
            return type_equals(a_t.type, b_t.type) && type_equals(a_t.type, exports.bool_type) ?
                ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.bool_plus_rt(a_t.sem, b_t.sem)))
                : ts_bccc_2.co_error("Error: unsupported types for operator (||)!");
        });
    });
};
exports.and = function (a, b) {
    return a.then(function (a_t) {
        return b.then(function (b_t) {
            return type_equals(a_t.type, b_t.type) && type_equals(a_t.type, exports.bool_type) ?
                ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.bool_times_rt(a_t.sem, b_t.sem)))
                : ts_bccc_2.co_error("Error: unsupported types for operator (&&)!");
        });
    });
};
exports.not = function (a) {
    return a.then(function (a_t) {
        return type_equals(a_t.type, exports.bool_type) ?
            ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.bool_not_rt(a_t.sem)))
            : ts_bccc_2.co_error("Error: unsupported type for unary operator (!)!");
    });
};
exports.length = function (a) {
    return a.then(function (a_t) {
        return type_equals(a_t.type, exports.string_type) ?
            ts_bccc_2.co_unit(mk_typing(exports.int_type, Sem.string_length_rt(a_t.sem)))
            : a_t.type.kind == "arr" ?
                ts_bccc_2.co_unit(mk_typing(exports.int_type, a_t.sem.then(function (a_val) { return Sem.get_arr_len_rt(a_val.value); })))
                : ts_bccc_2.co_error("Error: unsupported type for unary operator (-)!");
    });
};
exports.get_index = function (a, i) {
    return a.then(function (a_t) {
        return i.then(function (i_t) {
            return a_t.type.kind == "arr" && type_equals(i_t.type, exports.int_type) ?
                ts_bccc_2.co_unit(mk_typing(a_t.type.arg, Sem.get_arr_el_expr_rt(a_t.sem, i_t.sem)))
                : ts_bccc_2.co_error("Error: unsupported types for array lookup!");
        });
    });
};
exports.set_index = function (a, i, e) {
    return a.then(function (a_t) {
        return i.then(function (i_t) {
            return e.then(function (e_t) {
                return a_t.type.kind == "arr" && type_equals(i_t.type, exports.int_type) && type_equals(e_t.type, a_t.type.arg) ?
                    ts_bccc_2.co_unit(mk_typing(a_t.type.arg, Sem.set_arr_el_expr_rt(a_t.sem, i_t.sem, e_t.sem)))
                    : ts_bccc_2.co_error("Error: unsupported types for writing in an array!");
            });
        });
    });
};
// Debugger statements
exports.breakpoint = function (r) {
    return function (p) { return exports.semicolon(ts_bccc_2.co_unit(mk_typing(exports.unit_type, Sem.dbg_rt(r)(ts_bccc_1.apply(ts_bccc_1.inl(), Sem.mk_unit_val)))), p); };
};
exports.typechecker_breakpoint = function (range) {
    return function (p) { return exports.semicolon(exports.semicolon(exports.set_highlighting(range), Co.suspend().then(function (_) { return ts_bccc_2.co_unit(mk_typing(exports.unit_type, Sem.done_rt)); })), p); };
};
exports.highlight = ts_bccc_1.fun(function (x) { return (__assign({}, x.snd, { highlighting: x.fst })); });
exports.set_highlighting = function (r) {
    return ts_bccc_2.mk_coroutine(ts_bccc_1.constant(r).times(ts_bccc_1.id()).then(exports.highlight).then(ts_bccc_1.constant(mk_typing(exports.unit_type, Sem.done_rt)).times(ts_bccc_1.id())).then(Co.value().then(Co.result().then(Co.no_error()))));
};
// Control flow statements
exports.done = ts_bccc_2.co_unit(mk_typing(exports.unit_type, Sem.done_rt));
exports.lub = function (t1, t2) {
    return type_equals(t1, t2) ? ts_bccc_1.apply(ts_bccc_1.inl(), t1) :
        t1.kind == "unit" ? ts_bccc_1.apply(ts_bccc_1.inl(), t2) :
            t2.kind == "unit" ? ts_bccc_1.apply(ts_bccc_1.inl(), t1) :
                ts_bccc_1.apply(ts_bccc_1.inr(), {});
};
exports.if_then_else = function (c, t, e) {
    return c.then(function (c_t) {
        return c_t.type.kind != "bool" ? ts_bccc_2.co_error("Error: condition has the wrong type!") :
            t.then(function (t_t) {
                return e.then(function (e_t) {
                    var on_type = ts_bccc_1.fun(function (t_i) { return ts_bccc_2.co_unit(mk_typing(t_i, Sem.if_then_else_rt(c_t.sem, t_t.sem, e_t.sem))); });
                    var on_error = ts_bccc_1.constant(ts_bccc_2.co_error("Error: the branches of a conditional should have compatible types!"));
                    return ts_bccc_1.apply(on_type.plus(on_error), exports.lub(t_t.type, e_t.type));
                });
            });
    });
};
exports.while_do = function (c, b) {
    return c.then(function (c_t) {
        return c_t.type.kind != "bool" ? ts_bccc_2.co_error("Error: condition has the wrong type!") :
            b.then(function (t_t) { return ts_bccc_2.co_unit(mk_typing(t_t.type, Sem.while_do_rt(c_t.sem, t_t.sem))); });
    });
};
exports.semicolon = function (p, q) {
    return p.then(function (p_t) {
        return q.then(function (q_t) {
            return ts_bccc_2.co_unit(mk_typing(q_t.type, p_t.sem.then(function (res) {
                var f = ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inr(), res.value));
                return res.kind == "left" ? q_t.sem : f;
            })));
        });
    });
};
exports.mk_param = function (name, type) {
    return { name: name, type: type };
};
exports.mk_lambda = function (def, closure_parameters, range) {
    var parameters = def.parameters;
    var return_t = def.return_t;
    var body = def.body;
    var set_bindings = parameters.reduce(function (acc, par) { return exports.semicolon(exports.decl_v(par.name, par.type, false), acc); }, closure_parameters.reduce(function (acc, cp) { return exports.semicolon(exports.get_v(cp).then(function (cp_t) { return exports.decl_v(cp, cp_t.type, true); }), acc); }, exports.done));
    return Co.co_get_state().then(function (initial_bindings) {
        return set_bindings.then(function (_) {
            return body.then(function (body_t) {
                return type_equals(body_t.type, return_t) ?
                    Co.co_set_state(initial_bindings).then(function (_) {
                        return ts_bccc_2.co_unit(mk_typing(exports.fun_type(exports.tuple_type(parameters.map(function (p) { return p.type; })), body_t.type), Sem.mk_lambda_rt(body_t.sem, parameters.map(function (p) { return p.name; }), closure_parameters, range)));
                    })
                    :
                        ts_bccc_2.co_error("Error: return type does not match declaration");
            });
        });
    });
};
// export interface Bindings extends Immutable.Map<Name, TypeInformation> {}
// export interface State { highlighting:SourceRange, bindings:Bindings }
exports.def_fun = function (def, closure_parameters) {
    return ts_bccc_1.co_get_state().then(function (s) {
        return ts_bccc_1.co_set_state(__assign({}, s, { bindings: s.bindings.set(def.name, __assign({}, exports.fun_type(exports.tuple_type(def.parameters.map(function (p) { return p.type; })), def.return_t), { is_constant: true })) })).then(function (_) {
            return exports.mk_lambda(def, closure_parameters, def.range).then(function (l) {
                return ts_bccc_1.co_set_state(s).then(function (_) {
                    return exports.decl_const(def.name, l.type, ts_bccc_2.co_unit(l));
                });
            });
        });
    });
};
exports.def_method = function (C_name, def) {
    var parameters_with_this = [{ name: "this", type: exports.ref_type(C_name) }];
    def.parameters = def.parameters.concat(parameters_with_this);
    var parameters = def.parameters;
    var return_t = def.return_t;
    var body = def.body;
    var set_bindings = parameters.reduce(function (acc, par) { return exports.semicolon(exports.decl_v(par.name, par.type, false), acc); }, exports.done);
    return Co.co_get_state().then(function (initial_bindings) {
        return set_bindings.then(function (_) {
            return body.then(function (body_t) {
                return type_equals(body_t.type, return_t) ?
                    Co.co_set_state(initial_bindings).then(function (_) {
                        return ts_bccc_2.co_unit(mk_typing(exports.fun_type(exports.tuple_type(parameters.map(function (p) { return p.type; })), body_t.type), Sem.mk_lambda_rt(body_t.sem, parameters.map(function (p) { return p.name; }), [], def.range)));
                    })
                    :
                        ts_bccc_2.co_error("Error: return type does not match declaration");
            });
        });
    });
};
exports.call_lambda = function (lambda, arg_values) {
    var check_arguments = arg_values.reduce(function (args, arg) {
        return arg.then(function (arg_t) {
            return args.then(function (args_t) {
                return ts_bccc_2.co_unit(args_t.push(arg_t));
            });
        });
    }, ts_bccc_2.co_unit(Immutable.List()));
    return lambda.then(function (lambda_t) {
        return lambda_t.type.kind == "fun" && lambda_t.type.in.kind == "tuple" ?
            check_arguments.then(function (args_t) {
                return lambda_t.type.kind != "fun" || lambda_t.type.in.kind != "tuple" ||
                    arg_values.length != lambda_t.type.in.args.length ||
                    args_t.some(function (arg_t, i) { return lambda_t.type.kind != "fun" || lambda_t.type.in.kind != "tuple" || arg_t == undefined || i == undefined ||
                        !type_equals(arg_t.type, lambda_t.type.in.args[i]); }) ?
                    ts_bccc_2.co_error("Error: parameter type mismatch when calling lambda expression " + JSON.stringify(lambda_t.type))
                    :
                        ts_bccc_2.co_unit(mk_typing(lambda_t.type.out, Sem.call_lambda_expr_rt(lambda_t.sem, args_t.toArray().map(function (arg_t) { return arg_t.sem; }))));
            })
            : ts_bccc_2.co_error("Error: cannot invoke non-lambda expression of type " + JSON.stringify(lambda_t.type));
    });
};
exports.call_by_name = function (f_n, args) {
    return exports.call_lambda(exports.get_v(f_n), args);
};
exports.ret = function (p) {
    return p.then(function (p_t) {
        return ts_bccc_2.co_unit(mk_typing(p_t.type, Sem.return_rt(p_t.sem)));
    });
};
exports.new_array = function (type, len) {
    return len.then(function (len_t) {
        return type_equals(len_t.type, exports.int_type) ?
            ts_bccc_2.co_unit(mk_typing(exports.arr_type(type), Sem.new_arr_expr_rt(len_t.sem)))
            : ts_bccc_2.co_error("Error: argument of array constructor must be of type int");
    });
};
exports.get_arr_len = function (a) {
    return a.then(function (a_t) {
        return a_t.type.kind == "arr" ?
            ts_bccc_2.co_unit(mk_typing(exports.int_type, Sem.get_arr_len_expr_rt(a_t.sem)))
            : ts_bccc_2.co_error("Error: array length requires an array");
    });
};
exports.get_arr_el = function (a, i) {
    return a.then(function (a_t) {
        return i.then(function (i_t) {
            return a_t.type.kind == "arr" && type_equals(i_t.type, exports.int_type) ?
                ts_bccc_2.co_unit(mk_typing(a_t.type.arg, Sem.get_arr_el_expr_rt(a_t.sem, i_t.sem)))
                : ts_bccc_2.co_error("Error: array getter requires an array and an integer as arguments");
        });
    });
};
exports.set_arr_el = function (a, i, e) {
    return a.then(function (a_t) {
        return i.then(function (i_t) {
            return e.then(function (e_t) {
                return a_t.type.kind == "arr" && type_equals(i_t.type, exports.int_type) && type_equals(e_t.type, a_t.type.arg) ?
                    ts_bccc_2.co_unit(mk_typing(exports.unit_type, Sem.set_arr_el_expr_rt(a_t.sem, i_t.sem, e_t.sem)))
                    : ts_bccc_2.co_error("Error: array setter requires an array and an integer as arguments");
            });
        });
    });
};
exports.def_class = function (C_name, methods, fields) {
    var C_type_placeholder = {
        kind: "obj",
        methods: Immutable.Map(methods.map(function (m) { return [m.name, mk_typing(exports.fun_type(exports.tuple_type([exports.ref_type(C_name)].concat(m.parameters.map(function (p) { return p.type; }))), m.return_t), Sem.done_rt)]; })),
        fields: Immutable.Map(fields.map(function (f) { return [f.name, f.type]; }))
    };
    return ts_bccc_1.co_get_state().then(function (initial_bindings) {
        return ts_bccc_1.co_set_state(__assign({}, initial_bindings, { bindings: initial_bindings.bindings.set(C_name, __assign({}, C_type_placeholder, { is_constant: true })) })).then(function (_) {
            return ccc_aux_1.comm_list_coroutine(Immutable.List(methods.map(function (m) { return exports.def_method(C_name, m); }))).then(function (methods_t) {
                var methods_full_t = methods_t.zipWith(function (m_t, m_d) { return ({ typ: m_t, def: m_d }); }, Immutable.Seq(methods)).toArray();
                var C_type = {
                    kind: "obj",
                    methods: Immutable.Map(methods_full_t.map(function (m) { return [m.def.name, m.typ]; })),
                    fields: Immutable.Map(fields.map(function (f) { return [f.name, f.type]; }))
                };
                var C_int = {
                    base: ts_bccc_1.apply(ts_bccc_1.inr(), {}),
                    methods: Immutable.Map(methods_full_t.map(function (m) {
                        var res = [
                            m.def.name,
                            m.typ.sem
                        ];
                        return res;
                    }))
                };
                return ts_bccc_1.co_set_state(__assign({}, initial_bindings, { bindings: initial_bindings.bindings.set(C_name, __assign({}, C_type, { is_constant: true })) })).then(function (_) {
                    return ts_bccc_2.co_unit(mk_typing(exports.unit_type, Sem.declare_class_rt(C_name, C_int)));
                });
            });
        });
    });
};
exports.field_get = function (this_ref, F_name) {
    return this_ref.then(function (this_ref_t) {
        return ts_bccc_1.co_get_state().then(function (bindings) {
            if (this_ref_t.type.kind != "ref")
                return ts_bccc_2.co_error("Error: this must be a reference");
            if (!bindings.bindings.has(this_ref_t.type.C_name))
                return ts_bccc_2.co_error("Error: class " + this_ref_t.type.C_name + " is undefined");
            var C_def = bindings.bindings.get(this_ref_t.type.C_name);
            if (C_def.kind != "obj")
                return ts_bccc_2.co_error("Error: class " + this_ref_t.type.C_name + " is not a clas");
            if (!C_def.fields.has(F_name))
                return ts_bccc_2.co_error("Error: class " + this_ref_t.type.C_name + " does not contain field " + F_name);
            var F_def = C_def.fields.get(F_name);
            return ts_bccc_2.co_unit(mk_typing(F_def, Sem.field_get_expr_rt(F_name, this_ref_t.sem)));
        });
    });
};
exports.field_set = function (this_ref, F_name, new_value) {
    return this_ref.then(function (this_ref_t) {
        return new_value.then(function (new_value_t) {
            return ts_bccc_1.co_get_state().then(function (bindings) {
                if (this_ref_t.type.kind != "ref")
                    return ts_bccc_2.co_error("Error: this must be a reference");
                if (!bindings.bindings.has(this_ref_t.type.C_name))
                    return ts_bccc_2.co_error("Error: class " + this_ref_t.type.C_name + " is undefined");
                var C_def = bindings.bindings.get(this_ref_t.type.C_name);
                if (C_def.kind != "obj")
                    return ts_bccc_2.co_error("Error: type " + this_ref_t.type.C_name + " is not a class");
                if (!C_def.fields.has(F_name))
                    return ts_bccc_2.co_error("Error: class " + this_ref_t.type.C_name + " does not contain field " + F_name);
                var F_def = C_def.fields.get(F_name);
                if (!type_equals(F_def, new_value_t.type))
                    return ts_bccc_2.co_error("Error: field " + this_ref_t.type.C_name + "::" + F_name + " cannot be assigned to value of type " + JSON.stringify(new_value_t.type));
                return ts_bccc_2.co_unit(mk_typing(exports.unit_type, Sem.field_set_expr_rt(F_name, new_value_t.sem, this_ref_t.sem)));
            });
        });
    });
};
exports.call_cons = function (C_name, arg_values) {
    return ts_bccc_1.co_get_state().then(function (bindings) {
        if (!bindings.bindings.has(C_name))
            return ts_bccc_2.co_error("Error: class " + C_name + " is undefined");
        var C_def = bindings.bindings.get(C_name);
        if (C_def.kind != "obj")
            return ts_bccc_2.co_error("Error: type  " + C_name + " is not a class");
        if (!C_def.methods.has(C_name))
            return ts_bccc_2.co_error("Error: class " + C_name + " does not have constructors");
        var lambda_t = C_def.methods.get(C_name);
        var check_arguments = arg_values.reduce(function (args, arg) {
            return arg.then(function (arg_t) {
                return args.then(function (args_t) {
                    return ts_bccc_2.co_unit(args_t.push(arg_t));
                });
            });
        }, ts_bccc_2.co_unit(Immutable.List()));
        return lambda_t.type.kind == "fun" && lambda_t.type.in.kind == "tuple" ?
            check_arguments.then(function (args_t) {
                return lambda_t.type.kind != "fun" || lambda_t.type.in.kind != "tuple" ||
                    arg_values.length != lambda_t.type.in.args.length - 1 ||
                    args_t.some(function (arg_t, i) { return lambda_t.type.kind != "fun" || lambda_t.type.in.kind != "tuple" || arg_t == undefined || i == undefined ||
                        !type_equals(arg_t.type, lambda_t.type.in.args[i]); }) ?
                    ts_bccc_2.co_error("Error: parameter type mismatch when calling lambda expression " + JSON.stringify(lambda_t.type) + " with arguments " + JSON.stringify(args_t))
                    :
                        ts_bccc_2.co_unit(mk_typing(exports.ref_type(C_name), Sem.call_cons_rt(C_name, args_t.toArray().map(function (arg_t) { return arg_t.sem; }))));
            })
            : ts_bccc_2.co_error("Error: cannot invoke non-lambda expression of type " + JSON.stringify(lambda_t.type));
    });
};
exports.call_method = function (this_ref, M_name, arg_values) {
    return this_ref.then(function (this_ref_t) {
        return ts_bccc_1.co_get_state().then(function (bindings) {
            if (this_ref_t.type.kind != "ref")
                return ts_bccc_2.co_error("Error: this must be a reference");
            var C_name = this_ref_t.type.C_name;
            if (!bindings.bindings.has(C_name))
                return ts_bccc_2.co_error("Error: class " + C_name + " is undefined");
            var C_def = bindings.bindings.get(C_name);
            if (C_def.kind != "obj")
                return ts_bccc_2.co_error("Error: type  " + C_name + " is not a class");
            if (!C_def.methods.has(M_name))
                return ts_bccc_2.co_error("Error: class " + C_name + " does not have constructors");
            var lambda_t = C_def.methods.get(M_name);
            var check_arguments = arg_values.reduce(function (args, arg) {
                return arg.then(function (arg_t) {
                    return args.then(function (args_t) {
                        return ts_bccc_2.co_unit(args_t.push(arg_t));
                    });
                });
            }, ts_bccc_2.co_unit(Immutable.List()));
            return lambda_t.type.kind == "fun" && lambda_t.type.in.kind == "tuple" ?
                check_arguments.then(function (args_t) {
                    return lambda_t.type.kind != "fun" || lambda_t.type.in.kind != "tuple" ||
                        arg_values.length != lambda_t.type.in.args.length - 1 ||
                        args_t.some(function (arg_t, i) { return lambda_t.type.kind != "fun" || lambda_t.type.in.kind != "tuple" || arg_t == undefined || i == undefined ||
                            !type_equals(arg_t.type, lambda_t.type.in.args[i]); }) ?
                        ts_bccc_2.co_error("Error: parameter type mismatch when calling method " + JSON.stringify(lambda_t.type) + " with arguments " + JSON.stringify(args_t))
                        :
                            ts_bccc_2.co_unit(mk_typing(exports.ref_type(C_name), Sem.call_method_expr_rt(M_name, this_ref_t.sem, args_t.toArray().map(function (arg_t) { return arg_t.sem; }))));
                })
                : ts_bccc_2.co_error("Error: cannot invoke non-lambda expression of type " + JSON.stringify(lambda_t.type));
        });
    });
};
