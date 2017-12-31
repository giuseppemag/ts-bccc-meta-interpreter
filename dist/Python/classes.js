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
var ts_bccc_2 = require("ts-bccc");
var memory_1 = require("./memory");
var basic_statements_1 = require("./basic_statements");
var expressions_1 = require("./expressions");
var python_1 = require("./python");
exports.declare_class = function (C_name, int) {
    return memory_1.set_class_def(C_name, int);
};
exports.field_get = function (F_name, this_addr) {
    return memory_1.get_heap_v(this_addr.v).then(function (this_val) {
        if (this_val.k != "obj")
            return memory_1.runtime_error("runtime type error: this is not a reference when looking " + F_name + " up.");
        return expressions_1.val_expr(this_val.v.get(F_name));
    });
};
exports.field_get_expr = function (F_name, this_expr) {
    return this_expr.then(function (this_addr) {
        return this_addr.k != "ref" ? memory_1.runtime_error("runtime type error") :
            exports.field_get(F_name, this_addr);
    });
};
exports.field_set = function (F_name, new_val_expr, this_addr) {
    return new_val_expr.then(function (new_val) {
        return memory_1.get_heap_v(this_addr.v).then(function (this_val) {
            if (this_val.k != "obj")
                return memory_1.runtime_error("runtime type error: this is not a reference when looking " + F_name + " up.");
            var new_this_val = __assign({}, this_val, { v: this_val.v.set(F_name, new_val) });
            return memory_1.set_heap_v(this_addr.v, new_this_val).then(function (_) { return basic_statements_1.done; });
        });
    });
};
exports.field_set_expr = function (F_name, new_val_expr, this_expr) {
    return this_expr.then(function (this_addr) {
        return this_addr.k != "ref" ? memory_1.runtime_error("runtime type error") :
            exports.field_set(F_name, new_val_expr, this_addr);
    });
};
exports.resolve_method = function (M_name, C_def) {
    return C_def.methods.has(M_name) ? ts_bccc_1.apply(ts_bccc_1.inl(), C_def.methods.get(M_name))
        : ts_bccc_1.apply(ts_bccc_1.fun(function (int) { return exports.resolve_method(M_name, int); }).plus(ts_bccc_1.inr()), C_def.base);
};
exports.call_method = function (M_name, this_addr, args) {
    return this_addr.k != "ref" ? memory_1.runtime_error("runtime type error: this is not a reference when calling " + M_name + ".") :
        memory_1.get_heap_v(this_addr.v).then(function (this_val) {
            if (this_val.k != "obj")
                return memory_1.runtime_error("runtime type error: this is not an object when calling " + M_name + ".");
            var this_class = this_val.v.get("class");
            if (this_class.k != "s")
                return memory_1.runtime_error("runtime type error: this.class is not a string.");
            return memory_1.get_class_def(this_class.v).then(function (C_def) {
                var f = ts_bccc_1.fun(function (m) { return python_1.call_lambda_expr(m, args.concat([expressions_1.val_expr(this_addr)])); }).plus(ts_bccc_1.constant(expressions_1.unit_expr()));
                return ts_bccc_1.apply(f, exports.resolve_method(M_name, C_def));
            });
        });
};
exports.call_method_expr = function (M_name, this_expr, args) {
    return this_expr.then(function (this_addr) { return exports.call_method(M_name, this_addr, args); });
};
exports.call_cons = function (C_name, args) {
    return memory_1.get_class_def(C_name).then(function (C_def) {
        return memory_1.new_obj().then(function (this_addr) {
            return this_addr.k != "ref" ? memory_1.runtime_error("this is not a reference when calling " + C_name + "::cons") :
                exports.field_set("class", expressions_1.str_expr(C_name), this_addr).then(function (_) {
                    return python_1.call_lambda_expr(C_def.methods.get(C_name), args.concat([expressions_1.val_expr(this_addr)])).then(function (res) {
                        return ts_bccc_2.co_unit(this_addr);
                    });
                });
        });
    });
};
