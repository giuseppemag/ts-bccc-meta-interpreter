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
// import * as CCC from "ts-bccc"
// import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
// import * as Co from "ts-bccc"
var source_range_1 = require("../source_range");
var fast_coroutine_1 = require("../fast_coroutine");
exports.runtime_error = function (r, e) { return fast_coroutine_1.co_error({ message: e, range: r }); };
exports.init_array_val = function (len) { return ({ elements: Immutable.Map(Immutable.Range(0, len).map(function (i) { return [i, exports.mk_unit_val]; })), length: len }); };
exports.init_array_with_args_val = function (vals) { return ({ elements: Immutable.Map(Immutable.Range(0, vals.length).toArray().map(function (i) { return [i, vals[i]]; })), length: vals.length }); };
exports.empty_scope_val = Immutable.Map();
exports.empty_scopes_val = Immutable.Map().set(0, exports.empty_scope_val);
exports.mk_unit_val = ({ v: ts_bccc_1.apply(ts_bccc_1.unit(), {}), k: "u" });
exports.mk_string_val = function (v) { return ({ v: v, k: "s" }); };
exports.mk_int_val = function (v) { return ({ v: Math.floor(v), k: "i" }); };
exports.mk_float_val = function (v) { return ({ v: v, k: "f" }); };
exports.mk_arr_val = function (v) { return ({ v: v, k: "arr" }); };
exports.mk_tuple_val = function (v) { return ({ v: v, k: "tuple" }); };
exports.mk_bool_val = function (v) { return ({ v: v, k: "b" }); };
exports.mk_lambda_val = function (l) { return ({ v: l, k: "lambda" }); };
exports.mk_obj_val = function (o) { return ({ v: o, k: "obj" }); };
exports.mk_record_val = function (o) { return ({ v: o, k: "record" }); };
exports.mk_ref_val = function (r) { return ({ v: r, k: "ref" }); };
exports.mk_render_surface_val = function (s) { return ({ v: s, k: "render surface" }); };
exports.mk_circle_op = function (x, y, radius, color) { return ({ kind: "circle", x: x, y: y, radius: radius, color: color }); };
exports.mk_square_op = function (x, y, side, color, rotation) { return ({ kind: "square", x: x, y: y, side: side, color: color, rotation: rotation }); };
exports.mk_ellipse_op = function (x, y, width, height, color, rotation) { return ({ kind: "ellipse", x: x, y: y, width: width, height: height, color: color, rotation: rotation }); };
exports.mk_rectangle_op = function (x, y, width, height, color, rotation) { return ({ kind: "rectangle", x: x, y: y, width: width, height: height, color: color, rotation: rotation }); };
exports.mk_line_op = function (x1, y1, x2, y2, width, color, rotation) {
    return ({ kind: "line", x1: x1, y1: y1, x2: x2, y2: y2, width: width, color: color, rotation: rotation });
};
exports.mk_polygon_op = function (points, color, rotation) {
    return ({ kind: "polygon", points: points, color: color, rotation: rotation });
};
exports.mk_text_op = function (t, x, y, size, color, rotation) {
    return ({ kind: "text", t: t, x: x, y: y, size: size, color: color, rotation: rotation });
};
exports.mk_sprite_op = function (sprite, x, y, width, height, rotation) { return ({ kind: "sprite", sprite: sprite, x: x, y: y, width: width, height: height, rotation: rotation }); };
exports.mk_other_surface_op = function (s, dx, dy, sx, sy, rotation) { return ({ kind: "other surface", s: s, dx: dx, dy: dy, sx: sx, sy: sy, rotation: rotation }); };
exports.mk_render_surface_operation_val = function (s) { return ({ v: s, k: "render surface operation" }); };
exports.tuple_to_record = function (v, labels) { return v.k == "tuple" ?
    exports.mk_record_val(Immutable.Map(v.v.map(function (a, a_i) { return [labels[a_i], a]; }))) : v; };
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
exports.load_rt = function (v_name) { return function (x) {
    if (!x.stack.isEmpty()) {
        var res = find_last_scope(x.stack.get(x.stack.count() - 1), function (scope) { return scope.has(v_name) ? { kind: "right", value: scope } : { kind: "left", value: {} }; });
        if (res.kind == "right")
            return ts_bccc_1.apply(ts_bccc_1.inr(), ts_bccc_1.apply(ts_bccc_1.inl(), res.value.get(v_name)));
    }
    var maybe_in_globals = find_last_scope(x.globals, function (scope) { return scope.has(v_name) ? { kind: "right", value: scope } : { kind: "left", value: {} }; });
    if (maybe_in_globals.kind == "right") {
        return ts_bccc_1.apply(ts_bccc_1.inr(), ts_bccc_1.apply(ts_bccc_1.inl(), maybe_in_globals.value.get(v_name)));
    }
    return ts_bccc_1.apply(ts_bccc_1.inl(), {});
}; };
exports.store_rt = function (v_name, val) { return function (m) {
    if (!m.stack.isEmpty()) {
        var scopes1_1 = update_variable(v_name, val, m.stack.get(m.stack.count() - 1), true);
        if (scopes1_1.kind == "right") {
            return (__assign({}, m, { stack: m.stack.set(m.stack.count() - 1, scopes1_1.value) }));
        }
    }
    var scopes1 = update_variable(v_name, val, m.globals, true);
    if (scopes1.kind == "right") {
        return (__assign({}, m, { globals: scopes1.value }));
    }
    return m;
}; };
exports.decl_rt = function (v_name, val) { return function (m) {
    if (m.stack.count() > 0) {
        return (__assign({}, m, { stack: m.stack.set(m.stack.count() - 1, m.stack.last().set(m.stack.last().count() - 1, m.stack.last().last().set(v_name, val))) }));
    }
    else {
        return (__assign({}, m, { globals: m.globals.set(m.globals.count() - 1, m.globals.last().set(v_name, val)) }));
    }
}; };
exports.load_class_def_rt = function (v_name) { return function (x) {
    return x.classes.has(v_name) ? ts_bccc_1.apply(ts_bccc_1.inr(), x.classes.get(v_name)) : ts_bccc_1.apply(ts_bccc_1.inl(), {});
}; };
exports.store_class_def_rt = function (v_name, i) { return function (x) {
    return (__assign({}, x, { classes: x.classes.set(v_name, i) }));
}; };
exports.load_fun_def_rt = function (v_name) { return function (x) {
    return x.functions.has(v_name) ?
        ts_bccc_1.apply(ts_bccc_1.inr(), x.functions.get(v_name))
        : ts_bccc_1.apply(ts_bccc_1.inl(), {});
}; };
exports.store_fun_def_rt = function (v_name, l) { return function (x) {
    return (__assign({}, x, { functions: x.functions.set(v_name, l) }));
}; };
exports.load_heap_rt = function (v_name) { return function (x) {
    return x.heap.has(v_name) ?
        ts_bccc_1.apply(ts_bccc_1.inr(), x.heap.get(v_name))
        : ts_bccc_1.apply(ts_bccc_1.inl(), {});
}; };
exports.store_heap_rt = function (v_name, val) { return function (x) {
    var res = (__assign({}, x, { heap: x.heap.set(v_name, val) }));
    return res;
}; };
exports.heap_alloc_rt = function (val) { return function (x) {
    var new_ref = "ref_" + x.heap.count();
    return [ts_bccc_1.apply(ts_bccc_1.inl(), exports.mk_ref_val(new_ref)), __assign({}, x, { heap: x.heap.set(new_ref, val) })];
}; };
exports.push_inner_scope_rt = function (s) { return fast_coroutine_1.co_change_state(function (m) {
    if (!m.stack.isEmpty()) {
        var stack_count = m.stack.count();
        var top_stack = m.stack.last();
        var top_stack_count = top_stack.count();
        return (__assign({}, m, { stack: m.stack.set(stack_count - 1, top_stack.set(top_stack_count, s)) }));
    }
    else {
        return (__assign({}, m, { globals: m.globals.set(m.globals.count(), s) }));
    }
}); };
exports.pop_inner_scope_rt = function () { return fast_coroutine_1.co_change_state(function (m) {
    if (!m.stack.isEmpty()) {
        var stack_count = m.stack.count();
        var top_stack = m.stack.get(stack_count - 1);
        var top_stack_count = top_stack.count();
        return (__assign({}, m, { stack: m.stack.set(stack_count - 1, top_stack.remove(top_stack_count - 1)) }));
    }
    else {
        return (__assign({}, m, { globals: m.globals.remove(m.globals.count() - 1) }));
    }
}); };
exports.push_scope_rt = function (s) { return fast_coroutine_1.co_change_state(function (m) {
    return (__assign({}, m, { stack: m.stack.set(m.stack.count(), Immutable.Map().set(0, s)) }));
}); };
exports.pop_scope_rt = function (x) {
    return !x.stack.isEmpty() ?
        ts_bccc_1.apply(ts_bccc_1.inr(), (__assign({}, x, { stack: x.stack.remove(x.stack.count() - 1) })))
        : ts_bccc_1.apply(ts_bccc_1.inl(), {});
};
exports.empty_memory_rt = function (c_a) { return ({ highlighting: source_range_1.mk_range(0, 0, 0, 0),
    globals: exports.empty_scopes_val,
    heap: exports.empty_scope_val,
    functions: Immutable.Map(),
    classes: Immutable.Map(),
    stack: Immutable.Map(),
    fs: Immutable.Map(),
    custom_alert: c_a,
    steps_counter: 0 }); };
