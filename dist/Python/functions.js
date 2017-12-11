"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts_bccc_1 = require("ts-bccc");
var ts_bccc_2 = require("ts-bccc");
var Co = require("ts-bccc");
var memory_1 = require("./memory");
var basic_statements_1 = require("./basic_statements");
exports.def_fun = function (n, body, args, closure) {
    return memory_1.set_fun_def(n, { body: body, parameters: args, closure: closure });
};
exports.ret = function (e) {
    return e.then(function (e_val) { return memory_1.set_v("return", e_val).then(function (_) { return ts_bccc_2.co_unit(e_val); }); });
};
exports.call_by_name = function (f_n, args) {
    return memory_1.get_fun_def(f_n).then(function (f) { return exports.call_lambda(f, args); });
};
exports.call_lambda = function (lambda, arg_values) {
    var body = lambda.body;
    if (arg_values.length != lambda.parameters.length)
        return memory_1.runtime_error("Error: wrong number of parameters in lambda invocation. Expected " + lambda.parameters.length + ", received " + arg_values.length + ".");
    var set_args = lambda.parameters.map(function (n, i) { return ({ fst: n, snd: arg_values[i] }); }).reduce(function (sets, arg_expr) {
        return memory_1.set_v_expr(arg_expr.fst, arg_expr.snd).then(function (_) { return sets; });
    }, basic_statements_1.done);
    var init = ts_bccc_2.mk_coroutine(ts_bccc_1.apply(memory_1.push_scope, lambda.closure).then(ts_bccc_1.unit().times(ts_bccc_1.id())).then(Co.value().then(Co.result().then(Co.no_error()))));
    var pop_success = (ts_bccc_1.unit().times(ts_bccc_1.id())).then(Co.value().then(Co.result().then(Co.no_error())));
    var pop_failure = ts_bccc_1.constant("Internal error: cannot pop an empty stack.").then(Co.error());
    var cleanup = ts_bccc_2.mk_coroutine(memory_1.pop_scope.then(pop_failure.plus(pop_success)));
    return init.then(function (_) {
        return set_args.then(function (_) {
            return body.then(function (res) {
                return cleanup.then(function (_) {
                    return ts_bccc_2.co_unit(res);
                });
            });
        });
    });
};
