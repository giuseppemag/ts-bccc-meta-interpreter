"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts_bccc_1 = require("ts-bccc");
var Co = require("ts-bccc");
var memory_1 = require("./memory");
exports.done_rt = ts_bccc_1.co_unit(memory_1.mk_unit_val);
exports.dbg_rt = function (range) { return function (v) { return memory_1.set_highlighting_rt(range).then(function (_) { return Co.suspend().then(function (_) { return ts_bccc_1.co_unit(v); }); }); }; };
exports.if_then_else_rt = function (c, f, g) {
    return c.then(function (c_val) { return c_val.k != "b" ? memory_1.runtime_error("Error: conditional expression " + c_val + " is not a boolean.")
        : c_val.v ? f : g; });
};
exports.while_do_rt = function (p, k) {
    return exports.if_then_else_rt(p, k.then(function (_) { return exports.while_do_rt(p, k); }), exports.done_rt);
};