exports.set_highlighting_rt = function (r) {
    return fast_coroutine_1.co_change_state(function (m) { return (__assign({}, m, { highlighting: r })); }).combine(fast_coroutine_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), exports.mk_unit_val)));
};
exports.set_v_expr_rt = function (v, e) {
    return e.then(function (e_val) {
        // console.log(`Setting ${v} to ${JSON.stringify(e_val)}`) ||
        return exports.set_v_rt(v, e_val);
    });
};
exports.set_v_rt = function (v, vals) {
    var val = vals.value;
    var f = exports.store_rt(v, val);
    return fast_coroutine_1.co_change_state(f).combine(fast_coroutine_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), exports.mk_unit_val)));
};
exports.decl_v_rt = function (v, vals) {
    var val = vals.value;
    var f = exports.decl_rt(v, val);
    return fast_coroutine_1.co_change_state(f).combine(fast_coroutine_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), exports.mk_unit_val)));
};
exports.get_v_rt = function (r, v) {
    return fast_coroutine_1.co_from_state(exports.load_rt(v)).then(function (load_res) {
        if (load_res.kind == "left")
            return fast_coroutine_1.co_error({ message: "Error: variable " + v + " cannot be found.", range: r });
        return fast_coroutine_1.co_unit(load_res.value);
    });
};
exports.new_obj_rt = function () {
    return fast_coroutine_1.co_from_and_change_state(exports.heap_alloc_rt(exports.mk_obj_val(exports.empty_scope_val)));
};
exports.new_arr_rt = function (len) {
    return fast_coroutine_1.co_from_and_change_state(exports.heap_alloc_rt(exports.mk_arr_val(exports.init_array_val(len))));
};
exports.mk_expr_from_val = function (v) {
    return fast_coroutine_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), v));
};
exports.new_arr_with_args_rt = function (args) {
    return fast_coroutine_1.co_from_and_change_state(exports.heap_alloc_rt(exports.mk_arr_val(exports.init_array_with_args_val(args.map(function (arg) { return arg.value; })))));
};
exports.new_arr_expr_rt = function (r, len) {
    return len.then(function (len_v) { return len_v.value.k != "i" ? exports.runtime_error(r, "Cannot create array of length " + len_v.value.v + " as it is not an integer.") : exports.new_arr_rt(len_v.value.v); });
};
exports.new_arr_expr_with_values_rt = function (args) {
    return fast_coroutine_1.comm_list_coroutine(Immutable.List(args)).then(function (args_v) { return exports.new_arr_with_args_rt(args_v.toArray()); });
    // len.then(len_v => len_v.value.k != "i" ? runtime_error(r, `Cannot create array of length ${len_v.value.v} as it is not an integer.`) : new_arr_rt(len_v.value.v))
};
exports.get_arr_len_rt = function (r, a_ref) {
    return a_ref.k != "ref" ? exports.runtime_error(r, "Cannot lookup element on " + a_ref.v + " as it is not an array reference.") :
        exports.get_heap_v_rt(r, a_ref.v).then(function (a_val) {
            return a_val.value.k != "arr" ? exports.runtime_error(r, "Cannot lookup element on " + a_val.value.v + " as it is not an array.") :
                fast_coroutine_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), exports.mk_int_val(a_val.value.v.length)));
        });
};
exports.get_arr_len_expr_rt = function (r, a) {
    return a.then(function (a_val) { return exports.get_arr_len_rt(r, a_val.value); });
};
exports.get_arr_el_rt = function (r, a_ref, i) {
    return a_ref.k != "ref" ? exports.runtime_error(r, "Cannot lookup element on " + a_ref.v + " as it is not an array reference.") :
        exports.get_heap_v_rt(r, a_ref.v).then(function (a_val) {
            return a_val.value.k != "arr" ? exports.runtime_error(r, "Cannot lookup element on " + a_val.value.v + " as it is not an array.") :
                !a_val.value.v.elements.has(i) ? exports.runtime_error(r, "Cannot find element " + i + " on " + a_val.value.v + ".") :
                    fast_coroutine_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), a_val.value.v.elements.get(i)));
        });
};
exports.get_arr_el_expr_rt = function (r, a, i) {
    return a.then(function (a_val) {
        return i.then(function (i_val) {
            return i_val.value.k != "i" ? exports.runtime_error(r, "Index " + i_val + " is not an integer.") :
                exports.get_arr_el_rt(r, a_val.value, i_val.value.v);
        });
    });
};
exports.set_arr_el_rt = function (r, a_ref, i, v) {
    return a_ref.k != "ref" ? exports.runtime_error(r, "Cannot lookup element on " + a_ref.v + " as it is not an array reference.") :
        exports.get_heap_v_rt(r, a_ref.v).then(function (a_val) {
            return a_val.value.k != "arr" ? exports.runtime_error(r, "Cannot lookup element on " + a_val.value.v + " as it is not an array.") :
                exports.set_heap_v_rt(a_ref.v, __assign({}, a_val.value, { v: __assign({}, a_val.value.v, { length: Math.max(i + 1, a_val.value.v.length), elements: a_val.value.v.elements.set(i, v) }) }));
        });
};
exports.set_arr_el_expr_rt = function (r, a, i, e) {
    return a.then(function (a_val) {
        return i.then(function (i_val) {
            if (i_val.value.k != "i")
                return exports.runtime_error(r, "Index " + i_val + " is not an integer.");
            var i = i_val.value;
            return e.then(function (e_val) { return exports.set_arr_el_rt(r, a_val.value, i.v, e_val.value); });
        });
    });
};
exports.set_heap_v_rt = function (v, val) {
    return fast_coroutine_1.co_change_state(exports.store_heap_rt(v, val)).combine(fast_coroutine_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), exports.mk_unit_val)));
};
exports.get_heap_v_rt = function (r, v) {
    return fast_coroutine_1.co_from_state(exports.load_heap_rt(v)).then(function (loaded_val) {
        if (loaded_val.kind == "left")
            return fast_coroutine_1.co_error({ message: "Cannot find heap entry " + v + ".", range: r });
        return fast_coroutine_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), loaded_val.value));
    });
};
exports.set_class_def_rt = function (v, int) {
    return fast_coroutine_1.co_change_state(exports.store_class_def_rt(v, int)).combine(fast_coroutine_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), exports.mk_unit_val)));
};
exports.get_class_def_rt = function (r, v) {
    return fast_coroutine_1.co_from_state(exports.load_class_def_rt(v)).then(function (loaded_val) {
        if (loaded_val.kind == "left")
            return fast_coroutine_1.co_error({ message: "Cannot find class " + v + ".", range: r });
        return fast_coroutine_1.co_unit(loaded_val.value);
    });
};
exports.set_fun_def_rt = function (v, l) {
    return fast_coroutine_1.co_change_state(exports.store_fun_def_rt(v, l)).combine(fast_coroutine_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), exports.mk_unit_val)));
};
exports.get_fun_def_rt = function (r, v) {
    return fast_coroutine_1.co_from_state(exports.load_fun_def_rt(v)).then(function (loaded_val) {
        if (loaded_val.kind == "left")
            return fast_coroutine_1.co_error({ message: "Cannot find function definition " + v + ".", range: r });
        return fast_coroutine_1.co_unit(loaded_val.value);
    });
};
