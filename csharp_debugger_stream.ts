import * as Immutable from "immutable"
import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair, Option } from "ts-bccc"
import * as CCC from "ts-bccc"
import * as St from "ts-bccc"
import { mk_state, State } from "ts-bccc"
import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
import * as Co from "ts-bccc"
import { mk_range, zero_range, SourceRange } from "./source_range";

import * as Py from "./Python/python"
import * as CSharp from "./CSharpTypeChecker/csharp"
import { co_run_to_end } from "./ccc_aux";
import { ParserRes } from "./CSharpTypeChecker/csharp";
import { mk_parser_state } from "./CSharpTypeChecker/grammar";
import { ast_to_type_checker, global_calling_context } from "./CSharpTypeChecker/ast-operations";
import { standard_lib } from "./CSharpTypeChecker/standard_lib";
import * as FastCo from "./fast_coroutine";

export type DebuggerStreamStep = { kind:"memory", memory:Py.MemRt, ast:ParserRes } |
                                 { kind:"bindings", state:CSharp.State, ast:ParserRes } |
                                 { kind:"message", message:string, range:SourceRange }
export type DebuggerStream =
  ({ kind:"error"|"done" } |
  { kind:"step", next:() => DebuggerStream }) &
  { show:() => DebuggerStreamStep }

export let run_stream_to_end = (s:DebuggerStream) : Immutable.List<DebuggerStreamStep> => {
  let run_stream_to_end = (s:DebuggerStream) : Immutable.List<DebuggerStreamStep> =>
  s.kind != "step" ? Immutable.List<DebuggerStreamStep>([s.show()])
  : run_stream_to_end(s.next()).push(s.show())
  return run_stream_to_end(s).reverse().toList()
}

export let get_stream = (source:string, custom_alert:Option<(_:string) => boolean>) : DebuggerStream => {
  try{
    let parse_result = CSharp.GrammarBasics.tokenize(source)
    if (parse_result.kind == "left") {
      let error = parse_result.value
      return { kind:"error", show:() => ({ kind:"message", message:error.message, range:error.range }) }
    }

    let tokens = Immutable.List<CSharp.Token>(parse_result.value)
    let res = co_run_to_end(CSharp.program_prs(), mk_parser_state(tokens))
    if (res.kind != "right") {
      let msg = res.value.message
      let range = res.value.range
      return { kind:"error", show:() => ({ kind:"message", message:msg, range:range }) }
    }

    let ast = res.value.fst

    // console.log("AST:", JSON.stringify(ast))

    let p = (CSharp.semicolon(zero_range, standard_lib(), ast_to_type_checker(Immutable.Map())(ast)(global_calling_context)))(CSharp.no_constraints)

    type Res<a> = { kind:"err", e:Py.ErrVal } | { kind:"end", s:Py.MemRt } | { kind:"k", s:Py.MemRt, k:FastCo.Coroutine<Py.MemRt, Py.ErrVal,a> }
    let run_step = <a>(p:FastCo.Coroutine<Py.MemRt, Py.ErrVal, a>, s:Py.MemRt) : Res<a> => {
      if (p.run.kind == "run") {
        let q = p.run.run(s)
        if (q.kind == "e") return { kind:"err", e:q.e }
        if (q.kind == "v") return { kind:"end", s:q.s }
        if (q.kind == "k") return { kind:"k", s:q.s, k:q.k }
        return run_step_pre(q.pre, q.p, q.s)
        // return { kind:"k", s:q.s, k:q.pre.combine(q.p) }
      }
      let q = run_step_pre<a>(p.run.pre, p.run.p, s)
      if (q.kind == "k") return {...q, k:q.k}
      return q
    }
    let run_step_pre = <a>(pre:FastCo.Coroutine<Py.MemRt, Py.ErrVal, Unit>, p:FastCo.Coroutine<Py.MemRt, Py.ErrVal,a>, s:Py.MemRt) : Res<a> => {
      if (pre.run.kind == "run") {
        let q = pre.run.run(s)
        if (q.kind == "e") return { kind:"err", e:q.e }
        if (q.kind == "v") return run_step(p,q.s)
        if (q.kind == "k") return { kind:"k", s:q.s, k:q.k.combine(p) }
        // return { kind:"k", s:q.s, k:q.pre.combine(q.p).combine(p) }
        return run_step_pre(q.pre, q.p.combine(p), q.s)
      }
      let q = run_step_pre<a>(pre.run.pre, pre.run.p.combine(p), s)
      if (q.kind == "k") return {...q, k:q.k}
      return q
    }

    let runtime_stream = (state:Prod<Py.StmtRt,Py.MemRt>) : DebuggerStream => ({
      kind:"step",
      next:() => {
        let p = state.fst
        let s = state.snd
        let q = run_step(p, s)
        if (q.kind == "err") {
          let error = q.e
          return { kind:"error", show:() => ({ kind:"message", message:error.message, range:error.range }) }
        }
        if (q.kind == "end") {
          s = q.s
          return { kind:"done", show:() => ({ kind:"memory", memory:s, ast:ast}) }
        }
        return runtime_stream({ fst:q.k, snd:q.s })
      },
      show:() => ({ kind:"memory", memory:state.snd, ast:ast })
    })

    let typechecker_stream = (state:Prod<Coroutine<CSharp.State,CSharp.Err,CSharp.Typing>,CSharp.State>) : DebuggerStream => ({
      kind:"step",
      next:() => {
        let p = state.fst
        let s = state.snd
        let k = apply(p.run, s)
        if (k.kind == "left") {
          let error = k.value
          return { kind:"error", show:() => ({ kind:"message", message:error.message, range:error.range }) }
        }
        if (k.value.kind == "left") {
          return typechecker_stream(k.value.value)
        }
        let initial_runtime_state = apply(constant<Unit,Py.StmtRt>(k.value.value.fst.sem).times(constant<Unit,Py.MemRt>(Py.empty_memory_rt(custom_alert.kind == "left" ? custom_alert.value : (s:string) => true))), {})
        let first_stream = runtime_stream(initial_runtime_state)
        // if (first_stream.kind == "step") {
        //   first_stream = first_stream.next()
        // }
        return first_stream
      },
      show:() => ({ kind:"bindings", state:state.snd, ast:ast })
    })

    let initial_compiler_state = apply(constant<Unit,Coroutine<CSharp.State,CSharp.Err,CSharp.Typing>>(p).times(constant<Unit,CSharp.State>(CSharp.empty_state)), {})
    let first_stream = typechecker_stream(initial_compiler_state)
    // if (first_stream.kind == "step") {
    //   first_stream = first_stream.next()
    // }
    return first_stream
  }
  catch(e){
    console.log(e)
    return { kind:"error", show:() => ({ kind:"message", message:`Internal error: ${e}\n}`, range:mk_range(0,0,0,0) }) }
  }
}
