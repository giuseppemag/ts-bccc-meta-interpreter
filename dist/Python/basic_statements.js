"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts_bccc_1 = require("ts-bccc");
var ts_bccc_2 = require("ts-bccc");
var Co = require("ts-bccc");
var memory_1 = require("./memory");
exports.done_rt = ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), memory_1.mk_unit_val));
exports.dbg_rt = function (range) { return function (v) { return memory_1.set_highlighting_rt(range).then(function (_) { return Co.suspend().then(function (_) { return ts_bccc_2.co_unit(v); }); }); }; };
var push_new_context = ts_bccc_2.mk_coroutine(ts_bccc_1.apply(memory_1.push_inner_scope_rt, memory_1.empty_scope_val).then(ts_bccc_1.unit().times(ts_bccc_1.id())).then(Co.value().then(Co.result().then(Co.no_error()))));
var pop_current_context = ts_bccc_2.mk_coroutine(ts_bccc_1.apply(memory_1.pop_inner_scope_rt, memory_1.empty_scope_val).then(ts_bccc_1.unit().times(ts_bccc_1.id())).then(Co.value().then(Co.result().then(Co.no_error()))));
exports.if_then_else_rt = function (c, f, g) {
    return c.then(function (c_val) { return c_val.value.k != "b" ? memory_1.runtime_error("Error: conditional expression " + c_val + " is not a boolean.")
        : c_val.value.v ?
            push_new_context.then(function (_) { return f.then(function (res) { return pop_current_context.then(function (_) { return ts_bccc_2.co_unit(res); }); }); }) :
            push_new_context.then(function (_) { return g.then(function (res) { return pop_current_context.then(function (_) { return ts_bccc_2.co_unit(res); }); }); }); });
};
exports.while_do_rt = function (c, k) {
    return c.then(function (c_val) { return c_val.value.k != "b" ? memory_1.runtime_error("Error: conditional expression " + c_val + " is not a boolean.")
        : c_val.value.v ?
            push_new_context.then(function (_) { return k.then(function (k_res) { return pop_current_context.then(function (_) { return exports.while_do_rt(c, k); }); }); }) :
            exports.done_rt; });
};
