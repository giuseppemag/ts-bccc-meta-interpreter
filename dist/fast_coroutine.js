"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Immutable = require("immutable");
exports.co_err = function (e) { return ({ kind: "run", run: function (_) { return ({ kind: "e", e: e }); } }); };
exports.co_res = function (v) { return ({ kind: "run", run: function (s) { return ({ kind: "v", s: s, v: v }); } }); };
exports.co_cont = function (k) { return ({ kind: "run", run: function (s) { return ({ kind: "k", s: s, k: k }); } }); };
exports.mk_coroutine = function (run) {
    return ({
        run: run,
        then: then,
        combine: combine
    });
};
exports.map = function (p, f) {
    if (p.run.kind == "run") {
        var inner_p_1 = p.run;
        return exports.mk_coroutine({
            kind: "run", run: function (s0) {
                var res = inner_p_1.run(s0);
                if (res.kind == "e")
                    return { kind: "e", e: res.e };
                if (res.kind == "v")
                    return { kind: "v", s: res.s, v: f(res.v) };
                if (res.kind == "k")
                    return { kind: "k", s: res.s, k: exports.map(res.k, f) };
                return { kind: "cmp", s: res.s, pre: res.pre, p: exports.map(res.p, f) };
            }
        });
    }
    return exports.mk_coroutine({ kind: "cmp", pre: p.run.pre, p: exports.map(p.run.p, f) });
};
var join = function (p) {
    if (p.run.kind == "run") {
        var inner_p_2 = p.run;
        return exports.mk_coroutine({
            kind: "run", run: function (s0) {
                var res = inner_p_2.run(s0);
                if (res.kind == "e")
                    return { kind: "e", e: res.e };
                if (res.kind == "v") {
                    if (res.v.run.kind == "run")
                        return res.v.run.run(res.s);
                    else {
                        return { kind: "cmp", s: res.s, pre: res.v.run.pre, p: res.v.run.p };
                    }
                }
                if (res.kind == "k")
                    return { kind: "k", s: res.s, k: join(res.k) };
                return { kind: "cmp", s: res.s, pre: res.pre, p: join(res.p) };
            }
        });
    }
    return exports.mk_coroutine({ kind: "cmp", pre: p.run.pre, p: join(p.run.p) });
};
var then = function (k) {
    return join(exports.map(this, k));
};
var combine = function (q) {
    return exports.mk_coroutine({ kind: "cmp", pre: this, p: q });
};
exports.co_error = function (e) { return exports.mk_coroutine(exports.co_err(e)); };
exports.co_unit = function (v) { return exports.mk_coroutine(exports.co_res(v)); };
exports.co_suspend = function () { return exports.mk_coroutine(exports.co_cont(exports.co_unit({}))); };
var mk_pair = function (a, b) { return ({ a: a, b: b }); };
var inl = function (v) { return ({ kind: "l", v: v }); };
var inr = function (v) { return ({ kind: "r", v: v }); };
var run_step = function (p, s) {
    if (p.run.kind == "cmp") {
        var pre = run_step(p.run.pre, s);
        var p_in = p.run.p;
        if (pre.kind == "l")
            return inr(mk_pair(pre.v, p_in));
        return inr(mk_pair(pre.v.a, exports.mk_coroutine({ kind: "cmp", pre: pre.v.b, p: p_in })));
    }
    var q = p.run.run(s);
    if (q.kind == "e")
        return inl(s);
    if (q.kind == "v")
        return inl(q.s);
    if (q.kind == "k")
        return inr(mk_pair(q.s, q.k));
    return inr(mk_pair(q.s, exports.mk_coroutine({ kind: "cmp", pre: q.pre, p: q.p })));
};
exports.co_change_state = function (f) {
    return exports.mk_coroutine({ kind: "run",
        run: function (s) { return ({ kind: "v", s: f(s),
            v: {} }); } });
};
exports.co_from_state = function (f) {
    return exports.mk_coroutine({ kind: "run",
        run: function (s) { return ({ kind: "v", s: s,
            v: f(s) }); } });
};
exports.co_from_and_change_state = function (f) {
    return exports.mk_coroutine({ kind: "run",
        run: function (s) {
            var x = f(s);
            return ({ kind: "v", s: x[1],
                v: x[0] });
        } });
};
exports.co_get_state = function () {
    return exports.mk_coroutine({ kind: "run",
        run: function (s) { return ({ kind: "v", s: s,
            v: s }); } });
};
exports.co_set_state = function (s) {
    return exports.mk_coroutine({ kind: "run",
        run: function (_) { return ({ kind: "v", s: s,
            v: {} }); } });
};
exports.comm_list_coroutine = function (ps) {
    if (ps.isEmpty())
        return exports.co_unit(Immutable.List());
    var h = ps.first();
    var t = ps.rest().toList();
    return h.then(function (h_res) {
        return exports.comm_list_coroutine(t).then(function (t_res) {
            return exports.co_unit(t_res.unshift(h_res));
        });
    });
};
exports.co_lookup = function (p) {
    return exports.co_get_state().then(function (s) { return p.then(function (p_res) { return exports.co_set_state(s).then(function (_) { return exports.co_unit(p_res); }); }); });
};
