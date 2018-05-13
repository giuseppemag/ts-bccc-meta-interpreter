"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts_bccc_1 = require("ts-bccc");
// import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
// import * as Co from "ts-bccc"
var memory_1 = require("./memory");
var fast_coroutine_1 = require("../fast_coroutine");
exports.done_rt = fast_coroutine_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), memory_1.mk_unit_val));
exports.dbg_rt = function (range) { return function (v) { return memory_1.set_highlighting_rt(range).then(function (_) { return fast_coroutine_1.co_suspend().then(function (_) { return fast_coroutine_1.co_unit(v); }); }); }; };
var push_new_context = memory_1.push_inner_scope_rt(memory_1.empty_scope_val);
var pop_current_context = memory_1.pop_inner_scope_rt();
exports.if_then_else_rt = function (r, c, f, g) {
    return c.then(function (c_val) { return c_val.value.k != "b" ? memory_1.runtime_error(r, "Error: conditional expression " + c_val + " is not a boolean.")
        : c_val.value.v ?
            push_new_context.then(function (_) { return f.then(function (res) { return pop_current_context.then(function (_) { return fast_coroutine_1.co_unit(res); }); }); }) :
            push_new_context.then(function (_) { return g.then(function (res) { return pop_current_context.then(function (_) { return fast_coroutine_1.co_unit(res); }); }); }); });
};
exports.while_do_rt = function (r, c, k) {
    var k_full = push_new_context.combine(k.then(function (k_res) { return pop_current_context.combine(fast_coroutine_1.co_unit(k_res)); }));
    return fast_coroutine_1.mk_coroutine({ kind: "run", run: function (s0) {
            var s = s0;
            while (true) {
                var c_step = fast_coroutine_1.run_step(c, s);
                if (c_step.kind == "err") {
                    return { kind: "e", e: c_step.e };
                }
                if (c_step.kind == "k") {
                    s = c_step.s;
                    return { kind: "k", s: s, k: exports.while_do_rt(r, c_step.k, k) };
                }
                var c_val = c_step.v;
                // imperatively update s
                s = c_step.s;
                if (c_val.value.k != "b") {
                    return { kind: "e", e: { range: r, message: "Error: conditional expression " + c_val + " is not a boolean." } };
                }
                if (c_val.value.v == false) {
                    // loop has ended
                    return { kind: "v", s: s, v: ts_bccc_1.apply(ts_bccc_1.inl(), memory_1.mk_unit_val) };
                }
                else {
                    // loop has not ended and must continue
                    var k_step = fast_coroutine_1.run_step(k_full, s);
                    if (k_step.kind == "err") {
                        return { kind: "e", e: k_step.e };
                    }
                    if (k_step.kind == "k") {
                        s = k_step.s;
                        return { kind: "k", s: s, k: k_step.k.combine(exports.while_do_rt(r, c, k)) };
                    }
                    // imperatively update s
                    s = k_step.s;
                    // todo: if k_step.v is right, then propagate returned value
                    if (k_step.v.kind == "right")
                        return { kind: "v", s: s, v: k_step.v };
                    s.steps_counter = s.steps_counter + 1;
                    if (s.steps_counter > 10000) {
                        if (s.custom_alert('The program seems to be taking too much time. This might be an indication of an infinite loop. Press OK to terminate the program.'))
                            return { kind: "e", e: { range: r, message: "It seems your code has run into an infinite loop." } };
                        s.steps_counter = 0;
                        // return co_error<MemRt,ErrVal,Sum<Val,Val>>({ range: r, message: `It seems your code has run into an infinite loop.` })
                    }
                }
            }
        } });
};
// export let while_do_rt = function(r:SourceRange, c: ExprRt<Sum<Val,Val>>, k: StmtRt): StmtRt {
//   return c.then(c_val => c_val.value.k != "b" ? runtime_error(r, `Error: conditional expression ${c_val} is not a boolean.`)
//                          : c_val.value.v ?
//                 push_new_context.then(_ =>
//                   co_get_state<MemRt, ErrVal>().then(s =>
//                     {
//                       let f = (counter:number) : StmtRt => co_set_state<MemRt, ErrVal>({...s, steps_counter: counter}).then(_ =>
//                                 k.then(k_res => pop_current_context.then(_ => while_do_rt(r,c,k))))
//                       if(s.steps_counter > 300) {
//                         if (s.custom_alert('The program seems to be taking too much time. This might be an indication of an infinite loop. Press OK to terminate the program.'))
//                           return co_error<MemRt,ErrVal,Sum<Val,Val>>({ range: r, message: `It seems your code has run into an infinite loop.` })
//                         else
//                           return f(0)
//                       }
//                       return f(s.steps_counter + 1)
//                     })
//                 ) :
//                 done_rt)
// }
exports.for_loop_rt = function (r, i, c, s, b) {
    return push_new_context.then(function (_) {
        return i.then(function (_) {
            return exports.while_do_rt(r, c, b.then(function (_) { return s; })).then(function (_) {
                return pop_current_context.then(function (_) {
                    return exports.done_rt;
                });
            });
        });
    });
};
