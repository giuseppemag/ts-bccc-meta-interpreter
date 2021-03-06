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
var basic_statements_1 = require("./basic_statements");
var expressions_1 = require("./expressions");
var python_1 = require("./python");
var Immutable = require("immutable");
var fast_coroutine_1 = require("../fast_coroutine");
exports.declare_class_rt = function (r, C_name, int) {
    return memory_1.set_class_def_rt(C_name, int);
};
exports.add_method_to_class_rt = function (r, C_name, method_name, method_body) {
    return memory_1.add_method_def_rt(C_name, method_name, method_body);
};
exports.field_get_rt = function (r, F_name, this_addr) {
    return memory_1.get_heap_v_rt(r, this_addr.v).then(function (this_val) {
        if (this_val.value.k != "obj")
            return memory_1.runtime_error(r, "runtime type error: this is not a reference when looking " + F_name + " up.");
        return expressions_1.val_expr(ts_bccc_1.apply(ts_bccc_1.inl(), this_val.value.v.get(F_name)));
    });
};
exports.field_get_expr_rt = function (r, F_name, this_expr) {
    return this_expr.then(function (this_addr) {
        return this_addr.value.k != "ref" ? memory_1.runtime_error(r, "runtime type error") :
            exports.field_get_rt(r, F_name, this_addr.value);
    });
};
exports.method_get_rt = function (r, M_name, this_addr) {
    return memory_1.get_heap_v_rt(r, this_addr.v).then(function (this_val) {
        if (this_val.value.k != "obj")
            return memory_1.runtime_error(r, "runtime type error: this is not a reference when looking " + M_name + " up.");
        if (this_val.value.v.has("class")) {
            var c = this_val.value.v.get("class");
            if (c.k == "s") {
                return memory_1.get_class_def_rt(r, c.v).then(function (_class) {
                    return _class.methods.get(M_name);
                });
            }
        }
        return memory_1.runtime_error(r, "runtime type error: wrong method lookup " + M_name + ".");
    });
};
exports.method_get_expr_rt = function (r, M_name, this_expr) {
    return this_expr.then(function (this_addr) {
        return this_addr.value.k != "ref" ? memory_1.runtime_error(r, "runtime type error, method not found") :
            exports.method_get_rt(r, M_name, this_addr.value);
    });
};
exports.method_body_get_rt = function (r, M_name, C_name) {
    return memory_1.get_class_def_rt(r, C_name).then(function (_class) {
        return _class.methods.get(M_name);
    });
};
exports.field_set_rt = function (r, F_name, new_val_expr, this_addr) {
    return new_val_expr.then(function (new_val) {
        return memory_1.get_heap_v_rt(r, this_addr.v).then(function (this_val) {
            if (this_val.value.k != "obj")
                return memory_1.runtime_error(r, "runtime type error: this is not a reference when looking " + F_name + " up.");
            //improve
            var new_this_val = __assign({}, this_val.value, { v: this_val.value.v.set(F_name.att_name, new_val.value) });
            return memory_1.set_heap_v_rt(this_addr.v, new_this_val).then(function (_) { return basic_statements_1.done_rt; });
        });
    });
};
exports.static_field_get_expr_rt = function (r, C_name, F_name) {
    return memory_1.get_class_def_rt(r, C_name).then(function (C_def) {
        return fast_coroutine_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), C_def.static_fields.get(F_name)));
    });
};
exports.static_method_get_expr_rt = function (r, C_name, F_name) {
    return memory_1.get_class_def_rt(r, C_name).then(function (C_def) {
        return C_def.static_methods.get(F_name);
    });
};
exports.static_field_set_expr_rt = function (r, C_name, F_name, new_val_expr) {
    return new_val_expr.then(function (new_val) {
        return memory_1.get_class_def_rt(r, C_name).then(function (C_def) {
            //improve
            var new_C_def = __assign({}, C_def, { static_fields: C_def.static_fields.set(F_name.att_name, new_val.value) });
            return memory_1.set_class_def_rt(C_name, new_C_def);
        });
    });
};
exports.field_set_expr_rt = function (r, F_name, new_val_expr, this_expr) {
    return this_expr.then(function (this_addr) {
        return this_addr.value.k != "ref" ? memory_1.runtime_error(r, "runtime type error") :
            exports.field_set_rt(r, F_name, new_val_expr, this_addr.value);
    });
};
exports.resolve_method_rt = function (r, M_name, C_def) {
    return C_def.methods.has(M_name) ? ts_bccc_1.apply(ts_bccc_1.inl(), C_def.methods.get(M_name))
        : ts_bccc_1.apply(ts_bccc_1.fun(function (int) { return exports.resolve_method_rt(r, M_name, int); }).plus(ts_bccc_1.inr()), C_def.base);
};
exports.call_method_rt = function (r, M_name, this_addr, args) {
    return this_addr.k != "ref" ? memory_1.runtime_error(r, "runtime type error: this is not a reference when calling " + M_name + ".") :
        memory_1.get_heap_v_rt(r, this_addr.v).then(function (this_val) {
            if (this_val.value.k != "obj")
                return memory_1.runtime_error(r, "runtime type error: this is not an object when calling " + M_name + ".");
            var this_class = this_val.value.v.get("class");
            if (this_class.k != "s")
                return memory_1.runtime_error(r, "runtime type error: this.class is not a string.");
            return memory_1.get_class_def_rt(r, this_class.v).then(function (C_def) {
                var f = ts_bccc_1.fun(function (m) { return python_1.call_lambda_expr_rt(r, m, args.concat([expressions_1.val_expr(ts_bccc_1.apply(ts_bccc_1.inl(), this_addr))])); }).plus(ts_bccc_1.constant(expressions_1.unit_expr()));
                return ts_bccc_1.apply(f, exports.resolve_method_rt(r, M_name, C_def));
            });
        });
};
exports.call_static_method_expr_rt = function (r, C_name, M_name, args) {
    return memory_1.get_class_def_rt(r, C_name).then(function (C_def) {
        var f = ts_bccc_1.fun(function (m) { return python_1.call_lambda_expr_rt(r, m, args); }).plus(ts_bccc_1.constant(expressions_1.unit_expr()));
        return ts_bccc_1.apply(f, exports.resolve_method_rt(r, M_name, C_def));
    });
};
exports.call_method_expr_rt = function (r, M_name, this_expr, args) {
    return this_expr.then(function (this_addr) { return exports.call_method_rt(r, M_name, this_addr.value, args); });
};
exports.call_cons_rt = function (r, C_name, args, init_fields) {
    return memory_1.get_class_def_rt(r, C_name).then(function (C_def) {
        return memory_1.new_obj_rt().then(function (this_addr) {
            return this_addr.value.k != "ref" ? memory_1.runtime_error(r, "this is not a reference when calling " + C_name + "::cons") :
                exports.field_set_rt(r, { att_name: "class", kind: "att" }, expressions_1.str_expr(C_name), this_addr.value).then(function (_) {
                    return python_1.call_lambda_expr_rt(r, C_def.methods.get(C_name), [expressions_1.val_expr(this_addr)]).then(function (cons_lambda) {
                        if (cons_lambda.value.k == "lambda") {
                            var lambda_1 = cons_lambda.value.v;
                            var body_1 = lambda_1.body;
                            var arg_expressions = args;
                            if (arg_expressions.length != lambda_1.parameters.length)
                                return memory_1.runtime_error(r, "Error: wrong number of parameters in lambda invocation. Expected " + lambda_1.parameters.length + ", received " + arg_expressions.length + ".");
                            var eval_args = fast_coroutine_1.comm_list_coroutine(Immutable.List(arg_expressions));
                            var set_args_1 = function (arg_values) { return lambda_1.parameters.map(function (n, i) { return ({ fst: n, snd: arg_values[i] }); }).reduce(function (sets, arg_value) {
                                return memory_1.set_v_rt(arg_value.fst, arg_value.snd).then(function (_) { return sets; });
                            }, basic_statements_1.done_rt); };
                            var init_1 = memory_1.push_scope_rt(lambda_1.closure); // .then(unit<MemRt>().times(id<MemRt>())).then(Co.value<MemRt, ErrVal, Unit>().then(Co.result<MemRt, ErrVal, Unit>().then(Co.no_error<MemRt, ErrVal, Unit>()))))
                            // let pop_success = (unit<MemRt>().times(id<MemRt>())).then(Co.value<MemRt, ErrVal, Unit>().then(Co.result<MemRt, ErrVal, Unit>().then(Co.no_error<MemRt, ErrVal, Unit>())))
                            // let pop_failure = constant<Unit,ErrVal>().then(Co.error<MemRt,ErrVal,Unit>())
                            var cleanup_1 = fast_coroutine_1.co_from_state(memory_1.pop_scope_rt).then(function (popped_state) {
                                if (popped_state.kind == "left")
                                    return fast_coroutine_1.co_error({ message: "Internal error: cannot pop an empty stack.", range: r });
                                return fast_coroutine_1.co_set_state(popped_state.value);
                            });
                            return eval_args.then(function (arg_values) {
                                // console.log("lambda arguments", JSON.stringify(arg_values)) ||
                                return init_1.then(function (_) {
                                    return init_fields.then(function (_) {
                                        return set_args_1(arg_values.toArray()).then(function (_) {
                                            return body_1.then(function (res) {
                                                return cleanup_1.then(function (_) {
                                                    return fast_coroutine_1.co_unit(this_addr);
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        }
                        else {
                            return memory_1.runtime_error(r, "Cannot invoke non-lambda expression.");
                        }
                    });
                });
        });
    });
};
