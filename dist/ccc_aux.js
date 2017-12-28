"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts_bccc_1 = require("ts-bccc");
var ts_bccc_2 = require("ts-bccc");
var Immutable = require("immutable");
exports.option_to_array = function (x) {
    var l = ts_bccc_1.fun(function (x) { return [x]; });
    var r = ts_bccc_1.fun(function (_) { return []; });
    var f = l.plus(r);
    return ts_bccc_1.apply(f, x);
};
exports.some = function () { return ts_bccc_1.fun(function (x) { return ts_bccc_1.apply(ts_bccc_1.inl(), x); }); };
exports.none = function () { return ts_bccc_1.fun(function (x) { return ts_bccc_1.apply(ts_bccc_1.inr(), {}); }); };
exports.option_plus = function (p, q) {
    var f = (ts_bccc_1.id().times(p)).then(ts_bccc_1.distribute_sum_prod()).then((ts_bccc_1.snd().then(exports.some())).plus(ts_bccc_1.fst().then(q)));
    return ts_bccc_1.fun(function (c) { return ts_bccc_1.apply(f, c); });
};
exports.co_run_to_end = function (p, s) {
    var run_rec = ts_bccc_1.fun2(function (p, s) { return exports.co_run_to_end(p, s); });
    var j1 = run_rec.plus(ts_bccc_1.inr());
    var j = ts_bccc_1.inl().plus(j1);
    var i = ts_bccc_1.apply(p.run.then(j), s);
    return i;
};
exports.co_repeat = function (p) {
    return exports.co_catch(p.then(function (x) {
        return exports.co_repeat(p).then(function (xs) {
            return ts_bccc_2.co_unit([x].concat(xs));
        });
    }))(ts_bccc_2.co_unit(Array()));
};
exports.comm_list_coroutine = function (ps) {
    if (ps.isEmpty())
        return ts_bccc_2.co_unit(Immutable.List());
    var h = ps.first();
    var t = ps.rest().toList();
    return h.then(function (h_res) {
        return exports.comm_list_coroutine(t).then(function (t_res) {
            return ts_bccc_2.co_unit(Immutable.List([h_res].concat(t_res.toArray())));
        });
    });
};
exports.co_lookup = function (p) {
    return ts_bccc_1.co_get_state().then(function (s) { return p.then(function (p_res) { return ts_bccc_1.co_set_state(s).then(function (_) { return ts_bccc_2.co_unit(p_res); }); }); });
};
// Note: ugly (non categorical) version made in a hurry because Giulia, Rachel and Rebecca are screaming in my ears
// and I just want to get started on the actual parser.
exports.co_not = function (e) { return function (p) {
    return ts_bccc_2.mk_coroutine(ts_bccc_1.fun(function (s) {
        var res = p.run.f(s);
        if (res.kind == "left") {
            var f = ts_bccc_1.inr().then(ts_bccc_1.inr());
            var res1 = { fst: {}, snd: s };
            return f.f(res1);
        }
        if (res.value.kind == "left") {
            var k = res.value.value.fst;
            var s1 = res.value.value.snd;
            var k1 = exports.co_not(e)(k);
            var res1 = k1.run.f(s1);
            return res1;
        }
        return ts_bccc_1.inl().f(e);
    }));
}; };
exports.co_catch = function (p) { return function (on_err) {
    return ts_bccc_2.mk_coroutine(ts_bccc_1.fun(function (s) {
        var res = p.run.f(s);
        if (res.kind == "left") {
            return on_err.run.f(s);
        }
        if (res.value.kind == "left") {
            var k = res.value.value.fst;
            var s1 = res.value.value.snd;
            var k1 = exports.co_catch(k)(ts_bccc_1.co_set_state(s).then(function (_) { return on_err; }));
            var res1 = k1.run.f(s1);
            return res1;
        }
        return res;
    }));
}; };
