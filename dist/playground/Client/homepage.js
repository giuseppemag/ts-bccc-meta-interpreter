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
var React = require("react");
var ReactDOM = require("react-dom");
var ts_bccc_meta_interpreter_1 = require("ts-bccc-meta-interpreter");
var monadic_react_1 = require("monadic_react");
var debugger_stream_to_dom = function (s) {
    var state = s.show();
    // if (state.)
    return <monadic_react_1.div>...</monadic_react_1.div>;
};
// <textarea style={{width:"50%", height:"600px", float:"right"}} value={JSON.stringify(s.show())} />
function HomePage() {
    var default_program = "int fibonacci(int n) {\n    debugger;\n    if (n <= 1) {\n      return n;\n    } else {\n      return fibonacci((n-1)) + fibonacci((n-2));\n    }\n  }\n\n  int x;\n  x = fibonacci(5);\n\n  RenderGrid g;\n  int x;\n  int y;\n  typechecker_debugger;\n  g = empty_render_grid 16 16;\n  x = 0;\n  while (x < 16) {\n    y = 0;\n    while (y <= x) {\n      if (((y + x) % 2) == 1) {\n        g = g + pixel x y true;\n        debugger;\n      }\n      y = y + 1;\n    }\n    x = x + 1;\n  }";
    return <monadic_react_1.div>
    <monadic_react_1.h1>Giuseppe's little meta-playground</monadic_react_1.h1>

    {monadic_react_1.simple_application(monadic_react_1.repeat("main-repeat")(monadic_react_1.any("main-any")([
        monadic_react_1.retract("source-editor-retract")(function (s) { return s.code; }, function (s) { return function (c) { return (__assign({}, s, { code: c, stream: ts_bccc_meta_interpreter_1.get_stream(c) })); }; }, function (c) { return monadic_react_1.custom("source-editor-textarea")(function (_) { return function (k) {
            return <textarea value={c} onChange={function (e) { return k(function () { })(e.currentTarget.value); }} style={{ fontFamily: "monospace", width: "45%", height: "600px", overflowY: "scroll", float: "left" }}/>;
        }; }); }),
        function (s) { return monadic_react_1.custom("source-editor-state")(function (_) { return function (k) { return debugger_stream_to_dom(s.stream); }; }).never(); },
        function (s) { return monadic_react_1.button("Next", s.stream.kind != "step")({}).then("state-next-button", function (_) {
            return monadic_react_1.unit(__assign({}, s, { stream: s.stream.kind == "step" ? s.stream.next() : s.stream }));
        }); },
        function (s) { return monadic_react_1.button("Reset", s.stream.kind != "step")({}).then("state-reset-button", function (_) {
            return monadic_react_1.unit(__assign({}, s, { stream: ts_bccc_meta_interpreter_1.get_stream(s.code) }));
        }); }
    ]))({ code: default_program, stream: ts_bccc_meta_interpreter_1.get_stream(default_program) }), function (_) { })}
  </monadic_react_1.div>;
}
exports.HomePage = HomePage;
exports.HomePage_to = function (target_element_id) {
    ReactDOM.render(HomePage(), document.getElementById(target_element_id));
};
