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
var source_range_1 = require("../source_range");
exports.runtime_error = function (e) { return ts_bccc_2.co_error(e); };
exports.init_array_val = function (len) { return ({ elements: Immutable.Map(Immutable.Range(0, len).map(function (i) { return [i, exports.mk_unit_val]; })), length: len }); };
exports.empty_scope_val = Immutable.Map();
exports.empty_scopes_val = Immutable.Map().set(0, exports.empty_scope_val);
exports.mk_unit_val = ({ v: ts_bccc_1.apply(ts_bccc_1.unit(), {}), k: "u" });
exports.mk_string_val = function (v) { return ({ v: v, k: "s" }); };
exports.mk_int_val = function (v) { return ({ v: Math.floor(v), k: "i" }); };
exports.mk_float_val = function (v) { return ({ v: v, k: "f" }); };
exports.mk_arr_val = function (v) { return ({ v: v, k: "arr" }); };
exports.mk_bool_val = function (v) { return ({ v: v, k: "b" }); };
exports.mk_lambda_val = function (l) { return ({ v: l, k: "lambda" }); };
exports.mk_obj_val = function (o) { return ({ v: o, k: "obj" }); };
exports.mk_ref_val = function (r) { return ({ v: r, k: "ref" }); };
exports.mk_render_grid_val = function (r) { return ({ v: r, k: "render-grid" }); };
exports.mk_render_grid_pixel_val = function (p) { return ({ v: p, k: "render-grid-pixel" }); };
var find_last_scope = function (scopes, p) {
    var i = scopes.count() - 1;
    for (var index = i; index >= 0; index--) {
        var current = scopes.get(index);
        var res = p(current);
        if (res.kind == "right")
            return res;
    }
    return { kind: "left", value: {} };
};
// Mem[][], v,
var update_variable = function (name, value, scopes, assign_if_not_present) {
    var i = scopes.count() - 1;
    for (var index = i; index >= 0; index--) {
        var current = scopes.get(index);
        if (current.has(name)) {
            current = current.set(name, value);
            scopes = scopes.set(index, current);
            return { kind: "right", value: scopes };
        }
    }
    if (assign_if_not_present) {
        var current = scopes.get(i);
        current = current.set(name, value);
        scopes = scopes.set(i, current);
        return { kind: "right", value: scopes };
    }
    return { kind: "left", value: {} };
};
var highlight = ts_bccc_1.fun(function (x) { return (__assign({}, x.snd, { highlighting: x.fst })); });
exports.load_rt = ts_bccc_1.fun(function (x) {
    if (!x.snd.stack.isEmpty()) {
        var res = find_last_scope(x.snd.stack.get(x.snd.stack.count() - 1), function (scope) { return scope.has(x.fst) ? { kind: "right", value: scope } : { kind: "left", value: {} }; });
        if (res.kind == "right")
            return ts_bccc_1.apply(ts_bccc_1.inr(), ts_bccc_1.apply(ts_bccc_1.inl(), res.value.get(x.fst)));
    }
    var maybe_in_globals = find_last_scope(x.snd.globals, function (scope) { return scope.has(x.fst) ? { kind: "right", value: scope } : { kind: "left", value: {} }; });
    if (maybe_in_globals.kind == "right") {
        return ts_bccc_1.apply(ts_bccc_1.inr(), ts_bccc_1.apply(ts_bccc_1.inl(), maybe_in_globals.value.get(x.fst)));
    }
    return ts_bccc_1.apply(ts_bccc_1.inl(), {});
});
exports.store_rt = ts_bccc_1.fun(function (x) {
    if (!x.snd.stack.isEmpty()) {
        var scopes1_1 = update_variable(x.fst.fst, x.fst.snd, x.snd.stack.get(x.snd.stack.count() - 1), true);
        if (scopes1_1.kind == "right") {
            return (__assign({}, x.snd, { stack: x.snd.stack.set(x.snd.stack.count() - 1, scopes1_1.value) }));
        }
    }
    var scopes1 = update_variable(x.fst.fst, x.fst.snd, x.snd.globals, true);
    if (scopes1.kind == "right") {
        return (__assign({}, x.snd, { globals: scopes1.value }));
    }
    return x.snd;
});
exports.decl_rt = ts_bccc_1.fun(function (x) {
    if (x.snd.stack.count() > 0) {
        return (__assign({}, x.snd, { stack: x.snd.stack.set(x.snd.stack.count() - 1, x.snd.stack.last().set(x.snd.stack.last().count() - 1, x.snd.stack.last().last().set(x.fst.fst, x.fst.snd))) }));
    }
    else {
        return (__assign({}, x.snd, { globals: x.snd.globals.set(x.snd.globals.count() - 1, x.snd.globals.last().set(x.fst.fst, x.fst.snd)) }));
    }
});
exports.load_class_def_rt = ts_bccc_1.fun(function (x) {
    return x.snd.classes.has(x.fst) ? ts_bccc_1.apply(ts_bccc_1.inr(), x.snd.classes.get(x.fst)) : ts_bccc_1.apply(ts_bccc_1.inl(), {});
});
exports.store_class_def_rt = ts_bccc_1.fun(function (x) { return (__assign({}, x.snd, { classes: x.snd.classes.set(x.fst.fst, x.fst.snd) })); });
exports.load_fun_def_rt = ts_bccc_1.fun(function (x) {
    return x.snd.functions.has(x.fst) ?
        ts_bccc_1.apply(ts_bccc_1.inr(), x.snd.functions.get(x.fst))
        : ts_bccc_1.apply(ts_bccc_1.inl(), {});
});
exports.store_fun_def_rt = ts_bccc_1.fun(function (x) { return (__assign({}, x.snd, { functions: x.snd.functions.set(x.fst.fst, x.fst.snd) })); });
exports.load_heap_rt = ts_bccc_1.fun(function (x) {
    return x.snd.heap.has(x.fst) ?
        ts_bccc_1.apply(ts_bccc_1.inr(), x.snd.heap.get(x.fst))
        : ts_bccc_1.apply(ts_bccc_1.inl(), {});
});
exports.store_heap_rt = ts_bccc_1.fun(function (x) {
    var res = (__assign({}, x.snd, { heap: x.snd.heap.set(x.fst.fst, x.fst.snd) }));
    return res;
});
exports.heap_alloc_rt = ts_bccc_1.fun(function (x) {
    var new_ref = "ref_" + x.snd.heap.count();
    return ({ fst: exports.mk_ref_val(new_ref), snd: __assign({}, x.snd, { heap: x.snd.heap.set(new_ref, x.fst) }) });
});
exports.push_inner_scope_rt = ts_bccc_1.curry(ts_bccc_1.fun2(function (s, m) {
    if (!m.stack.isEmpty()) {
        var stack_count = m.stack.count();
        var top_stack = m.stack.last();
        var top_stack_count = top_stack.count();
        return (__assign({}, m, { stack: m.stack.set(stack_count - 1, top_stack.set(top_stack_count, s)) }));
    }
    else {
        return (__assign({}, m, { globals: m.globals.set(m.globals.count(), s) }));
    }
}));
exports.pop_inner_scope_rt = ts_bccc_1.curry(ts_bccc_1.fun2(function (s, m) {
    if (!m.stack.isEmpty()) {
        var stack_count = m.stack.count();
        var top_stack = m.stack.get(stack_count - 1);
        var top_stack_count = top_stack.count();
        return (__assign({}, m, { stack: m.stack.set(stack_count - 1, top_stack.remove(top_stack_count - 1)) }));
    }
    else {
        return (__assign({}, m, { globals: m.globals.remove(m.globals.count() - 1) }));
    }
}));
exports.push_scope_rt = ts_bccc_1.curry(ts_bccc_1.fun2(function (s, m) { return (__assign({}, m, { stack: m.stack.set(m.stack.count(), Immutable.Map().set(0, s)) })); }));
exports.pop_scope_rt = ts_bccc_1.fun(function (x) {
    return !x.stack.isEmpty() ?
        ts_bccc_1.apply(ts_bccc_1.inr(), (__assign({}, x, { stack: x.stack.remove(x.stack.count() - 1) })))
        : ts_bccc_1.apply(ts_bccc_1.inl(), {});
});
exports.empty_memory_rt = { highlighting: source_range_1.mk_range(0, 0, 0, 0),
    globals: exports.empty_scopes_val,
    heap: exports.empty_scope_val,
    functions: Immutable.Map(),
    classes: Immutable.Map(),
    stack: Immutable.Map() };
