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
var grammar_1 = require("./grammar");
var source_range_1 = require("../source_range");
var ccc_aux_1 = require("../ccc_aux");
var Immutable = require("immutable");
exports.parser_or = function (p, q) {
    return ccc_aux_1.co_catch(exports.merge_errors)(p)(q);
};
exports.mk_generic_type_decl = function (r, f, args) {
    return ({ range: r, ast: { kind: "generic type decl", f: f, args: args } });
};
exports.mk_get_array_value_at = function (r, a, actual) {
    return ({ range: r, ast: { kind: "get_array_value_at", array: a, index: actual } });
};
exports.mk_ternary_if = function (r, condition, then_else) {
    return ({ range: r, ast: { kind: "ternary_if", condition: condition, then_else: then_else } });
};
exports.mk_ternary_then_else = function (r, _then, _else) {
    return ({ range: r, ast: { kind: "ternary_then_else", _then: _then, _else: _else } });
};
exports.mk_array_decl = function (r, t) {
    return ({ range: r, ast: { kind: "array decl", t: t } });
};
exports.mk_tuple_type_decl = function (r, args) {
    return ({ range: r, ast: { kind: "tuple type decl", args: args } });
};
exports.mk_record_type_decl = function (r, args) {
    return ({ range: r, ast: { kind: "record type decl", args: args } });
};
exports.mk_string = function (v, sr) { return ({ range: sr, ast: { kind: "string", value: v } }); };
exports.mk_bracket = function (e, r) { return ({ range: r, ast: { kind: "bracket", e: e } }); };
exports.mk_unit = function (sr) { return ({ range: sr, ast: { kind: "unit" } }); };
exports.mk_bool = function (v, sr) { return ({ range: sr, ast: { kind: "bool", value: v } }); };
exports.mk_int = function (v, sr) { return ({ range: sr, ast: { kind: "int", value: v } }); };
exports.mk_float = function (v, sr) { return ({ range: sr, ast: { kind: "float", value: v } }); };
exports.mk_double = function (v, sr) { return ({ range: sr, ast: { kind: "double", value: v } }); };
exports.mk_identifier = function (v, sr) { return ({ range: sr, ast: { kind: "id", value: v } }); };
exports.mk_noop = function () { return ({ range: source_range_1.mk_range(-1, -1, -1, -1), ast: { kind: "noop" } }); };
exports.mk_return = function (e, range) { return ({ range: range, ast: { kind: "return", value: e } }); };
exports.mk_args = function (sr, ds) { return ({ range: sr, ast: { kind: "args", value: Immutable.List(ds) } }); };
exports.mk_decl_and_init = function (l, r, v) { return ({ kind: "decl and init", l: l, r: r, v: v }); };
exports.mk_decl = function (l, r) { return ({ kind: "decl", l: l, r: r }); };
exports.mk_assign = function (l, r) { return ({ range: source_range_1.join_source_ranges(l.range, r.range), ast: { kind: "=", l: l, r: r } }); };
exports.mk_for = function (range, i, c, s, b) { return ({ range: range, ast: { kind: "for", i: i, c: c, s: s, b: b } }); };
exports.mk_while = function (range, c, b) { return ({ range: range, ast: { kind: "while", c: c, b: b } }); };
exports.mk_if_then = function (range, c, t) { return ({ range: range, ast: { kind: "if", c: c, t: t, e: ts_bccc_1.apply(ccc_aux_1.none(), {}) } }); };
exports.mk_if_then_else = function (range, c, t, e) { return ({ range: range, ast: { kind: "if", c: c, t: t, e: ts_bccc_1.apply(ccc_aux_1.some(), e) } }); };
exports.mk_field_ref = function (l, r) { return ({ range: source_range_1.join_source_ranges(l.range, r.range), ast: { kind: ".", l: l, r: r } }); };
exports.mk_semicolon = function (l, r) { return ({ range: source_range_1.join_source_ranges(l.range, r.range), ast: { kind: ";", l: l, r: r } }); };
exports.mk_bin_op = function (k) { return function (l, r) { return ({ range: source_range_1.join_source_ranges(l.range, r.range), ast: { kind: k, l: l, r: r } }); }; };
exports.mk_pair = exports.mk_bin_op(",");
exports.mk_arrow = exports.mk_bin_op("=>");
exports.mk_as = exports.mk_bin_op("as");
exports.mk_plus = exports.mk_bin_op("+");
exports.mk_minus = exports.mk_bin_op("-");
exports.mk_times = exports.mk_bin_op("*");
exports.mk_div = exports.mk_bin_op("/");
exports.mk_mod = exports.mk_bin_op("%");
exports.mk_lt = exports.mk_bin_op("<");
exports.mk_gt = exports.mk_bin_op(">");
exports.mk_leq = exports.mk_bin_op("<=");
exports.mk_geq = exports.mk_bin_op(">=");
exports.mk_eq = exports.mk_bin_op("==");
exports.mk_neq = exports.mk_bin_op("!=");
exports.mk_and = exports.mk_bin_op("&&");
exports.mk_or = exports.mk_bin_op("||");
exports.mk_xor = exports.mk_bin_op("xor");
exports.mk_unary_op = function (k) { return function (e) { return ({ range: e.range, ast: { kind: k, e: e } }); }; };
exports.mk_not = exports.mk_unary_op("not");
exports.mk_call = function (f_name, actuals, range) {
    return ({ range: range,
        ast: { kind: "func_call", name: f_name, actuals: actuals } });
};
exports.mk_constructor_call = function (new_range, C_name, actuals) {
    return ({ range: new_range, ast: { kind: "cons_call", name: C_name, actuals: actuals } });
};
exports.mk_array_cons_call = function (new_range, _type, actual) {
    return ({ range: new_range, ast: { kind: "array_cons_call", type: _type, actual: actual } });
};
exports.mk_array_cons_call_and_init = function (new_range, _type, actuals) {
    return ({ range: new_range, ast: { kind: "array_cons_call_and_init", type: _type, actuals: actuals } });
};
exports.mk_constructor_declaration = function (range, function_name, arg_decls, params_base_call, body) {
    return ({ kind: "cons_decl", name: function_name, arg_decls: arg_decls, body: body, params_base_call: params_base_call, range: range });
};
exports.mk_function_declaration = function (range, return_type, function_name, arg_decls, body) {
    return ({ kind: "func_decl", name: function_name, return_type: return_type, arg_decls: arg_decls, body: body, range: range, params_base_call: [] });
};
exports.mk_class_declaration = function (C_name, extends_or_implements, fields, methods, constructors, range) {
    return ({ range: range,
        ast: { kind: "class", C_name: C_name,
            extends_or_implements: extends_or_implements,
            fields: fields, methods: methods, constructors: constructors } });
};
exports.mk_private = function (sr) { return ({ range: sr, ast: { kind: "private" } }); };
exports.mk_public = function (sr) { return ({ range: sr, ast: { kind: "public" } }); };
exports.mk_protected = function (sr) { return ({ range: sr, ast: { kind: "protected" } }); };
exports.mk_static = function (sr) { return ({ range: sr, ast: { kind: "static" } }); };
exports.mk_override = function (sr) { return ({ range: sr, ast: { kind: "override" } }); };
exports.mk_virtual = function (sr) { return ({ range: sr, ast: { kind: "virtual" } }); };
exports.mk_dbg = function (sr) { return ({ range: sr, ast: { kind: "debugger" } }); };
exports.mk_tc_dbg = function (sr) { return ({ range: sr, ast: { kind: "typechecker_debugger" } }); };
exports.mk_empty_surface = function (sr, w, h, col) { return ({ range: sr, ast: { kind: "empty surface", w: w, h: h, color: col } }); };
exports.mk_circle = function (sr, cx, cy, r, col) { return ({ range: sr, ast: { kind: "circle", cx: cx, cy: cy, r: r, color: col } }); };
exports.mk_square = function (sr, cx, cy, s, col, rotation) { return ({ range: sr, ast: { kind: "square", cx: cx, cy: cy, s: s, color: col, rotation: rotation } }); };
exports.mk_ellipse = function (sr, cx, cy, w, h, col, rotation) { return ({ range: sr, ast: { kind: "ellipse", cx: cx, cy: cy, w: w, h: h, color: col, rotation: rotation } }); };
exports.mk_rectangle = function (sr, cx, cy, w, h, col, rotation) { return ({ range: sr, ast: { kind: "rectangle", cx: cx, cy: cy, w: w, h: h, color: col, rotation: rotation } }); };
exports.mk_sprite = function (sr, sprite, cx, cy, w, h, rot) { return ({ range: sr, ast: { kind: "sprite", cx: cx, cy: cy, w: w, h: h, sprite: sprite, rotation: rot } }); };
exports.mk_line = function (sr, x1, y1, x2, y2, width, color, rotation) { return ({ range: sr, ast: { kind: "line", x1: x1, y1: y1, x2: x2, y2: y2, width: width, color: color, rotation: rotation } }); };
exports.mk_polygon = function (sr, points, color, rotation) { return ({ range: sr, ast: { kind: "polygon", points: points, color: color, rotation: rotation } }); };
exports.mk_text = function (sr, t, x, y, size, color, rotation) { return ({ range: sr, ast: { kind: "text", t: t, x: x, y: y, size: size, color: color, rotation: rotation } }); };
exports.mk_other_surface = function (sr, s, dx, dy, sx, sy, rotation) { return ({ range: sr, ast: { kind: "other surface", s: s, dx: dx, dy: dy, sx: sx, sy: sy, rotation: rotation } }); };
exports.mk_empty_surface_prs = function () {
    return exports.empty_surface_keyword.then(function (esk) {
        return exports.term(true).then(function (l) {
            return exports.term(true).then(function (r) {
                return exports.term(true).then(function (col) {
                    return ts_bccc_1.co_unit(exports.mk_empty_surface(source_range_1.join_source_ranges(esk, col.range), l, r, col));
                });
            });
        });
    });
};
exports.mk_circle_prs = function () {
    return exports.circle_keyword.then(function (kw) {
        return exports.term(true).then(function (cx) {
            return exports.term(true).then(function (cy) {
                return exports.term(true).then(function (r) {
                    return exports.term(true).then(function (col) {
                        return ts_bccc_1.co_unit(exports.mk_circle(source_range_1.join_source_ranges(kw, col.range), cx, cy, r, col));
                    });
                });
            });
        });
    });
};
exports.mk_square_prs = function () {
    return exports.square_keyword.then(function (kw) {
        return exports.term(true).then(function (cx) {
            return exports.term(true).then(function (cy) {
                return exports.term(true).then(function (r) {
                    return exports.term(true).then(function (col) {
                        return exports.term(true).then(function (rot) {
                            return ts_bccc_1.co_unit(exports.mk_square(source_range_1.join_source_ranges(kw, col.range), cx, cy, r, col, rot));
                        });
                    });
                });
            });
        });
    });
};
exports.mk_ellipse_prs = function () {
    return exports.ellipse_keyword.then(function (kw) {
        return exports.term(true).then(function (cx) {
            return exports.term(true).then(function (cy) {
                return exports.term(true).then(function (w) {
                    return exports.term(true).then(function (h) {
                        return exports.term(true).then(function (col) {
                            return exports.term(true).then(function (rot) {
                                return ts_bccc_1.co_unit(exports.mk_ellipse(source_range_1.join_source_ranges(kw, col.range), cx, cy, w, h, col, rot));
                            });
                        });
                    });
                });
            });
        });
    });
};
exports.mk_rectangle_prs = function () {
    return exports.rectangle_keyword.then(function (kw) {
        return exports.term(true).then(function (cx) {
            return exports.term(true).then(function (cy) {
                return exports.term(true).then(function (w) {
                    return exports.term(true).then(function (h) {
                        return exports.term(true).then(function (col) {
                            return exports.term(true).then(function (rot) {
                                return ts_bccc_1.co_unit(exports.mk_rectangle(source_range_1.join_source_ranges(kw, col.range), cx, cy, w, h, col, rot));
                            });
                        });
                    });
                });
            });
        });
    });
};
exports.mk_line_prs = function () {
    return exports.line_keyword.then(function (kw) {
        return exports.term(true).then(function (x1) {
            return exports.term(true).then(function (y1) {
                return exports.term(true).then(function (x2) {
                    return exports.term(true).then(function (y2) {
                        return exports.term(true).then(function (w) {
                            return exports.term(true).then(function (col) {
                                return exports.term(true).then(function (rot) {
                                    return ts_bccc_1.co_unit(exports.mk_line(source_range_1.join_source_ranges(kw, col.range), x1, y1, x2, y2, w, col, rot));
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};
exports.mk_polygon_prs = function () {
    return exports.polygon_keyword.then(function (kw) {
        return exports.term(true).then(function (points) {
            return exports.term(true).then(function (col) {
                return exports.term(true).then(function (rot) {
                    return ts_bccc_1.co_unit(exports.mk_polygon(source_range_1.join_source_ranges(kw, col.range), points, col, rot));
                });
            });
        });
    });
};
exports.mk_text_prs = function () {
    return exports.text_keyword.then(function (kw) {
        return exports.term(true).then(function (t) {
            return exports.term(true).then(function (x) {
                return exports.term(true).then(function (y) {
                    return exports.term(true).then(function (size) {
                        return exports.term(true).then(function (col) {
                            return exports.term(true).then(function (rot) {
                                return ts_bccc_1.co_unit(exports.mk_text(source_range_1.join_source_ranges(kw, col.range), t, x, y, size, col, rot));
                            });
                        });
                    });
                });
            });
        });
    });
};
exports.mk_sprite_prs = function () {
    return exports.sprite_keyword.then(function (kw) {
        return exports.term(true).then(function (sprite) {
            return exports.term(true).then(function (cx) {
                return exports.term(true).then(function (cy) {
                    return exports.term(true).then(function (w) {
                        return exports.term(true).then(function (h) {
                            return exports.term(true).then(function (rot) {
                                return ts_bccc_1.co_unit(exports.mk_sprite(source_range_1.join_source_ranges(kw, rot.range), sprite, cx, cy, w, h, rot));
                            });
                        });
                    });
                });
            });
        });
    });
};
exports.mk_other_surface_prs = function () {
    return exports.other_surface_keyword.then(function (kw) {
        return exports.term(true).then(function (s) {
            return exports.term(true).then(function (dx) {
                return exports.term(true).then(function (dy) {
                    return exports.term(true).then(function (sx) {
                        return exports.term(true).then(function (sy) {
                            return exports.term(true).then(function (rot) {
                                return ts_bccc_1.co_unit(exports.mk_other_surface(source_range_1.join_source_ranges(kw, sy.range), s, dx, dy, sx, sy, rot));
                            });
                        });
                    });
                });
            });
        });
    });
};
exports.term = function (try_par) {
    return exports.parser_or(exports.mk_empty_surface_prs(), exports.parser_or(exports.mk_circle_prs(), exports.parser_or(exports.mk_square_prs(), exports.parser_or(exports.mk_ellipse_prs(), exports.parser_or(exports.mk_rectangle_prs(), exports.parser_or(exports.mk_line_prs(), exports.parser_or(exports.mk_polygon_prs(), exports.parser_or(exports.mk_text_prs(), exports.parser_or(exports.mk_sprite_prs(), exports.parser_or(exports.mk_other_surface_prs(), exports.parser_or(exports.bool, exports.parser_or(exports.float, exports.parser_or(exports.double, exports.parser_or(exports.int, exports.parser_or(exports.string, try_par ?
        exports.parser_or(exports.identifier, grammar_1.par.then(function (res) { return ts_bccc_1.co_unit(exports.mk_bracket(res.val[0], res.range)); }))
        : exports.identifier)))))))))))))));
};
exports.unary_expr = function () {
    return exports.not_op.then(function (_) {
        return grammar_1.expr().then(function (e) {
            return ts_bccc_1.co_unit(exports.mk_not(e));
        });
    });
};
exports.newline_sign = ts_bccc_1.co_get_state().then(function (s) {
    if (s.tokens.isEmpty())
        return ts_bccc_1.co_error({ range: source_range_1.mk_range(-1, 0, 0, 0), priority: s.branch_priority, message: "found empty state, expected newline" });
    var i = s.tokens.first();
    if (i.kind == "nl") {
        return ts_bccc_1.co_set_state(__assign({}, s, { tokens: s.tokens.rest().toList() })).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error({ range: i.range, priority: s.branch_priority, message: "expected newline" });
});
exports.whitespace_sign = ts_bccc_1.co_get_state().then(function (s) {
    if (s.tokens.isEmpty())
        return ts_bccc_1.co_error({ range: source_range_1.mk_range(-1, 0, 0, 0), priority: s.branch_priority, message: "found empty state, expected whitespace" });
    var i = s.tokens.first();
    if (i.kind == " ") {
        return ts_bccc_1.co_set_state(__assign({}, s, { tokens: s.tokens.rest().toList() })).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error({ range: i.range, priority: s.branch_priority, message: "expected whitespace" });
});
exports.merge_errors = function (e1, e2) {
    var res = e1.priority > e2.priority ? e1 :
        e2.priority > e1.priority ? e2 :
            ({ priority: Math.max(e1.priority, e2.priority), message: e1.message + " or " + e2.message, range: source_range_1.join_source_ranges(e1.range, e2.range) });
    // let show = [{p:e1.priority, m:e1.message},{p:e2.priority, m:e2.message},{p:res.priority, m:res.message}]
    // if (res.priority > 50) console.log("merging errors", JSON.stringify(show))
    return res;
};
exports.whitespace = function () {
    return ccc_aux_1.co_repeat(exports.parser_or(exports.newline_sign, exports.whitespace_sign)).then(function (_) { return ts_bccc_1.co_unit({}); });
};
exports.ignore_whitespace = function (p) { return exports.whitespace().then(function (_) { return p.then(function (p_res) { return exports.whitespace().then(function (_) { return ts_bccc_1.co_unit(p_res); }); }); }); };
exports.symbol = function (token_kind, token_name) { return exports.ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.tokens.isEmpty())
        return ts_bccc_1.co_error({ range: source_range_1.mk_range(-1, 0, 0, 0), priority: s.branch_priority, message: "found empty state, expected " + token_name });
    var i = s.tokens.first();
    if (i.kind == token_kind) {
        return ts_bccc_1.co_set_state(__assign({}, s, { tokens: s.tokens.rest().toList() })).then(function (_) { return ts_bccc_1.co_unit(i.range); });
    }
    else {
        // if (token_kind == ";") console.log(`Failed ; lookup on ${s.branch_priority}`)
        return ts_bccc_1.co_error({ range: i.range, priority: s.branch_priority, message: "expected '" + token_name + "', found '" + i.kind + "'" });
    }
})); };
exports.binop_sign = function (k) { return exports.ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.tokens.isEmpty())
        return ts_bccc_1.co_error({ range: source_range_1.mk_range(-1, 0, 0, 0), priority: s.branch_priority, message: "found empty state, expected " + k });
    var i = s.tokens.first();
    if (i.kind == k) {
        return ts_bccc_1.co_set_state(__assign({}, s, { tokens: s.tokens.rest().toList() })).then(function (_) { return ts_bccc_1.co_unit(i.range); });
    }
    else
        return ts_bccc_1.co_error({ range: i.range, priority: s.branch_priority, message: "expected '" + k + "'" });
})); };
exports.unaryop_sign = function (k) { return exports.ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.tokens.isEmpty())
        return ts_bccc_1.co_error({ range: source_range_1.mk_range(-1, 0, 0, 0), priority: s.branch_priority, message: "found empty state, expected " + k });
    var i = s.tokens.first();
    if (i.kind == k) {
        return ts_bccc_1.co_set_state(__assign({}, s, { tokens: s.tokens.rest().toList() })).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error({ range: i.range, priority: s.branch_priority, message: "expected '" + k + "'" });
})); };
exports.string = exports.ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.tokens.isEmpty())
        return ts_bccc_1.co_error({ range: source_range_1.mk_range(-1, 0, 0, 0), priority: s.branch_priority, message: "found empty state, expected number" });
    var i = s.tokens.first();
    if (i.kind == "string") {
        var res_1 = exports.mk_string(i.v, i.range);
        return ts_bccc_1.co_set_state(__assign({}, s, { tokens: s.tokens.rest().toList() })).then(function (_) { return ts_bccc_1.co_unit(res_1); });
    }
    else
        return ts_bccc_1.co_error({ range: i.range, priority: s.branch_priority, message: "expected int" });
}));
exports.bool = exports.ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.tokens.isEmpty())
        return ts_bccc_1.co_error({ range: source_range_1.mk_range(-1, 0, 0, 0), priority: s.branch_priority, message: "found empty state, expected boolean" });
    var i = s.tokens.first();
    if (i.kind == "bool") {
        var res_2 = exports.mk_bool(i.v, i.range);
        return ts_bccc_1.co_set_state(__assign({}, s, { tokens: s.tokens.rest().toList() })).then(function (_) { return ts_bccc_1.co_unit(res_2); });
    }
    else
        return ts_bccc_1.co_error({ range: i.range, priority: s.branch_priority, message: "expected boolean" });
}));
exports.int = exports.ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.tokens.isEmpty())
        return ts_bccc_1.co_error({ range: source_range_1.mk_range(-1, 0, 0, 0), priority: s.branch_priority, message: "found empty state, expected int" });
    var i = s.tokens.first();
    if (i.kind == "int") {
        var res_3 = exports.mk_int(i.v, i.range);
        return ts_bccc_1.co_set_state(__assign({}, s, { tokens: s.tokens.rest().toList() })).then(function (_) { return ts_bccc_1.co_unit(res_3); });
    }
    else
        return ts_bccc_1.co_error({ range: i.range, priority: s.branch_priority, message: "expected int" });
}));
exports.float = exports.ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.tokens.isEmpty())
        return ts_bccc_1.co_error({ range: source_range_1.mk_range(-1, 0, 0, 0), priority: s.branch_priority, message: "found empty state, expected float" });
    var i = s.tokens.first();
    if (i.kind == "float") {
        var res_4 = exports.mk_float(i.v, i.range);
        return ts_bccc_1.co_set_state(__assign({}, s, { tokens: s.tokens.rest().toList() })).then(function (_) { return ts_bccc_1.co_unit(res_4); });
    }
    else
        return ts_bccc_1.co_error({ range: i.range, priority: s.branch_priority, message: "expected float" });
}));
exports.double = exports.ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.tokens.isEmpty())
        return ts_bccc_1.co_error({ range: source_range_1.mk_range(-1, 0, 0, 0), priority: s.branch_priority, message: "found empty state, expected double" });
    var i = s.tokens.first();
    if (i.kind == "double") {
        var res_5 = exports.mk_double(i.v, i.range);
        return ts_bccc_1.co_set_state(__assign({}, s, { tokens: s.tokens.rest().toList() })).then(function (_) { return ts_bccc_1.co_unit(res_5); });
    }
    else
        return ts_bccc_1.co_error({ range: i.range, priority: s.branch_priority, message: "expected double" });
}));
exports.negative_number = exports.ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.tokens.isEmpty())
        return ts_bccc_1.co_error({ range: source_range_1.mk_range(-1, 0, 0, 0), priority: s.branch_priority, message: "found empty state, expected a negative number" });
    var i = s.tokens.first();
    if (i.kind == "int" && i.v < 0) {
        var res_6 = exports.mk_int(i.v, i.range);
        return ts_bccc_1.co_set_state(__assign({}, s, { tokens: s.tokens.rest().toList() })).then(function (_) { return ts_bccc_1.co_unit(res_6); });
    }
    else if (i.kind == "float" && i.v < 0) {
        var res_7 = exports.mk_float(i.v, i.range);
        return ts_bccc_1.co_set_state(__assign({}, s, { tokens: s.tokens.rest().toList() })).then(function (_) { return ts_bccc_1.co_unit(res_7); });
    }
    else if (i.kind == "double" && i.v < 0) {
        var res_8 = exports.mk_double(i.v, i.range);
        return ts_bccc_1.co_set_state(__assign({}, s, { tokens: s.tokens.rest().toList() })).then(function (_) { return ts_bccc_1.co_unit(res_8); });
    }
    else
        return ts_bccc_1.co_error({ range: i.range, priority: s.branch_priority, message: "expected a negative number" });
}));
exports.identifier_token = exports.ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.tokens.isEmpty())
        return ts_bccc_1.co_error({ range: source_range_1.mk_range(-1, 0, 0, 0), priority: s.branch_priority, message: "found empty state, expected identifier" });
    var i = s.tokens.first();
    if (i.kind == "id") {
        var res_9 = i.v;
        var range_1 = i.range;
        return ts_bccc_1.co_set_state(__assign({}, s, { tokens: s.tokens.rest().toList() })).then(function (_) { return ts_bccc_1.co_unit({ id: res_9, range: range_1 }); });
    }
    else
        return ts_bccc_1.co_error({ range: i.range, priority: s.branch_priority, message: "expected identifier but found " + i.kind });
}));
exports.identifier = exports.ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.tokens.isEmpty())
        return ts_bccc_1.co_error({ range: source_range_1.mk_range(-1, 0, 0, 0), priority: s.branch_priority, message: "found empty state, expected identifier" });
    var i = s.tokens.first();
    if (i.kind == "id") {
        var res_10 = exports.mk_identifier(i.v, i.range);
        var range = i.range;
        return ts_bccc_1.co_set_state(__assign({}, s, { tokens: s.tokens.rest().toList() })).then(function (_) { return ts_bccc_1.co_unit(res_10); });
    }
    else
        return ts_bccc_1.co_error({ range: i.range, priority: s.branch_priority, message: "expected identifier but found " + i.kind });
}));
exports.return_sign = exports.symbol("return", "return");
exports.for_keyword = exports.symbol("for", "for");
exports.while_keyword = exports.symbol("while", "while");
exports.if_keyword = exports.symbol("if", "if");
exports.question_mark_keyword = exports.symbol("?", "?");
exports.colon_keyword = exports.symbol(":", ":");
exports.else_keyword = exports.symbol("else", "else");
exports.equal_sign = exports.symbol("=", "=");
exports.semicolon_sign = exports.symbol(";", "semicolon");
exports.comma_sign = exports.symbol(",", "comma");
exports.class_keyword = exports.symbol("class", "class");
exports.new_keyword = exports.symbol("new", "new");
exports.base = exports.symbol("base", "base");
exports.surface_keyword = exports.symbol("surface", "surface");
exports.empty_surface_keyword = exports.symbol("empty_surface", "empty_surface");
exports.sprite_keyword = exports.symbol("sprite", "sprite");
exports.circle_keyword = exports.symbol("circle", "circle");
exports.square_keyword = exports.symbol("square", "square");
exports.rectangle_keyword = exports.symbol("rectangle", "rectangle");
exports.ellipse_keyword = exports.symbol("ellipse", "ellipse");
exports.line_keyword = exports.symbol("line", "line");
exports.polygon_keyword = exports.symbol("polygon", "polygon");
exports.text_keyword = exports.symbol("text", "text");
exports.other_surface_keyword = exports.symbol("other_surface", "other_surface");
exports.left_bracket = exports.symbol("(", "(");
exports.right_bracket = exports.symbol(")", ")");
exports.left_square_bracket = exports.symbol("[", "[");
exports.right_square_bracket = exports.symbol("]", "]");
exports.left_curly_bracket = exports.symbol("{", "{");
exports.right_curly_bracket = exports.symbol("}", "}");
exports.dot_sign = exports.symbol(".", ".");
exports.private_modifier = exports.symbol("private", "private");
exports.public_modifier = exports.symbol("public", "public");
exports.protected_modifier = exports.symbol("protected", "protected");
exports.static_modifier = exports.symbol("static", "static");
exports.override_modifier = exports.symbol("override", "override");
exports.virtual_modifier = exports.symbol("virtual", "virtual");
exports.as_op = exports.binop_sign("as");
exports.plus_op = exports.binop_sign("+");
exports.minus_op = exports.binop_sign("-");
exports.times_op = exports.binop_sign("*");
exports.div_op = exports.binop_sign("/");
exports.mod_op = exports.binop_sign("%");
exports.lt_op = exports.binop_sign("<");
exports.gt_op = exports.binop_sign(">");
exports.leq_op = exports.binop_sign("<=");
exports.geq_op = exports.binop_sign(">=");
exports.eq_op = exports.binop_sign("==");
exports.neq_op = exports.binop_sign("!=");
exports.and_op = exports.binop_sign("&&");
exports.or_op = exports.binop_sign("||");
exports.xor_op = exports.binop_sign("xor");
exports.arrow_op = exports.binop_sign("=>");
exports.not_op = exports.unaryop_sign("not");
exports.eof = exports.ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.tokens.isEmpty())
        return ts_bccc_1.co_unit(source_range_1.zero_range);
    return ts_bccc_1.co_error({ range: s.tokens.first().range, message: "expected eof, found " + s.tokens.first().kind + " at " + source_range_1.print_range(s.tokens.first().range), priority: s.branch_priority });
}));
