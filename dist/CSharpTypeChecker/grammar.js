"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Immutable = require("immutable");
var ts_bccc_1 = require("ts-bccc");
var ccc_aux_1 = require("../ccc_aux");
var GrammarBasics;
(function (GrammarBasics) {
    var parse_prefix_regex = function (r, t) { return ts_bccc_1.mk_coroutine(ts_bccc_1.fun(function (s) {
        var m = s.buffer.match(r);
        if (m == null || m.length == 0) {
            return ts_bccc_1.apply(ts_bccc_1.inl(), "No match");
        }
        else {
            var rest = s.buffer.split(r)[1];
            var new_line_index = s.line_index;
            var new_column_index = s.column_index + m[0].length;
            var f = (ts_bccc_1.constant(t(m[0], { start: { row: s.line_index, column: s.column_index }, end: { row: new_line_index, column: new_column_index } })).times(ts_bccc_1.constant({ buffer: rest || "", line_index: new_line_index, column_index: new_column_index })));
            var g = f.then(ts_bccc_1.inr());
            var h = g.then(ts_bccc_1.inr());
            return ts_bccc_1.apply(h, {});
        }
    })); };
    var eof = parse_prefix_regex(/^$/, function (s, r) { return ({ range: r, kind: "eof" }); });
    var newline = parse_prefix_regex(/^\n/, function (s, r) { return ({ range: r, kind: "nl" }); });
    var whitespace = parse_prefix_regex(/^\s+/, function (s, r) { return ({ range: r, kind: " " }); });
    var semicolon = parse_prefix_regex(/^;/, function (s, r) { return ({ range: r, kind: ";" }); });
    var plus = parse_prefix_regex(/^\+/, function (s, r) { return ({ range: r, kind: "+" }); });
    var times = parse_prefix_regex(/^\*/, function (s, r) { return ({ range: r, kind: "*" }); });
    var dot = parse_prefix_regex(/^\./, function (s, r) { return ({ range: r, kind: "." }); });
    var lbr = parse_prefix_regex(/^\(/, function (s, r) { return ({ range: r, kind: "(" }); });
    var rbr = parse_prefix_regex(/^\)/, function (s, r) { return ({ range: r, kind: ")" }); });
    var int = parse_prefix_regex(/^[0-9]+/, function (s, r) { return ({ range: r, kind: "int", v: parseInt(s) }); });
    var float = parse_prefix_regex(/^[0-9]+.[0-9]+/, function (s, r) { return ({ range: r, kind: "float", v: parseFloat(s) }); });
    var _if = parse_prefix_regex(/^if/, function (s, r) { return ({ range: r, kind: "if" }); });
    var _eq = parse_prefix_regex(/^=/, function (s, r) { return ({ range: r, kind: "=" }); });
    var _then = parse_prefix_regex(/^then/, function (s, r) { return ({ range: r, kind: "then" }); });
    var _else = parse_prefix_regex(/^else/, function (s, r) { return ({ range: r, kind: "else" }); });
    var identifier = parse_prefix_regex(/^[a-zA-Z][a-zA-Z0-9]*/, function (s, r) { return ({ range: r, kind: "id", v: s }); });
    var token = ccc_aux_1.co_catch(semicolon)(ccc_aux_1.co_catch(plus)(ccc_aux_1.co_catch(times)(ccc_aux_1.co_catch(dot)(ccc_aux_1.co_catch(lbr)(ccc_aux_1.co_catch(rbr)(ccc_aux_1.co_catch(int)(ccc_aux_1.co_catch(float)(ccc_aux_1.co_catch(_if)(ccc_aux_1.co_catch(_eq)(ccc_aux_1.co_catch(_then)(ccc_aux_1.co_catch(_else)(ccc_aux_1.co_catch(int)(ccc_aux_1.co_catch(identifier)(whitespace))))))))))))));
    GrammarBasics.tokenize = function (source) {
        var lines = source.split("\n");
        // console.log(lines)
        // process.exit()
        var tokens = Immutable.List();
        var line_index = 0;
        while (line_index < lines.length) {
            var line = lines[line_index];
            var line_tokens = ccc_aux_1.co_run_to_end(ccc_aux_1.co_repeat(token).then(function (ts) { return eof.then(function (_) { return ts_bccc_1.co_unit(ts); }); }), { buffer: line, line_index: line_index, column_index: 0 });
            if (line_tokens.kind == "left")
                return line_tokens;
            tokens = tokens.push.apply(tokens, line_tokens.value.fst);
            tokens = tokens.push({ kind: "nl", range: { start: { row: line_index, column: line.length }, end: { row: line_index, column: line.length + 1 } } });
            line_index = line_index + 1;
        }
        return ts_bccc_1.apply(ts_bccc_1.inr(), tokens.toArray());
    };
})(GrammarBasics = exports.GrammarBasics || (exports.GrammarBasics = {}));
var mk_decl = function (l, r) { return ({ kind: "decl", l: l, r: r }); };
var mk_assign = function (l, r) { return ({ kind: "=", l: l, r: r }); };
var mk_field_ref = function (l, r) { return ({ kind: ".", l: l, r: r }); };
var mk_semicolon = function (l, r) { return ({ kind: ";", l: l, r: r }); };
var mk_plus = function (l, r) { return ({ kind: "+", l: l, r: r }); };
var mk_times = function (l, r) { return ({ kind: "*", l: l, r: r }); };
var newline_sign = ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected dot");
    var i = s.first();
    if (i.kind == "Newline") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("error, dot");
});
var whitespace = function () {
    return ccc_aux_1.co_catch(newline_sign.then(function (_) { return whitespace(); }))(ts_bccc_1.co_unit({}));
};
var ignore_whitespace = function (p) { return whitespace().then(function (_) { return p.then(function (p_res) { return whitespace().then(function (_) { return ts_bccc_1.co_unit(p_res); }); }); }); };
var int = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected number");
    var i = s.first();
    if (i.kind == "int") {
        var res_1 = { kind: "int", value: i.v };
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit(res_1); });
    }
    else
        return ts_bccc_1.co_error("error, int");
}));
var id = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected identifier");
    var i = s.first();
    if (i.kind == "id") {
        var res_2 = { kind: "id", value: i.v };
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit(res_2); });
    }
    else
        return ts_bccc_1.co_error("error, int");
}));
var equal_sign = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected equal");
    var i = s.first();
    if (i.kind == "=") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("error, int");
}));
var semicolon_sign = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected equal");
    var i = s.first();
    if (i.kind == ";") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("error, int");
}));
var left_bracket = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected dot");
    var i = s.first();
    if (i.kind == "(") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("error, dot");
}));
var right_bracket = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected dot");
    var i = s.first();
    if (i.kind == ")") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("error, dot");
}));
var dot_sign = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected dot");
    var i = s.first();
    if (i.kind == ".") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("error, dot");
}));
var plus_op = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected dot");
    var i = s.first();
    if (i.kind == "+") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("error, dot");
}));
var times_op = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected dot");
    var i = s.first();
    if (i.kind == "*") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("error, dot");
}));
var eof = ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_unit({});
    return ts_bccc_1.co_error("found non-empty state, expected eof");
}));
var field_ref = function () { return id.then(function (l) {
    return dot_sign.then(function (_) {
        return ccc_aux_1.co_catch(field_ref())(id).then(function (r) {
            return ts_bccc_1.co_unit(mk_field_ref(l, r));
        });
    });
}); };
var term = function () {
    return ccc_aux_1.co_catch(id)(ccc_aux_1.co_catch(int)(left_bracket.then(function (_) {
        return expr().then(function (e) {
            return right_bracket.then(function (_) {
                return ts_bccc_1.co_unit(e);
            });
        });
    })));
};
var expr = function () {
    return term().then(function (l) {
        return ccc_aux_1.co_catch(plus_op.then(function (_) { return expr().then(function (r) { return ts_bccc_1.co_unit(mk_plus(l, r)); }); }))(ccc_aux_1.co_catch(times_op.then(function (_) { return expr().then(function (r) { return ts_bccc_1.co_unit(mk_times(l, r)); }); }))(ts_bccc_1.co_unit(l)));
    });
};
var assign = function () {
    return ccc_aux_1.co_catch(field_ref())(id).then(function (l) {
        return equal_sign.then(function (_) {
            return expr().then(function (r) {
                return ts_bccc_1.co_unit(mk_assign(l, r));
            });
        });
    });
};
var decl = function () {
    return id.then(function (l) {
        return whitespace().then(function (_) {
            return id.then(function (r) {
                return ts_bccc_1.co_unit(mk_decl(l, r));
            });
        });
    });
};
var outer_statement = function () {
    return ccc_aux_1.co_catch(decl())(assign()).then(function (l) { return whitespace().then(function (_) { return semicolon_sign.then(function (_) { return whitespace().then(function (_) { return ts_bccc_1.co_unit(l); }); }); }); });
};
exports.program = function () {
    return outer_statement().then(function (l) {
        return ccc_aux_1.co_catch(exports.program().then(function (r) {
            return ts_bccc_1.co_unit(mk_semicolon(l, r));
        }))(eof.then(function (_) { return ts_bccc_1.co_unit(l); }));
    });
};
