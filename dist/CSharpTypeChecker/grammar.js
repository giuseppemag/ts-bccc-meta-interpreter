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
var source_range_1 = require("../source_range");
var ccc_aux_1 = require("../ccc_aux");
var CSharp = require("./csharp");
var GrammarBasics;
(function (GrammarBasics) {
    var parse_prefix_regex = function (r, t) { return ts_bccc_1.mk_coroutine(ts_bccc_1.fun(function (s) {
        var m = s.buffer.match(r);
        if (m == null || m.length == 0) {
            return ts_bccc_1.apply(ts_bccc_1.inl(), "Syntax error: cannot match token at (" + s.line_index + ", " + s.column_index + "), " + s.buffer.substr(0, Math.min(s.buffer.length, 5)) + "...");
        }
        else {
            var rest = s.buffer.replace(r, "");
            console.log("Lexing", r, s.buffer);
            console.log("Match", m);
            console.log("Rest", rest);
            var new_line_index = s.line_index;
            var new_column_index = s.column_index + m[0].length;
            var f = (ts_bccc_1.constant(t(m[0], source_range_1.mk_range(s.line_index, s.column_index, new_line_index, new_column_index))).times(ts_bccc_1.constant({ buffer: rest || "", line_index: new_line_index, column_index: new_column_index })));
            var g = f.then(ts_bccc_1.inr());
            var h = g.then(ts_bccc_1.inr());
            return ts_bccc_1.apply(h, {});
        }
    })); };
    var fst_err = function (x, y) { return x; };
    var lex_catch = ccc_aux_1.co_catch(fst_err);
    var lex_catch_many = function (tokens) { return tokens.isEmpty() ?
        ts_bccc_1.co_error("No lexer available.")
        :
            lex_catch(tokens.first())(lex_catch_many(tokens.rest().toList())); };
    var eof = parse_prefix_regex(/^$/, function (s, r) { return ({ range: r, kind: "eof" }); });
    var token = lex_catch_many(Immutable.List([
        parse_prefix_regex(/^;/, function (s, r) { return ({ range: r, kind: ";" }); }),
        parse_prefix_regex(/^class/, function (s, r) { return ({ range: r, kind: "class" }); }),
        parse_prefix_regex(/^return/, function (s, r) { return ({ range: r, kind: "return" }); }),
        parse_prefix_regex(/^while/, function (s, r) { return ({ range: r, kind: "while" }); }),
        parse_prefix_regex(/^if/, function (s, r) { return ({ range: r, kind: "if" }); }),
        parse_prefix_regex(/^else/, function (s, r) { return ({ range: r, kind: "else" }); }),
        parse_prefix_regex(/^empty_render_grid/, function (s, r) { return ({ range: r, kind: "mk_empty_render_grid" }); }),
        parse_prefix_regex(/^pixel/, function (s, r) { return ({ range: r, kind: "pixel" }); }),
        parse_prefix_regex(/^debugger/, function (s, r) { return ({ range: r, kind: "dbg" }); }),
        parse_prefix_regex(/^typechecker_debugger/, function (s, r) { return ({ range: r, kind: "tc-dbg" }); }),
        parse_prefix_regex(/^\n/, function (s, r) { return ({ range: r, kind: "nl" }); }),
        parse_prefix_regex(/^\+/, function (s, r) { return ({ range: r, kind: "+" }); }),
        parse_prefix_regex(/^\*/, function (s, r) { return ({ range: r, kind: "*" }); }),
        parse_prefix_regex(/^\-/, function (s, r) { return ({ range: r, kind: "-" }); }),
        parse_prefix_regex(/^\//, function (s, r) { return ({ range: r, kind: "/" }); }),
        parse_prefix_regex(/^%/, function (s, r) { return ({ range: r, kind: "%" }); }),
        parse_prefix_regex(/^<=/, function (s, r) { return ({ range: r, kind: "<=" }); }),
        parse_prefix_regex(/^>=/, function (s, r) { return ({ range: r, kind: "<=" }); }),
        parse_prefix_regex(/^</, function (s, r) { return ({ range: r, kind: "<" }); }),
        parse_prefix_regex(/^>/, function (s, r) { return ({ range: r, kind: ">" }); }),
        parse_prefix_regex(/^==/, function (s, r) { return ({ range: r, kind: "==" }); }),
        parse_prefix_regex(/^!=/, function (s, r) { return ({ range: r, kind: "!=" }); }),
        parse_prefix_regex(/^&&/, function (s, r) { return ({ range: r, kind: "&&" }); }),
        parse_prefix_regex(/^\^/, function (s, r) { return ({ range: r, kind: "xor" }); }),
        parse_prefix_regex(/^!/, function (s, r) { return ({ range: r, kind: "not" }); }),
        parse_prefix_regex(/^,/, function (s, r) { return ({ range: r, kind: "," }); }),
        parse_prefix_regex(/^\|\|/, function (s, r) { return ({ range: r, kind: "||" }); }),
        parse_prefix_regex(/^\./, function (s, r) { return ({ range: r, kind: "." }); }),
        parse_prefix_regex(/^\(/, function (s, r) { return ({ range: r, kind: "(" }); }),
        parse_prefix_regex(/^\)/, function (s, r) { return ({ range: r, kind: ")" }); }),
        parse_prefix_regex(/^{/, function (s, r) { return ({ range: r, kind: "{" }); }),
        parse_prefix_regex(/^}/, function (s, r) { return ({ range: r, kind: "}" }); }),
        parse_prefix_regex(/^".*"/, function (s, r) { return ({ range: r, kind: "string", v: s }); }),
        parse_prefix_regex(/^[0-9]+/, function (s, r) { return ({ range: r, kind: "int", v: parseInt(s) }); }),
        parse_prefix_regex(/^((true)|(false))/, function (s, r) { return ({ range: r, kind: "bool", v: (s == "true") }); }),
        parse_prefix_regex(/^[0-9]+.[0-9]+/, function (s, r) { return ({ range: r, kind: "float", v: parseFloat(s) }); }),
        parse_prefix_regex(/^=/, function (s, r) { return ({ range: r, kind: "=" }); }),
        parse_prefix_regex(/^\s+/, function (s, r) { return ({ range: r, kind: " " }); }),
        parse_prefix_regex(/^[a-zA-Z_][a-zA-Z0-9_]*/, function (s, r) { return ({ range: r, kind: "id", v: s }); })
    ]));
    GrammarBasics.tokenize = function (source) {
        var lines = source.split("\n");
        var tokens = Immutable.List();
        var line_index = 0;
        while (line_index < lines.length) {
            var line = lines[line_index];
            var line_tokens = ccc_aux_1.co_run_to_end(ccc_aux_1.co_repeat(token).then(function (ts) { return eof.then(function (_) { return ts_bccc_1.co_unit(ts); }); }), { buffer: line, line_index: line_index, column_index: 0 });
            if (line_tokens.kind == "left")
                return line_tokens;
            tokens = tokens.push.apply(tokens, line_tokens.value.fst);
            tokens = tokens.push({ kind: "nl", range: source_range_1.mk_range(line_index, line.length, line_index, line.length + 1) });
            line_index = line_index + 1;
        }
        return ts_bccc_1.apply(ts_bccc_1.inr(), tokens.toArray());
    };
})(GrammarBasics = exports.GrammarBasics || (exports.GrammarBasics = {}));
var proprity_operators_table = Immutable.Map()
    .set("*", 10)
    .set("/", 10)
    .set("%", 10)
    .set("+", 7)
    .set("-", 7)
    .set(">", 6)
    .set("<", 6)
    .set("<=", 6)
    .set(">=", 6)
    .set("==", 5)
    .set("!=", 5)
    .set("not", 4)
    .set("xor", 4)
    .set("&&", 4)
    .set("||", 4);
var mk_string = function (v, sr) { return ({ range: sr, ast: { kind: "string", value: v } }); };
var mk_bool = function (v, sr) { return ({ range: sr, ast: { kind: "bool", value: v } }); };
var mk_int = function (v, sr) { return ({ range: sr, ast: { kind: "int", value: v } }); };
var mk_identifier = function (v, sr) { return ({ range: sr, ast: { kind: "id", value: v } }); };
var mk_return = function (e) { return ({ range: e.range, ast: { kind: "return", value: e } }); };
var mk_args = function (sr, ds) { return ({ range: sr, ast: { kind: "args", value: Immutable.List(ds) } }); };
var mk_decl = function (l, r) { return ({ kind: "decl", l: l, r: r }); };
var mk_assign = function (l, r) { return ({ range: source_range_1.join_source_ranges(l.range, r.range), ast: { kind: "=", l: l, r: r } }); };
var mk_while = function (c, b) { return ({ range: source_range_1.join_source_ranges(c.range, b.range), ast: { kind: "while", c: c, b: b } }); };
var mk_if_then = function (c, t) { return ({ range: source_range_1.join_source_ranges(c.range, t.range), ast: { kind: "if", c: c, t: t, e: ts_bccc_1.apply(ccc_aux_1.none(), {}) } }); };
var mk_if_then_else = function (c, t, e) { return ({ range: source_range_1.join_source_ranges(c.range, t.range), ast: { kind: "if", c: c, t: t, e: ts_bccc_1.apply(ccc_aux_1.some(), e) } }); };
var mk_field_ref = function (l, r) { return ({ range: source_range_1.join_source_ranges(l.range, r.range), ast: { kind: ".", l: l, r: r } }); };
var mk_semicolon = function (l, r) { return ({ range: source_range_1.join_source_ranges(l.range, r.range), ast: { kind: ";", l: l, r: r } }); };
var mk_bin_op = function (k) { return function (l, r) { return ({ range: source_range_1.join_source_ranges(l.range, r.range), ast: { kind: k, l: l, r: r } }); }; };
var mk_plus = mk_bin_op("+");
var mk_minus = mk_bin_op("-");
var mk_times = mk_bin_op("*");
var mk_div = mk_bin_op("/");
var mk_mod = mk_bin_op("%");
var mk_lt = mk_bin_op("<");
var mk_gt = mk_bin_op(">");
var mk_leq = mk_bin_op("<=");
var mk_geq = mk_bin_op(">=");
var mk_eq = mk_bin_op("==");
var mk_neq = mk_bin_op("!=");
var mk_and = mk_bin_op("&&");
var mk_or = mk_bin_op("||");
var mk_xor = mk_bin_op("xor");
var mk_unary_op = function (k) { return function (e) { return ({ range: e.range, ast: { kind: k, e: e } }); }; };
var mk_not = mk_unary_op("not");
var mk_call = function (f_name, actuals) {
    return ({ range: f_name.range,
        ast: { kind: "func_call", name: f_name, actuals: actuals } });
};
var mk_function_declaration = function (return_type, function_name, arg_decls, body) {
    return ({ kind: "func_decl", name: function_name, return_type: return_type, arg_decls: arg_decls, body: body });
};
var mk_class_declaration = function (C_name, fields, methods, range) {
    return ({ range: range,
        ast: { kind: "class", C_name: C_name, fields: fields, methods: methods } });
};
var mk_dbg = function (sr) { return ({ range: sr, ast: { kind: "dbg" } }); };
var mk_tc_dbg = function (sr) { return ({ range: sr, ast: { kind: "tc-dbg" } }); };
var mk_empty_render_grid = function (w, h) { return ({ range: source_range_1.join_source_ranges(w.range, h.range), ast: { kind: "mk-empty-render-grid", w: w, h: h } }); };
var mk_render_grid_pixel = function (w, h, status) { return ({ range: source_range_1.join_source_ranges(w.range, source_range_1.join_source_ranges(h.range, status.range)), ast: { kind: "mk-render-grid-pixel", w: w, h: h, status: status } }); };
var mk_empty_render_grid_sign = ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected empty_render_grid");
    var i = s.first();
    if (i.kind == "mk_empty_render_grid") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("expected empty_render_grid");
});
var mk_render_grid_pixel_sign = ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected pixel");
    var i = s.first();
    if (i.kind == "pixel") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("expected pixel");
});
var newline_sign = ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected newline");
    var i = s.first();
    if (i.kind == "nl") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("expected newline");
});
var whitespace_sign = ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected whitespace");
    var i = s.first();
    if (i.kind == " ") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("expected whitespace");
});
var fst_err = function (e, _) { return e; };
var snd_err = function (e, _) { return e; };
var both_errors = function (e1, e2) { return e1 + ", or " + e2; };
var whitespace = function () {
    return ccc_aux_1.co_repeat(ccc_aux_1.co_catch(fst_err)(newline_sign)(whitespace_sign)).then(function (_) { return ts_bccc_1.co_unit({}); });
};
var ignore_whitespace = function (p) { return whitespace().then(function (_) { return p.then(function (p_res) { return whitespace().then(function (_) { return ts_bccc_1.co_unit(p_res); }); }); }); };
var dbg = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected identifier");
    var i = s.first();
    if (i.kind == "dbg") {
        var res_1 = mk_dbg(i.range);
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit(res_1); });
    }
    else
        return ts_bccc_1.co_error("expected debugger but found " + i.kind + " at (" + i.range.start.row + ", " + i.range.start.column + ")");
}));
var tc_dbg = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected identifier");
    var i = s.first();
    if (i.kind == "tc-dbg") {
        var res_2 = mk_tc_dbg(i.range);
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit(res_2); });
    }
    else
        return ts_bccc_1.co_error("expected typecheker debugger but found " + i.kind + " at (" + i.range.start.row + ", " + i.range.start.column + ")");
}));
var string = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected number");
    var i = s.first();
    if (i.kind == "string") {
        var res_3 = mk_string(i.v, i.range);
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit(res_3); });
    }
    else
        return ts_bccc_1.co_error("expected int");
}));
var bool = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected boolean");
    var i = s.first();
    if (i.kind == "bool") {
        var res_4 = mk_bool(i.v, i.range);
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit(res_4); });
    }
    else
        return ts_bccc_1.co_error("expected boolean");
}));
var int = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected number");
    var i = s.first();
    if (i.kind == "int") {
        var res_5 = mk_int(i.v, i.range);
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit(res_5); });
    }
    else
        return ts_bccc_1.co_error("expected int");
}));
var identifier_token = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected identifier");
    var i = s.first();
    if (i.kind == "id") {
        var res_6 = i.v;
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit(res_6); });
    }
    else
        return ts_bccc_1.co_error("expected identifier but found " + i.kind + " at (" + i.range.start.row + ", " + i.range.start.column + ")");
}));
var identifier = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected identifier");
    var i = s.first();
    if (i.kind == "id") {
        var res_7 = mk_identifier(i.v, i.range);
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit(res_7); });
    }
    else
        return ts_bccc_1.co_error("expected identifier but found " + i.kind + " at (" + i.range.start.row + ", " + i.range.start.column + ")");
}));
var return_sign = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected return");
    var i = s.first();
    if (i.kind == "return") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("expected return but found " + i.kind + " at (" + i.range.start.row + ", " + i.range.start.column + ")");
}));
var while_keyword = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected while");
    var i = s.first();
    if (i.kind == "while") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("expected keyword 'while'");
}));
var if_keyword = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected if");
    var i = s.first();
    if (i.kind == "if") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("expected keyword 'if'");
}));
var else_keyword = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected else");
    var i = s.first();
    if (i.kind == "else") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("expected keyword 'else'");
}));
var equal_sign = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected equal");
    var i = s.first();
    if (i.kind == "=") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("expected '='");
}));
var semicolon_sign = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected equal");
    var i = s.first();
    if (i.kind == ";") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("expected ';' at (" + i.range.start.to_string() + ")");
}));
var comma_sign = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected equal");
    var i = s.first();
    if (i.kind == ",") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("expected ',' at (" + i.range.start.to_string() + ")");
}));
var class_keyword = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected `class`");
    var i = s.first();
    if (i.kind == "class") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit(i.range); });
    }
    else
        return ts_bccc_1.co_error("expected `class`");
}));
var left_bracket = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected dot");
    var i = s.first();
    if (i.kind == "(") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("expected '('");
}));
var right_bracket = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected dot");
    var i = s.first();
    if (i.kind == ")") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("expected ')'");
}));
var left_curly_bracket = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected {");
    var i = s.first();
    if (i.kind == "{") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("expected '{'");
}));
var right_curly_bracket = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected }");
    var i = s.first();
    if (i.kind == "}") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit(i.range); });
    }
    else
        return ts_bccc_1.co_error("expected '}'");
}));
var dot_sign = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected dot");
    var i = s.first();
    if (i.kind == ".") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("expected '.'");
}));
var binop_sign = function (k) { return ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected " + k);
    var i = s.first();
    if (i.kind == k) {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("expected '" + k + "'");
})); };
var unaryop_sign = function (k) { return ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected " + k);
    var i = s.first();
    if (i.kind == k) {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("expected '" + k + "'");
})); };
var plus_op = binop_sign("+");
var minus_op = binop_sign("-");
var times_op = binop_sign("*");
var div_op = binop_sign("/");
var mod_op = binop_sign("%");
var lt_op = binop_sign("<");
var gt_op = binop_sign(">");
var leq_op = binop_sign("<=");
var geq_op = binop_sign(">=");
var eq_op = binop_sign("==");
var neq_op = binop_sign("!=");
var and_op = binop_sign("&&");
var or_op = binop_sign("||");
var xor_op = binop_sign("xor");
var not_op = unaryop_sign("not");
var eof = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_unit({});
    return ts_bccc_1.co_error("expected eof, found " + JSON.stringify(s.first()));
}));
var field_ref = function () { return identifier.then(function (l) {
    return dot_sign.then(function (_) {
        return ccc_aux_1.co_catch(snd_err)(field_ref())(identifier).then(function (r) {
            return ts_bccc_1.co_unit(mk_field_ref(l, r));
        });
    });
}); };
var mk_empty_render_grid_prs = function () {
    return mk_empty_render_grid_sign.then(function (_) {
        return expr().then(function (l) {
            return expr().then(function (r) {
                return ts_bccc_1.co_unit(mk_empty_render_grid(l, r));
            });
        });
    });
};
var render_grid_pixel_prs = function () {
    return mk_render_grid_pixel_sign.then(function (_) {
        return expr().then(function (l) {
            return expr().then(function (r) {
                return expr().then(function (st) {
                    return ts_bccc_1.co_unit(mk_render_grid_pixel(l, r, st));
                });
            });
        });
    });
};
var term = function () {
    return ccc_aux_1.co_catch(both_errors)(mk_empty_render_grid_prs())(ccc_aux_1.co_catch(both_errors)(render_grid_pixel_prs())(ccc_aux_1.co_catch(both_errors)(bool)(ccc_aux_1.co_catch(both_errors)(int)(ccc_aux_1.co_catch(both_errors)(string)(ccc_aux_1.co_catch(both_errors)(call())(ccc_aux_1.co_catch(both_errors)(identifier)(ccc_aux_1.co_catch(both_errors)(unary_expr())(left_bracket.then(function (_) {
        return expr().then(function (e) {
            return right_bracket.then(function (_) {
                return ts_bccc_1.co_unit(e);
            });
        });
    })))))))));
};
var unary_expr = function () {
    return not_op.then(function (_) {
        return expr().then(function (e) { return ts_bccc_1.co_unit(mk_not(e)); });
    });
};
var call = function () {
    return identifier.then(function (f_name) {
        return left_bracket.then(function (_) {
            return actuals().then(function (actuals) {
                return right_bracket.then(function (_) {
                    return ts_bccc_1.co_unit(mk_call(f_name, actuals));
                });
            });
        });
    });
};
var empty_table = { symbols: Immutable.Stack(),
    ops: Immutable.Stack() };
