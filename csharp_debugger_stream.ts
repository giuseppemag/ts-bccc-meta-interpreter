import * as Immutable from "immutable"
import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair } from "ts-bccc"
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

export let get_stream = (source:string) : DebuggerStream => {
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

    let p = (CSharp.semicolon(zero_range, standard_lib(), ast_to_type_checker(ast)(global_calling_context)))(CSharp.no_constraints)

    let runtime_stream = (state:Prod<Py.StmtRt,Py.MemRt>) : DebuggerStream => ({
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
          return runtime_stream(k.value.value)
        }
        s = k.value.value.snd
        return { kind:"done", show:() => ({ kind:"memory", memory:s, ast:ast}) }
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
        let initial_runtime_state = apply(constant<Unit,Py.StmtRt>(k.value.value.fst.sem).times(constant<Unit,Py.MemRt>(Py.empty_memory_rt)), {})
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
