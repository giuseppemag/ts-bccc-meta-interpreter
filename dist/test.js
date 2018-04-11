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
        var source = "\n    class Vector2 {\n      public double x;\n      public double y;\n      public Vector2(double x, double y){\n        this.x = x;\n        this.y = y;\n      }\n      public double Length(){\n        return Math.sqrt(this.x * this.x + this.y * this.y);\n      }\n      public static Vector2 Plus(Vector2 v1, Vector2 v2){\n        return new Vector2(v1.x + v2.x, v1.y + v2.y);\n      }\n      public static Vector2 Minus(Vector2 v1, Vector2 v2){\n        return new Vector2(v1.x - v2.x, v1.y - v2.y);\n      }\n      public static Vector2 Times(Vector2 v1, double c){\n        return new Vector2(v1.x * c, v1.y * c);\n      }\n      public static Vector2 Div(Vector2 v1, double c){\n        return Vector2.Times(v1, 1.0 / c);\n      }\n    }\n\n    var v1 = new Vector2(0.0,0.0);\n    var v2 = new Vector2(10.0,5.0);\n    var v3 = Vector2.Times(v1, 1.0);\n    typechecker_debugger;\n    debugger;";
        // class C {
        //   int f;
        //   public C() {
        //     this.f = 1;
        //   }
        //   public void M(float x, float y) {
        //     this.f = this.f * x + y;
        //   }
        //   public void M(Func<int,int> f) {
        //     this.f = f(this.f);
        //   }
        //   public void M(Func<int,int> f, int x) {
        //     this.f = f(this.f) + x;
        //   }
        // }
        // var c = new C();
        // c.M(2, 3);
        // c.M(x => x + 1);
        // c.M(x => x * 3, 2);
        /*
        abstract class Animal{
          public abstract string MakeSound();
        }
        class Cat : Animal{
          public override string MakeSound(){
             return "miao";
          }
        }
        
        class LargeCat : Cat {
          public override string MakeSound(){
            return "MIAO";
         }
        }
        
        Cat c = new LargeCat();
        var s = c.MakeSound();
        */
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
