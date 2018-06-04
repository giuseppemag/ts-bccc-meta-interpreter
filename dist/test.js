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
        var source = "\n    int invokeFuncs(Func<int[], int>[] functions, int[] arguments) {\n      var sum = 0;\n    \n      for(int i = 0; i < functions.Length; i = i + 1) {\n        var currFunc = functions[i]; \n        var currRes = currFunc(arguments); \n        sum = sum + currRes;\n      }\n    \n      return sum;\n    }\n    \n    int f1(int[] array) {\n      var sum = 0;\n      for(int i = 0; i < array.Length; i = i + 1) {\n        sum = sum + array[i];\n      }\n      return sum;\n    }\n     \n    int f2(int[] array) {\n      var prod = 1;\n      for(int i = 0; i < array.Length; i = i + 1) {\n        prod = prod * array[i];\n      }\n      return prod;\n    }\n     \n    int f3(int[] array) {\n      var sum = f1(array);\n      var average = sum/array.Length;\n    } \n    \n    \n    var f = new Func<int[],int>[3];\n    f[0] = f3;\n    f[1] = f2; \n    f[2] = f1;\n    var args = new int[] { 1, 2, 3 };\n    var res = invokeFuncs(f, args);\n    \n    debugger;\n    typechecker_debugger;\n";
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
