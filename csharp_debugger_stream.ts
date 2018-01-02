import * as Immutable from "immutable"
import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair } from "ts-bccc"
import * as CCC from "ts-bccc"
import * as St from "ts-bccc"
import { mk_state, State } from "ts-bccc"
import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
import * as Co from "ts-bccc"
import { mk_range, zero_range } from "./source_range";

import * as Py from "./Python/python"
import * as CSharp from "./CSharpTypeChecker/csharp"
import { co_run_to_end } from "./ccc_aux";
import { ast_to_type_checker } from "./CSharpTypeChecker/csharp";

export type DebuggerStream = ({ kind:"error"|"done" } | { kind:"step", next:() => DebuggerStream }) & { show:() => { kind:"memory", memory:Py.MemRt } | { kind:"bindings", state:CSharp.State } | { kind:"message", message:string } }
export let get_stream = (source:string) : DebuggerStream => {
  let parse_result = CSharp.GrammarBasics.tokenize(source)
  if (parse_result.kind == "left") {
    let error = parse_result.value
    return { kind:"error", show:() => ({ kind:"message", message:error }) }
  }

  let tokens = Immutable.List<CSharp.Token>(parse_result.value)
  let res = co_run_to_end(CSharp.program_prs(), tokens)
  if (res.kind != "right") {
    let error = res.value
    return { kind:"error", show:() => ({ kind:"message", message:error }) }
  }

  let p = ast_to_type_checker(res.value.fst)

  let runtime_stream = (state:Prod<Py.StmtRt,Py.MemRt>) : DebuggerStream => ({
    kind:"step",
    next:() => {
      let p = state.fst
      let s = state.snd
      let k = apply(p.run, s)
      if (k.kind == "left") {
        let error = k.value
        return { kind:"error", show:() => ({ kind:"message", message:error }) }
      }
      if (k.value.kind == "left") {
        return runtime_stream(k.value.value)
      }
      s = k.value.value.snd
      return { kind:"done", show:() => ({ kind:"memory", memory:s}) }
    },
    show:() => ({ kind:"memory", memory:state.snd })
  })

  let typechecker_stream = (state:Prod<CSharp.Stmt,CSharp.State>) : DebuggerStream => ({
    kind:"step",
    next:() => {
      let p = state.fst
      let s = state.snd
      let k = apply(p.run, s)
      if (k.kind == "left") {
        let error = k.value
        return { kind:"error", show:() => ({ kind:"message", message:error }) }
      }
      if (k.value.kind == "left") {
        return typechecker_stream(k.value.value)
      }
      let initial_runtime_state = apply(constant<Unit,Py.StmtRt>(k.value.value.fst.sem).times(constant<Unit,Py.MemRt>(Py.empty_memory_rt)), {})
      return runtime_stream(initial_runtime_state)
    },
    show:() => ({ kind:"bindings", state:state.snd })
  })

  let initial_compiler_state = apply(constant<Unit,CSharp.Stmt>(p).times(constant<Unit,CSharp.State>(CSharp.empty_state)), {})
  return typechecker_stream(initial_compiler_state)
}

