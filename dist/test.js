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
        var source = "\n  class A {\n    double a;\n    public A(int a, int x){\n      this.a = a;\n      this.b = 10;\n    }\n    protected int b;\n    protected int GetB(){\n      return this.b;\n    }\n    public virtual double GetA(){\n      return this.a;\n    }\n  }\n  \n  class AAA : A {\n    int aaa;\n    public AAA (int aaa) : base(aaa, 5){\n      this.aaa = aaa;\n    }\n    public override double GetA(){\n      return this.aaa;\n    }\n  }\n  \n  AAA aaa = new AAA(555);\n  double _aaa = aaa.GetA();\n  int x = aaa.b;\n  int y = aaa.GetB();\n  debugger;\n";
        // let hrstart = process.hrtime()
        var output = "";
        var log = function (s, x) {
            output = output + s + JSON.stringify(x) + "\n\n";
        };
        // let hrdiff = process.hrtime(hrstart)
        // let time_in_ns = hrdiff[0] * 1e9 + hrdiff[1]
        // log(`Timer: ${time_in_ns / 1000000}ms\n Compiler error: `, JSON.stringify(compiler_res.value))
        var stream = ImpLanguageWithSuspend.get_stream(source, CCC.apply(CCC.inr(), {}));
        while (stream.kind == "step") {
            var show_1 = stream.show();
            //{ highlighting:SourceRange, globals:Scopes, heap:Scope, functions:Immutable.Map<ValueName,Lambda>, classes:Immutable.Map<ValueName, Interface>, stack:Immutable.Map<number, Scopes> }
            log("Step:", show_1.kind == "bindings" ? show_1.state :
                show_1.kind == "memory" ? __assign({}, show_1.memory, { classes: show_1.memory.classes.filter(function (c) { return c != undefined && !c.is_internal; }).toMap() }) :
                    show_1);
            stream = stream.next();
        }
        var show = stream.show();
        log("Step:", show.kind == "bindings" ? show.state :
            show.kind == "memory" ? __assign({}, show.memory, { classes: show.memory.classes.filter(function (c) { return c != undefined && !c.is_internal; }).toMap() }) :
                show);
        return output;
    };
})(ImpLanguageWithSuspend = exports.ImpLanguageWithSuspend || (exports.ImpLanguageWithSuspend = {}));
// console.log(ImpLanguageWithSuspend.test_imp())
console.log(ImpLanguageWithSuspend.test_parser());
