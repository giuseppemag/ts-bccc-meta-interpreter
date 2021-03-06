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
var ccc_aux_1 = require("../ccc_aux");
var source_range_1 = require("../source_range");
var primitives_1 = require("./primitives");
var priority_operators_table = Immutable.Map()
    .set("()", { priority: 12, associativity: "left" })
    .set("[]", { priority: 12, associativity: "left" })
    .set(".", { priority: 12, associativity: "left" })
    .set("*", { priority: 10, associativity: "left" })
    .set("/", { priority: 10, associativity: "left" })
    .set("%", { priority: 10, associativity: "right" })
    .set("+", { priority: 7, associativity: "left" })
    .set("-", { priority: 7, associativity: "left" })
    .set(">", { priority: 6, associativity: "right" })
    .set("<", { priority: 6, associativity: "right" })
    .set("<=", { priority: 6, associativity: "right" })
    .set(">=", { priority: 6, associativity: "right" })
    .set("==", { priority: 5, associativity: "right" })
    .set("!=", { priority: 5, associativity: "right" })
    .set("not", { priority: 4, associativity: "right" })
    .set("xor", { priority: 4, associativity: "right" })
    .set("&&", { priority: 4, associativity: "right" })
    .set("||", { priority: 4, associativity: "right" })
    .set("as", { priority: 4, associativity: "right" })
    .set(":", { priority: 3, associativity: "right" })
    .set("?", { priority: 2, associativity: "left" })
    .set("=>", { priority: 1, associativity: "right" })
    .set(",", { priority: 0, associativity: "right" });
