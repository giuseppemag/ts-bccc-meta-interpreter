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
    var empty_scope = Immutable.Map();
    var unt = ({ v: ts_bccc_1.apply(ts_bccc_1.unit(), {}), k: "u" });
    var str = function (v) { return ({ v: v, k: "s" }); };
    var int = function (v) { return ({ v: v, k: "n" }); };
    var bool = function (v) { return ({ v: v, k: "b" }); };
    var lambda = function (l) { return ({ v: l, k: "lambda" }); };
    var obj = function (o) { return ({ v: o, k: "obj" }); };
    var ref = function (r) { return ({ v: r, k: "ref" }); };
    var unit_expr = function () { return mk_expr(ts_bccc_3.co_unit(unt)); };
    var str_expr = function (s) { return mk_expr(ts_bccc_3.co_unit(str(s))); };
    var int_expr = function (n) { return mk_expr(ts_bccc_3.co_unit(int(n))); };
    var lambda_expr = function (l) { return mk_expr(ts_bccc_3.co_unit(lambda(l))); };
    var obj_expr = function (o) { return mk_expr(ts_bccc_3.co_unit(obj(o))); };
    var ref_expr = function (r) { return mk_expr(ts_bccc_3.co_unit(ref(r))); };
    var val_expr = function (v) { return mk_expr(ts_bccc_3.co_unit(v)); };
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
    var load_heap = ts_bccc_1.fun(function (x) { return x.snd.heap.get(x.fst); });
    var store_heap = ts_bccc_1.fun(function (x) { return (__assign({}, x.snd, { heap: x.snd.heap.set(x.fst.fst, x.fst.snd) })); });
    var heap_alloc = ts_bccc_1.fun(function (x) {
        var new_ref = "ref_" + x.heap.count();
        return ({ fst: ref(new_ref), snd: __assign({}, x, { heap: x.heap.set(new_ref, obj(empty_scope)) }) });
    });
    var push_scope = ts_bccc_1.fun(function (x) { return (__assign({}, x, { stack: x.stack.set(x.stack.count(), empty_scope) })); });
    var pop_scope = ts_bccc_1.fun(function (x) { return (__assign({}, x, { stack: x.stack.remove(x.stack.count() - 1) })); });
    var mk_expr = function (s) {
        return __assign({}, s, { semicolon: function (k) { return mk_stmt(this.then(function (_) { return k; })); }, as_coroutine: function () { return this; } });
    };
    var mk_stmt = mk_expr;
    var empty_memory = { globals: empty_scope, heap: empty_scope, classes: Immutable.Map(), stack: Immutable.Map() };
    var done = mk_stmt(ts_bccc_1.apply(ts_bccc_1.fun(ts_bccc_3.co_unit), {}));
    var dbg = mk_stmt(Co.suspend());
    var set_v = function (v, val) {
        var store_co = store.then(ts_bccc_1.unit().times(ts_bccc_1.id()).then(Co.value().then(Co.result().then(Co.no_error()))));
        var f = ((ts_bccc_1.constant(v).times(ts_bccc_1.constant(val))).times(ts_bccc_1.id())).then(store_co);
        return mk_stmt(ts_bccc_3.mk_coroutine(f));
    };
    var get_v = function (v) {
        var f = (ts_bccc_1.constant(v).times(ts_bccc_1.id()).then(load)).times(ts_bccc_1.id());
        return mk_expr(ts_bccc_3.mk_coroutine(Co.no_error().after(Co.result().after(Co.value().after(f)))));
    };
    var new_v = function () {
        var heap_alloc_co = ts_bccc_3.mk_coroutine(heap_alloc.then(Co.value().then(Co.result().then(Co.no_error()))));
        return mk_expr(heap_alloc_co);
    };
    var set_heap_v = function (v, val) {
        var store_co = store_heap.then(ts_bccc_1.unit().times(ts_bccc_1.id()).then(Co.value().then(Co.result().then(Co.no_error()))));
        var f = ((ts_bccc_1.constant(v).times(ts_bccc_1.constant(val))).times(ts_bccc_1.id())).then(store_co);
        return mk_stmt(ts_bccc_3.mk_coroutine(f));
    };
    var get_heap_v = function (v) {
        var f = (ts_bccc_1.constant(v).times(ts_bccc_1.id()).then(load_heap)).times(ts_bccc_1.id());
        return mk_expr(ts_bccc_3.mk_coroutine(Co.no_error().after(Co.result().after(Co.value().after(f)))));
    };
    var set_class_def = function (v, int) {
        var store_co = store_class_def.then(ts_bccc_1.unit().times(ts_bccc_1.id()).then(Co.value().then(Co.result().then(Co.no_error()))));
        var f = ((ts_bccc_1.constant(v).times(ts_bccc_1.constant(int))).times(ts_bccc_1.id())).then(store_co);
        return mk_stmt(ts_bccc_3.mk_coroutine(f));
    };
    var get_class_def = function (v) {
        var f = (ts_bccc_1.constant(v).times(ts_bccc_1.id()).then(load_class_def)).times(ts_bccc_1.id());
        return mk_expr(ts_bccc_3.mk_coroutine(Co.no_error().after(Co.result().after(Co.value().after(f)))));
    };
    var if_then_else = function (f, g) {
        return bool_to_boolcat.times(ts_bccc_1.unit()).then(ts_bccc_1.apply_pair()).then(g.plus(f));
    };
    var while_do = function (p, k) {
        var h = if_then_else(ts_bccc_1.fun(function (_) { return k.semicolon(while_do(p, k)); }), ts_bccc_1.fun(function (_) { return done; }));
        return mk_stmt(p.then(ts_bccc_1.defun(h)));
    };
    var def_fun = function (n, body, args) {
        return set_v(n, ts_bccc_1.apply(ts_bccc_1.constant(body).times(ts_bccc_1.constant(args)).then(ts_bccc_1.fun(lambda)), {}));
    };
    var call_by_name = function (f_n, args) {
        return mk_expr(get_v(f_n).then(function (f) { return f.k == "lambda" ? call_lambda(f.v, args) : unit_expr(); }));
    };
    var call_lambda = function (lambda, arg_values) {
        var body = lambda.fst;
        var arg_names = lambda.snd;
        // let arg_values = args.map(a => a.snd)
        var actual_args = arg_names.map(function (n, i) { return ({ fst: n, snd: arg_values[i] }); });
        var set_args = actual_args.reduce(function (sets, arg_expr) {
            return mk_stmt(arg_expr.snd.then(function (arg_v) { return set_v(arg_expr.fst, arg_v).as_coroutine(); })).semicolon(sets);
        }, done);
        var init = mk_stmt(ts_bccc_3.mk_coroutine(push_scope.then(ts_bccc_1.unit().times(ts_bccc_1.id())).then(Co.value().then(Co.result().then(Co.no_error())))));
        var cleanup = ts_bccc_3.mk_coroutine(pop_scope.then(ts_bccc_1.unit().times(ts_bccc_1.id())).then(Co.value().then(Co.result().then(Co.no_error()))));
        return mk_expr(init.then(function (_) {
            return set_args.then(function (_) {
                return body.then(function (res) {
                    return cleanup.then(function (_) {
                        return ts_bccc_3.co_unit(res);
                    });
                });
            });
        }));
    };
    var declare_class = function (C_name, int) {
        return set_class_def(C_name, int);
    };
    var field_get = function (F_name, this_addr) {
        return mk_expr(get_heap_v(this_addr.v).then(function (this_val) {
            if (this_val.k != "obj")
                return unit_expr();
            return val_expr(this_val.v.get(F_name));
        }));
    };
    var field_set = function (F_name, new_val_expr, this_addr) {
        return mk_stmt(new_val_expr.then(function (new_val) {
            return get_heap_v(this_addr.v).then(function (this_val) {
                if (this_val.k != "obj")
                    return done;
                var new_this_val = __assign({}, this_val, { v: this_val.v.set(F_name, new_val) });
                return set_heap_v(this_addr.v, new_this_val).semicolon(done);
            });
        }));
    };
    var call_method = function (M_name, this_addr, args) {
        return this_addr.k != "ref" ? unit_expr() : mk_expr(get_heap_v(this_addr.v).then(function (this_val) {
            if (this_val.k != "obj")
                return unit_expr();
            var this_class = this_val.v.get("class");
            if (this_class.k != "s")
                return unit_expr();
            return get_class_def(this_class.v).then(function (C_def) {
                return call_lambda(C_def.get(M_name), args.concat([val_expr(this_addr)]));
            });
        }));
    };
    var call_cons = function (C_name, args) {
        return mk_expr(get_class_def(C_name).then(function (C_def) {
            return new_v().then(function (this_addr) {
                return this_addr.k != "ref" ? unit_expr() :
                    mk_expr(field_set("class", str_expr(C_name), this_addr).then(function (_) {
                        return mk_expr(call_lambda(C_def.get("constructor"), args.concat([val_expr(this_addr)])).then(function (_) {
                            return mk_expr(ts_bccc_3.co_unit(this_addr));
                        }));
                    }));
            });
        }));
    };
    var run_to_end = function () {
        var f = CCC.fun(function (p) { return run_to_end().f(p); });
        return (ts_bccc_3.co_run().map_times(ts_bccc_1.fun(function (s) { return console.log("Intermediate step:", JSON.stringify(s)) ||
            s; }))).then(CCC.apply_pair()).then(CCC.inl().plus(f.plus(CCC.inr())));
    };
    ImpLanguageWithSuspend.test_imp = function () {
        var loop_test = set_v("s", str("")).semicolon(set_v("n", int(1000)).semicolon(while_do(mk_expr(get_v("n").then(function (n) { return ts_bccc_3.co_unit(n.v > 0); })), mk_stmt(get_v("n").then(function (n) { return n.k == "n" ? set_v("n", int(n.v - 1)) : done; })).semicolon(mk_stmt(get_v("s").then(function (s) { return s.k == "s" ? set_v("s", str(s.v + "*")) : done; })).semicolon(mk_stmt(get_v("n").then(function (n) { return n.k == "n" && n.v % 5 == 0 ? dbg : done; })))))));
        var lambda_test = set_v("n", int(10)).semicolon(mk_stmt(call_lambda({ fst: mk_expr(dbg.then(function (_) { return int_expr(1); })), snd: ["n"] }, [int_expr(5)]).then(function (res) {
            return dbg;
        })));
        var fun_test = def_fun("f", mk_expr(dbg.then(function (_) { return int_expr(1); })), []).semicolon(def_fun("g", mk_expr(dbg.then(function (_) { return int_expr(2); })), []).semicolon(mk_stmt(call_by_name("g", []).then(function (v) {
            return dbg.semicolon(set_v("n", v));
        }))));
        var vector2 = Immutable.Map([
            ["scale",
                { fst: mk_expr(get_v("this").then(function (this_addr) {
                        return get_v("k").then(function (k_val) {
                            return this_addr.k != "ref" || k_val.k != "n" ? unit_expr() :
                                field_get("x", this_addr).then(function (x_val) {
                                    return x_val.k != "n" ? unit_expr() :
                                        field_get("y", this_addr).then(function (y_val) {
                                            return y_val.k != "n" ? unit_expr() :
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
                    })),
                    snd: ["k", "this"] }],
            ["constructor",
                { fst: mk_expr(get_v("this").then(function (this_addr) {
                        return this_addr.k != "ref" ? unit_expr() :
                            get_v("x").then(function (x_val) {
                                return x_val.k != "n" ? unit_expr() :
                                    get_v("y").then(function (y_val) {
                                        return y_val.k != "n" ? unit_expr() :
                                            field_set("x", val_expr(x_val), this_addr).then(function (_) {
                                                return field_set("y", val_expr(y_val), this_addr).then(function (_) {
                                                    return unit_expr();
                                                });
                                            });
                                    });
                            });
                    })),
                    snd: ["x", "y", "this"] }]
        ]);
        var class_test = mk_stmt(declare_class("Vector2", vector2).then(function (_) {
            return mk_expr(call_cons("Vector2", [int_expr(10), int_expr(20)]).then(function (v2) {
                return set_v("v2", v2).then(function (_) {
                    return call_method("scale", v2, [int_expr(2)]).semicolon(done);
                });
            }));
        }));
        var hrstart = process.hrtime();
        var p = class_test;
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
