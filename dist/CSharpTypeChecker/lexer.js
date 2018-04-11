"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Immutable = require("immutable");
var ts_bccc_1 = require("ts-bccc");
var ccc_aux_1 = require("../ccc_aux");
var source_range_1 = require("../source_range");
var GrammarBasics;
(function (GrammarBasics) {
    var parse_prefix_regex = function (r, t) { return ts_bccc_1.mk_coroutine(ts_bccc_1.fun(function (s) {
        var m = s.buffer.match(r);
        if (m == null || m.length == 0) {
            return ts_bccc_1.apply(ts_bccc_1.inl(), { range: source_range_1.mk_range(s.line_index, s.column_index, s.line_index, s.column_index + s.buffer.length), message: "Syntax error: cannot match token at (" + s.line_index + ", " + s.column_index + "), " + s.buffer.substr(0, Math.min(s.buffer.length, 5)) + "..." });
        }
        else {
            var rest = s.buffer.replace(r, "");
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
    var fst_err = function (x, y) { return x; };
    var lex_catch = ccc_aux_1.co_catch(fst_err);
    var lex_catch_many = function (tokens) { return tokens.isEmpty() ?
        ts_bccc_1.co_error({ range: source_range_1.zero_range, message: "" })
        :
            lex_catch(tokens.first())(lex_catch_many(tokens.rest().toList())); };
    var eof = parse_prefix_regex(/^$/, function (s, r) { return ({ range: r, kind: "eof" }); });
    var token = lex_catch_many(Immutable.List([
        parse_prefix_regex(/^;/, function (s, r) { return ({ range: r, kind: ";" }); }),
        parse_prefix_regex(/^[a-zA-Z_][a-zA-Z0-9_]*/, function (s, r) {
            return s == "class" || s == "new" || s == "return" || s == "for"
                || s == "for" || s == "while" || s == "if" || s == "else"
                || s == "debugger" || s == "typechecker_debugger"
                || s == "private" || s == "public" || s == "protected"
                || s == "virtual" || s == "override" || s == "base"
                || s == "static" ? ({ range: r, kind: s })
                : s == "other_surface" || s == "empty_surface" || s == "ellipse"
                    || s == "sprite" || s == "circle" || s == "rectangle" || s == "text"
                    || s == "line" || s == "polygon" || s == "square" ? ({ range: r, kind: s })
                    : s == "as" ? ({ range: r, kind: "as" })
                        : s == "true" || s == "false" ? ({ range: r, kind: "bool", v: (s == "true") })
                            : ({ range: r, kind: "id", v: s });
        }),
        parse_prefix_regex(/^-?[0-9]+\.[0-9]*f/, function (s, r) { return ({ range: r, kind: "float", v: parseFloat(s) }); }),
        parse_prefix_regex(/^-?[0-9]+\.[0-9]+/, function (s, r) { return ({ range: r, kind: "double", v: parseFloat(s) }); }),
        parse_prefix_regex(/^-?[0-9]+/, function (s, r) { return ({ range: r, kind: "int", v: parseInt(s) }); }),
        parse_prefix_regex(/^\n/, function (s, r) { return ({ range: r, kind: "nl" }); }),
        parse_prefix_regex(/^\?/, function (s, r) { return ({ range: r, kind: "?" }); }),
        parse_prefix_regex(/^\:/, function (s, r) { return ({ range: r, kind: ":" }); }),
        parse_prefix_regex(/^\+/, function (s, r) { return ({ range: r, kind: "+" }); }),
        parse_prefix_regex(/^\*/, function (s, r) { return ({ range: r, kind: "*" }); }),
        parse_prefix_regex(/^\-/, function (s, r) { return ({ range: r, kind: "-" }); }),
        parse_prefix_regex(/^\//, function (s, r) { return ({ range: r, kind: "/" }); }),
        parse_prefix_regex(/^%/, function (s, r) { return ({ range: r, kind: "%" }); }),
        parse_prefix_regex(/^<=/, function (s, r) { return ({ range: r, kind: "<=" }); }),
        parse_prefix_regex(/^>=/, function (s, r) { return ({ range: r, kind: ">=" }); }),
        parse_prefix_regex(/^</, function (s, r) { return ({ range: r, kind: "<" }); }),
        parse_prefix_regex(/^>/, function (s, r) { return ({ range: r, kind: ">" }); }),
        parse_prefix_regex(/^=>/, function (s, r) { return ({ range: r, kind: "=>" }); }),
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
        parse_prefix_regex(/^\[/, function (s, r) { return ({ range: r, kind: "[" }); }),
        parse_prefix_regex(/^\]/, function (s, r) { return ({ range: r, kind: "]" }); }),
        parse_prefix_regex(/^{/, function (s, r) { return ({ range: r, kind: "{" }); }),
        parse_prefix_regex(/^}/, function (s, r) { return ({ range: r, kind: "}" }); }),
        parse_prefix_regex(/^"[^"]*"/, function (s, r) { return ({ range: r, kind: "string", v: s.replace(/^"/, "").replace(/"$/, "") }); }),
        parse_prefix_regex(/^=/, function (s, r) { return ({ range: r, kind: "=" }); }),
        parse_prefix_regex(/^\s+/, function (s, r) { return ({ range: r, kind: " " }); }),
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
