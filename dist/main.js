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
        var loop_test = memory_1.set_v("s", memory_1.str("")).then(function (_) {
            return memory_1.set_v("i", memory_1.int(20)).then(function (_) {
                return basic_statements_1.while_do(expressions_1.int_geq(memory_1.get_v("i"), expressions_1.int_expr(0)), memory_1.set_v_expr("i", expressions_1.int_minus(memory_1.get_v("i"), expressions_1.int_expr(1))).then(function (_) {
                    return memory_1.set_v_expr("s", expressions_1.string_plus(memory_1.get_v("s"), expressions_1.str_expr("*"))).then(function (_) {
                        return basic_statements_1.if_then_else(expressions_1.int_eq(expressions_1.int_mod(memory_1.get_v("i"), expressions_1.int_expr(5)), expressions_1.int_expr(0)), basic_statements_1.dbg(source_range_1.mk_range(9, 0, 10, 0))(memory_1.unt), basic_statements_1.done);
                    });
                }));
            });
        });
        var arr_test = memory_1.set_v_expr("a", memory_1.new_arr(10)).then(function (_) {
            return memory_1.set_v("i", memory_1.int(0)).then(function (_) {
                return basic_statements_1.while_do(expressions_1.int_lt(memory_1.get_v("i"), memory_1.get_arr_len_expr(memory_1.get_v("a"))), // get_v("i").then(i_val => bool_expr(i_val.v < a_len.v)),
                memory_1.get_v("i").then(function (i_val) { return i_val.k != "i" ? memory_1.runtime_error(i_val.v + " is not a number") :
                    memory_1.set_arr_el_expr(memory_1.get_v("a"), memory_1.get_v("i"), expressions_1.int_times(memory_1.get_v("i"), expressions_1.int_expr(2))).then(function (_) {
                        return memory_1.set_v_expr("i", expressions_1.int_plus(memory_1.get_v("i"), expressions_1.int_expr(1))).then(function (_) {
                            return basic_statements_1.dbg(source_range_1.mk_range(9, 0, 10, 0))(memory_1.unt);
                        });
                    }); }));
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
                    { fst: classes_1.field_set_expr("x", expressions_1.int_times(classes_1.field_get_expr("x", memory_1.get_v("this")), memory_1.get_v("k")), memory_1.get_v("this")).then(function (_) {
                            return basic_statements_1.dbg(source_range_1.mk_range(6, 0, 7, 0))(memory_1.unt).then(function (_) {
                                return classes_1.field_set_expr("y", expressions_1.int_times(classes_1.field_get_expr("y", memory_1.get_v("this")), memory_1.get_v("k")), memory_1.get_v("this")).then(function (_) {
                                    return basic_statements_1.dbg(source_range_1.mk_range(6, 0, 7, 0))(memory_1.unt);
                                });
                            });
                        }),
                        snd: ["k", "this"] }],
                ["constructor",
                    { fst: classes_1.field_set_expr("x", memory_1.get_v("x"), memory_1.get_v("this")).then(function (_) {
                            return classes_1.field_set_expr("y", memory_1.get_v("y"), memory_1.get_v("this")).then(function (_) {
                                return expressions_1.unit_expr();
                            });
                        }),
                        snd: ["x", "y", "this"] }]
            ])
        };
        var class_test = classes_1.declare_class("Vector2", vector2).then(function (_) {
            return classes_1.call_cons("Vector2", [expressions_1.int_expr(10), expressions_1.int_expr(20)]).then(function (v2) {
                return memory_1.set_v("v2", v2).then(function (_) {
                    return classes_1.call_method_expr("scale", memory_1.get_v("v2"), [expressions_1.int_expr(2)]).then(function (_) {
                        return memory_1.set_v_expr("v2_s", classes_1.call_method_expr("to_string", memory_1.get_v("v2"), []));
                    });
                });
            });
        });
        var hrstart = process.hrtime();
        var p = class_test;
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
