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
var ts_bccc_1 = require("ts-bccc");
// import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
// import * as Co from "ts-bccc"
var memory_1 = require("./memory");
var fast_coroutine_1 = require("../fast_coroutine");
exports.done_rt = fast_coroutine_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), memory_1.mk_unit_val));
exports.dbg_rt = function (range) { return function (v) { return memory_1.set_highlighting_rt(range).then(function (_) { return fast_coroutine_1.co_suspend().then(function (_) { return fast_coroutine_1.co_unit(v); }); }); }; };
var push_new_context = memory_1.push_inner_scope_rt(memory_1.empty_scope_val);
var pop_current_context = memory_1.pop_inner_scope_rt();
exports.if_then_else_rt = function (r, c, f, g) {
    return c.then(function (c_val) { return c_val.value.k != "b" ? memory_1.runtime_error(r, "Error: conditional expression " + c_val + " is not a boolean.")
        : c_val.value.v ?
            push_new_context.then(function (_) { return f.then(function (res) { return pop_current_context.then(function (_) { return fast_coroutine_1.co_unit(res); }); }); }) :
            push_new_context.then(function (_) { return g.then(function (res) { return pop_current_context.then(function (_) { return fast_coroutine_1.co_unit(res); }); }); }); });
};
exports.while_do_rt = function (r, c, k) {
    return c.then(function (c_val) { return c_val.value.k != "b" ? memory_1.runtime_error(r, "Error: conditional expression " + c_val + " is not a boolean.")
        : c_val.value.v ?
            push_new_context.then(function (_) {
                return fast_coroutine_1.co_get_state().then(function (s) {
                    var f = function (counter) { return fast_coroutine_1.co_set_state(__assign({}, s, { steps_counter: counter })).then(function (_) {
                        return k.then(function (k_res) { return pop_current_context.then(function (_) { return exports.while_do_rt(r, c, k); }); });
                    }); };
                    if (s.steps_counter > 300) {
                        if (s.custom_alert('The program seems to be taking too much time. This might be an indication of an infinite loop. Press OK to terminate the program.'))
                            return fast_coroutine_1.co_error({ range: r, message: "It seems your code has run into an infinite loop." });
                        else
                            return f(0);
                    }
                    return f(s.steps_counter + 1);
                });
            }) :
            exports.done_rt; });
};
exports.for_loop_rt = function (r, i, c, s, b) {
    return push_new_context.then(function (_) {
        return i.then(function (_) {
            return exports.while_do_rt(r, c, b.then(function (_) { return s; })).then(function (_) {
                return pop_current_context.then(function (_) {
                    return exports.done_rt;
                });
            });
        });
    });
};