exports.set_highlighting_rt = function (r) {
    return ts_bccc_2.mk_coroutine(ts_bccc_1.constant(r).times(ts_bccc_1.id()).then(highlight).then(ts_bccc_1.constant(ts_bccc_1.apply(ts_bccc_1.inl(), exports.mk_unit_val)).times(ts_bccc_1.id())).then(Co.value().then(Co.result().then(Co.no_error()))));
};
exports.set_v_expr_rt = function (v, e) {
    return e.then(function (e_val) {
        // console.log(`Setting ${v} to ${JSON.stringify(e_val)}`) ||
        return exports.set_v_rt(v, e_val);
    });
};
exports.set_v_rt = function (v, vals) {
    var val = vals.value;
    var store_co = exports.store_rt.then((ts_bccc_1.constant(exports.mk_unit_val).then(ts_bccc_1.inl())).times(ts_bccc_1.id()).then(Co.value().then(Co.result().then(Co.no_error()))));
    var f = ((ts_bccc_1.constant(v).times(ts_bccc_1.constant(val))).times(ts_bccc_1.id())).then(store_co);
    return ts_bccc_2.mk_coroutine(f);
};
exports.decl_v_rt = function (v, vals) {
    var val = vals.value;
    var store_co = exports.decl_rt.then((ts_bccc_1.constant(exports.mk_unit_val).then(ts_bccc_1.inl())).times(ts_bccc_1.id()).then(Co.value().then(Co.result().then(Co.no_error()))));
    var f = ((ts_bccc_1.constant(v).times(ts_bccc_1.constant(val))).times(ts_bccc_1.id())).then(store_co);
    return ts_bccc_2.mk_coroutine(f);
};
exports.get_v_rt = function (v) {
    var f = ts_bccc_1.constant(v).times(ts_bccc_1.id()).then(exports.load_rt).times(ts_bccc_1.id()).then(CCC.swap_prod()).then(CCC.distribute_sum_prod()).then(ts_bccc_1.snd().map_plus(ts_bccc_1.id()));
    var g_err = ts_bccc_1.constant("Error: variable " + v + " cannot be found.").then(Co.error());
    var g_res = ts_bccc_1.swap_prod().then(Co.value()).then(Co.result()).then(Co.no_error());
    var g = g_err.plus(g_res);
    return ts_bccc_2.mk_coroutine(f.then(g));
};
exports.new_obj_rt = function () {
    var heap_alloc_co = ts_bccc_2.mk_coroutine(ts_bccc_1.constant(exports.mk_obj_val(exports.empty_scope_val)).times(ts_bccc_1.id()).then(exports.heap_alloc_rt).then((ts_bccc_1.inl()).map_times(ts_bccc_1.id())).then(Co.value().then(Co.result().then(Co.no_error()))));
    return (heap_alloc_co);
};
exports.new_arr_rt = function (len) {
    var heap_alloc_co = ts_bccc_2.mk_coroutine(ts_bccc_1.constant(exports.mk_arr_val(exports.init_array_val(len))).times(ts_bccc_1.id()).then(exports.heap_alloc_rt).then((ts_bccc_1.inl()).map_times(ts_bccc_1.id())).then(Co.value().then(Co.result().then(Co.no_error()))));
    return (heap_alloc_co);
};
exports.new_arr_expr_rt = function (len) {
    return len.then(function (len_v) { return len_v.value.k != "i" ? exports.runtime_error("Cannot create array of length " + len_v.value.v + " as it is not an integer.") : exports.new_arr_rt(len_v.value.v); });
};
exports.get_arr_len_rt = function (a_ref) {
    return a_ref.k != "ref" ? exports.runtime_error("Cannot lookup element on " + a_ref.v + " as it is not an array reference.") :
        exports.get_heap_v_rt(a_ref.v).then(function (a_val) {
            return a_val.value.k != "arr" ? exports.runtime_error("Cannot lookup element on " + a_val.value.v + " as it is not an array.") :
                ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), exports.mk_int_val(a_val.value.v.length)));
        });
};
exports.get_arr_len_expr_rt = function (a) {
    return a.then(function (a_val) { return exports.get_arr_len_rt(a_val.value); });
};
exports.get_arr_el_rt = function (a_ref, i) {
    return a_ref.k != "ref" ? exports.runtime_error("Cannot lookup element on " + a_ref.v + " as it is not an array reference.") :
        exports.get_heap_v_rt(a_ref.v).then(function (a_val) {
            return a_val.value.k != "arr" ? exports.runtime_error("Cannot lookup element on " + a_val.value.v + " as it is not an array.") :
                !a_val.value.v.elements.has(i) ? exports.runtime_error("Cannot find element " + i + " on " + a_val.value.v + ".") :
                    ts_bccc_2.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), a_val.value.v.elements.get(i)));
        });
};
exports.get_arr_el_expr_rt = function (a, i) {
    return a.then(function (a_val) {
        return i.then(function (i_val) {
            return i_val.value.k != "i" ? exports.runtime_error("Index " + i_val + " is not an integer.") :
                exports.get_arr_el_rt(a_val.value, i_val.value.v);
        });
    });
};
exports.set_arr_el_rt = function (a_ref, i, v) {
    return a_ref.k != "ref" ? exports.runtime_error("Cannot lookup element on " + a_ref.v + " as it is not an array reference.") :
        exports.get_heap_v_rt(a_ref.v).then(function (a_val) {
            return a_val.value.k != "arr" ? exports.runtime_error("Cannot lookup element on " + a_val.value.v + " as it is not an array.") :
                exports.set_heap_v_rt(a_ref.v, __assign({}, a_val.value, { v: __assign({}, a_val.value.v, { length: Math.max(i + 1, a_val.value.v.length), elements: a_val.value.v.elements.set(i, v) }) }));
        });
};
exports.set_arr_el_expr_rt = function (a, i, e) {
    return a.then(function (a_val) {
        return i.then(function (i_val) {
            if (i_val.value.k != "i")
                return exports.runtime_error("Index " + i_val + " is not an integer.");
            var i = i_val.value;
            return e.then(function (e_val) { return exports.set_arr_el_rt(a_val.value, i.v, e_val.value); });
        });
    });
};
exports.set_heap_v_rt = function (v, val) {
    var store_co = exports.store_heap_rt.then((ts_bccc_1.constant(exports.mk_unit_val).then(ts_bccc_1.inl())).times(ts_bccc_1.id()).then(Co.value().then(Co.result().then(Co.no_error()))));
    var f = ((ts_bccc_1.constant(v).times(ts_bccc_1.constant(val))).times(ts_bccc_1.id())).then(store_co);
    return ts_bccc_2.mk_coroutine(f);
};
exports.get_heap_v_rt = function (v) {
    var f = (ts_bccc_1.constant(v).times(ts_bccc_1.id()).then(exports.load_heap_rt.then(ts_bccc_1.id().map_plus(ts_bccc_1.inl())))).times(ts_bccc_1.id()).then(ts_bccc_1.swap_prod()).then(CCC.distribute_sum_prod()).then(ts_bccc_1.snd().map_plus(ts_bccc_1.swap_prod()));
    var g1 = ts_bccc_1.constant("Cannot find heap entry " + v + ".").then(Co.error());
    var g2 = Co.no_error().after(Co.result().after(Co.value()));
    var g = g1.plus(g2);
    return ts_bccc_2.mk_coroutine(f.then(g));
};
exports.set_class_def_rt = function (v, int) {
    var store_co = exports.store_class_def_rt.then((ts_bccc_1.constant(exports.mk_unit_val).then(ts_bccc_1.inl())).times(ts_bccc_1.id()).then(Co.value().then(Co.result().then(Co.no_error()))));
    var f = ((ts_bccc_1.constant(v).times(ts_bccc_1.constant(int))).times(ts_bccc_1.id())).then(store_co);
    var g = f;
    return ts_bccc_2.mk_coroutine(f);
};
exports.get_class_def_rt = function (v) {
    var f = (ts_bccc_1.constant(v).times(ts_bccc_1.id()).then(exports.load_class_def_rt)).times(ts_bccc_1.id()).then(ts_bccc_1.swap_prod()).then(CCC.distribute_sum_prod()).then(ts_bccc_1.snd().map_plus(ts_bccc_1.swap_prod()));
    var g1 = ts_bccc_1.constant("Cannot find class " + v + ".").then(Co.error());
    var g2 = Co.no_error().after(Co.result().after(Co.value()));
    var g = g1.plus(g2);
    return ts_bccc_2.mk_coroutine(f.then(g));
};
exports.set_fun_def_rt = function (v, l) {
    var store_co = exports.store_fun_def_rt.then((ts_bccc_1.constant(exports.mk_unit_val).then(ts_bccc_1.inl())).times(ts_bccc_1.id()).then(Co.value().then(Co.result().then(Co.no_error()))));
    var f = ((ts_bccc_1.constant(v).times(ts_bccc_1.constant(l))).times(ts_bccc_1.id())).then(store_co);
    return ts_bccc_2.mk_coroutine(f);
};
exports.get_fun_def_rt = function (v) {
    var f = (ts_bccc_1.constant(v).times(ts_bccc_1.id()).then(exports.load_fun_def_rt)).times(ts_bccc_1.id()).then(ts_bccc_1.swap_prod()).then(CCC.distribute_sum_prod()).then(ts_bccc_1.snd().map_plus(ts_bccc_1.swap_prod()));
    var g1 = ts_bccc_1.constant("Cannot find function definition " + v + ".").then(Co.error());
    var g2 = Co.no_error().after(Co.result().after(Co.value()));
    var g = g1.plus(g2);
    return ts_bccc_2.mk_coroutine(f.then(g));
};
