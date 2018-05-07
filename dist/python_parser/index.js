"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Jison = require("jison");
var fs = require("fs");
var path = require("path");
var Sem = require("../Python/python");
var ts_bccc_1 = require("ts-bccc");
var main_1 = require("../main");
var memory_1 = require("../Python/memory");
var succeed = function (x) { return ({ kind: 'succeed', value: x }); };
var fail = function (x) { return ({ kind: 'fail', value: x }); };
var INDENT_TOKEN = 'TOKEN_INDENT';
var DEDENT_TOKEN = 'TOKEN_DEDENT';
var make_pre_processor = function (force_indent) { return function (source) {
    var only_whitespace = function (str) { return !/\S/.test(str); };
    var lines = source.split(/\r\n|\r|\n/);
    var output = [];
    var previous_indentation_level = 0;
    var unclosed_indents = 0;
    for (var l = 0; l < lines.length; l++) {
        var line = lines[l];
        var current_indentation = line.search(/\S|$/);
        if (only_whitespace(line)) {
            output.push(line);
            continue;
        }
        if (force_indent !== "no" && current_indentation % force_indent !== 0) {
            return fail("Malformed indent at line index: " + l);
        }
        if (current_indentation > previous_indentation_level) {
            output.push(INDENT_TOKEN + " " + line);
            unclosed_indents += 1;
        }
        else if (current_indentation < previous_indentation_level) {
            output.push(DEDENT_TOKEN + " " + line);
            unclosed_indents -= 1;
        }
        else {
            output.push(line);
        }
        previous_indentation_level = current_indentation;
    }
    while (unclosed_indents > 0) {
        output.push(DEDENT_TOKEN);
        unclosed_indents -= 1;
    }
    return succeed(output.join("\n"));
}; };
var assignment = function (ast) {
    return ast_to_sem(ast.r).then(function (val) {
        return (ast.l.ast.kind == "id")
            ? memory_1.decl_v_rt(ast.l.ast.value, val)
            : Sem.done_rt;
    });
};
var bin_op = function (op) { return function (a, b) {
    return a.then(function (a_v) {
        return b.then(function (b_v) {
            if (a_v.value.k === "f" || b_v.value.k === "f") {
                var a_f = a_v.value.v;
                var b_f = b_v.value.v;
                switch (op) {
                    case "+": return ts_bccc_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), main_1.mk_float_val(a_f + b_f)));
                    case "-": return ts_bccc_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), main_1.mk_float_val(a_f - b_f)));
                    case "/": return ts_bccc_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), main_1.mk_float_val(a_f / b_f)));
                    case "*": return ts_bccc_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), main_1.mk_float_val(a_f * b_f)));
                }
            }
            return ts_bccc_1.co_error({ message: "Cannot add " + a_v.value.k + " and " + b_v.value.k, range: main_1.zero_range });
        });
    });
}; };
var ast_to_sem = function (res) {
    return res.ast.kind == "+" ?
        bin_op('+')(ast_to_sem(res.ast.l), ast_to_sem(res.ast.r))
        : res.ast.kind == "-" ?
            bin_op('-')(ast_to_sem(res.ast.l), ast_to_sem(res.ast.r))
            : res.ast.kind == "*" ?
                bin_op('*')(ast_to_sem(res.ast.l), ast_to_sem(res.ast.r))
                : res.ast.kind == "/" ?
                    bin_op('/')(ast_to_sem(res.ast.l), ast_to_sem(res.ast.r))
                    : res.ast.kind == "=" ?
                        assignment(res.ast)
                        : res.ast.kind == "id" ?
                            Sem.get_v_rt(res.range, res.ast.value)
                            : res.ast.kind == "float" ?
                                Sem.float_expr(res.ast.value)
                                : ts_bccc_1.co_error({ message: "Unsupported AST Node: " + res.ast.kind, range: main_1.zero_range });
};
var filename = path.join(__dirname, "..", "..", "python_parser", "python.bison");
var grammar = fs.readFileSync(filename);
var parser = new Jison.Parser(grammar.toString());
var pre_processor = make_pre_processor(2);
var result = pre_processor("x = 10+1*1+5");
if (result.kind == "fail") {
    console.log("Preprocessing failed with: " + result.value);
}
else {
    var pre_processed_source = result.value;
    var parse_res = parser.parse(pre_processed_source);
    var ast = ast_to_sem(parse_res);
    var memrt = ast.run.f(main_1.empty_memory_rt(function (_) { return true; }));
    console.log(JSON.stringify(memrt, undefined, 2));
}
