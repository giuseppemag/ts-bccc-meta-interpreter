"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Jison = require("jison");
var fs = require("fs");
var path = require("path");
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
var filename = path.join(__dirname, "..", "..", "python_parser", "python.bison");
var grammar = fs.readFileSync(filename);
var parser = new Jison.Parser(grammar.toString());
var pre_processor = make_pre_processor(2);
console.log(JSON.stringify(parser.parse(pre_processor("x = 10+1*1+5").value)));
