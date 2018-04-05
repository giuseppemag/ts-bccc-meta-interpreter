"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts_bccc_1 = require("ts-bccc");
var CCC = require("ts-bccc");
var DebuggerStream = require("./csharp_debugger_stream");
var ImpLanguageWithSuspend;
(function (ImpLanguageWithSuspend) {
    var run_to_end = function (log) {
        var f = CCC.fun(function (p) { return run_to_end(log).f(p); });
        return (ts_bccc_1.co_run().map_times(ts_bccc_1.fun(function (s) { return log("Intermediate step:", JSON.stringify(s)) ||
            s; }))).then(CCC.apply_pair()).then(CCC.inl().plus(f.plus(CCC.inr())));
    };
    ImpLanguageWithSuspend.get_stream = DebuggerStream.get_stream;
    ImpLanguageWithSuspend.test_parser = function () {
        var source = "class School {\n  (string name, string desc, int points)[] courses;\n\n  public School() {\n    this.courses = new (string name, string desc, int points)[0];\n    typechecker_debugger;\n    debugger;\n  }\n\n  public int TotalPoints() {\n    int tot = 0;\n    for(int i = 0; i < this.courses.Length; i = i + 1) {\n      tot = tot + this.courses[i].points;\n    }\n    return tot;\n  }\n\n  public void AddCourse(string n, string d, int p) {\n    var newAmountCourses = this.courses.Length + 1;\n    (string name, string desc, int points)[] newCourses = new (string name, string desc, int points)[newAmountCourses];\n    for(int i = 0; i < this.courses.Length; i = i + 1) {\n      newCourses[i] = this.courses[i];\n    }\n    newCourses[newAmountCourses-1] = (n, d, p);\n    this.courses = newCourses;\n  }\n}\nvar hr = new School();\nhr.AddCourse(\"Dev1\", \"Basics of programming\", 4);\nhr.AddCourse(\"Dev5\", \"Basics of web development\", 4);\nvar tot_p = hr.TotalPoints();\ntypechecker_debugger;\ndebugger;\n";
        // let hrstart = process.hrtime()
        var output = "";
        var log = function (s, x) {
            output = output + s + JSON.stringify(x) + "\n\n";
        };
        // let hrdiff = process.hrtime(hrstart)
        // let time_in_ns = hrdiff[0] * 1e9 + hrdiff[1]
        // log(`Timer: ${time_in_ns / 1000000}ms\n Compiler error: `, JSON.stringify(compiler_res.value))
        var stream = ImpLanguageWithSuspend.get_stream(source);
        while (stream.kind == "step") {
            var show_1 = stream.show();
            log("Step:", show_1.kind == "bindings" ? show_1.state : show_1.kind == "memory" ? show_1.memory : show_1);
            stream = stream.next();
        }
        var show = stream.show();
        log("Step:", show.kind == "bindings" ? show.state : show.kind == "memory" ? show.memory : show);
        return output;
    };
})(ImpLanguageWithSuspend = exports.ImpLanguageWithSuspend || (exports.ImpLanguageWithSuspend = {}));
// console.log(ImpLanguageWithSuspend.test_imp())
console.log(ImpLanguageWithSuspend.test_parser());
