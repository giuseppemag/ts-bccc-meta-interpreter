"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts_bccc_1 = require("ts-bccc");
var ccc_aux_1 = require("../ccc_aux");
var GrammarBasics;
(function (GrammarBasics) {
    var parse_prefix_regex = function (r, t) { return ts_bccc_1.mk_coroutine(ts_bccc_1.fun(function (s) {
        var m = s.match(r);
        if (m == null || m.length == 0) {
            return ts_bccc_1.apply(ts_bccc_1.inl(), "No match");
        }
        else {
            var rest = s.split(r)[1];
            var f = (ts_bccc_1.constant(t(m[0])).times(ts_bccc_1.constant(rest || "")));
            var g = f.then(ts_bccc_1.inr());
            var h = g.then(ts_bccc_1.inr());
            return ts_bccc_1.apply(h, {});
        }
    })); };
    var eof = parse_prefix_regex(/^$/, function (s) { return ({ kind: "eof" }); });
    var newline = parse_prefix_regex(/^\n/, function (s) { return ({ kind: "\n" }); });
    var whitespace = parse_prefix_regex(/^\s+/, function (s) { return ({ kind: " " }); });
    var semicolon = parse_prefix_regex(/^;/, function (s) { return ({ kind: ";" }); });
    var plus = parse_prefix_regex(/^\+/, function (s) { return ({ kind: "+" }); });
    var times = parse_prefix_regex(/^\*/, function (s) { return ({ kind: "*" }); });
    var dot = parse_prefix_regex(/^\./, function (s) { return ({ kind: "." }); });
    var lbr = parse_prefix_regex(/^\(/, function (s) { return ({ kind: "(" }); });
    var rbr = parse_prefix_regex(/^\)/, function (s) { return ({ kind: ")" }); });
    var int = parse_prefix_regex(/^[0-9]+/, function (s) { return ({ kind: "int", v: parseInt(s) }); });
    var float = parse_prefix_regex(/^[0-9]+.[0-9]+/, function (s) { return ({ kind: "float", v: parseFloat(s) }); });
    var _if = parse_prefix_regex(/^if/, function (s) { return ({ kind: "if" }); });
    var _eq = parse_prefix_regex(/^=/, function (s) { return ({ kind: "=" }); });
    var _then = parse_prefix_regex(/^then/, function (s) { return ({ kind: "then" }); });
    var _else = parse_prefix_regex(/^else/, function (s) { return ({ kind: "else" }); });
    var identifier = parse_prefix_regex(/^[a-zA-Z][a-zA-Z0-9]*/, function (s) { return ({ kind: "id", v: s }); });
    var token = ccc_aux_1.co_catch(semicolon)(ccc_aux_1.co_catch(plus)(ccc_aux_1.co_catch(times)(ccc_aux_1.co_catch(dot)(ccc_aux_1.co_catch(lbr)(ccc_aux_1.co_catch(rbr)(ccc_aux_1.co_catch(int)(ccc_aux_1.co_catch(float)(ccc_aux_1.co_catch(_if)(ccc_aux_1.co_catch(_eq)(ccc_aux_1.co_catch(_then)(ccc_aux_1.co_catch(_else)(ccc_aux_1.co_catch(int)(ccc_aux_1.co_catch(identifier)(ccc_aux_1.co_catch(newline)(whitespace)))))))))))))));
    GrammarBasics.tokenize = function (source) {
        var res = ccc_aux_1.co_run_to_end(ccc_aux_1.co_repeat(token).then(function (ts) { return eof.then(function (_) { return ts_bccc_1.co_unit(ts); }); }), source);
        return res.kind == "left" ? [] : res.value.fst;
    };
})(GrammarBasics = exports.GrammarBasics || (exports.GrammarBasics = {}));
var mk_decl = function (l, r) { return ({ kind: "decl", l: l, r: r }); };
var mk_assign = function (l, r) { return ({ kind: "=", l: l, r: r }); };
var mk_field_ref = function (l, r) { return ({ kind: ".", l: l, r: r }); };
var mk_semicolon = function (l, r) { return ({ kind: ";", l: l, r: r }); };
var mk_plus = function (l, r) { return ({ kind: "+", l: l, r: r }); };
var mk_times = function (l, r) { return ({ kind: "*", l: l, r: r }); };
var int = ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected number");
    var i = s.first();
    if (i.kind == "int") {
        var res_1 = { kind: "int", value: i.v };
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit(res_1); });
    }
    else
        return ts_bccc_1.co_error("error, int");
});
var id = ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected identifier");
    var i = s.first();
    if (i.kind == "id") {
        var res_2 = { kind: "id", value: i.v };
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit(res_2); });
    }
    else
        return ts_bccc_1.co_error("error, int");
});
var equal_sign = ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected equal");
    var i = s.first();
    if (i.kind == "=") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("error, int");
});
var semicolon_sign = ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected equal");
    var i = s.first();
    if (i.kind == ";") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("error, int");
});
var left_bracket = ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected dot");
    var i = s.first();
    if (i.kind == "(") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("error, dot");
});
var right_bracket = ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected dot");
    var i = s.first();
    if (i.kind == ")") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("error, dot");
});
var dot_sign = ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected dot");
    var i = s.first();
    if (i.kind == ".") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("error, dot");
});
var plus_op = ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected dot");
    var i = s.first();
    if (i.kind == "+") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("error, dot");
});
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
var times_op = ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_error("found empty state, expected dot");
    var i = s.first();
    if (i.kind == "*") {
        return ts_bccc_1.co_set_state(s.rest().toList()).then(function (_) { return ts_bccc_1.co_unit({}); });
    }
    else
        return ts_bccc_1.co_error("error, dot");
});
var eof = ts_bccc_1.co_get_state().then(function (s) {
    if (s.isEmpty())
        return ts_bccc_1.co_unit({});
    return ts_bccc_1.co_error("found non-empty state, expected eof");
});
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
var whitespace = function () {
    return ccc_aux_1.co_catch(newline_sign.then(function (_) { return whitespace(); }))(ts_bccc_1.co_unit({}));
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