exports.mk_filesystem_ast = function (nodes) { return ({ kind: 'filesystem', nodes: Immutable.List(nodes) }); };
exports.mk_key_value_ast = function (key, value) { return ({ kind: 'filesystem.keyvalue', key: key, value: value }); };
exports.mk_file_ast = function (path, contents) { return ({ kind: 'filesystem.file', path: path, attributes: Immutable.List(contents) }); };
exports.mk_filesys_and_program_ast = function (fs, prg) { return ({ kind: 'filesystem+program', filesystem: fs, program: prg }); };
exports.key_value = primitives_1.string.then(function (key) {
    return primitives_1.colon_keyword.then(function (_) {
        return primitives_1.string.then(function (value) {
            return ts_bccc_1.co_unit({
                range: source_range_1.join_source_ranges(key.range, value.range),
                ast: exports.mk_key_value_ast(key, value)
            });
        });
    });
});
exports.file = primitives_1.file_keyword.then(function (id) {
    return primitives_1.string.then(function (path) {
        return primitives_1.left_curly_bracket.then(function (_) {
            return ccc_aux_1.co_repeat(exports.key_value).then(function (kvs) {
                return primitives_1.right_curly_bracket.then(function (rb) {
                    return ts_bccc_1.co_unit({ range: source_range_1.join_source_ranges(id, rb), ast: exports.mk_file_ast(path, kvs) });
                });
            });
        });
    });
});
exports.filesystem_prs = primitives_1.filesystem_keyword.then(function (k) {
    return primitives_1.left_curly_bracket.then(function (_) {
        return ccc_aux_1.co_repeat(exports.file).then(function (children) {
            return primitives_1.right_curly_bracket.then(function (rb) {
                return ts_bccc_1.co_unit({ range: source_range_1.join_source_ranges(k, rb), ast: exports.mk_filesystem_ast(children) });
            });
        });
    });
});
exports.mk_parser_state = function (tokens) { return ({ tokens: tokens, branch_priority: 0 }); };
var no_match = ts_bccc_1.co_get_state().then(function (s) { return ts_bccc_1.co_set_state(__assign({}, s, { branch_priority: 0 })); });
var partial_match = ts_bccc_1.co_get_state().then(function (s) { return ts_bccc_1.co_set_state(__assign({}, s, { branch_priority: 50 })); });
var full_match = ts_bccc_1.co_get_state().then(function (s) { return ts_bccc_1.co_set_state(__assign({}, s, { branch_priority: 100 })); });
var dbg = primitives_1.ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.tokens.isEmpty())
        return ts_bccc_1.co_error({ range: source_range_1.mk_range(-1, 0, 0, 0), priority: s.branch_priority, message: "found empty state, expected identifier" });
    var i = s.tokens.first();
    if (i.kind == "debugger") {
        var res_1 = primitives_1.mk_dbg(i.range);
        return ts_bccc_1.co_set_state(__assign({}, s, { tokens: s.tokens.rest().toList() })).then(function (_) { return ts_bccc_1.co_unit(res_1); });
    }
    else
        return ts_bccc_1.co_error({ range: i.range, priority: s.branch_priority, message: "expected debugger but found " + i.kind });
}));
var tc_dbg = primitives_1.ignore_whitespace(ts_bccc_1.co_get_state().then(function (s) {
    if (s.tokens.isEmpty())
        return ts_bccc_1.co_error({ range: source_range_1.mk_range(-1, 0, 0, 0), priority: s.branch_priority, message: "found empty state, expected identifier" });
    var i = s.tokens.first();
    if (i.kind == "typechecker_debugger") {
        var res_2 = primitives_1.mk_tc_dbg(i.range);
        return ts_bccc_1.co_set_state(__assign({}, s, { tokens: s.tokens.rest().toList() })).then(function (_) { return ts_bccc_1.co_unit(res_2); });
    }
    else
        return ts_bccc_1.co_error({ range: i.range, priority: s.branch_priority, message: "expected typecheker debugger but found " + i.kind });
}));
var index_of = primitives_1.left_square_bracket.then(function (ls) {
    return exports.expr().then(function (actual) {
        return primitives_1.right_square_bracket.then(function (rs) {
            return ts_bccc_1.co_unit({ val: actual, range: source_range_1.join_source_ranges(ls, rs) });
        });
    });
});
exports.par = no_match.then(function (_) {
    return primitives_1.left_bracket.then(function (lb) {
        return partial_match.then(function (_) {
            return actuals().then(function (actuals) {
                return primitives_1.right_bracket.then(function (rb) {
                    return full_match.then(function (_) {
                        return ts_bccc_1.co_unit({ val: actuals, range: source_range_1.join_source_ranges(lb, rb) });
                    });
                });
            });
        });
    });
});
var empty_table = {
    symbols: Immutable.Stack(),
    callables: Immutable.Stack(),
    ops: Immutable.Stack()
};
var reduce_table = function (table) {
    if (table.symbols.count() == 0 && table.ops.count() == 0)
        return { ast: { kind: "unit" }, range: source_range_1.mk_range(-1, -1, -1, -1) };
    if (table.symbols.count() == 1 && table.ops.count() == 0)
        return table.symbols.peek();
    var res = reduce_table_2(table.symbols, table.ops, table.callables, true);
    return res.new_top;
};
var is_callable = function (e) {
    var e_k = e.ast.kind;
    // console.log("")
    // console.log("is callable", e_k)
    // console.log("")
    return e_k == "." ||
        e_k == "func_call" ||
        e_k == "get_array_value_at" ||
        e_k == "bracket" ||
        e_k == "id";
};
var reduce_table_2 = function (symbols, ops, callables, reduce_to_end) {
    if (reduce_to_end && symbols.count() == 1 && ops.count() == 0) {
        return { new_top: symbols.peek(), callables: callables.pop().push(is_callable(symbols.peek())), symbols: symbols, ops: ops };
    }
    var op = ops.peek();
    // console.log("ops_count", ops.count(), JSON.stringify(ops))
    // console.log("symbols_count", symbols.count(), JSON.stringify(symbols))
    // console.log("callables_count", callables.count(), JSON.stringify(callables))
    // console.log("op", callables.count(), JSON.stringify(callables))
    if (op.snd.kind == "binary") {
        var snd = symbols.peek();
        var fst = symbols.pop().peek();
        symbols = symbols.pop().pop();
        var new_top = op.snd.f(fst, snd);
        callables = callables.pop().pop().pop();
        var is_new_top_callable = is_callable(new_top);
        callables = callables.push(is_new_top_callable);
        if (reduce_to_end) {
            return reduce_table_2(symbols.push(new_top), ops.pop(), callables, reduce_to_end);
        }
        return { new_top: new_top, symbols: symbols.push(new_top), callables: callables, ops: ops.pop() };
    }
    else {
        var fst = symbols.peek();
        symbols = symbols.pop();
        var is_fst_callable = fst == undefined ? false
            : callables.count() == 0 ? false
                : callables.peek();
        callables = callables.pop();
        var new_top = op.snd.f(fst == undefined ? "none" : fst, is_fst_callable);
        if (new_top.kind == "0-ary_push_back") {
            symbols = fst == undefined ? symbols : symbols.push(fst);
            symbols = symbols.push(new_top.value);
            callables = callables.pop().push(is_callable(new_top.value));
        }
        else {
            callables = callables.pop().pop().push(is_callable(new_top.value));
            symbols = symbols.push(new_top.value);
        }
        if (reduce_to_end && symbols.count() > 0) {
            return reduce_table_2(symbols, ops.pop(), callables, reduce_to_end);
        }
        return { new_top: new_top.value, symbols: symbols, callables: callables, ops: ops.pop() };
    }
};
var expr_after_op = function (symbols, callables, ops, current_op, compose_current) {
    if (ops.count() > 0 &&
        ((ops.peek().snd.kind == "binary" &&
            symbols.count() >= 2) ||
            (ops.peek().snd.kind == "unary" &&
                symbols.count() >= 1))) {
        // console.log("A")
        var op_p = priority_operators_table.get(ops.peek().fst);
        var current_p = priority_operators_table.get(current_op);
        if (op_p.priority > current_p.priority ||
            (op_p.priority == current_p.priority &&
                op_p.associativity == "left")) {
            var res = reduce_table_2(symbols, ops, callables, false);
            return expr_after_op(res.symbols, res.callables, res.ops, current_op, compose_current);
        }
    }
    // console.log("B")
    return expr_AUX({ symbols: symbols, ops: ops.push({ fst: current_op, snd: compose_current }), callables: current_op == "()" ? callables : callables.push(false) });
};
var comma_to_array = function (comma) {
    if (comma.ast.kind == ",") {
        var left = comma.ast.l;
        var right = comma_to_array(comma.ast.r);
        return [left].concat(right);
    }
    else {
        return [comma];
    }
};
var mk_unary = function (f) { return ({ kind: "unary", f: f }); };
var mk_binary = function (f) { return ({ kind: "binary", f: f }); };
var expr_AUX = function (table, try_par) {
    var cases = function (l) {
        var symbols = table.symbols;
        var callables = table.callables;
        if (l != "none") {
            symbols = table.symbols.push(l);
            callables = table.callables.push(is_callable(l));
        }
        else {
        }
        // to improve
        // not_op.then(_ =>
        //   expr().then(e =>
        //   co_unit<ParserState,ParserError,ParserRes>(mk_not(e))))
        return primitives_1.parser_or(primitives_1.not_op.then(function (_) { return expr_after_op(symbols, callables, table.ops, "not", mk_unary(function (l, is_callable) { return ({ kind: "res", value: primitives_1.mk_not(l) }); })); }), primitives_1.parser_or(index_of.then(function (res) { return expr_after_op(symbols, callables, table.ops, "[]", mk_unary(function (l, is_callable) { return ({ kind: "res", value: primitives_1.mk_get_array_value_at(source_range_1.join_source_ranges(l.range, res.range), l, res.val) }); })); }), primitives_1.parser_or(primitives_1.question_mark_keyword.then(function (_) { return expr_after_op(symbols, callables, table.ops, "?", mk_binary(function (l, r) { return primitives_1.mk_ternary_if(source_range_1.join_source_ranges(l.range, r.range), l, r); })); }), primitives_1.parser_or(primitives_1.colon_keyword.then(function (_) { return expr_after_op(symbols, callables, table.ops, ":", mk_binary(function (l, r) { return primitives_1.mk_ternary_then_else(source_range_1.join_source_ranges(l.range, r.range), l, r); })); }), primitives_1.parser_or(primitives_1.dot_sign.then(function (_) { return expr_after_op(symbols, callables, table.ops, ".", mk_binary(function (l, r) { return primitives_1.mk_field_ref(l, r); })); }), primitives_1.parser_or(exports.par.then(function (res) {
            var actuals = res.val;
            var range = res.range;
            actuals = actuals.length == 1 && actuals[0].ast.kind == "unit" ? [] : actuals;
            return expr_after_op(symbols, l != "none" ? callables.push(is_callable(l)) : callables, table.ops, "()", mk_unary(function (_l, is_callable) {
                return _l == "none" ? { kind: "0-ary_push_back", value: primitives_1.mk_bracket(actuals[0], range) }
                    : !is_callable ? { kind: "0-ary_push_back", value: primitives_1.mk_bracket(actuals[0], range) }
                        : { kind: "res", value: primitives_1.mk_call(_l, actuals.length == 1 && actuals[0].ast.kind == "," ? comma_to_array(actuals[0]) : actuals, source_range_1.join_source_ranges(_l.range, res.range)) };
            }));
        }), primitives_1.parser_or(comma.then(function (_) { return expr_after_op(symbols, callables, table.ops, ",", mk_binary(function (l, r) { return primitives_1.mk_pair(l, r); })); }), primitives_1.parser_or(primitives_1.arrow_op.then(function (_) { return expr_after_op(symbols, callables, table.ops, "=>", mk_binary(function (l, r) {
            //console.log("mk_arrow-2", JSON.stringify(r)) ||
            return primitives_1.mk_arrow(l, r);
        })); }), primitives_1.parser_or(primitives_1.as_op.then(function (_) { return expr_after_op(symbols, callables, table.ops, "as", mk_binary(function (l, r) { return primitives_1.mk_as(l, r); })); }), primitives_1.parser_or(primitives_1.plus_op.then(function (_) { return expr_after_op(symbols, callables, table.ops, "+", mk_binary(function (l, r) { return primitives_1.mk_plus(l, r); })); }), primitives_1.parser_or(primitives_1.minus_op.then(function (_) { return expr_after_op(symbols, callables, table.ops, "-", mk_binary(function (l, r) { return primitives_1.mk_minus(l, r); })); }), primitives_1.parser_or(ccc_aux_1.co_stateless(primitives_1.negative_number).then(function (_) { return expr_after_op(symbols, callables, table.ops, "+", mk_binary(function (l, r) { return primitives_1.mk_plus(l, r); })); }), primitives_1.parser_or(primitives_1.times_op.then(function (_) { return expr_after_op(symbols, callables, table.ops, "*", mk_binary(function (l, r) { return primitives_1.mk_times(l, r); })); }), primitives_1.parser_or(primitives_1.div_op.then(function (_) { return expr_after_op(symbols, callables, table.ops, "/", mk_binary(function (l, r) { return primitives_1.mk_div(l, r); })); }), primitives_1.parser_or(primitives_1.mod_op.then(function (_) { return expr_after_op(symbols, callables, table.ops, "%", mk_binary(function (l, r) { return primitives_1.mk_mod(l, r); })); }), primitives_1.parser_or(primitives_1.lt_op.then(function (_) { return expr_after_op(symbols, callables, table.ops, "<", mk_binary(function (l, r) { return primitives_1.mk_lt(l, r); })); }), primitives_1.parser_or(primitives_1.gt_op.then(function (_) { return expr_after_op(symbols, callables, table.ops, ">", mk_binary(function (l, r) { return primitives_1.mk_gt(l, r); })); }), primitives_1.parser_or(primitives_1.leq_op.then(function (_) { return expr_after_op(symbols, callables, table.ops, "<=", mk_binary(function (l, r) { return primitives_1.mk_leq(l, r); })); }), primitives_1.parser_or(primitives_1.geq_op.then(function (_) { return expr_after_op(symbols, callables, table.ops, ">=", mk_binary(function (l, r) { return primitives_1.mk_geq(l, r); })); }), primitives_1.parser_or(primitives_1.eq_op.then(function (_) { return expr_after_op(symbols, callables, table.ops, "==", mk_binary(function (l, r) { return primitives_1.mk_eq(l, r); })); }), primitives_1.parser_or(primitives_1.neq_op.then(function (_) { return expr_after_op(symbols, callables, table.ops, "!=", mk_binary(function (l, r) { return primitives_1.mk_neq(l, r); })); }), primitives_1.parser_or(primitives_1.and_op.then(function (_) { return expr_after_op(symbols, callables, table.ops, "&&", mk_binary(function (l, r) { return primitives_1.mk_and(l, r); })); }), primitives_1.parser_or(primitives_1.or_op.then(function (_) { return expr_after_op(symbols, callables, table.ops, "||", mk_binary(function (l, r) { return primitives_1.mk_or(l, r); })); }), primitives_1.parser_or(primitives_1.xor_op.then(function (_) { return expr_after_op(symbols, callables, table.ops, "xor", mk_binary(function (l, r) { return primitives_1.mk_xor(l, r); })); }), ts_bccc_1.co_unit(__assign({}, table, { symbols: symbols, callables: callables }))))))))))))))))))))))))));
    };
    // return parser_or<SymTable>(term().then(l => cases(l).then(res => console.log("RES1", res)||co_unit(res))), cases("none").then(res => console.log("RES2", res) || co_unit(res)))
    return primitives_1.parser_or(primitives_1.term(try_par ? try_par : false).then(function (l) { return cases(l); }), cases("none"));
};
var cons_call = function () {
    return primitives_1.new_keyword.then(function (new_range) {
        return primitives_1.identifier_token.then(function (class_name) {
            return primitives_1.parser_or(primitives_1.lt_op.then(function (_) {
                return partial_match.then(function (_) {
                    return exports.type_args().then(function (args) {
                        return primitives_1.gt_op.then(function (end_range) {
                            return ts_bccc_1.co_unit(args);
                        });
                    });
                });
            }), ts_bccc_1.co_unit(Array())).then(function (type_params) {
                return primitives_1.left_bracket.then(function (_) {
                    return actuals().then(function (actuals) {
                        return primitives_1.right_bracket.then(function (rb) {
                            var args = actuals.length == 1 && actuals[0].ast.kind == "unit" ? [] :
                                actuals.length == 1 && actuals[0].ast.kind == "," ? comma_to_array(actuals[0]) : actuals;
                            return ts_bccc_1.co_unit(primitives_1.mk_constructor_call(source_range_1.join_source_ranges(new_range, rb), class_name.id, type_params, args));
                        });
                    });
                });
            });
        });
    });
};
var array_new = function () {
    return primitives_1.new_keyword.then(function (new_range) {
        return type_decl().then(function (array_type) {
            return primitives_1.left_square_bracket.then(function (_) {
                return primitives_1.parser_or(exports.expr(), primitives_1.term(false))
                    .then(function (actual) {
                    return primitives_1.right_square_bracket.then(function (rs) {
                        return ts_bccc_1.co_unit(primitives_1.mk_array_cons_call(source_range_1.join_source_ranges(new_range, rs), array_type, actual));
                    });
                });
            });
        });
    });
};
var array_new_and_init = function () {
    return primitives_1.new_keyword.then(function (new_range) {
        return type_decl(false).then(function (array_type) {
            return primitives_1.left_square_bracket.then(function (_) {
                return primitives_1.right_square_bracket.then(function (_) {
                    return primitives_1.left_curly_bracket.then(function (_) {
                        return actuals().then(function (_actuals) {
                            return primitives_1.right_curly_bracket.then(function (rs) {
                                var actuals = _actuals[0].ast.kind == "," ? comma_to_array(_actuals[0]) : _actuals;
                                return ts_bccc_1.co_unit(primitives_1.mk_array_cons_call_and_init(source_range_1.join_source_ranges(new_range, rs), array_type, actuals));
                            });
                        });
                    });
                });
            });
        });
    });
};
exports.expr = function () {
    var res = expr_AUX(empty_table, true).then(function (e) { return ts_bccc_1.co_unit(reduce_table(e)); });
    return primitives_1.parser_or(array_new_and_init(), primitives_1.parser_or(array_new(), primitives_1.parser_or(cons_call(), res)));
};
var semicolon = primitives_1.ignore_whitespace(primitives_1.semicolon_sign);
var comma = primitives_1.ignore_whitespace(primitives_1.comma_sign);
var with_semicolon = function (p) { return p.then(function (p_res) { return primitives_1.ignore_whitespace(primitives_1.semicolon_sign).then(function (_) { return ts_bccc_1.co_unit(p_res); }); }); };
exports.type_args = function (check_array_decl) {
    if (check_array_decl === void 0) { check_array_decl = true; }
    return primitives_1.parser_or(type_decl(check_array_decl).then(function (a) {
        return primitives_1.parser_or(comma.then(function (_) {
            return exports.type_args(check_array_decl).then(function (as) {
                return ts_bccc_1.co_unit([a].concat(as));
            });
        }), ts_bccc_1.co_unit([a]));
    }), ts_bccc_1.co_unit(Array()));
};
var assign_right = function () {
    return no_match.then(function (_) {
        return primitives_1.equal_sign.then(function (_) {
            return partial_match.then(function (_) {
                return exports.expr().then(function (r) {
                    return full_match.then(function (_) {
                        return ts_bccc_1.co_unit(r);
                    });
                });
            });
        });
    });
};
var assign = function () {
    return exports.expr().then(function (l) {
        return assign_right().then(function (r) { return ts_bccc_1.co_unit(primitives_1.mk_assign(l, r)); });
    });
};
var tuple_or_record = primitives_1.left_bracket.then(function (lb) {
    return primitives_1.parser_or(exports.type_args().then(function (as) {
        return primitives_1.right_bracket.then(function (rb) {
            return ts_bccc_1.co_unit(primitives_1.mk_tuple_type_decl(source_range_1.join_source_ranges(lb, rb), as));
        });
    }), arg_decls().then(function (as) {
        return primitives_1.right_bracket.then(function (rb) {
            return ts_bccc_1.co_unit(primitives_1.mk_record_type_decl(source_range_1.join_source_ranges(lb, rb), as));
        });
    }));
});
var array = function (t) {
    return primitives_1.left_square_bracket.then(function (_) {
        return partial_match.then(function (_) {
            return primitives_1.right_square_bracket.then(function (end_range) {
                return ts_bccc_1.co_unit(primitives_1.mk_array_decl(source_range_1.join_source_ranges(t.range, end_range), t));
            });
        });
    });
};
var type_decl = function (check_array_decl) {
    if (check_array_decl === void 0) { check_array_decl = true; }
    return primitives_1.parser_or(check_array_decl ?
        primitives_1.parser_or(tuple_or_record.then(function (t) {
            return array(t);
        }), tuple_or_record) : tuple_or_record, primitives_1.identifier.then(function (i) {
        return primitives_1.parser_or((check_array_decl ? array(i) : ts_bccc_1.co_error({ range: source_range_1.zero_range, priority: -1, message: "" })), primitives_1.parser_or(primitives_1.lt_op.then(function (_) {
            return partial_match.then(function (_) {
                return exports.type_args().then(function (args) {
                    return primitives_1.gt_op.then(function (end_range) {
                        return ts_bccc_1.co_unit(primitives_1.mk_generic_type_inst(source_range_1.join_source_ranges(i.range, end_range), i, args));
                    });
                });
            });
        }), check_array_decl ?
            primitives_1.parser_or(primitives_1.left_square_bracket.then(function (_) {
                return partial_match.then(function (_) {
                    return primitives_1.right_square_bracket.then(function (end_range) {
                        return ts_bccc_1.co_unit(primitives_1.mk_array_decl(source_range_1.join_source_ranges(i.range, end_range), i));
                    });
                });
            }), ts_bccc_1.co_unit(i)) : ts_bccc_1.co_unit(i)));
    }));
};
var decl_init = function () {
    return no_match.then(function (_) {
        return type_decl().then(function (l) {
            return primitives_1.identifier.then(function (r) {
                return partial_match.then(function (_) {
                    return assign_right().then(function (v) {
                        return full_match.then(function (_) {
                            return ts_bccc_1.co_unit(primitives_1.mk_decl_and_init(l, r, v));
                        });
                    });
                });
            });
        });
    });
};
var decl = function () {
    return no_match.then(function (_) {
        return type_decl().then(function (l) {
            return primitives_1.identifier.then(function (r) {
                return partial_match.then(function (_) {
                    return ts_bccc_1.co_unit(primitives_1.mk_decl(l, r));
                });
            });
        });
    });
};
var actuals = function () {
    return primitives_1.parser_or(exports.expr().then(function (a) {
        return primitives_1.parser_or(comma.then(function (_) {
            return actuals().then(function (as) {
                return ts_bccc_1.co_unit([a].concat(as));
            });
        }), ts_bccc_1.co_unit([a]));
    }), ts_bccc_1.co_unit(Array()));
};
var identifiers = function () {
    return primitives_1.parser_or(primitives_1.identifier.then(function (a) {
        return primitives_1.parser_or(comma.then(function (_) {
            return identifiers().then(function (as) {
                return ts_bccc_1.co_unit([a].concat(as));
            });
        }), ts_bccc_1.co_unit([a]));
    }), ts_bccc_1.co_unit(Array()));
};
var generic_identifiers = function () {
    return primitives_1.parser_or(primitives_1.parser_or(primitives_1.identifier.then(function (i) {
        return primitives_1.lt_op.then(function (_) {
            return generic_identifiers().then(function (args) {
                return primitives_1.gt_op.then(function (gt) {
                    return ts_bccc_1.co_unit(primitives_1.mk_generic_type_inst(source_range_1.join_source_ranges(i.range, gt), i, args));
                });
            });
        });
    }), primitives_1.identifier).then(function (a) {
        return primitives_1.parser_or(comma.then(function (_) {
            return generic_identifiers().then(function (as) {
                return ts_bccc_1.co_unit([a].concat(as));
            });
        }), ts_bccc_1.co_unit([a]));
    }), ts_bccc_1.co_unit(Array()));
};
var arg_decls = function () {
    return primitives_1.parser_or(decl().then(function (d) {
        return primitives_1.parser_or(comma.then(function (_) {
            return arg_decls().then(function (ds) {
                return ts_bccc_1.co_unit([d].concat(ds));
            });
        }), ts_bccc_1.co_unit([d]));
    }), ts_bccc_1.co_unit(Array()));
};
var return_statement = function () {
    return no_match.then(function (_) {
        return primitives_1.return_sign.then(function (return_range) {
            return partial_match.then(function (_) {
                return primitives_1.parser_or(exports.expr().then(function (e) {
                    return ts_bccc_1.co_unit(primitives_1.mk_return(e, source_range_1.join_source_ranges(return_range, e.range)));
                }), ts_bccc_1.co_unit(primitives_1.mk_unit(return_range)));
            });
        });
    });
};
var if_conditional = function (stmt) {
    return no_match.then(function (_) {
        return primitives_1.if_keyword.then(function (if_keyword) {
            return partial_match.then(function (_) {
                return exports.expr().then(function (c) {
                    return primitives_1.parser_or(primitives_1.left_curly_bracket.then(function (_) {
                        return un_bracketized_statement().then(function (t) {
                            return primitives_1.right_curly_bracket.then(function (t_r_cb) {
                                return primitives_1.parser_or(primitives_1.else_keyword.then(function (_) {
                                    return primitives_1.left_curly_bracket.then(function (_) {
                                        return un_bracketized_statement().then(function (e) {
                                            return primitives_1.right_curly_bracket.then(function (e_r_cb) {
                                                return full_match.then(function (_) {
                                                    return ts_bccc_1.co_unit(primitives_1.mk_if_then_else(source_range_1.join_source_ranges(if_keyword, e_r_cb), c, t, e));
                                                });
                                            });
                                        });
                                    });
                                }), ts_bccc_1.co_unit(primitives_1.mk_if_then(source_range_1.join_source_ranges(if_keyword, t_r_cb), c, t)));
                            });
                        });
                    }), stmt().then(function (t) {
                        return primitives_1.parser_or(primitives_1.else_keyword.then(function (_) {
                            return stmt().then(function (e) {
                                return full_match.then(function (_) {
                                    return ts_bccc_1.co_unit(primitives_1.mk_if_then_else(source_range_1.join_source_ranges(if_keyword, e.range), c, t, e));
                                });
                            });
                        }), ts_bccc_1.co_unit(primitives_1.mk_if_then(source_range_1.join_source_ranges(if_keyword, t.range), c, t)));
                    }));
                });
            });
        });
    });
};
var for_loop = function (stmt) {
    return no_match.then(function (_) {
        return primitives_1.for_keyword.then(function (for_keyword_range) {
            return partial_match.then(function (_) {
                return primitives_1.left_bracket.then(function (lb) {
                    return stmt().then(function (i) {
                        return exports.expr().then(function (c) {
                            return semicolon.then(function (_) {
                                return stmt(true).then(function (s) {
                                    return primitives_1.right_bracket.then(function (_) {
                                        return primitives_1.left_curly_bracket.then(function (_) {
                                            return un_bracketized_statement().then(function (b) {
                                                return primitives_1.right_curly_bracket.then(function (r_b) {
                                                    return full_match.then(function (_) {
                                                        return ts_bccc_1.co_unit(primitives_1.mk_for(source_range_1.join_source_ranges(for_keyword_range, r_b), i, c, s, b));
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};
var while_loop = function (stmt) {
    return no_match.then(function (_) {
        return primitives_1.while_keyword.then(function (while_keyword_range) {
            return partial_match.then(function (_) {
                return exports.expr().then(function (c) {
                    return primitives_1.left_curly_bracket.then(function (_) {
                        return un_bracketized_statement().then(function (b) {
                            return primitives_1.right_curly_bracket.then(function (r_b) {
                                return full_match.then(function (_) {
                                    return ts_bccc_1.co_unit(primitives_1.mk_while(source_range_1.join_source_ranges(while_keyword_range, r_b), c, b));
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};
var bracketized_statement = function () {
    return no_match.then(function (_) {
        return primitives_1.left_curly_bracket.then(function (l_b_r) {
            return partial_match.then(function (_) {
                return function_statements(ccc_aux_1.co_lookup(primitives_1.right_curly_bracket).then(function (_) { return ts_bccc_1.co_unit({}); })).then(function (s) {
                    return primitives_1.right_curly_bracket.then(function (r_b_r) {
                        return full_match.then(function (_) {
                            return ts_bccc_1.co_unit(__assign({}, s, { range: source_range_1.join_source_ranges(l_b_r, r_b_r) }));
                        });
                    });
                });
            });
        });
    });
};
var un_bracketized_statement = function () {
    return no_match.then(function (_) {
        return partial_match.then(function (_) {
            return function_statements(ccc_aux_1.co_lookup(primitives_1.right_curly_bracket).then(function (_) { return ts_bccc_1.co_unit({}); })).then(function (s) {
                return full_match.then(function (_) {
                    return ts_bccc_1.co_unit(s);
                });
            });
        });
    });
};
var constructor_body = function (function_name, arg_decls, params_base_call) {
    return primitives_1.left_curly_bracket.then(function (_) {
        return function_statements(ccc_aux_1.co_lookup(primitives_1.right_curly_bracket).then(function (_) { return ts_bccc_1.co_unit({}); })).then(function (body) {
            return primitives_1.right_curly_bracket.then(function (rb) {
                return full_match.then(function (_) {
                    return ts_bccc_1.co_unit(primitives_1.mk_constructor_declaration(source_range_1.join_source_ranges(function_name.range, rb), function_name.id, Immutable.List(arg_decls), params_base_call, body));
                });
            });
        });
    });
};
var constructor_declaration = function () {
    return no_match.then(function (_) {
        return primitives_1.identifier_token.then(function (function_name) {
            return primitives_1.left_bracket.then(function (_) {
                return partial_match.then(function (_) {
                    return arg_decls().then(function (arg_decls) {
                        return primitives_1.right_bracket.then(function (_) {
                            return primitives_1.parser_or(primitives_1.colon_keyword.then(function (_) {
                                return primitives_1.base.then(function (_) {
                                    return primitives_1.left_bracket.then(function (_) {
                                        return partial_match.then(function (_) {
                                            return actuals().then(function (actuals) {
                                                return primitives_1.right_bracket.then(function (_) {
                                                    var args = actuals.length == 1 && actuals[0].ast.kind == "unit" ? [] :
                                                        actuals.length == 1 && actuals[0].ast.kind == "," ? comma_to_array(actuals[0]) : actuals;
                                                    return constructor_body(function_name, arg_decls, ts_bccc_1.apply(ts_bccc_1.inl(), args));
                                                });
                                            });
                                        });
                                    });
                                });
                            }), constructor_body(function_name, arg_decls, ts_bccc_1.apply(ts_bccc_1.inr(), {})));
                        });
                    });
                });
            });
        });
    });
};
var function_declaration = function (modifiers) {
    return no_match.then(function (_) {
        return type_decl().then(function (return_type) {
            return primitives_1.identifier_token.then(function (function_name) {
                return generic_parameters().then(function (gps) {
                    return primitives_1.left_bracket.then(function (_) {
                        return partial_match.then(function (_) {
                            return arg_decls().then(function (arg_decls) {
                                return primitives_1.right_bracket.then(function (_) {
                                    return primitives_1.parser_or(semicolon.then(function (semicolon) {
                                        return full_match.then(function (_) {
                                            return ts_bccc_1.co_unit(primitives_1.mk_function_declaration(source_range_1.join_source_ranges(return_type.range, semicolon), return_type, function_name.id, Immutable.List(arg_decls), { range: semicolon, ast: { kind: "noop" } }, gps.toArray().map(function (p) { return p.name; })));
                                        });
                                    }), primitives_1.left_curly_bracket.then(function (_) {
                                        return function_statements(ccc_aux_1.co_lookup(primitives_1.right_curly_bracket).then(function (_) { return ts_bccc_1.co_unit({}); })).then(function (body) {
                                            return primitives_1.right_curly_bracket.then(function (rb) {
                                                return full_match.then(function (_) {
                                                    return ts_bccc_1.co_unit(primitives_1.mk_function_declaration(source_range_1.join_source_ranges(return_type.range, rb), return_type, function_name.id, Immutable.List(arg_decls), body, gps.toArray().map(function (p) { return p.name; })));
                                                });
                                            });
                                        });
                                    }));
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};
var class_body = function (class_name, initial_range, generic_parameters, extends_or_implements, modifiers) {
    return primitives_1.left_curly_bracket.then(function (_) {
        return class_statements().then(function (declarations) {
            return primitives_1.right_curly_bracket.then(function (closing_curly_range) {
                return full_match.then(function (_) {
                    return ts_bccc_1.co_unit(primitives_1.mk_class_declaration(class_name.id, generic_parameters, extends_or_implements, declarations.fst, declarations.snd.fst.filter(function (m) { return m != undefined && m.decl.generic_parameters.length == 0; }).toList(), declarations.snd.fst.filter(function (m) { return m != undefined && m.decl.generic_parameters.length > 0; }).toList(), declarations.snd.snd, modifiers, source_range_1.join_source_ranges(initial_range, closing_curly_range)));
                });
            });
        });
    });
};
var class_declaration = function () {
    return no_match.then(function (_) {
        return class_modifiers().then(function (c_ms) {
            return primitives_1.class_keyword.then(function (initial_range) {
                return partial_match.then(function (_) {
                    return primitives_1.identifier_token.then(function (class_name) {
                        return primitives_1.parser_or(primitives_1.lt_op.then(function (_) {
                            return partial_match.then(function (_) {
                                return exports.type_args(false).then(function (args) {
                                    return primitives_1.gt_op.then(function (end_range) {
                                        return ts_bccc_1.co_unit(args);
                                    });
                                });
                            });
                        }), ts_bccc_1.co_unit(Array())).then(function (type_params) {
                            var range = c_ms.count() == 0 ? initial_range : c_ms.toArray().map(function (c_m) { return c_m.range; }).reduce(function (p, n) { return source_range_1.join_source_ranges(p, n); });
                            return primitives_1.parser_or(primitives_1.colon_keyword.then(function (_) {
                                return generic_identifiers().then(function (extends_or_implements) {
                                    return class_body(class_name, range, type_params.map(function (p) { return ({ name: p, variant: "inv" }); }), extends_or_implements_AUX(extends_or_implements), Immutable.List(c_ms.toArray().map(function (m) { return m.ast; })));
                                });
                            }), class_body(class_name, range, type_params.map(function (p) { return ({ name: p, variant: "inv" }); }), [], Immutable.List(c_ms.toArray().map(function (m) { return m.ast; }))));
                        });
                    });
                });
            });
        });
    });
};
var extends_or_implements_AUX = function (extends_or_implements) {
    return extends_or_implements.map(function (i) {
        if (i.ast.kind == "id") {
            return { C_name: i.ast.value, generic_parameters: [], ast: i };
        }
        if (i.ast.kind == "generic type inst" &&
            i.ast.f.ast.kind == "id") {
            return { C_name: i.ast.f.ast.value,
                generic_parameters: i.ast.args.map(function (e) { return (e.ast.kind == "id" ? { name: e.ast.value, variance: "inv" } :
                    { name: "?", variance: "inv" }); }),
                ast: i
            };
        }
        return { C_name: "", generic_parameters: [], ast: i };
    });
};
var interface_declaration = function () {
    return no_match.then(function (_) {
        return class_modifiers().then(function (_ms) {
            return partial_match.then(function (_) {
                return primitives_1.identifier_token.then(function (class_name) {
                    return primitives_1.parser_or(primitives_1.lt_op.then(function (_) {
                        return partial_match.then(function (_) {
                            return exports.type_args().then(function (args) {
                                return primitives_1.gt_op.then(function (end_range) {
                                    return ts_bccc_1.co_unit(args);
                                });
                            });
                        });
                    }), ts_bccc_1.co_unit(Array())).then(function (type_params) {
                        var range = _ms.count() == 0 ? class_name.range :
                            _ms.toArray().map(function (c_m) { return c_m.range; }).reduce(function (p, n) { return source_range_1.join_source_ranges(p, n); });
                        var _ms_new = _ms.toArray().some(function (m) { return m.ast.kind == "public"; }) || _ms.count() == 0 ?
                            _ms.toArray().map(function (m) { return m && m.ast; }) : _ms.toArray().map(function (m) { return m && m.ast; }).concat([{ kind: "public" }]);
                        return primitives_1.parser_or(primitives_1.colon_keyword.then(function (_) {
                            return generic_identifiers().then(function (extends_or_implements) {
                                return class_body(class_name, range, type_params.map(function (p) { return ({ name: p, variant: "inv" }); }), extends_or_implements_AUX(extends_or_implements), Immutable.List(_ms_new));
                            });
                        }), class_body(class_name, range, type_params.map(function (p) { return ({ name: p, variant: "inv" }); }), [], Immutable.List(_ms_new)));
                    });
                });
            });
        });
    });
};
var outer_statement = function () {
    return primitives_1.parser_or(function_declaration([]).then(function (fun_decl) {
        return ts_bccc_1.co_unit({ range: fun_decl.range, ast: fun_decl });
    }), primitives_1.parser_or(class_declaration(), primitives_1.parser_or(interface_declaration(), inner_statement())));
};
var unchanged = CCC.id().f;
var inner_statement = function (skip_semicolon) {
    return primitives_1.parser_or(with_semicolon(ts_bccc_1.co_unit(primitives_1.mk_noop())), primitives_1.parser_or(bracketized_statement(), primitives_1.parser_or(for_loop(function_statement), primitives_1.parser_or(while_loop(function_statement), primitives_1.parser_or(if_conditional(function_statement), primitives_1.parser_or((skip_semicolon ? unchanged : with_semicolon)(decl().then(function (d) {
        return ts_bccc_1.co_unit({ range: source_range_1.join_source_ranges(d.l.range, d.r.range), ast: d });
    })), primitives_1.parser_or((skip_semicolon ? unchanged : with_semicolon)(decl_init().then(function (d_i) {
        return ts_bccc_1.co_unit({ range: source_range_1.join_source_ranges(d_i.l.range, d_i.v.range), ast: d_i });
    })), primitives_1.parser_or((skip_semicolon ? unchanged : with_semicolon)(assign()), primitives_1.parser_or((skip_semicolon ? unchanged : with_semicolon)(exports.expr()), primitives_1.parser_or((skip_semicolon ? unchanged : with_semicolon)(no_match.then(function (_) { return dbg; })), with_semicolon(no_match.then(function (_) { return tc_dbg; }))))))))))));
};
var function_statement = function (skip_semicolon) {
    return primitives_1.parser_or(with_semicolon(return_statement()), inner_statement(skip_semicolon));
};
var generic_statements = function (stmt, check_trailer) {
    return primitives_1.parser_or(stmt().then(function (l) {
        return primitives_1.parser_or(generic_statements(stmt, check_trailer).then(function (r) { return ts_bccc_1.co_unit(r.ast.kind == "noop" ? l : primitives_1.mk_semicolon(l, r)); }), check_trailer.then(function (_) { return ts_bccc_1.co_unit(l); }));
    }), ts_bccc_1.co_unit(primitives_1.mk_noop()));
};
var function_statements = function (check_trailer) {
    return generic_statements(function_statement, check_trailer);
};
var inner_statements = function (check_trailer) { return generic_statements(function () { return inner_statement(); }, check_trailer); };
var outer_statements = function (check_trailer) { return generic_statements(outer_statement, check_trailer); };
var modifier = function () {
    return primitives_1.parser_or(primitives_1.private_modifier.then(function (r) { return ts_bccc_1.co_unit(primitives_1.mk_private(r)); }), primitives_1.parser_or(primitives_1.public_modifier.then(function (r) { return ts_bccc_1.co_unit(primitives_1.mk_public(r)); }), primitives_1.parser_or(primitives_1.protected_modifier.then(function (r) { return ts_bccc_1.co_unit(primitives_1.mk_protected(r)); }), primitives_1.parser_or(primitives_1.virtual_modifier.then(function (r) { return ts_bccc_1.co_unit(primitives_1.mk_virtual(r)); }), primitives_1.parser_or(primitives_1.override_modifier.then(function (r) { return ts_bccc_1.co_unit(primitives_1.mk_override(r)); }), primitives_1.parser_or(primitives_1.abstract_modifier.then(function (r) { return ts_bccc_1.co_unit(primitives_1.mk_abstract(r)); }), primitives_1.parser_or(primitives_1.interface_modifier.then(function (r) { return ts_bccc_1.co_unit(primitives_1.mk_interface(r)); }), primitives_1.static_modifier.then(function (r) { return ts_bccc_1.co_unit(primitives_1.mk_static(r)); }))))))));
};
var generic_parameters = function () {
    return primitives_1.parser_or(primitives_1.lt_op.then(function (_) {
        return exports.type_args().then(function (args) {
            return primitives_1.gt_op.then(function (_) {
                return ts_bccc_1.co_unit(Immutable.List(args.map(function (a) { return ({ name: a, variant: "inv" }); })));
            });
        });
    }), ts_bccc_1.co_unit(Immutable.List()));
};
var modifiers = function () {
    return primitives_1.parser_or(modifier().then(function (m) {
        return modifiers().then(function (ms) {
            return m.ast.kind == "private" && ms.some(function (m) { return !m || m.ast.kind == "public"; }) ||
                m.ast.kind == "public" && ms.some(function (m) { return !m || m.ast.kind == "private"; }) ||
                m.ast.kind == "virtual" && ms.some(function (m) { return !m || m.ast.kind == "override"; }) ||
                m.ast.kind == "override" && ms.some(function (m) { return !m || m.ast.kind == "virtual"; }) ||
                m.ast.kind == "abstract" && ms.some(function (m) { return !m || m.ast.kind == "virtual"; }) ?
                ts_bccc_1.co_get_state().then(function (s) {
                    return ts_bccc_1.co_error({ range: m.range, priority: s.branch_priority, message: "Error: incompatible modifiers." });
                })
                : ts_bccc_1.co_unit(ms.push(m));
        });
    }), ts_bccc_1.co_unit(Immutable.List()));
};
var class_modifiers = function () {
    return primitives_1.parser_or(modifier().then(function (m) {
        return modifiers().then(function (ms) {
            return m.ast.kind == "private" && ms.some(function (m) { return !m || m.ast.kind == "public"; }) ||
                m.ast.kind == "public" && ms.some(function (m) { return !m || m.ast.kind == "private"; }) ||
                m.ast.kind == "interface" && ms.some(function (m) { return !m || m.ast.kind == "abstract"; }) ||
                m.ast.kind == "abstract" && ms.some(function (m) { return !m || m.ast.kind == "interface"; }) ?
                ts_bccc_1.co_get_state().then(function (s) {
                    return ts_bccc_1.co_error({ range: m.range, priority: s.branch_priority, message: "Error: incompatible modifiers." });
                })
                : ts_bccc_1.co_unit(ms.push(m));
        });
    }), ts_bccc_1.co_unit(Immutable.List()));
};
var class_statements = function () {
    return primitives_1.parser_or(primitives_1.parser_or(with_semicolon(modifiers().then(function (ms) {
        return primitives_1.parser_or(decl_init().then(function (d) { return ts_bccc_1.co_unit(d); }), decl().then(function (d) { return ts_bccc_1.co_unit(d); })).then(function (d) {
            return ts_bccc_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), { decl: d, modifiers: ms }));
        });
    })), primitives_1.parser_or(modifiers().then(function (ms) { return function_declaration(ms.toArray()).then(function (d) {
        return ts_bccc_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inr().after(ts_bccc_1.inl()), { decl: d, modifiers: ms }));
    }); }), modifiers().then(function (ms) { return constructor_declaration().then(function (d) {
        return ts_bccc_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inr().after(ts_bccc_1.inr()), { decl: d, modifiers: ms }));
    }); }))).then(function (decl) {
        return class_statements().then(function (decls) {
            return ts_bccc_1.co_unit({
                fst: decl.kind == "left" ? decls.fst.push(decl.value) : decls.fst,
                snd: decl.kind == "right" ?
                    decl.value.kind == "left" ? __assign({}, decls.snd, { fst: decls.snd.fst.push(decl.value.value) }) : __assign({}, decls.snd, { snd: decls.snd.snd.push(decl.value.value) })
                    : decls.snd
            });
        });
    }), ccc_aux_1.co_lookup(primitives_1.right_curly_bracket).then(function (_) {
        return ts_bccc_1.co_unit({
            fst: Immutable.List(),
            snd: {
                fst: Immutable.List(),
                snd: Immutable.List()
            }
        });
    }));
};
exports.program = outer_statements(ccc_aux_1.co_lookup(primitives_1.eof).then(function (_) { return ts_bccc_1.co_unit({}); })).then(function (s) {
    return primitives_1.eof.then(function (_) { return ts_bccc_1.co_unit(s); });
});
exports.program_prs = function () {
    return primitives_1.parser_or(exports.filesystem_prs.then(function (fs) {
        return exports.program.then(function (prg) {
            return ts_bccc_1.co_unit({
                range: source_range_1.join_source_ranges(fs.range, prg.range),
                ast: exports.mk_filesys_and_program_ast(fs, prg)
            });
        });
    }), exports.program);
};