var reduce_table = function (table) {
    var res = reduce_table_2(table.symbols, table.ops, true);
    return res.new_top;
};
var reduce_table_2 = function (symbols, ops, reduce_to_end) {
    if (reduce_to_end && symbols.count() == 1 && ops.count() == 0)
        return { new_top: symbols.peek(), symbols: symbols.pop(), ops: ops };
    var snd = symbols.peek();
    var fst = symbols.pop().peek();
    symbols = symbols.pop().pop();
    var op = ops.peek();
    var new_top = op.snd(fst, snd);
    if (reduce_to_end)
        return reduce_table_2(symbols.push(new_top), ops.pop(), reduce_to_end);
    return { new_top: new_top, symbols: symbols.push(new_top), ops: ops.pop() };
};
var expr_after_op = function (symbols, ops, current_op, compose_current) {
    if (ops.count() >= 1 &&
        symbols.count() >= 2 && proprity_operators_table.get(ops.peek().fst) >= proprity_operators_table.get(current_op)) {
        var res = reduce_table_2(symbols, ops, false);
        return expr_after_op(res.symbols, res.ops, current_op, compose_current);
    }
    return expr_AUX({ symbols: symbols, ops: ops.push({ fst: current_op, snd: compose_current }) });
};
var expr_AUX = function (table) {
    return term().then(function (l) {
        return ccc_aux_1.co_catch(both_errors)(plus_op.then(function (_) { return expr_after_op(table.symbols.push(l), table.ops, "+", function (l, r) { return mk_plus(l, r); }); }))(ccc_aux_1.co_catch(both_errors)(minus_op.then(function (_) { return expr_after_op(table.symbols.push(l), table.ops, "-", function (l, r) { return mk_minus(l, r); }); }))(ccc_aux_1.co_catch(both_errors)(times_op.then(function (_) { return expr_after_op(table.symbols.push(l), table.ops, "*", function (l, r) { return mk_times(l, r); }); }))(ccc_aux_1.co_catch(both_errors)(div_op.then(function (_) { return expr_after_op(table.symbols.push(l), table.ops, "/", function (l, r) { return mk_div(l, r); }); }))(ccc_aux_1.co_catch(both_errors)(mod_op.then(function (_) { return expr_after_op(table.symbols.push(l), table.ops, "%", function (l, r) { return mk_mod(l, r); }); }))(ccc_aux_1.co_catch(both_errors)(lt_op.then(function (_) { return expr_after_op(table.symbols.push(l), table.ops, "<", function (l, r) { return mk_lt(l, r); }); }))(ccc_aux_1.co_catch(both_errors)(gt_op.then(function (_) { return expr_after_op(table.symbols.push(l), table.ops, ">", function (l, r) { return mk_gt(l, r); }); }))(ccc_aux_1.co_catch(both_errors)(leq_op.then(function (_) { return expr_after_op(table.symbols.push(l), table.ops, "<=", function (l, r) { return mk_leq(l, r); }); }))(ccc_aux_1.co_catch(both_errors)(geq_op.then(function (_) { return expr_after_op(table.symbols.push(l), table.ops, ">=", function (l, r) { return mk_geq(l, r); }); }))(ccc_aux_1.co_catch(both_errors)(eq_op.then(function (_) { return expr_after_op(table.symbols.push(l), table.ops, "==", function (l, r) { return mk_eq(l, r); }); }))(ccc_aux_1.co_catch(both_errors)(neq_op.then(function (_) { return expr_after_op(table.symbols.push(l), table.ops, "!=", function (l, r) { return mk_neq(l, r); }); }))(ccc_aux_1.co_catch(both_errors)(and_op.then(function (_) { return expr_after_op(table.symbols.push(l), table.ops, "&&", function (l, r) { return mk_and(l, r); }); }))(ccc_aux_1.co_catch(both_errors)(or_op.then(function (_) { return expr_after_op(table.symbols.push(l), table.ops, "||", function (l, r) { return mk_or(l, r); }); }))(ccc_aux_1.co_catch(both_errors)(xor_op.then(function (_) { return expr_after_op(table.symbols.push(l), table.ops, "xor", function (l, r) { return mk_xor(l, r); }); }))(ts_bccc_1.co_unit(__assign({}, table, { symbols: table.symbols.push(l) }))))))))))))))));
    });
};
var expr = function () {
    var res = expr_AUX(empty_table).then(function (e) { return ts_bccc_1.co_unit(reduce_table(e)); });
    return res;
};
var semicolon = ignore_whitespace(semicolon_sign);
var comma = ignore_whitespace(comma_sign);
var with_semicolon = function (p) { return p.then(function (p_res) { return ignore_whitespace(semicolon_sign).then(function (_) { return ts_bccc_1.co_unit(p_res); }); }); };
var assign = function () {
    return ccc_aux_1.co_catch(snd_err)(field_ref())(identifier).then(function (l) {
        return equal_sign.then(function (_) {
            return expr().then(function (r) {
                return ts_bccc_1.co_unit(mk_assign(l, r));
            });
        });
    });
};
var decl = function () {
    return identifier.then(function (l) {
        return identifier_token.then(function (r) {
            return ts_bccc_1.co_unit(mk_decl(l, r));
        });
    });
};
var actuals = function () {
    return ccc_aux_1.co_catch(both_errors)(term().then(function (a) {
        return ccc_aux_1.co_catch(both_errors)(comma.then(function (_) {
            return actuals().then(function (as) {
                return ts_bccc_1.co_unit([a].concat(as));
            });
        }))(ts_bccc_1.co_unit([a]));
    }))(ts_bccc_1.co_unit(Array()));
};
var arg_decls = function () {
    return ccc_aux_1.co_catch(both_errors)(decl().then(function (d) {
        return ccc_aux_1.co_catch(both_errors)(comma.then(function (_) {
            return arg_decls().then(function (ds) {
                return ts_bccc_1.co_unit([d].concat(ds));
            });
        }))(ts_bccc_1.co_unit([d]));
    }))(ts_bccc_1.co_unit(Array()));
};
var return_statement = function () {
    return return_sign.then(function (_) {
        return expr().then(function (e) {
            return ts_bccc_1.co_unit(mk_return(e));
        });
    });
};
var if_conditional = function (stmt) {
    return if_keyword.then(function (_) {
        return expr().then(function (c) {
            return stmt().then(function (t) {
                return ccc_aux_1.co_catch(fst_err)(else_keyword.then(function (_) {
                    return stmt().then(function (e) {
                        return ts_bccc_1.co_unit(mk_if_then_else(c, t, e));
                    });
                }))(ts_bccc_1.co_unit(mk_if_then(c, t)));
            });
        });
    });
};
var while_loop = function (stmt) {
    return while_keyword.then(function (_) {
        return expr().then(function (c) {
            return stmt().then(function (b) {
                return ts_bccc_1.co_unit(mk_while(c, b));
            });
        });
    });
};
var bracketized_statement = function () {
    return left_curly_bracket.then(function (_) {
        return function_statements().then(function (s) {
            return right_curly_bracket.then(function (_) {
                return ts_bccc_1.co_unit(s);
            });
        });
    });
};
var function_declaration = function () {
    return identifier.then(function (return_type) {
        return identifier_token.then(function (function_name) {
            return left_bracket.then(function (_) {
                return arg_decls().then(function (arg_decls) {
                    return right_bracket.then(function (_) {
                        return left_curly_bracket.then(function (_) {
                            return function_statements().then(function (body) {
                                return right_curly_bracket.then(function (_) {
                                    return ts_bccc_1.co_unit(mk_function_declaration(return_type, function_name, Immutable.List(arg_decls), body));
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};
var class_declaration = function () {
    return class_keyword.then(function (initial_range) {
        return console.log("class!!!") ||
            identifier_token.then(function (class_name) {
                return console.log(class_name) ||
                    left_curly_bracket.then(function (_) {
                        return console.log("curlyyyyyyyyyy") ||
                            class_statements().then(function (declarations) {
                                return console.log("field and method declarations", declarations) ||
                                    right_curly_bracket.then(function (closing_curly_range) {
                                        return console.log("yyyyyyyyyylruc") ||
                                            ts_bccc_1.co_unit(mk_class_declaration(class_name, declarations.fst, declarations.snd, source_range_1.join_source_ranges(initial_range, closing_curly_range)));
                                    });
                            });
                    });
            });
    });
};
var outer_statement = function () {
    return ccc_aux_1.co_catch(both_errors)(function_declaration().then(function (fun_decl) {
        return ts_bccc_1.co_unit({ range: source_range_1.join_source_ranges(fun_decl.return_type.range, fun_decl.body.range), ast: fun_decl });
    }))(ccc_aux_1.co_catch(both_errors)(class_declaration())(inner_statement()));
};
var inner_statement = function () {
    return ccc_aux_1.co_catch(both_errors)(bracketized_statement())(ccc_aux_1.co_catch(both_errors)(while_loop(function_statement))(ccc_aux_1.co_catch(both_errors)(if_conditional(function_statement))(ccc_aux_1.co_catch(both_errors)(with_semicolon(call()))(ccc_aux_1.co_catch(both_errors)(with_semicolon(decl().then(function (d) {
        return ts_bccc_1.co_unit({ range: d.l.range, ast: d });
    })))(ccc_aux_1.co_catch(both_errors)(with_semicolon(assign()))((ccc_aux_1.co_catch(both_errors)(with_semicolon(dbg))(with_semicolon(tc_dbg)))))))));
};
var function_statement = function () {
    return ccc_aux_1.co_catch(both_errors)(with_semicolon(return_statement()))(inner_statement());
};
var generic_statements = function (stmt) {
    return stmt().then(function (l) {
        return ccc_aux_1.co_catch(snd_err)(generic_statements(stmt).then(function (r) {
            return ts_bccc_1.co_unit(mk_semicolon(l, r));
        }))(ts_bccc_1.co_unit(l));
    });
};
var function_statements = function () { return generic_statements(function_statement); };
var inner_statements = function () { return generic_statements(function () { return inner_statement(); }); };
var outer_statements = function () { return generic_statements(outer_statement); };
var class_statements = function () {
    return ccc_aux_1.co_catch(both_errors)(ccc_aux_1.co_catch(both_errors)(with_semicolon(decl().then(function (d) {
        return ts_bccc_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), d));
    })))(function_declaration().then(function (d) {
        return ts_bccc_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inr(), d));
    })).then(function (decl) {
        return class_statements().then(function (decls) {
            return ts_bccc_1.co_unit({
                fst: decl.kind == "left" ? decls.fst.push(decl.value) : decls.fst,
                snd: decl.kind == "right" ? decls.snd.push(decl.value) : decls.snd
            });
        });
    }))(ts_bccc_1.co_unit({
        fst: Immutable.List(),
        snd: Immutable.List()
    }));
};
exports.program_prs = function () {
    return outer_statements().then(function (s) {
        return eof.then(function (_) { return ts_bccc_1.co_unit(s); });
    });
};
var string_to_csharp_type = function (s) {
    return s == "int" ? CSharp.int_type
        : s == "bool" ? CSharp.bool_type
            : s == "RenderGrid" ? CSharp.render_grid_type
                : s == "RenderGridPixel" ? CSharp.render_grid_pixel_type
                    : CSharp.ref_type(s);
};
exports.ast_to_type_checker = function (n) {
    return n.ast.kind == "int" ? CSharp.int(n.ast.value)
        : n.ast.kind == "string" ? CSharp.str(n.ast.value)
            : n.ast.kind == "bool" ? CSharp.bool(n.ast.value)
                : n.ast.kind == ";" ? CSharp.semicolon(exports.ast_to_type_checker(n.ast.l), exports.ast_to_type_checker(n.ast.r))
                    : n.ast.kind == "while" ? CSharp.while_do(exports.ast_to_type_checker(n.ast.c), exports.ast_to_type_checker(n.ast.b))
                        : n.ast.kind == "if" ? CSharp.if_then_else(exports.ast_to_type_checker(n.ast.c), exports.ast_to_type_checker(n.ast.t), n.ast.e.kind == "right" ? CSharp.done : exports.ast_to_type_checker(n.ast.e.value))
                            : n.ast.kind == "+" ? CSharp.plus(exports.ast_to_type_checker(n.ast.l), exports.ast_to_type_checker(n.ast.r))
                                : n.ast.kind == "-" ? CSharp.minus(exports.ast_to_type_checker(n.ast.l), exports.ast_to_type_checker(n.ast.r))
                                    : n.ast.kind == "*" ? CSharp.times(exports.ast_to_type_checker(n.ast.l), exports.ast_to_type_checker(n.ast.r), n.range)
                                        : n.ast.kind == "/" ? CSharp.div(exports.ast_to_type_checker(n.ast.l), exports.ast_to_type_checker(n.ast.r))
                                            : n.ast.kind == "%" ? CSharp.mod(exports.ast_to_type_checker(n.ast.l), exports.ast_to_type_checker(n.ast.r))
                                                : n.ast.kind == "<" ? CSharp.lt(exports.ast_to_type_checker(n.ast.l), exports.ast_to_type_checker(n.ast.r))
                                                    : n.ast.kind == ">" ? CSharp.gt(exports.ast_to_type_checker(n.ast.l), exports.ast_to_type_checker(n.ast.r))
                                                        : n.ast.kind == "<=" ? CSharp.leq(exports.ast_to_type_checker(n.ast.l), exports.ast_to_type_checker(n.ast.r))
                                                            : n.ast.kind == ">=" ? CSharp.geq(exports.ast_to_type_checker(n.ast.l), exports.ast_to_type_checker(n.ast.r))
                                                                : n.ast.kind == "==" ? CSharp.eq(exports.ast_to_type_checker(n.ast.l), exports.ast_to_type_checker(n.ast.r))
                                                                    : n.ast.kind == "!=" ? CSharp.neq(exports.ast_to_type_checker(n.ast.l), exports.ast_to_type_checker(n.ast.r))
                                                                        : n.ast.kind == "xor" ? CSharp.xor(exports.ast_to_type_checker(n.ast.l), exports.ast_to_type_checker(n.ast.r))
                                                                            : n.ast.kind == "not" ? CSharp.not(exports.ast_to_type_checker(n.ast.e))
                                                                                : n.ast.kind == "&&" ? CSharp.and(exports.ast_to_type_checker(n.ast.l), exports.ast_to_type_checker(n.ast.r))
                                                                                    : n.ast.kind == "||" ? CSharp.or(exports.ast_to_type_checker(n.ast.l), exports.ast_to_type_checker(n.ast.r))
                                                                                        : n.ast.kind == "id" ? CSharp.get_v(n.ast.value)
                                                                                            : n.ast.kind == "return" ? CSharp.ret(exports.ast_to_type_checker(n.ast.value))
                                                                                                : n.ast.kind == "." && n.ast.r.ast.kind == "id" ? CSharp.field_get(exports.ast_to_type_checker(n.ast.l), n.ast.r.ast.value)
                                                                                                    : n.ast.kind == "=" && n.ast.l.ast.kind == "id" ? CSharp.set_v(n.ast.l.ast.value, exports.ast_to_type_checker(n.ast.r))
                                                                                                        : n.ast.kind == "func_call" &&
                                                                                                            n.ast.name.ast.kind == "id" ?
                                                                                                            CSharp.call_by_name(n.ast.name.ast.value, n.ast.actuals.map(function (a) { return exports.ast_to_type_checker(a); }))
                                                                                                            : n.ast.kind == "func_decl" &&
                                                                                                                n.ast.return_type.ast.kind == "id" ?
                                                                                                                CSharp.def_fun({ name: n.ast.name,
                                                                                                                    return_t: string_to_csharp_type(n.ast.return_type.ast.value),
                                                                                                                    parameters: n.ast.arg_decls.toArray().map(function (d) { return ({ name: d.r, type: string_to_csharp_type(d.l.ast.value) }); }),
                                                                                                                    body: exports.ast_to_type_checker(n.ast.body),
                                                                                                                    range: n.range }, [])
                                                                                                                : n.ast.kind == "class" && !n.ast.methods.some(function (m) { return !m || m.return_type.ast.kind != "id" || m.arg_decls.some(function (a) { return !a || a.l.ast.kind != "id"; }); })
                                                                                                                    && !n.ast.fields.some(function (f) { return !f || f.l.ast.kind != "id"; }) ?
                                                                                                                    CSharp.def_class(n.ast.C_name, n.ast.methods.toArray().map(function (m) { return ({
                                                                                                                        name: m.name,
                                                                                                                        return_t: string_to_csharp_type(m.return_type.ast.value),
                                                                                                                        parameters: m.arg_decls.toArray().map(function (a) { return ({ name: a.r, type: string_to_csharp_type(a.l.ast.value) }); }),
                                                                                                                        body: exports.ast_to_type_checker(m.body),
                                                                                                                        range: source_range_1.join_source_ranges(m.return_type.range, m.body.range)
                                                                                                                    }); }), n.ast.fields.toArray().map(function (f) { return ({ name: f.r, type: string_to_csharp_type(f.l.ast.value) }); }))
                                                                                                                    : n.ast.kind == "decl" && n.ast.l.ast.kind == "id" ?
                                                                                                                        CSharp.decl_v(n.ast.r, string_to_csharp_type(n.ast.l.ast.value))
                                                                                                                        : n.ast.kind == "dbg" ?
                                                                                                                            CSharp.breakpoint(n.range)(CSharp.done)
                                                                                                                            : n.ast.kind == "tc-dbg" ?
                                                                                                                                CSharp.typechecker_breakpoint(n.range)(CSharp.done)
                                                                                                                                : n.ast.kind == "mk-empty-render-grid" ?
                                                                                                                                    CSharp.mk_empty_render_grid(exports.ast_to_type_checker(n.ast.w), exports.ast_to_type_checker(n.ast.h))
                                                                                                                                    : n.ast.kind == "mk-render-grid-pixel" ?
                                                                                                                                        CSharp.mk_render_grid_pixel(exports.ast_to_type_checker(n.ast.w), exports.ast_to_type_checker(n.ast.h), exports.ast_to_type_checker(n.ast.status))
                                                                                                                                        : (function () { console.log("Error: unsupported ast node: " + JSON.stringify(n)); throw new Error("Unsupported ast node: " + JSON.stringify(n)); })();
};
