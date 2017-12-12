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
exports.unit_type = { kind: "unit" };
exports.int_type = { kind: "int" };
exports.string_type = { kind: "string" };
exports.bool_type = { kind: "bool" };
exports.float_type = { kind: "float" };
exports.fun_type = function (i, o) { return ({ kind: "fun", in: i, out: o }); };
exports.tuple_type = function (args) { return ({ kind: "tuple", args: args }); };
var mk_typing = function (t, s) { return ({ type: t, sem: s }); };
var mk_typing_cat = ts_bccc_1.fun2(mk_typing);
exports.empty_state = { highlighting: { start: { row: 0, column: 0 }, end: { row: 0, column: 0 } }, bindings: Immutable.Map() };
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
            !t1.inner.some(function (v1, k1) { return v1 == undefined || k1 == undefined || !t2.inner.has(k1) || !type_equals(t2.inner.get(k1), v1); }) &&
            !t2.inner.some(function (v2, k2) { return v2 == undefined || k2 == undefined || !t1.inner.has(k2); }))
        || t1.kind == t2.kind;
};
// Basic statements and expressions
var wrap_co_res = Co.value().then(Co.result());
var wrap_co = wrap_co_res.then(Co.no_error());
exports.get_v = function (v) {
    var f = exports.load.then(ts_bccc_1.constant("Error: variable " + v + " does not exist.").map_plus((ts_bccc_1.id().times(ts_bccc_1.constant(Sem.get_v(v)))).then(mk_typing_cat)));
    var g = ts_bccc_1.snd().times(f).then(ts_bccc_1.distribute_sum_prod());
    var g1 = g.then((ts_bccc_1.snd()).map_plus((ts_bccc_1.swap_prod().then(wrap_co_res))));
    var h = ts_bccc_1.apply(ts_bccc_1.curry(g1), v);
    return ts_bccc_2.mk_coroutine(h);
};
exports.decl_v = function (v, t) {
    var f = exports.store.then(ts_bccc_1.constant(mk_typing(exports.unit_type, Sem.done)).times(ts_bccc_1.id())).then(wrap_co);
    var g = ts_bccc_1.curry(f);
    var args = ts_bccc_1.apply(ts_bccc_1.constant(v).times(ts_bccc_1.constant(t)), {});
    return ts_bccc_2.mk_coroutine(ts_bccc_1.apply(g, args));
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
                    ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.int_gt(a_t.sem, b_t.sem)))
                    : type_equals(a_t.type, exports.float_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.float_type, Sem.float_gt(a_t.sem, b_t.sem)))
                        : ts_bccc_2.co_error("Error: unsupported types for operator (>)!")
                : ts_bccc_2.co_error("Error: cannot sum expressions of different types!");
        });
    });
};
exports.plus = function (a, b) {
    return a.then(function (a_t) {
        return b.then(function (b_t) {
            return type_equals(a_t.type, b_t.type) ?
                type_equals(a_t.type, exports.int_type) ?
                    ts_bccc_2.co_unit(mk_typing(exports.int_type, Sem.int_plus(a_t.sem, b_t.sem)))
                    : type_equals(a_t.type, exports.float_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.int_type, Sem.float_plus(a_t.sem, b_t.sem)))
                        : type_equals(a_t.type, exports.string_type) ?
                            ts_bccc_2.co_unit(mk_typing(exports.string_type, Sem.string_plus(a_t.sem, b_t.sem)))
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
                    ts_bccc_2.co_unit(mk_typing(exports.int_type, Sem.int_minus(a_t.sem, b_t.sem)))
                    : type_equals(a_t.type, exports.float_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.float_type, Sem.float_minus(a_t.sem, b_t.sem)))
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
                    ts_bccc_2.co_unit(mk_typing(exports.int_type, Sem.int_div(a_t.sem, b_t.sem)))
                    : type_equals(a_t.type, exports.float_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.float_type, Sem.float_div(a_t.sem, b_t.sem)))
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
                    ts_bccc_2.co_unit(mk_typing(exports.int_type, Sem.int_times(a_t.sem, b_t.sem)))
                    : type_equals(a_t.type, exports.float_type) ?
                        ts_bccc_2.co_unit(mk_typing(exports.float_type, Sem.float_times(a_t.sem, b_t.sem)))
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
                    ts_bccc_2.co_unit(mk_typing(exports.int_type, Sem.int_mod(a_t.sem, b_t.sem)))
                    : ts_bccc_2.co_error("Error: unsupported types for operator (-)!")
                : ts_bccc_2.co_error("Error: cannot mod expressions of different types!");
        });
    });
};
exports.minus_unary = function (a) {
    return a.then(function (a_t) {
        return type_equals(a_t.type, exports.int_type) ?
            ts_bccc_2.co_unit(mk_typing(exports.int_type, Sem.int_minus_unary(a_t.sem)))
            : type_equals(a_t.type, exports.float_type) ?
                ts_bccc_2.co_unit(mk_typing(exports.float_type, Sem.float_minus_unary(a_t.sem)))
                : ts_bccc_2.co_error("Error: unsupported type for unary operator (-)!");
    });
};
exports.or = function (a, b) {
    return a.then(function (a_t) {
        return b.then(function (b_t) {
            return type_equals(a_t.type, b_t.type) && type_equals(a_t.type, exports.bool_type) ?
                ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.bool_plus(a_t.sem, b_t.sem)))
                : ts_bccc_2.co_error("Error: unsupported types for operator (&&)!");
        });
    });
};
exports.and = function (a, b) {
    return a.then(function (a_t) {
        return b.then(function (b_t) {
            return type_equals(a_t.type, b_t.type) && type_equals(a_t.type, exports.bool_type) ?
                ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.bool_times(a_t.sem, b_t.sem)))
                : ts_bccc_2.co_error("Error: unsupported types for operator (&&)!");
        });
    });
};
exports.not = function (a) {
    return a.then(function (a_t) {
        return type_equals(a_t.type, exports.bool_type) ?
            ts_bccc_2.co_unit(mk_typing(exports.bool_type, Sem.bool_not(a_t.sem)))
            : ts_bccc_2.co_error("Error: unsupported type for unary operator (!)!");
    });
};
exports.length = function (a) {
    return a.then(function (a_t) {
        return type_equals(a_t.type, exports.string_type) ?
            ts_bccc_2.co_unit(mk_typing(exports.int_type, Sem.string_length(a_t.sem)))
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
// Debugger statements
exports.breakpoint = function (r) {
    return ts_bccc_2.co_unit(mk_typing(exports.unit_type, Sem.dbg(r)(Sem.unt)));
};
exports.highlight = ts_bccc_1.fun(function (x) { return (__assign({}, x.snd, { highlighting: x.fst })); });
exports.set_highlighting = function (r) {
    return ts_bccc_2.mk_coroutine(ts_bccc_1.constant(r).times(ts_bccc_1.id()).then(exports.highlight).then(ts_bccc_1.constant(mk_typing(exports.unit_type, Sem.done)).times(ts_bccc_1.id())).then(Co.value().then(Co.result().then(Co.no_error()))));
};
exports.typechecker_breakpoint = function (range) {
    return exports.semicolon(exports.set_highlighting(range), Co.suspend().then(function (_) { return ts_bccc_2.co_unit(mk_typing(exports.unit_type, Sem.done)); }));
};
// Control flow statements
exports.done = ts_bccc_2.co_unit(mk_typing(exports.unit_type, Sem.done));
exports.if_then_else = function (c, t, e) {
    return c.then(function (c_t) {
        return c_t.type.kind != "bool" ? ts_bccc_2.co_error("Error: condition has the wrong type!") :
            t.then(function (t_t) {
                return e.then(function (e_t) {
                    return type_equals(t_t.type, exports.unit_type) && type_equals(e_t.type, exports.unit_type) ?
                        ts_bccc_2.co_unit(mk_typing(t_t.type, Sem.if_then_else(c_t.sem, t_t.sem, e_t.sem)))
                        : ts_bccc_2.co_error("Error: the branches of a conditional should be of type unit!");
                });
            });
    });
};
exports.while_do = function (c, b) {
    return c.then(function (c_t) {
        return c_t.type.kind != "bool" ? ts_bccc_2.co_error("Error: condition has the wrong type!") :
            b.then(function (t_t) {
                return type_equals(t_t.type, exports.unit_type) ?
                    ts_bccc_2.co_unit(mk_typing(t_t.type, Sem.while_do(c_t.sem, t_t.sem)))
                    : ts_bccc_2.co_error("Error: the body of a loop should be of type unit, instead it has type " + JSON.stringify(t_t.type));
            });
    });
};
exports.semicolon = function (p, q) {
    return p.then(function (p_t) {
        return q.then(function (q_t) {
            return ts_bccc_2.co_unit(mk_typing(q_t.type, p_t.sem.then(function (_) { return q_t.sem; })));
        });
    });
};
exports.mk_lambda = function (body, parameters, closure_parameters) {
    var set_bindings = parameters.reduce(function (acc, par) { return exports.semicolon(exports.decl_v(par.name, par.type), acc); }, closure_parameters.reduce(function (acc, cp) { return exports.semicolon(exports.get_v(cp).then(function (cp_t) { return exports.decl_v(cp, cp_t.type); }), acc); }, exports.done));
    return Co.co_get_state().then(function (initial_bindings) {
        return set_bindings.then(function (_) {
            return body.then(function (body_t) {
                return Co.co_set_state(initial_bindings).then(function (_) {
                    return ts_bccc_2.co_unit(mk_typing(exports.fun_type(exports.tuple_type(parameters.map(function (p) { return p.type; })), body_t.type), Sem.mk_lambda(body_t.sem, parameters.map(function (p) { return p.name; }), closure_parameters)));
                });
            });
        });
    });
};
var def_fun = function (n, body, parameters, closure_parameters) {
    // let f = mk_lambda(body, parameters, closure_parameters).then(l_t => set_v(n, l_t))
    return undefined;
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
                        ts_bccc_2.co_unit(mk_typing(lambda_t.type.out, Sem.call_lambda_expr(lambda_t.sem, args_t.toArray().map(function (arg_t) { return arg_t.sem; }))));
            })
            : ts_bccc_2.co_error("Error: cannot invoke non-lambda expression of type " + JSON.stringify(lambda_t.type));
    });
};
