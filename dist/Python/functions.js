"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Immutable = require("immutable");
var ts_bccc_1 = require("ts-bccc");
var memory_1 = require("./memory");
var basic_statements_1 = require("./basic_statements");
var python_1 = require("./python");
// import { comm_list_coroutine } from "../ccc_aux";
var fast_coroutine_1 = require("../fast_coroutine");
var build_closure = function (r, closure_parameters) { return function (i, closure) {
    if (i >= closure_parameters.length)
        return fast_coroutine_1.co_unit(closure);
    else
        return python_1.get_v_rt(r, closure_parameters[i]).then(function (c_val) {
            return build_closure(r, closure_parameters)(i + 1, closure.set(closure_parameters[i], c_val.value));
        });
}; };
exports.mk_lambda_rt = function (body, parameters, closure_parameters, range) {
    return build_closure(range, closure_parameters)(0, python_1.empty_scope_val).then(function (closure) { return python_1.lambda_expr({ body: body, parameters: parameters, closure: closure, range: range }); });
};
exports.def_fun_rt = function (n, body, parameters, closure_parameters, range) {
    return build_closure(range, closure_parameters)(0, python_1.empty_scope_val).then(function (closure) { return memory_1.set_fun_def_rt(n, { body: body, parameters: parameters, closure: closure, range: range }); });
};
exports.return_rt = function (e) {
    return e.then(function (e_val) { return memory_1.set_v_rt("return", e_val).then(function (_) { return fast_coroutine_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inr(), e_val.value)); }); });
};
exports.call_by_name_rt = function (r, f_n, args) {
    return memory_1.get_fun_def_rt(r, f_n).then(function (f) {
        return exports.call_lambda_rt(r, f, args);
    });
};
exports.call_lambda_expr_rt = function (r, lambda, arg_values) {
    return lambda.then(function (l) {
        return l.value.k == "lambda" ? exports.call_lambda_rt(r, l.value.v, arg_values)
            : memory_1.runtime_error(r, "Cannot invoke non-lambda expression.");
    });
};
exports.call_lambda_rt = function (r, lambda, arg_expressions) {
    var body = lambda.body;
    if (arg_expressions.length != lambda.parameters.length)
        return memory_1.runtime_error(r, "Error: wrong number of parameters in lambda invocation. Expected " + lambda.parameters.length + ", received " + arg_expressions.length + ".");
    var eval_args = fast_coroutine_1.comm_list_coroutine(Immutable.List(arg_expressions));
    var set_args = function (arg_values) { return lambda.parameters.map(function (n, i) { return ({ fst: n, snd: arg_values[i] }); }).reduce(function (sets, arg_value) {
        return memory_1.set_v_rt(arg_value.fst, arg_value.snd).then(function (_) { return sets; });
    }, basic_statements_1.done_rt); };
    var init = memory_1.push_scope_rt(lambda.closure); // .then(unit<MemRt>().times(id<MemRt>())).then(Co.value<MemRt, ErrVal, Unit>().then(Co.result<MemRt, ErrVal, Unit>().then(Co.no_error<MemRt, ErrVal, Unit>()))))
    // let pop_success = (unit<MemRt>().times(id<MemRt>())).then(Co.value<MemRt, ErrVal, Unit>().then(Co.result<MemRt, ErrVal, Unit>().then(Co.no_error<MemRt, ErrVal, Unit>())))
    // let pop_failure = constant<Unit,ErrVal>({ message:`Internal error: cannot pop an empty stack.`, range:r }).then(Co.error<MemRt,ErrVal,Unit>())
    var cleanup = fast_coroutine_1.co_from_state(memory_1.pop_scope_rt).then(function (popped_state) {
        if (popped_state.kind == "left")
            return fast_coroutine_1.co_error({ message: "Internal error: cannot pop an empty stack.", range: r });
        return fast_coroutine_1.co_set_state(popped_state.value);
    });
    return eval_args.then(function (arg_values) {
        // console.log("lambda arguments", JSON.stringify(arg_values)) ||
        return init.then(function (_) {
            return set_args(arg_values.toArray()).then(function (_) {
                return body.then(function (res) {
                    return cleanup.then(function (_) {
                        return fast_coroutine_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), res.value));
                    });
                });
            });
        });
    });
};
