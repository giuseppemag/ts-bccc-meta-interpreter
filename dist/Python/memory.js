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
var Immutable = require("immutable");
var ts_bccc_1 = require("ts-bccc");
var CCC = require("ts-bccc");
var ts_bccc_2 = require("ts-bccc");
var Co = require("ts-bccc");
exports.runtime_error = function (e) { return ts_bccc_2.co_error(e); };
exports.init_array_val = function (len) { return ({ elements: Immutable.Map(Immutable.Range(0, len).map(function (i) { return [i, exports.unt]; })), length: len }); };
exports.empty_scope = Immutable.Map();
exports.unt = ({ v: ts_bccc_1.apply(ts_bccc_1.unit(), {}), k: "u" });
exports.str = function (v) { return ({ v: v, k: "s" }); };
exports.int = function (v) { return ({ v: Math.floor(v), k: "i" }); };
exports.float = function (v) { return ({ v: v, k: "f" }); };
exports.arr = function (v) { return ({ v: v, k: "arr" }); };
exports.bool = function (v) { return ({ v: v, k: "b" }); };
exports.lambda = function (l) { return ({ v: l, k: "lambda" }); };
exports.obj = function (o) { return ({ v: o, k: "obj" }); };
exports.ref = function (r) { return ({ v: r, k: "ref" }); };
exports.mk_range = function (sr, sc, er, ec) { return ({ start: { row: sr, column: sc }, end: { row: er, column: ec } }); };
exports.highlight = ts_bccc_1.fun(function (x) { return (__assign({}, x.snd, { highlighting: x.fst })); });
exports.load = ts_bccc_1.fun(function (x) {
    return !x.snd.stack.isEmpty() && x.snd.stack.get(x.snd.stack.count() - 1).has(x.fst) ?
        ts_bccc_1.apply(ts_bccc_1.inr(), x.snd.stack.get(x.snd.stack.count() - 1).get(x.fst))
        : x.snd.globals.has(x.fst) ?
            ts_bccc_1.apply(ts_bccc_1.inr(), x.snd.globals.get(x.fst))
            : ts_bccc_1.apply(ts_bccc_1.inl(), {});
});
exports.store = ts_bccc_1.fun(function (x) {
    return !x.snd.stack.isEmpty() ?
        (__assign({}, x.snd, { stack: x.snd.stack.set(x.snd.stack.count() - 1, x.snd.stack.get(x.snd.stack.count() - 1).set(x.fst.fst, x.fst.snd)) }))
        :
            (__assign({}, x.snd, { globals: x.snd.globals.set(x.fst.fst, x.fst.snd) }));
});
exports.load_class_def = ts_bccc_1.fun(function (x) {
    return x.snd.classes.has(x.fst) ? ts_bccc_1.apply(ts_bccc_1.inr(), x.snd.classes.get(x.fst)) : ts_bccc_1.apply(ts_bccc_1.inl(), {});
});
exports.store_class_def = ts_bccc_1.fun(function (x) { return (__assign({}, x.snd, { classes: x.snd.classes.set(x.fst.fst, x.fst.snd) })); });
exports.load_fun_def = ts_bccc_1.fun(function (x) {
    return x.snd.functions.has(x.fst) ?
        ts_bccc_1.apply(ts_bccc_1.inr(), x.snd.functions.get(x.fst))
        : ts_bccc_1.apply(ts_bccc_1.inl(), {});
});
exports.store_fun_def = ts_bccc_1.fun(function (x) { return (__assign({}, x.snd, { functions: x.snd.functions.set(x.fst.fst, x.fst.snd) })); });
exports.load_heap = ts_bccc_1.fun(function (x) {
    return x.snd.heap.has(x.fst) ?
        ts_bccc_1.apply(ts_bccc_1.inr(), x.snd.heap.get(x.fst))
        : ts_bccc_1.apply(ts_bccc_1.inl(), {});
});
exports.store_heap = ts_bccc_1.fun(function (x) { return (__assign({}, x.snd, { heap: x.snd.heap.set(x.fst.fst, x.fst.snd) })); });
exports.heap_alloc = ts_bccc_1.fun(function (x) {
    var new_ref = "ref_" + x.snd.heap.count();
    return ({ fst: exports.ref(new_ref), snd: __assign({}, x.snd, { heap: x.snd.heap.set(new_ref, x.fst) }) });
});
exports.push_scope = ts_bccc_1.fun(function (x) { return (__assign({}, x, { stack: x.stack.set(x.stack.count(), exports.empty_scope) })); });
exports.pop_scope = ts_bccc_1.fun(function (x) {
    return !x.stack.isEmpty() ?
        ts_bccc_1.apply(ts_bccc_1.inr(), (__assign({}, x, { stack: x.stack.remove(x.stack.count() - 1) })))
        : ts_bccc_1.apply(ts_bccc_1.inl(), {});
});
exports.empty_memory = { highlighting: exports.mk_range(0, 0, 0, 0), globals: exports.empty_scope, heap: exports.empty_scope, functions: Immutable.Map(), classes: Immutable.Map(), stack: Immutable.Map() };
exports.set_highlighting = function (r) {
    return ts_bccc_2.mk_coroutine(ts_bccc_1.constant(r).times(ts_bccc_1.id()).then(exports.highlight).then(ts_bccc_1.unit().times(ts_bccc_1.id())).then(Co.value().then(Co.result().then(Co.no_error()))));
};
exports.set_v_expr = function (v, e) {
    return e.then(function (e_val) { return exports.set_v(v, e_val); });
};
exports.set_v = function (v, val) {
    var store_co = exports.store.then(ts_bccc_1.unit().times(ts_bccc_1.id()).then(Co.value().then(Co.result().then(Co.no_error()))));
    var f = ((ts_bccc_1.constant(v).times(ts_bccc_1.constant(val))).times(ts_bccc_1.id())).then(store_co);
    return ts_bccc_2.mk_coroutine(f);
};
exports.get_v = function (v) {
    var f = ts_bccc_1.constant(v).times(ts_bccc_1.id()).then(exports.load).times(ts_bccc_1.id()).then(CCC.swap_prod()).then(CCC.distribute_sum_prod()).then(ts_bccc_1.snd().map_plus(ts_bccc_1.id()));
    var g_err = ts_bccc_1.constant("Error: variable " + v + " cannot be found.").then(Co.error());
    var g_res = ts_bccc_1.swap_prod().then(Co.value()).then(Co.result()).then(Co.no_error());
    var g = g_err.plus(g_res);
    return ts_bccc_2.mk_coroutine(f.then(g));
};
exports.new_obj = function () {
    var heap_alloc_co = ts_bccc_2.mk_coroutine(ts_bccc_1.constant(exports.obj(exports.empty_scope)).times(ts_bccc_1.id()).then(exports.heap_alloc).then(Co.value().then(Co.result().then(Co.no_error()))));
    return (heap_alloc_co);
};
exports.new_arr = function (len) {
    var heap_alloc_co = ts_bccc_2.mk_coroutine(ts_bccc_1.constant(exports.arr(exports.init_array_val(len))).times(ts_bccc_1.id()).then(exports.heap_alloc).then(Co.value().then(Co.result().then(Co.no_error()))));
    return (heap_alloc_co);
};
exports.get_arr_len = function (a_ref) {
    return a_ref.k != "ref" ? exports.runtime_error("Cannot lookup element on " + a_ref.v + " as it is not an array reference.") :
        exports.get_heap_v(a_ref.v).then(function (a_val) {
            return a_val.k != "arr" ? exports.runtime_error("Cannot lookup element on " + a_val.v + " as it is not an array.") :
                ts_bccc_2.co_unit(exports.int(a_val.v.length));
        });
};
exports.get_arr_el = function (a_ref, i) {
    return a_ref.k != "ref" ? exports.runtime_error("Cannot lookup element on " + a_ref.v + " as it is not an array reference.") :
        exports.get_heap_v(a_ref.v).then(function (a_val) {
            return a_val.k != "arr" ? exports.runtime_error("Cannot lookup element on " + a_val.v + " as it is not an array.") :
                !a_val.v.elements.has(i) ? exports.runtime_error("Cannot find element " + i + " on " + a_val.v + ".") :
                    ts_bccc_2.co_unit(a_val.v.elements.get(i));
        });
};
exports.set_arr_el = function (a_ref, i, v) {
    return a_ref.k != "ref" ? exports.runtime_error("Cannot lookup element on " + a_ref.v + " as it is not an array reference.") :
        exports.get_heap_v(a_ref.v).then(function (a_val) {
            return a_val.k != "arr" ? exports.runtime_error("Cannot lookup element on " + a_val.v + " as it is not an array.") :
                exports.set_heap_v(a_ref.v, __assign({}, a_val, { v: __assign({}, a_val.v, { length: Math.max(i + 1, a_val.v.length), elements: a_val.v.elements.set(i, v) }) }));
        });
};
exports.set_arr_el_expr = function (a_ref, i, e) {
    return e.then(function (e_val) { return exports.set_arr_el(a_ref, i, e_val); });
};
exports.set_heap_v = function (v, val) {
    var store_co = exports.store_heap.then(ts_bccc_1.unit().times(ts_bccc_1.id()).then(Co.value().then(Co.result().then(Co.no_error()))));
    var f = ((ts_bccc_1.constant(v).times(ts_bccc_1.constant(val))).times(ts_bccc_1.id())).then(store_co);
    return ts_bccc_2.mk_coroutine(f);
};
exports.get_heap_v = function (v) {
    var f = (ts_bccc_1.constant(v).times(ts_bccc_1.id()).then(exports.load_heap)).times(ts_bccc_1.id()).then(ts_bccc_1.swap_prod()).then(CCC.distribute_sum_prod()).then(ts_bccc_1.snd().map_plus(ts_bccc_1.swap_prod()));
    var g1 = ts_bccc_1.constant("Cannot find heap entry " + v + ".").then(Co.error());
    var g2 = Co.no_error().after(Co.result().after(Co.value()));
    var g = g1.plus(g2);
    return ts_bccc_2.mk_coroutine(f.then(g));
};
exports.set_class_def = function (v, int) {
    var store_co = exports.store_class_def.then(ts_bccc_1.unit().times(ts_bccc_1.id()).then(Co.value().then(Co.result().then(Co.no_error()))));
    var f = ((ts_bccc_1.constant(v).times(ts_bccc_1.constant(int))).times(ts_bccc_1.id())).then(store_co);
    return ts_bccc_2.mk_coroutine(f);
};
exports.get_class_def = function (v) {
    var f = (ts_bccc_1.constant(v).times(ts_bccc_1.id()).then(exports.load_class_def)).times(ts_bccc_1.id()).then(ts_bccc_1.swap_prod()).then(CCC.distribute_sum_prod()).then(ts_bccc_1.snd().map_plus(ts_bccc_1.swap_prod()));
    var g1 = ts_bccc_1.constant("Cannot find class " + v + ".").then(Co.error());
    var g2 = Co.no_error().after(Co.result().after(Co.value()));
    var g = g1.plus(g2);
    return ts_bccc_2.mk_coroutine(f.then(g));
};
exports.set_fun_def = function (v, l) {
    var store_co = exports.store_fun_def.then(ts_bccc_1.unit().times(ts_bccc_1.id()).then(Co.value().then(Co.result().then(Co.no_error()))));
    var f = ((ts_bccc_1.constant(v).times(ts_bccc_1.constant(l))).times(ts_bccc_1.id())).then(store_co);
    return ts_bccc_2.mk_coroutine(f);
};
exports.get_fun_def = function (v) {
    var f = (ts_bccc_1.constant(v).times(ts_bccc_1.id()).then(exports.load_fun_def)).times(ts_bccc_1.id()).then(ts_bccc_1.swap_prod()).then(CCC.distribute_sum_prod()).then(ts_bccc_1.snd().map_plus(ts_bccc_1.swap_prod()));
    var g1 = ts_bccc_1.constant("Cannot find function definition " + v + ".").then(Co.error());
    var g2 = Co.no_error().after(Co.result().after(Co.value()));
    var g = g1.plus(g2);
    return ts_bccc_2.mk_coroutine(f.then(g));
};