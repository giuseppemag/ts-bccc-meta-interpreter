"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts_bccc_1 = require("ts-bccc");
var ts_bccc_2 = require("ts-bccc");
var Co = require("ts-bccc");
var Sem = require("../Python/memory");
var SemExpr = require("../Python/expressions");
var SemStmts = require("../Python/basic_statements");
exports.unit_type = { kind: "unit" };
exports.int_type = { kind: "int" };
exports.string_type = { kind: "string" };
exports.bool_type = { kind: "bool" };
exports.float_type = { kind: "float" };
var mk_typing = function (t, s) { return ({ type: t, sem: s }); };
exports.mk_typing_cat = ts_bccc_1.fun2(mk_typing);
exports.load = ts_bccc_1.fun(function (x) {
    return x.snd.has(x.fst) ?
        ts_bccc_1.apply(ts_bccc_1.inr(), x.snd.get(x.fst))
        : ts_bccc_1.apply(ts_bccc_1.inl(), {});
});
exports.store = ts_bccc_1.fun(function (x) {
    return x.snd.set(x.fst.fst, x.fst.snd);
});
var type_equals = function (t1, t2) {
    return (t1.kind == "fun" && t2.kind == "fun" && type_equals(t1.in, t2.in) && type_equals(t1.out, t2.out))
        || (t1.kind == "arr" && t2.kind == "arr" && type_equals(t1.arg, t2.arg))
        || (t1.kind == "obj" && t2.kind == "obj" &&
            !t1.inner.some(function (v1, k1) { return v1 == undefined || k1 == undefined || !t2.inner.has(k1) || !type_equals(t2.inner.get(k1), v1); }) &&
            !t2.inner.some(function (v2, k2) { return v2 == undefined || k2 == undefined || !t1.inner.has(k2); }))
        || t1.kind == t2.kind;
};
// Basic statements and expressions
var wrap_co_res = Co.value().then(Co.result());
exports.get_v = function (v) {
    var f = exports.load.then(ts_bccc_1.constant("Error: variable " + v + " does not exist.").map_plus((ts_bccc_1.id().times(ts_bccc_1.constant(Sem.get_v(v)))).then(exports.mk_typing_cat)));
    var g = ts_bccc_1.snd().times(f).then(ts_bccc_1.distribute_sum_prod());
    var g1 = g.then((ts_bccc_1.snd()).map_plus((ts_bccc_1.swap_prod().then(wrap_co_res))));
    var h = ts_bccc_1.apply(ts_bccc_1.curry(g1), v);
    return ts_bccc_2.mk_coroutine(h);
};
exports.set_v = function (v, e) {
    return e.then(function (e_val) {
        return exports.get_v(v).then(function (v_val) {
            return type_equals(e_val.type, v_val.type) ?
                ts_bccc_2.co_unit(mk_typing(exports.unit_type, Sem.set_v_expr(v, e_val.sem)))
                :
                    ts_bccc_2.co_error("Error: cannot assign " + v + " to " + e + ": type " + v_val.type + " does not match " + e_val.type);
        });
    });
};
exports.plus = function (a, b) {
    return a.then(function (a_t) {
        return b.then(function (b_t) {
            return type_equals(a_t.type, b_t.type) ?
                type_equals(a_t.type, exports.int_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.int_type, SemExpr.int_plus(a_t.sem, b_t.sem)))
                    : type_equals(a_t.type, exports.float_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.int_type, SemExpr.float_plus(a_t.sem, b_t.sem)))
                        : type_equals(a_t.type, exports.string_type) ?
                            ts_bccc_2.co_unit(mk_typing(exports.string_type, SemExpr.string_plus(a_t.sem, b_t.sem)))
                            : ts_bccc_2.co_error("Error: unsupported types for operator (+)!")
                : ts_bccc_2.co_error("Error: cannot sum expressions of different types!");
        });
    });
};
exports.minus = function (a, b) {
    return a.then(function (a_t) {
        return b.then(function (b_t) {
            return type_equals(a_t.type, b_t.type) ?
                type_equals(a_t.type, exports.int_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.int_type, SemExpr.int_minus(a_t.sem, b_t.sem)))
                    : type_equals(a_t.type, exports.float_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.float_type, SemExpr.float_minus(a_t.sem, b_t.sem)))
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
                    ts_bccc_2.co_unit(mk_typing(exports.int_type, SemExpr.int_div(a_t.sem, b_t.sem)))
                    : type_equals(a_t.type, exports.float_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.float_type, SemExpr.float_div(a_t.sem, b_t.sem)))
                        : ts_bccc_2.co_error("Error: unsupported types for operator (/)!")
                : ts_bccc_2.co_error("Error: cannot divide expressions of different types!");
        });
    });
};
exports.times = function (a, b) {
    return a.then(function (a_t) {
        return b.then(function (b_t) {
            return type_equals(a_t.type, b_t.type) ?
                type_equals(a_t.type, exports.int_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.int_type, SemExpr.int_times(a_t.sem, b_t.sem)))
                    : type_equals(a_t.type, exports.float_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.float_type, SemExpr.float_times(a_t.sem, b_t.sem)))
                        : ts_bccc_2.co_error("Error: unsupported types for operator (*)!")
                : ts_bccc_2.co_error("Error: cannot multiply expressions of different types!");
        });
    });
};
exports.mod = function (a, b) {
    return a.then(function (a_t) {
        return b.then(function (b_t) {
            return type_equals(a_t.type, b_t.type) ?
                type_equals(a_t.type, exports.int_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.int_type, SemExpr.int_mod(a_t.sem, b_t.sem)))
                    : ts_bccc_2.co_error("Error: unsupported types for operator (-)!")
                : ts_bccc_2.co_error("Error: cannot mod expressions of different types!");
        });
    });
};
exports.minus_unary = function (a) {
    return a.then(function (a_t) {
        return type_equals(a_t.type, exports.int_type) ?
            ts_bccc_2.co_unit(mk_typing(exports.int_type, SemExpr.int_minus_unary(a_t.sem)))
            : type_equals(a_t.type, exports.float_type) ?
                ts_bccc_2.co_unit(mk_typing(exports.float_type, SemExpr.float_minus_unary(a_t.sem)))
                : ts_bccc_2.co_error("Error: unsupported type for unary operator (-)!");
    });
};
exports.or = function (a, b) {
    return a.then(function (a_t) {
        return b.then(function (b_t) {
            return type_equals(a_t.type, b_t.type) && type_equals(a_t.type, exports.bool_type) ?
                ts_bccc_2.co_unit(mk_typing(exports.bool_type, SemExpr.bool_plus(a_t.sem, b_t.sem)))
                : ts_bccc_2.co_error("Error: unsupported types for operator (&&)!");
        });
    });
};
exports.and = function (a, b) {
    return a.then(function (a_t) {
        return b.then(function (b_t) {
            return type_equals(a_t.type, b_t.type) && type_equals(a_t.type, exports.bool_type) ?
                ts_bccc_2.co_unit(mk_typing(exports.bool_type, SemExpr.bool_times(a_t.sem, b_t.sem)))
                : ts_bccc_2.co_error("Error: unsupported types for operator (&&)!");
        });
    });
};
exports.not = function (a) {
    return a.then(function (a_t) {
        return type_equals(a_t.type, exports.bool_type) ?
            ts_bccc_2.co_unit(mk_typing(exports.bool_type, SemExpr.bool_not(a_t.sem)))
            : ts_bccc_2.co_error("Error: unsupported type for unary operator (!)!");
    });
};
exports.length = function (a) {
    return a.then(function (a_t) {
        return type_equals(a_t.type, exports.string_type) ?
            ts_bccc_2.co_unit(mk_typing(exports.int_type, SemExpr.string_length(a_t.sem)))
            : a_t.type.kind == "arr" ?
                ts_bccc_2.co_unit(mk_typing(exports.int_type, a_t.sem.then(function (a_val) { return Sem.get_arr_len(a_val); })))
                : ts_bccc_2.co_error("Error: unsupported type for unary operator (-)!");
    });
};
exports.get_index = function (a, i) {
    return a.then(function (a_t) {
        return i.then(function (i_t) {
            return a_t.type.kind == "arr" && type_equals(i_t.type, exports.int_type) ?
                ts_bccc_2.co_unit(mk_typing(a_t.type.arg, Sem.get_arr_el_expr(a_t.sem, i_t.sem)))
                : ts_bccc_2.co_error("Error: unsupported types for array lookup!");
        });
    });
};
exports.set_index = function (a, i, e) {
    return a.then(function (a_t) {
        return i.then(function (i_t) {
            return e.then(function (e_t) {
                return a_t.type.kind == "arr" && type_equals(i_t.type, exports.int_type) && type_equals(e_t.type, a_t.type.arg) ?
                    ts_bccc_2.co_unit(mk_typing(a_t.type.arg, Sem.set_arr_el_expr(a_t.sem, i_t.sem, e_t.sem)))
                    : ts_bccc_2.co_error("Error: unsupported types for writing in an array!");
            });
        });
    });
};
// Control flow statements
exports.if_then_else = function (c, t, e) {
    return c.then(function (c_t) {
        return c_t.type.kind != "bool" ? ts_bccc_2.co_error("Error: condition has the wrong type!") :
            t.then(function (t_t) {
                return e.then(function (e_t) {
                    return type_equals(t_t.type, exports.unit_type) && type_equals(e_t.type, exports.unit_type) ? ts_bccc_2.co_error("Error: the branches of a conditional should be of type unit!") :
                        ts_bccc_2.co_unit(mk_typing(t_t.type, SemStmts.if_then_else(c_t.sem, t_t.sem, e_t.sem)));
                });
            });
    });
};
exports.while_do = function (c, b) {
    return c.then(function (c_t) {
        return c_t.type.kind != "bool" ? ts_bccc_2.co_error("Error: condition has the wrong type!") :
            b.then(function (t_t) {
                return type_equals(t_t.type, exports.unit_type) ? ts_bccc_2.co_error("Error: the body of a loop should be of type unit!") :
                    ts_bccc_2.co_unit(mk_typing(t_t.type, SemStmts.while_do(c_t.sem, t_t.sem)));
            });
    });
};
exports.semicolon = function (p, q) {
    return p.then(function (p_t) {
        return q.then(function (q_t) {
            return ts_bccc_2.co_unit(mk_typing(exports.unit_type, p_t.sem.then(function (_) { return q_t.sem; })));
        });
    });
};
