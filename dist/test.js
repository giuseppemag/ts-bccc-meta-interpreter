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
        var source = "\nclass Vector2 {\n  double x;\n  double y;\n  public Vector2(double x, double y){\n    this.x = x;\n    this.y = y;\n  }\n  public Vector2 Mul(double c){\n    return new Vector2(this.x * c, this.y * c);\n  }\n  public void Sum(Vector2 v1){\n    this.x = this.x + v1.x;\n    this.y = this.y + v1.y;\n  }\n}\npublic interface Ship {\n  void Update(double delta_time);\n}\n\nclass SimpleSpaceShip : Ship {\n  Vector2 position;\n  Vector2 velocity;\n\n  public SimpleSpaceShip(Vector2 pos, Vector2 vel){\n    this.position = pos;\n    this.velocity = vel;\n  }\n\n  public override void Update(double dt){\n    this.position.Sum(this.velocity.Mul(dt));\n  }\n}\n\nclass WarpEngine{\n  double current_warp_factor;\n  double max_warp;\n  public WarpEngine(){\n    this.current_warp_factor = 0.0;\n    this.max_warp = 5.0;\n  }\n  public void SetWarpFactor(double factor){\n    this.current_warp_factor = Math.min(factor, this.max_warp);\n  }\n  public double GetWarpSpeed(){\n    var warp_factor = this.current_warp_factor;\n    var speed_light = 1.0;\n    return speed_light / Math.pow(warp_factor, 10.0/3.0);\n  }\n}\n\n\n\npublic abstract ShipDecorator : Ship {\n  public Ship ship;\n  public ShipDecorator(Ship ship){\n    this.ship = ship;\n  }\n} \n\n\nclass EnterpriseNX01 : ShipDecorator {\n  private WarpEngine warp_engine;\n  public EnterpriseNX01(Ship ship):base(ship){\n    this.ship = ship;\n    this.warp_engine = new WarpEngine();\n  }\n  public void GoToWarp(double factor){\n    this.warp_engine.SetWarpFactor(factor);\n  }\n  public override void Update(double dt){\n    var multiplier = this.warp_engine.GetWarpSpeed();\n    this.ship.Update(dt * multiplier);\n  }\n} \n\nvoid main(){\n  var p1 = new Vector2(0.0,0.0);\n  var v1 = new Vector2(10.0,10.0);\n  Ship s = new SimpleSpaceShip(p1, v1);\n  EnterpriseNX01 nx1 = new EnterpriseNX01(s);\n  nx1.GoToWarp(3.0);\n\n  var p2 = new Vector2(0.0,100.0);\n  var v2 = new Vector2(10.0,10.0);\n  Ship tv = new SimpleSpaceShip(p2, v2);\n\n  Ship[] fleet = new Ship[]{ nx1, tv };\n  for(int i = 0; i < fleet.Length; i = i + 1 ){\n    fleet[i].Update(0.16);\n  }\n  debugger;\n}\nmain();\ntypechecker_debugger;\n";
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
