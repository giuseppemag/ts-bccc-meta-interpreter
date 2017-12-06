"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Immutable = require("immutable");
var ts_bccc_1 = require("ts-bccc");
var CCC = require("ts-bccc");
var ts_bccc_2 = require("ts-bccc");
var memory_1 = require("./Python/memory");
var expressions_1 = require("./Python/expressions");
var basic_statements_1 = require("./Python/basic_statements");
var functions_1 = require("./Python/functions");
var classes_1 = require("./Python/classes");
var source_range_1 = require("./source_range");
var ImpLanguageWithSuspend;
(function (ImpLanguageWithSuspend) {
    var run_to_end = function () {
        var f = CCC.fun(function (p) { return run_to_end().f(p); });
        return (ts_bccc_2.co_run().map_times(ts_bccc_1.fun(function (s) { return console.log("Intermediate step:", JSON.stringify(s)) ||
            s; }))).then(CCC.apply_pair()).then(CCC.inl().plus(f.plus(CCC.inr())));
    };
    ImpLanguageWithSuspend.test_imp = function () {
        var loop_test = memory_1.set_v("b", memory_1.str("")).then(function (_) {
            return memory_1.set_v("i", memory_1.int(1000)).then(function (_) {
                return basic_statements_1.while_do(memory_1.get_v("i").then(function (n) { return expressions_1.bool_expr(n.v > 0); }), memory_1.get_v("i").then(function (n) { return n.k == "i" ? memory_1.set_v("i", memory_1.int(n.v - 1)) : memory_1.runtime_error(n.v + " is not a number"); }).then(function (_) {
                    return memory_1.get_v("b").then(function (s) { return s.k == "b" ? memory_1.set_v("b", memory_1.str(s.v + "*")) : memory_1.runtime_error(s.v + " is not a string"); }).then(function (_) {
                        return memory_1.get_v("i").then(function (n) { return n.k == "i" && n.v % 5 == 0 ? basic_statements_1.dbg(source_range_1.mk_range(6, 0, 7, 0))({}) : memory_1.runtime_error(n.v + " is not a number"); });
                    });
                }));
            });
        });
        var arr_test = memory_1.new_arr(10).then(function (a_ref) {
            return memory_1.set_v("a", a_ref).then(function (_) {
                return memory_1.set_v("i", memory_1.int(0)).then(function (_) {
                    return memory_1.get_arr_len(a_ref).then(function (a_len) { return a_len.k != "i" ? memory_1.runtime_error(a_len.v + " is not a number") :
                        basic_statements_1.while_do(memory_1.get_v("i").then(function (i_val) { return expressions_1.bool_expr(i_val.v < a_len.v); }), memory_1.get_v("i").then(function (i_val) { return i_val.k != "i" ? memory_1.runtime_error(i_val.v + " is not a number") :
                            memory_1.set_arr_el(a_ref, i_val.v, memory_1.int(i_val.v * 2)).then(function (_) {
                                return memory_1.set_v("i", memory_1.int(i_val.v + 1)).then(function (_) {
                                    return basic_statements_1.dbg(source_range_1.mk_range(9, 0, 10, 0))({});
                                });
                            }); })); });
                });
            });
        });
        var lambda_test = memory_1.set_v("i", memory_1.int(10)).then(function (_) {
            return functions_1.call_lambda({ fst: basic_statements_1.dbg(source_range_1.mk_range(6, 0, 7, 0))({}).then(function (_) { return expressions_1.int_expr(1); }), snd: ["i"] }, [expressions_1.int_expr(5)]).then(function (res) {
                return basic_statements_1.dbg(source_range_1.mk_range(6, 0, 7, 0))({});
            });
        });
        var fun_test = functions_1.def_fun("f", basic_statements_1.dbg(source_range_1.mk_range(1, 0, 2, 0))({}).then(function (_) { return functions_1.ret(expressions_1.int_expr(1)).then(basic_statements_1.dbg(source_range_1.mk_range(2, 0, 3, 0))); }), []).then(function (_) {
            return functions_1.def_fun("g", basic_statements_1.dbg(source_range_1.mk_range(3, 0, 4, 0))({}).then(function (_) { return functions_1.ret(expressions_1.int_expr(2)).then(basic_statements_1.dbg(source_range_1.mk_range(4, 0, 5, 0))); }), []).then(function (_) {
                return functions_1.call_by_name("g", []).then(function (v) {
                    return basic_statements_1.dbg(source_range_1.mk_range(6, 0, 7, 0))({}).then(function (_) {
                        return memory_1.set_v("i", v);
                    });
                });
            });
        });
        var vector2 = {
            base: ts_bccc_1.apply(ts_bccc_1.inl(), {
                base: ts_bccc_1.apply(ts_bccc_1.inr(), {}),
                methods: Immutable.Map([
                    ["to_string",
                        { fst: memory_1.get_v("this").then(function (this_addr) {
                                return this_addr.k != "ref" ? memory_1.runtime_error("\"this\" is not a reference when calling to_string") :
                                    classes_1.field_get("x", this_addr).then(function (x_val) {
                                        return x_val.k != "i" ? memory_1.runtime_error(x_val.v + " is not a number") :
                                            classes_1.field_get("y", this_addr).then(function (y_val) {
                                                return y_val.k != "i" ? memory_1.runtime_error(y_val.v + " is not a number") :
                                                    expressions_1.str_expr("(" + x_val.v + ", " + y_val.v + ")");
                                            });
                                    });
                            }),
                            snd: ["this"] }]
                ])
            }),
            methods: Immutable.Map([
                ["scale",
                    { fst: memory_1.get_v("this").then(function (this_addr) {
                            return memory_1.get_v("k").then(function (k_val) {
                                return this_addr.k != "ref" || k_val.k != "i" ? memory_1.runtime_error("runtime type error") :
                                    classes_1.field_get("x", this_addr).then(function (x_val) {
                                        return x_val.k != "i" ? memory_1.runtime_error("runtime type error") :
                                            classes_1.field_get("y", this_addr).then(function (y_val) {
                                                return y_val.k != "i" ? memory_1.runtime_error("runtime type error") :
                                                    basic_statements_1.dbg(source_range_1.mk_range(6, 0, 7, 0))({}).then(function (_) {
                                                        return classes_1.field_set("x", expressions_1.val_expr(memory_1.int(x_val.v * k_val.v)), this_addr).then(function (_) {
                                                            return basic_statements_1.dbg(source_range_1.mk_range(6, 0, 7, 0))({}).then(function (_) {
                                                                return classes_1.field_set("y", expressions_1.val_expr(memory_1.int(y_val.v * k_val.v)), this_addr).then(function (_) {
                                                                    return basic_statements_1.dbg(source_range_1.mk_range(6, 0, 7, 0))({}).then(function (_) {
                                                                        return expressions_1.unit_expr();
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
                    { fst: memory_1.get_v("this").then(function (this_addr) {
                            return this_addr.k != "ref" ? memory_1.runtime_error("runtime type error") :
                                memory_1.get_v("x").then(function (x_val) {
                                    return x_val.k != "i" ? memory_1.runtime_error("runtime type error") :
                                        memory_1.get_v("y").then(function (y_val) {
                                            return y_val.k != "i" ? memory_1.runtime_error("runtime type error") :
                                                classes_1.field_set("x", expressions_1.val_expr(x_val), this_addr).then(function (_) {
                                                    return classes_1.field_set("y", expressions_1.val_expr(y_val), this_addr).then(function (_) {
                                                        return expressions_1.unit_expr();
                                                    });
                                                });
                                        });
                                });
                        }),
                        snd: ["x", "y", "this"] }]
            ])
        };
        var class_test = classes_1.declare_class("Vector2", vector2).then(function (_) {
            return classes_1.call_cons("Vector2", [expressions_1.int_expr(10), expressions_1.int_expr(20)]).then(function (v2) {
                return memory_1.set_v("v2", v2).then(function (_) {
                    return classes_1.call_method("scale", v2, [expressions_1.int_expr(2)]).then(function (_) {
                        return classes_1.call_method("to_string", v2, []).then(function (v2_s) {
                            return memory_1.set_v("v2_s", v2_s).then(function (_) {
                                return basic_statements_1.done;
                            });
                        });
                    });
                });
            });
        });
        var hrstart = process.hrtime();
        var p = fun_test;
        var res = ts_bccc_1.apply((ts_bccc_1.constant(p).times(ts_bccc_1.constant(memory_1.empty_memory))).then(run_to_end()), {});
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
