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
        var source = "\ninterface Visitor<a,b> {\n  public b OnSome(a _a);\n  public b onNone();\n }\n \n class IntVisitorToString : Visitor<int,string> {\n  public override string OnSome(int v) { return \"Value: \" + v; }\n  public override string onNone() { return \"No value\"; }\n }\n \n interface Option<a, b>\n {\n  b Visit(Visitor<a,b> v);\n }\n \n class None<a, b> : Option<a, b>\n {\n  public None() { }\n \n  public override b Visit(Visitor<a,b> v)\n  {\n    return v.onNone();\n  }\n }\n \n class Some<a, b> : Option<a, b>\n {\n  a v;\n  public Some(a v) { this.v = v; }\n \n  public override b Visit(Visitor<a,b> vis)\n  {\n    return vis.OnSome(this.v);\n  }\n }\n \n var values_or_not = new Option<int,string>[] { new None<int,string>(), new Some<int,string>(10), new Some<int,string>(2), new None<int,string>() };\n typechecker_debugger;\n var s = \"\";\n var v = new IntVisitorToString();\n for(int i = 0; i < values_or_not.Length; i = i + 1)\n {\n  var x = values_or_not[i];\n  s = s + x.Visit(v) + \"; \";\n }\n typechecker_debugger;\n debugger;\n";
        // interface Option<a> {
        //   bool has_value();
        //   a get_value();
        // }
        // class None<a> : Option<a> {
        //   public override bool has_value(){
        //     return false;
        //   }
        // }
        // class Some<a> : Option<a> {
        //   a value;
        //   public Some(a value){
        //     this.value = value;
        //   }
        //   public override a get_value(){
        //     return this.value;
        //   }
        // }
        // typechecker_debugger;
        // debugger;
        // class C<a,b> {
        //   a x;
        //   public C(a x) { this.x = x; }
        //   public (a,b) get_x(b y) { return (this.x,y); }
        // }
        // C<int, bool> c = new C<int, bool>(10);
        // var y = c.get_x(true);
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
