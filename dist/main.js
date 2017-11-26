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
var CCC = require("ts-bccc");
var ts_bccc_2 = require("ts-bccc");
var ts_bccc_3 = require("ts-bccc");
var Co = require("ts-bccc");
var ImpLanguageWithSuspend;
(function (ImpLanguageWithSuspend) {
    var mk_state_fun = function () { return ts_bccc_1.fun(ts_bccc_2.mk_state); };
    var False = ts_bccc_1.unit().then(ts_bccc_1.inl());
    var True = ts_bccc_1.unit().then(ts_bccc_1.inr());
    var bool_to_boolcat = ts_bccc_1.fun(function (b) { return b ? True : False; });
    var init_array_val = function (len) { return ({ elements: Immutable.Map(Immutable.Range(0, len).map(function (i) { return [i, unt]; })), length: len }); };
    var empty_scope = Immutable.Map();
    var unt = ({ v: ts_bccc_1.apply(ts_bccc_1.unit(), {}), k: "u" });
    var str = function (v) { return ({ v: v, k: "s" }); };
    var int = function (v) { return ({ v: v, k: "n" }); };
    var arr = function (v) { return ({ v: v, k: "arr" }); };
    var bool = function (v) { return ({ v: v, k: "b" }); };
    var lambda = function (l) { return ({ v: l, k: "lambda" }); };
    var obj = function (o) { return ({ v: o, k: "obj" }); };
    var ref = function (r) { return ({ v: r, k: "ref" }); };
    var unit_expr = function () { return (ts_bccc_3.co_unit(unt)); };
    var str_expr = function (s) { return (ts_bccc_3.co_unit(str(s))); };
    var int_expr = function (n) { return (ts_bccc_3.co_unit(int(n))); };
    var arr_expr = function (a) { return (ts_bccc_3.co_unit(arr(a))); };
    var lambda_expr = function (l) { return (ts_bccc_3.co_unit(lambda(l))); };
    var obj_expr = function (o) { return (ts_bccc_3.co_unit(obj(o))); };
    var ref_expr = function (r) { return (ts_bccc_3.co_unit(ref(r))); };
    var val_expr = function (v) { return (ts_bccc_3.co_unit(v)); };
    var load = ts_bccc_1.fun(function (x) {
        return !x.snd.stack.isEmpty() && x.snd.stack.get(x.snd.stack.count() - 1).has(x.fst) ?
            x.snd.stack.get(x.snd.stack.count() - 1).get(x.fst)
            :
                x.snd.globals.get(x.fst);
    });
    var store = ts_bccc_1.fun(function (x) {
        return !x.snd.stack.isEmpty() ?
            (__assign({}, x.snd, { stack: x.snd.stack.set(x.snd.stack.count() - 1, x.snd.stack.get(x.snd.stack.count() - 1).set(x.fst.fst, x.fst.snd)) }))
            :
                (__assign({}, x.snd, { globals: x.snd.globals.set(x.fst.fst, x.fst.snd) }));
    });
    var load_class_def = ts_bccc_1.fun(function (x) { return x.snd.classes.get(x.fst); });
    var store_class_def = ts_bccc_1.fun(function (x) { return (__assign({}, x.snd, { classes: x.snd.classes.set(x.fst.fst, x.fst.snd) })); });
    var load_fun_def = ts_bccc_1.fun(function (x) { return x.snd.functions.get(x.fst); });
    var store_fun_def = ts_bccc_1.fun(function (x) { return (__assign({}, x.snd, { functions: x.snd.functions.set(x.fst.fst, x.fst.snd) })); });
    var load_heap = ts_bccc_1.fun(function (x) { return x.snd.heap.get(x.fst); });
    var store_heap = ts_bccc_1.fun(function (x) { return (__assign({}, x.snd, { heap: x.snd.heap.set(x.fst.fst, x.fst.snd) })); });
    var heap_alloc = ts_bccc_1.fun(function (x) {
        var new_ref = "ref_" + x.snd.heap.count();
        return ({ fst: ref(new_ref), snd: __assign({}, x.snd, { heap: x.snd.heap.set(new_ref, x.fst) }) });
    });
    var push_scope = ts_bccc_1.fun(function (x) { return (__assign({}, x, { stack: x.stack.set(x.stack.count(), empty_scope) })); });
    var pop_scope = ts_bccc_1.fun(function (x) { return (__assign({}, x, { stack: x.stack.remove(x.stack.count() - 1) })); });
    var empty_memory = { globals: empty_scope, heap: empty_scope, functions: Immutable.Map(), classes: Immutable.Map(), stack: Immutable.Map() };
    var done = ts_bccc_1.apply(ts_bccc_1.fun(ts_bccc_3.co_unit), {});
    var runtime_error = function (e) { return ts_bccc_3.co_error(e); };
    var dbg = Co.suspend();
    var set_v_expr = function (v, e) {
        return e.then(function (e_val) { return set_v(v, e_val); });
    };
    var set_v = function (v, val) {
        var store_co = store.then(ts_bccc_1.unit().times(ts_bccc_1.id()).then(Co.value().then(Co.result().then(Co.no_error()))));
        var f = ((ts_bccc_1.constant(v).times(ts_bccc_1.constant(val))).times(ts_bccc_1.id())).then(store_co);
        return ts_bccc_3.mk_coroutine(f);
    };
    var get_v = function (v) {
        var f = (ts_bccc_1.constant(v).times(ts_bccc_1.id()).then(load)).times(ts_bccc_1.id());
        return (ts_bccc_3.mk_coroutine(Co.no_error().after(Co.result().after(Co.value().after(f)))));
    };
    var new_obj = function () {
        var heap_alloc_co = ts_bccc_3.mk_coroutine(ts_bccc_1.constant(obj(empty_scope)).times(ts_bccc_1.id()).then(heap_alloc).then(Co.value().then(Co.result().then(Co.no_error()))));
        return (heap_alloc_co);
    };
    var new_arr = function (len) {
        var heap_alloc_co = ts_bccc_3.mk_coroutine(ts_bccc_1.constant(arr(init_array_val(len))).times(ts_bccc_1.id()).then(heap_alloc).then(Co.value().then(Co.result().then(Co.no_error()))));
        return (heap_alloc_co);
    };
    var get_arr_len = function (a_ref) {
        return a_ref.k != "ref" ? runtime_error("Cannot lookup element on " + a_ref.v + " as it is not an array reference.") :
            get_heap_v(a_ref.v).then(function (a_val) {
                return a_val.k != "arr" ? runtime_error("Cannot lookup element on " + a_val.v + " as it is not an array.") :
                    ts_bccc_3.co_unit(int(a_val.v.length));
            });
    };
    var get_arr_el = function (a_ref, i) {
        return a_ref.k != "ref" ? runtime_error("Cannot lookup element on " + a_ref.v + " as it is not an array reference.") :
            get_heap_v(a_ref.v).then(function (a_val) {
                return a_val.k != "arr" ? runtime_error("Cannot lookup element on " + a_val.v + " as it is not an array.") :
                    !a_val.v.elements.has(i) ? runtime_error("Cannot find element " + i + " on " + a_val.v + ".") :
                        ts_bccc_3.co_unit(a_val.v.elements.get(i));
            });
    };
    var set_arr_el = function (a_ref, i, v) {
        return a_ref.k != "ref" ? runtime_error("Cannot lookup element on " + a_ref.v + " as it is not an array reference.") :
            get_heap_v(a_ref.v).then(function (a_val) {
                return a_val.k != "arr" ? runtime_error("Cannot lookup element on " + a_val.v + " as it is not an array.") :
                    set_heap_v(a_ref.v, __assign({}, a_val, { v: __assign({}, a_val.v, { length: Math.max(i + 1, a_val.v.length), elements: a_val.v.elements.set(i, v) }) }));
            });
    };
    var set_arr_el_expr = function (a_ref, i, e) {
        return e.then(function (e_val) { return set_arr_el(a_ref, i, e_val); });
    };
    var set_heap_v = function (v, val) {
        var store_co = store_heap.then(ts_bccc_1.unit().times(ts_bccc_1.id()).then(Co.value().then(Co.result().then(Co.no_error()))));
        var f = ((ts_bccc_1.constant(v).times(ts_bccc_1.constant(val))).times(ts_bccc_1.id())).then(store_co);
        return ts_bccc_3.mk_coroutine(f);
    };
    var get_heap_v = function (v) {
        var f = (ts_bccc_1.constant(v).times(ts_bccc_1.id()).then(load_heap)).times(ts_bccc_1.id());
        return (ts_bccc_3.mk_coroutine(Co.no_error().after(Co.result().after(Co.value().after(f)))));
    };
    var set_class_def = function (v, int) {
        var store_co = store_class_def.then(ts_bccc_1.unit().times(ts_bccc_1.id()).then(Co.value().then(Co.result().then(Co.no_error()))));
        var f = ((ts_bccc_1.constant(v).times(ts_bccc_1.constant(int))).times(ts_bccc_1.id())).then(store_co);
        return ts_bccc_3.mk_coroutine(f);
    };
    var get_class_def = function (v) {
        var f = (ts_bccc_1.constant(v).times(ts_bccc_1.id()).then(load_class_def)).times(ts_bccc_1.id());
        return ts_bccc_3.mk_coroutine(Co.no_error().after(Co.result().after(Co.value().after(f))));
    };
    var set_fun_def = function (v, l) {
        var store_co = store_fun_def.then(ts_bccc_1.unit().times(ts_bccc_1.id()).then(Co.value().then(Co.result().then(Co.no_error()))));
        var f = ((ts_bccc_1.constant(v).times(ts_bccc_1.constant(l))).times(ts_bccc_1.id())).then(store_co);
        return ts_bccc_3.mk_coroutine(f);
    };
    var get_fun_def = function (v) {
        var f = (ts_bccc_1.constant(v).times(ts_bccc_1.id()).then(load_fun_def)).times(ts_bccc_1.id());
        return ts_bccc_3.mk_coroutine(Co.no_error().after(Co.result().after(Co.value().after(f))));
    };
    var if_then_else = function (f, g) {
        return bool_to_boolcat.times(ts_bccc_1.unit()).then(ts_bccc_1.apply_pair()).then(g.plus(f));
    };
    var while_do = function (p, k) {
        var h = if_then_else(ts_bccc_1.fun(function (_) { return k.then(function (_) { return while_do(p, k); }); }), ts_bccc_1.fun(function (_) { return done; }));
        return p.then(ts_bccc_1.defun(h));
    };
    var def_fun = function (n, body, args) {
        return set_fun_def(n, ts_bccc_1.apply(ts_bccc_1.constant(body).times(ts_bccc_1.constant(args)), {}));
    };
    var call_by_name = function (f_n, args) {
        return get_fun_def(f_n).then(function (f) { return call_lambda(f, args); });
    };
    var call_lambda = function (lambda, arg_values) {
        var body = lambda.fst;
        var arg_names = lambda.snd;
        // let arg_values = args.map(a => a.snd)
        var actual_args = arg_names.map(function (n, i) { return ({ fst: n, snd: arg_values[i] }); });
        var set_args = actual_args.reduce(function (sets, arg_expr) {
            return set_v_expr(arg_expr.fst, arg_expr.snd).then(function (_) { return sets; });
        }, done);
        var init = ts_bccc_3.mk_coroutine(push_scope.then(ts_bccc_1.unit().times(ts_bccc_1.id())).then(Co.value().then(Co.result().then(Co.no_error()))));
        var cleanup = ts_bccc_3.mk_coroutine(pop_scope.then(ts_bccc_1.unit().times(ts_bccc_1.id())).then(Co.value().then(Co.result().then(Co.no_error()))));
        return init.then(function (_) {
            return set_args.then(function (_) {
                return body.then(function (res) {
                    return cleanup.then(function (_) {
                        return ts_bccc_3.co_unit(res);
                    });
                });
            });
        });
    };
    var declare_class = function (C_name, int) {
        return set_class_def(C_name, int);
    };
    var field_get = function (F_name, this_addr) {
        return get_heap_v(this_addr.v).then(function (this_val) {
            if (this_val.k != "obj")
                return runtime_error("runtime type error: this is not a reference when looking " + F_name + " up.");
            return val_expr(this_val.v.get(F_name));
        });
    };
    var field_set = function (F_name, new_val_expr, this_addr) {
        return new_val_expr.then(function (new_val) {
            return get_heap_v(this_addr.v).then(function (this_val) {
                if (this_val.k != "obj")
                    return runtime_error("runtime type error: this is not a reference when looking " + F_name + " up.");
                var new_this_val = __assign({}, this_val, { v: this_val.v.set(F_name, new_val) });
                return set_heap_v(this_addr.v, new_this_val).then(function (_) { return done; });
            });
        });
    };
    var resolve_method = function (M_name, C_def) {
        return C_def.methods.has(M_name) ? ts_bccc_1.apply(ts_bccc_1.inl(), C_def.methods.get(M_name))
            : ts_bccc_1.apply(ts_bccc_1.fun(function (int) { return resolve_method(M_name, int); }).plus(ts_bccc_1.inr()), C_def.base);
    };
    var call_method = function (M_name, this_addr, args) {
        return this_addr.k != "ref" ? runtime_error("runtime type error: this is not a reference when calling " + M_name + ".") :
            get_heap_v(this_addr.v).then(function (this_val) {
                if (this_val.k != "obj")
                    return runtime_error("runtime type error: this is not an object when calling " + M_name + ".");
                var this_class = this_val.v.get("class");
                if (this_class.k != "s")
                    return runtime_error("runtime type error: this.class is not a string.");
                return get_class_def(this_class.v).then(function (C_def) {
                    var f = ts_bccc_1.fun(function (m) { return call_lambda(m, args.concat([val_expr(this_addr)])); }).plus(ts_bccc_1.constant(unit_expr()));
                    return ts_bccc_1.apply(f, resolve_method(M_name, C_def));
                });
            });
    };
    var call_cons = function (C_name, args) {
        return get_class_def(C_name).then(function (C_def) {
            return new_obj().then(function (this_addr) {
                return this_addr.k != "ref" ? runtime_error("this is not a reference when calling " + C_name + "::cons") :
                    field_set("class", str_expr(C_name), this_addr).then(function (_) {
                        return call_lambda(C_def.methods.get("constructor"), args.concat([val_expr(this_addr)])).then(function (_) {
                            return ts_bccc_3.co_unit(this_addr);
                        });
                    });
            });
        });
    };
    var run_to_end = function () {
        var f = CCC.fun(function (p) { return run_to_end().f(p); });
        return (ts_bccc_3.co_run().map_times(ts_bccc_1.fun(function (s) { return console.log("Intermediate step:", JSON.stringify(s)) ||
            s; }))).then(CCC.apply_pair()).then(CCC.inl().plus(f.plus(CCC.inr())));
    };
    ImpLanguageWithSuspend.test_imp = function () {
        var loop_test = set_v("s", str("")).then(function (_) {
            return set_v("n", int(1000)).then(function (_) {
                return while_do(get_v("n").then(function (n) { return ts_bccc_3.co_unit(n.v > 0); }), get_v("n").then(function (n) { return n.k == "n" ? set_v("n", int(n.v - 1)) : runtime_error(n.v + " is not a number"); }).then(function (_) {
                    return get_v("s").then(function (s) { return s.k == "s" ? set_v("s", str(s.v + "*")) : runtime_error(s.v + " is not a string"); }).then(function (_) {
                        return get_v("n").then(function (n) { return n.k == "n" && n.v % 5 == 0 ? dbg : runtime_error(n.v + " is not a number"); });
                    });
                }));
            });
        });
        var arr_test = new_arr(10).then(function (a_ref) {
            return set_v("a", a_ref).then(function (_) {
                return set_v("i", int(0)).then(function (_) {
                    return get_arr_len(a_ref).then(function (a_len) { return a_len.k != "n" ? runtime_error(a_len.v + " is not a number") :
                        while_do(get_v("i").then(function (i_val) { return ts_bccc_3.co_unit(i_val.v < a_len.v); }), get_v("i").then(function (i_val) { return i_val.k != "n" ? runtime_error(i_val.v + " is not a number") :
                            set_arr_el(a_ref, i_val.v, int(i_val.v * 2)).then(function (_) {
                                return set_v("i", int(i_val.v + 1)).then(function (_) {
                                    return dbg;
                                });
                            }); })); });
                });
            });
        });
        var lambda_test = set_v("n", int(10)).then(function (_) {
            return call_lambda({ fst: dbg.then(function (_) { return int_expr(1); }), snd: ["n"] }, [int_expr(5)]).then(function (res) {
                return dbg;
            });
        });
        var fun_test = def_fun("f", dbg.then(function (_) { return int_expr(1); }), []).then(function (_) {
            return def_fun("g", dbg.then(function (_) { return int_expr(2); }), []).then(function (_) {
                return call_by_name("g", []).then(function (v) {
                    return dbg.then(function (_) {
                        return set_v("n", v);
                    });
                });
            });
        });
        var vector2 = {
            base: ts_bccc_1.apply(ts_bccc_1.inl(), {
                base: ts_bccc_1.apply(ts_bccc_1.inr(), {}),
                methods: Immutable.Map([
                    ["to_string",
                        { fst: get_v("this").then(function (this_addr) {
                                return this_addr.k != "ref" ? runtime_error("\"this\" is not a reference when calling to_string") :
                                    field_get("x", this_addr).then(function (x_val) {
                                        return x_val.k != "n" ? runtime_error(x_val.v + " is not a number") :
                                            field_get("y", this_addr).then(function (y_val) {
                                                return y_val.k != "n" ? runtime_error(y_val.v + " is not a number") :
                                                    str_expr("(" + x_val.v + ", " + y_val.v + ")");
                                            });
                                    });
                            }),
                            snd: ["this"] }]
                ])
            }),
            methods: Immutable.Map([
                ["scale",
                    { fst: get_v("this").then(function (this_addr) {
                            return get_v("k").then(function (k_val) {
                                return this_addr.k != "ref" || k_val.k != "n" ? runtime_error("runtime type error") :
                                    field_get("x", this_addr).then(function (x_val) {
                                        return x_val.k != "n" ? runtime_error("runtime type error") :
                                            field_get("y", this_addr).then(function (y_val) {
                                                return y_val.k != "n" ? runtime_error("runtime type error") :
                                                    dbg.then(function (_) {
                                                        return field_set("x", val_expr(int(x_val.v * k_val.v)), this_addr).then(function (_) {
                                                            return dbg.then(function (_) {
                                                                return field_set("y", val_expr(int(y_val.v * k_val.v)), this_addr).then(function (_) {
                                                                    return dbg.then(function (_) {
                                                                        return unit_expr();
                                                                    });
                                                                });
                                                            });
                                                        });
                                                    });
                                            });
                                    });
                            });
                        }),
                        snd: ["k", "this"] }],
                ["constructor",
                    { fst: get_v("this").then(function (this_addr) {
                            return this_addr.k != "ref" ? runtime_error("runtime type error") :
                                get_v("x").then(function (x_val) {
                                    return x_val.k != "n" ? runtime_error("runtime type error") :
                                        get_v("y").then(function (y_val) {
                                            return y_val.k != "n" ? runtime_error("runtime type error") :
                                                field_set("x", val_expr(x_val), this_addr).then(function (_) {
                                                    return field_set("y", val_expr(y_val), this_addr).then(function (_) {
                                                        return unit_expr();
                                                    });
                                                });
                                        });
                                });
                        }),
                        snd: ["x", "y", "this"] }]
            ])
        };
        var class_test = declare_class("Vector2", vector2).then(function (_) {
            return call_cons("Vector2", [int_expr(10), int_expr(20)]).then(function (v2) {
                return set_v("v2", v2).then(function (_) {
                    return call_method("scale", v2, [int_expr(2)]).then(function (_) {
                        return call_method("to_string", v2, []).then(function (v2_s) {
                            return set_v("v2_s", v2_s).then(function (_) {
                                return done;
                            });
                        });
                    });
                });
            });
        });
        var hrstart = process.hrtime();
        var p = arr_test;
        var res = ts_bccc_1.apply((ts_bccc_1.constant(p).times(ts_bccc_1.constant(empty_memory))).then(run_to_end()), {});
        var hrdiff = process.hrtime(hrstart);
        var time_in_ns = hrdiff[0] * 1e9 + hrdiff[1];
        console.log("Timer: " + time_in_ns / 1000000 + "ms\n Result: ", JSON.stringify(res));
    };
})(ImpLanguageWithSuspend || (ImpLanguageWithSuspend = {}));
ImpLanguageWithSuspend.test_imp();
// let incr = CCC.fun<number,number>(x => x + 1)
// let double = CCC.fun<number,number>(x => x * 2)
// console.log(CCC.apply(incr.then(double), 5))
// console.log(CCC.apply(incr.map_times(double), CCC.mk_pair<number,number>(5)(2)))
// console.log(CCC.apply(incr.map_plus(double), CCC.inl<number,number>().f(5)))
// console.log(CCC.apply(incr.plus(double), CCC.inr<number,number>().f(4)))
