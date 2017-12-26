"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts_bccc_1 = require("ts-bccc");
var Lexer = require("../lexer");
var ccc_aux_1 = require("../ccc_aux");
var GrammarBasics;
(function (GrammarBasics) {
    var newline = ({ kind: "Newline" });
    var indent = ({ kind: "Indent" });
    var deindent = ({ kind: "Deindent" });
    var semicolon = function (s) { return !/;$/.test(s) ? ccc_aux_1.none().f({}) : ccc_aux_1.some().f({ kind: ";" }); };
    var plus = function (s) { return !/\+$/.test(s) ? ccc_aux_1.none().f({}) : ccc_aux_1.some().f({ kind: "+" }); };
    var times = function (s) { return !/\*$/.test(s) ? ccc_aux_1.none().f({}) : ccc_aux_1.some().f({ kind: "*" }); };
    var dot = function (s) { return !/\.$/.test(s) ? ccc_aux_1.none().f({}) : ccc_aux_1.some().f({ kind: "." }); };
    var lbr = function (s) { return !/\($/.test(s) ? ccc_aux_1.none().f({}) : ccc_aux_1.some().f({ kind: "(" }); };
    var rbr = function (s) { return !/\)$/.test(s) ? ccc_aux_1.none().f({}) : ccc_aux_1.some().f({ kind: ")" }); };
    var int = function (s) { return !/^[0-9]+$/.test(s) ? ccc_aux_1.none().f({}) : ccc_aux_1.some().f({ kind: "int", v: parseInt(s) }); };
    var float = function (s) { return !/^[0-9]+.[0-9]+$/.test(s) ? ccc_aux_1.none().f({}) : ccc_aux_1.some().f({ kind: "float", v: parseFloat(s) }); };
    var _if = function (s) { return !/^if$/.test(s) ? ccc_aux_1.none().f({}) : ccc_aux_1.some().f({ kind: "if" }); };
    var _eq = function (s) { return !/^=$/.test(s) ? ccc_aux_1.none().f({}) : ccc_aux_1.some().f({ kind: "=" }); };
    var _then = function (s) { return !/^then$/.test(s) ? ccc_aux_1.none().f({}) : ccc_aux_1.some().f({ kind: "then" }); };
    var _else = function (s) { return !/^else$/.test(s) ? ccc_aux_1.none().f({}) : ccc_aux_1.some().f({ kind: "else" }); };
    var id = function (s) { return !/^[a-zA-Z][a-zA-Z0-9]*$/.test(s) ? ccc_aux_1.none().f({}) : ccc_aux_1.some().f({ kind: "id", v: s }); };
    GrammarBasics.tokenize = function (source) {
        var res = Lexer.tokenize(Lexer.pre_process_indentation(source), function (_) { return newline; }, function (_) { return indent; }, function (_) { return deindent; }, ts_bccc_1.defun(ccc_aux_1.option_plus(ts_bccc_1.fun(semicolon), ccc_aux_1.option_plus(ts_bccc_1.fun(dot), ccc_aux_1.option_plus(ts_bccc_1.fun(plus), ccc_aux_1.option_plus(ts_bccc_1.fun(times), ccc_aux_1.option_plus(ts_bccc_1.fun(int), ccc_aux_1.option_plus(ts_bccc_1.fun(lbr), ccc_aux_1.option_plus(ts_bccc_1.fun(rbr), ccc_aux_1.option_plus(ts_bccc_1.fun(float), ccc_aux_1.option_plus(ts_bccc_1.fun(_if), ccc_aux_1.option_plus(ts_bccc_1.fun(_eq), ccc_aux_1.option_plus(ts_bccc_1.fun(_then), ccc_aux_1.option_plus(ts_bccc_1.fun(_else), ts_bccc_1.fun(id)))))))))))))));
        return res.kind == "right" ? Array() : res.value;
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
