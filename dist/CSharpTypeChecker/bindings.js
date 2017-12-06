"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts_bccc_1 = require("ts-bccc");
var Sem = require("../Python/memory");
var SemStmts = require("../Python/basic_statements");
exports.unit_type = { kind: "unit" };
var mk_typing = function (t, s) { return ({ type: t, sem: s }); };
var type_equals = function (t1, t2) {
    return (t1.kind == "fun" && t2.kind == "fun" && type_equals(t1.in, t2.in) && type_equals(t1.out, t2.out))
        || (t1.kind == "obj" && t2.kind == "obj" &&
            !t1.inner.some(function (v1, k1) { return v1 == undefined || k1 == undefined || !t2.inner.has(k1) || !type_equals(t2.inner.get(k1), v1); }) &&
            !t2.inner.some(function (v2, k2) { return v2 == undefined || k2 == undefined || !t1.inner.has(k2); }))
        || t1.kind == t2.kind;
};
exports.if_then_else = function (c, t, e) {
    return c.then(function (c_t) {
        return c_t.type.kind != "bool" ? ts_bccc_1.co_error("Error: condition has the wrong type!") :
            t.then(function (t_t) {
                return e.then(function (e_t) {
                    return type_equals(t_t.type, exports.unit_type) && type_equals(e_t.type, exports.unit_type) ? ts_bccc_1.co_error("Error: the branches of a conditional should be of type unit!") :
                        ts_bccc_1.co_unit(mk_typing(t_t.type, SemStmts.if_then_else(c_t.sem, t_t.sem.ignore(), e_t.sem.ignore()).ignore_with(Sem.unt)));
                });
            });
    });
};
exports.while_do = function (c, b) {
    return c.then(function (c_t) {
        return c_t.type.kind != "bool" ? ts_bccc_1.co_error("Error: condition has the wrong type!") :
            b.then(function (t_t) {
                return type_equals(t_t.type, exports.unit_type) ? ts_bccc_1.co_error("Error: the body of a loop should be of type unit!") :
                    ts_bccc_1.co_unit(mk_typing(t_t.type, SemStmts.while_do(c_t.sem, t_t.sem.ignore()).ignore_with(Sem.unt)));
            });
    });
};
