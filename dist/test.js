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
        var source = "\nvar a = 2 + 5;\nvar b = 5 * 1.5f;\nvar c = 2.5 + (5 * 1.5f);\nvar d = \"a\" + a;\nvar e = !((d == \"c\") || (c > b));\nvar f = (a <= c) && (b == c);\n";
        // class C<a> {
        //   a x;
        //   public C(a x) { this.x = x; }
        //   public a get_x() { return this.x; }
        //   public b map<b>(Func<a,b> f) { return new C<b>(f(this.get_x())); }
        // }
        // var c_int = new C<int>(10);
        // var c_bool = c.map<bool>(x => x > 0);
        // typechecker_debugger;
        // test 2
        // interface I
        // {
        //   bool M(int x, string y);
        // }
        // class C<a> : I where a : I {
        //   public bool M(int x, string y)
        //   {
        //     return x > y.Length;
        //   }
        //   public bool N(a x, a y) {
        //     return x.M(10, "dieci") && y.M(11, "undici");
        //   }
        // }
        // test 3
        // interface I<a>
        // {
        //   bool cmp(a other);
        // }
        // class C<a> where a : I<a> {
        //   public bool N(a x, a y) {
        //     return x.cmp(y);
        //   }
        // }
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
            log("Step:", show_1.kind == "bindings" ? show_1.state.bindings.filter(function (c) { return c != undefined && (c.kind != "obj" || !c.is_internal); }) :
                show_1.kind == "memory" ? __assign({}, show_1.memory, { classes: show_1.memory.classes.filter(function (c) { return c != undefined && !c.is_internal; }).toMap() }) :
                    show_1);
            stream = stream.next();
        }
        var show = stream.show();
        log("Step:", show.kind == "bindings" ? show.state :
            show.kind == "memory" ? __assign({}, show.memory, { classes: show.memory.classes.filter(function (c) { return c != undefined && !c.is_internal; }).toMap() }) :
                show);
        // if (show.kind == "memory")
        //   console.log(show.memory.classes.map((c, C_name) => c != undefined && C_name != undefined ? [C_name, c.is_internal] : []))
        return output;
    };
})(ImpLanguageWithSuspend = exports.ImpLanguageWithSuspend || (exports.ImpLanguageWithSuspend = {}));
// console.log(ImpLanguageWithSuspend.test_imp())
console.log(ImpLanguageWithSuspend.test_parser());
