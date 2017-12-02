"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts_bccc_1 = require("ts-bccc");
var ts_bccc_2 = require("ts-bccc");
var Co = require("ts-bccc");
var memory_1 = require("./memory");
var expressions_1 = require("./expressions");
exports.done = ts_bccc_1.apply(ts_bccc_1.fun(ts_bccc_2.co_unit), {});
exports.dbg = function (range) { return function (v) { return memory_1.set_highlighting(range).then(function (_) { return Co.suspend().then(function (_) { return ts_bccc_2.co_unit(v); }); }); }; };
exports.if_then_else = function (f, g) {
    return expressions_1.bool_to_boolcat.times(ts_bccc_1.unit()).then(ts_bccc_1.apply_pair()).then(g.plus(f));
};
exports.while_do = function (p, k) {
    var h = exports.if_then_else(ts_bccc_1.fun(function (_) { return k.then(function (_) { return exports.while_do(p, k); }); }), ts_bccc_1.fun(function (_) { return exports.done; }));
    return p.then(ts_bccc_1.defun(h));
};
