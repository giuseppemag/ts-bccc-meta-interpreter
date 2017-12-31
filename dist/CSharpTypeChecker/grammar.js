"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Immutable = require("immutable");
var ts_bccc_1 = require("ts-bccc");
var source_range_1 = require("../source_range");
var ccc_aux_1 = require("../ccc_aux");
var GrammarBasics;
(function (GrammarBasics) {
    var parse_prefix_regex = function (r, t) { return ts_bccc_1.mk_coroutine(ts_bccc_1.fun(function (s) {
        var m = s.buffer.match(r);
        if (m == null || m.length == 0) {
            return ts_bccc_1.apply(ts_bccc_1.inl(), "Syntax error: cannot match token at (" + s.line_index + ", " + s.column_index + "), " + s.buffer.substr(0, Math.min(s.buffer.length, 5)) + "...");
        }
        else {
            var rest = s.buffer.split(r)[1];
            // console.log("Lexing", r, s.buffer)
            // console.log("Match", m)
            // console.log("Rest", rest)
            var new_line_index = s.line_index;
            var new_column_index = s.column_index + m[0].length;
            var f = (ts_bccc_1.constant(t(m[0], source_range_1.mk_range(s.line_index, s.column_index, new_line_index, new_column_index))).times(ts_bccc_1.constant({ buffer: rest || "", line_index: new_line_index, column_index: new_column_index })));
            var g = f.then(ts_bccc_1.inr());
            var h = g.then(ts_bccc_1.inr());
            return ts_bccc_1.apply(h, {});
        }
    })); };
    var empty_render_grid = parse_prefix_regex(/^empty_render_grid/, function (s, r) { return ({ range: r, kind: "mk_empty_render_grid" }); });
    var pixel = parse_prefix_regex(/^pixel/, function (s, r) { return ({ range: r, kind: "pixel" }); });
    var dbg = parse_prefix_regex(/^debugger/, function (s, r) { return ({ range: r, kind: "dbg" }); });
    var dbg_tc = parse_prefix_regex(/^typechecker_debugger/, function (s, r) { return ({ range: r, kind: "tc-dbg" }); });
    var eof = parse_prefix_regex(/^$/, function (s, r) { return ({ range: r, kind: "eof" }); });
    var newline = parse_prefix_regex(/^\n/, function (s, r) { return ({ range: r, kind: "nl" }); });
    var whitespace = parse_prefix_regex(/^\s+/, function (s, r) { return ({ range: r, kind: " " }); });
    var semicolon = parse_prefix_regex(/^;/, function (s, r) { return ({ range: r, kind: ";" }); });
    var plus = parse_prefix_regex(/^\+/, function (s, r) { return ({ range: r, kind: "+" }); });
    var lt = parse_prefix_regex(/^</, function (s, r) { return ({ range: r, kind: "<" }); });
    var times = parse_prefix_regex(/^\*/, function (s, r) { return ({ range: r, kind: "*" }); });
    var dot = parse_prefix_regex(/^\./, function (s, r) { return ({ range: r, kind: "." }); });
    var lbr = parse_prefix_regex(/^\(/, function (s, r) { return ({ range: r, kind: "(" }); });
    var rbr = parse_prefix_regex(/^\)/, function (s, r) { return ({ range: r, kind: ")" }); });
    var lcbr = parse_prefix_regex(/^{/, function (s, r) { return ({ range: r, kind: "{" }); });
    var rcbr = parse_prefix_regex(/^}/, function (s, r) { return ({ range: r, kind: "}" }); });
    var string = parse_prefix_regex(/^".*"/, function (s, r) { return ({ range: r, kind: "string", v: s }); });
    var int = parse_prefix_regex(/^[0-9]+/, function (s, r) { return ({ range: r, kind: "int", v: parseInt(s) }); });
    var bool = parse_prefix_regex(/^(true)|(false)/, function (s, r) { return ({ range: r, kind: "bool", v: (s == "true") }); });
    var float = parse_prefix_regex(/^[0-9]+.[0-9]+/, function (s, r) { return ({ range: r, kind: "float", v: parseFloat(s) }); });
    var _while = parse_prefix_regex(/^while/, function (s, r) { return ({ range: r, kind: "while" }); });
    var _if = parse_prefix_regex(/^if/, function (s, r) { return ({ range: r, kind: "if" }); });
    var _eq = parse_prefix_regex(/^=/, function (s, r) { return ({ range: r, kind: "=" }); });
    var _then = parse_prefix_regex(/^then/, function (s, r) { return ({ range: r, kind: "then" }); });
    var _else = parse_prefix_regex(/^else/, function (s, r) { return ({ range: r, kind: "else" }); });
    var identifier = parse_prefix_regex(/^[a-zA-Z][a-zA-Z0-9]*/, function (s, r) { return ({ range: r, kind: "id", v: s }); });
    var fst_err = function (x, y) { return x; };
    var lex_catch = ccc_aux_1.co_catch(fst_err);
    var token = lex_catch(semicolon)(lex_catch(lt)(lex_catch(plus)(lex_catch(times)(lex_catch(dot)(lex_catch(lbr)(lex_catch(rbr)(lex_catch(lcbr)(lex_catch(rcbr)(lex_catch(dbg)(lex_catch(dbg_tc)(lex_catch(bool)(lex_catch(int)(lex_catch(string)(lex_catch(float)(lex_catch(_while)(lex_catch(_if)(lex_catch(_eq)(lex_catch(_then)(lex_catch(_else)(lex_catch(int)(lex_catch(empty_render_grid)(lex_catch(pixel)(lex_catch(identifier)(whitespace))))))))))))))))))))))));
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
var mk_string = function (v, sr) { return ({ range: sr, ast: { kind: "string", value: v } }); };
var mk_bool = function (v, sr) { return ({ range: sr, ast: { kind: "bool", value: v } }); };
var mk_int = function (v, sr) { return ({ range: sr, ast: { kind: "int", value: v } }); };
var mk_identifier = function (v, sr) { return ({ range: sr, ast: { kind: "id", value: v } }); };
var mk_decl = function (l, r) { return ({ range: source_range_1.join_source_ranges(l.range, r.range), ast: { kind: "decl", l: l, r: r } }); };
var mk_assign = function (l, r) { return ({ range: source_range_1.join_source_ranges(l.range, r.range), ast: { kind: "=", l: l, r: r } }); };
var mk_while = function (c, b) { return ({ range: source_range_1.join_source_ranges(c.range, b.range), ast: { kind: "while", c: c, b: b } }); };
var mk_field_ref = function (l, r) { return ({ range: source_range_1.join_source_ranges(l.range, r.range), ast: { kind: ".", l: l, r: r } }); };
var mk_semicolon = function (l, r) { return ({ range: source_range_1.join_source_ranges(l.range, r.range), ast: { kind: ";", l: l, r: r } }); };
var mk_plus = function (l, r) { return ({ range: source_range_1.join_source_ranges(l.range, r.range), ast: { kind: "+", l: l, r: r } }); };
var mk_lt = function (l, r) { return ({ range: source_range_1.join_source_ranges(l.range, r.range), ast: { kind: "<", l: l, r: r } }); };
var mk_times = function (l, r) { return ({ range: source_range_1.join_source_ranges(l.range, r.range), ast: { kind: "*", l: l, r: r } }); };
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
var identifier = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected identifier");
    var i = s.first();
    if (i.kind == "id") {
        var res_6 = mk_identifier(i.v, i.range);
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit(res_6); });
    }
    else
        return ts_bccc_1.co_error("expected identifier but found " + i.kind + " at (" + i.range.start.row + ", " + i.range.start.column + ")");
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
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
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
var lt_op = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected <");
    var i = s.first();
    if (i.kind == "<") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("expected '<'");
}));
var plus_op = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected dot");
    var i = s.first();
    if (i.kind == "+") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("expected '+'");
}));
var times_op = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected dot");
    var i = s.first();
    if (i.kind == "*") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("expected '*'");
}));
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
    return ccc_aux_1.co_catch(both_errors)(mk_empty_render_grid_prs())(ccc_aux_1.co_catch(both_errors)(render_grid_pixel_prs())(ccc_aux_1.co_catch(both_errors)(identifier)(ccc_aux_1.co_catch(both_errors)(int)(ccc_aux_1.co_catch(both_errors)(string)(left_bracket.then(function (_) {
        return expr().then(function (e) {
            return right_bracket.then(function (_) {
                return ts_bccc_1.co_unit(e);
            });
        });
    }))))));
};
var expr = function () {
    return term().then(function (l) {
        return ccc_aux_1.co_catch(both_errors)(plus_op.then(function (_) { return expr().then(function (r) { return ts_bccc_1.co_unit(mk_plus(l, r)); }); }))(ccc_aux_1.co_catch(both_errors)(times_op.then(function (_) { return expr().then(function (r) { return ts_bccc_1.co_unit(mk_times(l, r)); }); }))(ccc_aux_1.co_catch(both_errors)(lt_op.then(function (_) { return expr().then(function (r) { return ts_bccc_1.co_unit(mk_lt(l, r)); }); }))(ts_bccc_1.co_unit(l))));
    });
};
var semicolon = ignore_whitespace(semicolon_sign);
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
        return identifier.then(function (r) {
            return ts_bccc_1.co_unit(mk_decl(l, r));
        });
    });
};
var while_loop = function () {
    return while_keyword.then(function (_) {
        return expr().then(function (c) {
            return outer_statement().then(function (b) {
                return ts_bccc_1.co_unit(mk_while(c, b));
            });
        });
    });
};
var bracketized_statement = function () {
    return left_curly_bracket.then(function (_) {
        return outer_statements().then(function (s) {
            return right_curly_bracket.then(function (_) {
                return ts_bccc_1.co_unit(s);
            });
        });
    });
};
var outer_statement = function () {
    return ccc_aux_1.co_catch(both_errors)(bracketized_statement())(ccc_aux_1.co_catch(both_errors)(while_loop())(ccc_aux_1.co_catch(both_errors)(with_semicolon(decl()))(ccc_aux_1.co_catch(both_errors)(with_semicolon(assign()))((ccc_aux_1.co_catch(both_errors)(with_semicolon(dbg))(with_semicolon(tc_dbg)))))));
};
var outer_statements = function () {
    return outer_statement().then(function (l) {
        return ccc_aux_1.co_catch(snd_err)(outer_statements().then(function (r) {
            return ts_bccc_1.co_unit(mk_semicolon(l, r));
        }))(ts_bccc_1.co_unit(l));
    });
};
exports.program_prs = function () {
    return outer_statements().then(function (s) {
        return eof.then(function (_) { return ts_bccc_1.co_unit(s); });
    });
};
