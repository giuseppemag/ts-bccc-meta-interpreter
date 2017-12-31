import * as Immutable from "immutable"
import { Prod, apply, curry, inl, inr, unit, Option, Sum, Unit, Fun, distribute_sum_prod, swap_prod, snd, fst, defun, Coroutine, co_get_state, co_error, co_set_state, co_unit, constant, State, CoCont, CoRet, mk_coroutine, Co, fun, CoPreRes, CoRes } from "ts-bccc"
import * as CCC from "ts-bccc"
import { SourceRange, join_source_ranges, mk_range } from "../source_range";
import * as Lexer from "../lexer";
import { some, none, option_plus, comm_list_coroutine, co_catch, co_repeat, co_run_to_end } from "../ccc_aux"

export type Token = ({ kind:"string", v:string } | { kind:"int", v:number } | { kind:"float", v:number }
  | { kind:"if" } | { kind:"then" } | { kind:"else" }
  | { kind:"id", v:string }
  | { kind:"=" } | { kind:"+" } | { kind:"*" }
  | { kind:";" } | { kind:"." }
  | { kind:"dbg" } | { kind:"tc-dbg" }
  | { kind:"(" } | { kind:")" }
  | { kind:"eof" } | { kind:"nl" }
  | { kind:" " }
  | { kind:"RenderGrid", v:number } | { kind:"mk_empty_render_grid" } | { kind:"pixel" }
  ) & { range:SourceRange }

export module GrammarBasics {
  type LexerError = string
  type LexerState = { buffer:string, line_index:number, column_index:number }
  type Lexer = Coroutine<LexerState,LexerError,Token>

  let parse_prefix_regex : (r:RegExp,t:(s:string,r:SourceRange)=>Token) => Lexer
  = (r,t) => mk_coroutine<LexerState,LexerError,Token>(fun(s => {
    let m = s.buffer.match(r)
    if (m == null || m.length == 0) {
      return apply(inl<LexerError, CoRes<LexerState,LexerError,Token>>(), `Syntax error: cannot match token at (${s.line_index}, ${s.column_index}), ${s.buffer.substr(0, Math.min(s.buffer.length, 5))}...`)
    } else {
      let rest = s.buffer.split(r)[1]
      // console.log("Lexing", r, s.buffer)
      // console.log("Match", m)
      // console.log("Rest", rest)
      let new_line_index = s.line_index
      let new_column_index = s.column_index + m[0].length
      let f = (constant<Unit,Token>(t(m[0], mk_range(s.line_index, s.column_index, new_line_index, new_column_index))).times(constant<Unit,LexerState>({buffer:rest || "", line_index:new_line_index, column_index:new_column_index})))
      let g = f.then(inr<CoCont<LexerState,LexerError,Token>, CoRet<LexerState,LexerError,Token>>())
      let h = g.then(inr<LexerError, CoRes<LexerState,LexerError,Token>>())
      return apply(h, {})
    }
  }))

  let empty_render_grid = parse_prefix_regex(/^empty_render_grid/, (s,r) => ({range:r, kind:"mk_empty_render_grid"}))
  let pixel = parse_prefix_regex(/^pixel/, (s,r) => ({range:r, kind:"pixel"}))
  let dbg = parse_prefix_regex(/^debugger/, (s,r) => ({range:r, kind:"dbg"}))
  let dbg_tc = parse_prefix_regex(/^typechecker_debugger/, (s,r) => ({range:r, kind:"tc-dbg"}))
  let eof = parse_prefix_regex(/^$/, (s,r) => ({range:r, kind:"eof"}))
  let newline = parse_prefix_regex(/^\n/, (s,r) => ({range:r, kind:"nl"}))
  let whitespace = parse_prefix_regex(/^\s+/, (s,r) => ({range:r, kind:" "}))
  let semicolon = parse_prefix_regex(/^;/, (s,r) => ({range:r, kind:";"}))
  let plus = parse_prefix_regex(/^\+/, (s,r) => ({range:r, kind:"+"}))
  let times = parse_prefix_regex(/^\*/, (s,r) => ({range:r, kind:"*"}))
  let dot = parse_prefix_regex(/^\./, (s,r) => ({range:r, kind:"."}))
  let lbr = parse_prefix_regex(/^\(/, (s,r) => ({range:r, kind:"("}))
  let rbr = parse_prefix_regex(/^\)/, (s,r) => ({range:r, kind:")"}))
  let string = parse_prefix_regex(/^".*"/, (s,r) => ({range:r,  kind:"string", v:s }))
  let int = parse_prefix_regex(/^[0-9]+/, (s,r) => ({range:r,  kind:"int", v:parseInt(s) }))
  let float = parse_prefix_regex(/^[0-9]+.[0-9]+/, (s,r) => ({range:r,  kind:"float", v:parseFloat(s) }))
  let _if = parse_prefix_regex(/^if/, (s,r) => ({range:r, kind:"if"}))
  let _eq = parse_prefix_regex(/^=/, (s,r) => ({range:r, kind:"="}))
  let _then = parse_prefix_regex(/^then/, (s,r) => ({range:r, kind:"then"}))
  let _else = parse_prefix_regex(/^else/, (s,r) => ({range:r, kind:"else"}))
  let identifier = parse_prefix_regex(/^[a-zA-Z][a-zA-Z0-9]*/, (s,r) => ({range:r,  kind:"id", v:s }))

  let fst_err = (x:LexerError,y:LexerError) => x
  let lex_catch = co_catch<LexerState,LexerError,Token>(fst_err)

  let token = lex_catch(semicolon)(
              lex_catch(plus)(
              lex_catch(times)(
              lex_catch(dot)(
              lex_catch(lbr)(
              lex_catch(rbr)(
              lex_catch(dbg)(
              lex_catch(dbg_tc)(
              lex_catch(int)(
              lex_catch(string)(
              lex_catch(float)(
              lex_catch(_if)(
              lex_catch(_eq)(
              lex_catch(_then)(
              lex_catch(_else)(
              lex_catch(int)(
              lex_catch(empty_render_grid)(
              lex_catch(pixel)(
              lex_catch(identifier)(
              whitespace
              )))))))))))))))))))

  export let tokenize = (source:string) : Sum<LexerError,Token[]> => {
    let lines = source.split("\n")
    let tokens = Immutable.List<Token>()
    let line_index = 0
    while (line_index < lines.length) {
      let line = lines[line_index]
      let line_tokens = co_run_to_end(co_repeat(token).then(ts => eof.then(_ => co_unit(ts))), { buffer:line, line_index:line_index, column_index:0})
      if (line_tokens.kind == "left") return line_tokens
      tokens = tokens.push(...line_tokens.value.fst)
      tokens = tokens.push({kind:"nl", range:mk_range(line_index, line.length, line_index, line.length+1)})
      line_index = line_index + 1
    }
    return apply(inr<LexerError,Token[]>(), tokens.toArray())
  }
}

export interface DebuggerAST { kind: "dbg" }
export interface TCDebuggerAST { kind: "tc-dbg" }
export interface StringAST { kind: "string", value:string }
export interface IntAST { kind: "int", value: number }
export interface IdAST { kind: "id", value: string }
export interface DeclAST { kind: "decl", l:ParserRes, r:ParserRes }
export interface AssignAST { kind: "=", l:ParserRes, r:ParserRes }
export interface FieldRefAST { kind: ".", l:ParserRes, r:ParserRes }
export interface SemicolonAST { kind: ";", l:ParserRes, r:ParserRes }
export interface PlusAST { kind: "+", l:ParserRes, r:ParserRes }
export interface TimesAST { kind: "*", l:ParserRes, r:ParserRes }
export interface FunDefAST { kind: "fun", n:IdAST, args:Array<AST>, body:AST }
export interface MkEmptyRenderGrid { kind: "mk-empty-render-grid", w:ParserRes, h:ParserRes }
export interface MkRenderGridPixel { kind: "mk-render-grid-pixel", w:ParserRes, h:ParserRes, status:ParserRes }
export type AST = StringAST | IntAST | IdAST | FieldRefAST
                | AssignAST | DeclAST | SemicolonAST | FunDefAST
                | PlusAST | TimesAST
                | DebuggerAST | TCDebuggerAST
                | MkEmptyRenderGrid | MkRenderGridPixel
export interface ParserRes { range:SourceRange, ast:AST }

let mk_string = (v:string, sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "string", value:v }})
let mk_int = (v:number, sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "int", value:v }})
let mk_identifier = (v:string, sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "id", value:v }})
let mk_decl = (l:ParserRes,r:ParserRes) : ParserRes => ({ range:join_source_ranges(l.range, r.range), ast:{ kind: "decl", l:l, r:r }})
let mk_assign = (l:ParserRes,r:ParserRes) : ParserRes => ({ range:join_source_ranges(l.range, r.range), ast:{ kind: "=", l:l, r:r }})
let mk_field_ref = (l:ParserRes,r:ParserRes) : ParserRes => ({ range:join_source_ranges(l.range, r.range), ast:{ kind: ".", l:l, r:r }})
let mk_semicolon = (l:ParserRes,r:ParserRes) : ParserRes => ({ range:join_source_ranges(l.range, r.range), ast:{ kind: ";", l:l, r:r }})
let mk_plus = (l:ParserRes,r:ParserRes) : ParserRes => ({ range:join_source_ranges(l.range, r.range), ast:{ kind: "+", l:l, r:r }})
let mk_times = (l:ParserRes,r:ParserRes) : ParserRes => ({ range:join_source_ranges(l.range, r.range), ast:{ kind: "*", l:l, r:r }})
let mk_dbg = (sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "dbg" }})
let mk_tc_dbg = (sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "tc-dbg" }})
let mk_empty_render_grid = (w:ParserRes, h:ParserRes) : ParserRes => ({ range:join_source_ranges(w.range, h.range), ast:{ kind: "mk-empty-render-grid", w:w, h:h }})
let mk_render_grid_pixel = (w:ParserRes, h:ParserRes, status:ParserRes) : ParserRes => ({ range:join_source_ranges(w.range, join_source_ranges(h.range, status.range)), ast:{ kind: "mk-render-grid-pixel", w:w, h:h, status:status }})


export type ParserError = string
export type ParserState = Immutable.List<Token>
export type Parser = Coroutine<ParserState, ParserError, ParserRes>

let mk_empty_render_grid_sign: Coroutine<ParserState,ParserError,Unit> = co_get_state<ParserState, ParserError>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected empty_render_grid")
  let i = s.first()
  if (i.kind == "mk_empty_render_grid") {
    return co_set_state<ParserState, ParserError>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("expected empty_render_grid")
})

let mk_render_grid_pixel_sign: Coroutine<ParserState,ParserError,Unit> = co_get_state<ParserState, ParserError>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected pixel")
  let i = s.first()
  if (i.kind == "pixel") {
    return co_set_state<ParserState, ParserError>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("expected pixel")
})

let newline_sign: Coroutine<ParserState,ParserError,Unit> = co_get_state<ParserState, ParserError>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected newline")
  let i = s.first()
  if (i.kind == "nl") {
    return co_set_state<ParserState, ParserError>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("expected newline")
})

let whitespace_sign: Coroutine<ParserState,ParserError,Unit> = co_get_state<ParserState, ParserError>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected whitespace")
  let i = s.first()
  if (i.kind == " ") {
    return co_set_state<ParserState, ParserError>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("expected whitespace")
})

let fst_err = (e:ParserError, _:ParserError) => e
let snd_err = (e:ParserError, _:ParserError) => e
let both_errors = (e1:ParserError, e2:ParserError) => `${e1}, or ${e2}`

let whitespace = () =>
  co_repeat(co_catch<ParserState,ParserError,Unit>(fst_err)(newline_sign)(whitespace_sign)).then(_ => co_unit({}))

let ignore_whitespace = function<a>(p:Coroutine<ParserState,ParserError,a>) : Coroutine<ParserState,ParserError,a> { return whitespace().then(_ => p.then(p_res => whitespace().then(_ => co_unit(p_res)))) }

let dbg: Parser = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected identifier")
  let i = s.first()
  if (i.kind == "dbg") {
    let res = mk_dbg(i.range)
    return co_set_state<ParserState, ParserError>(s.rest().toList()).then(_ => co_unit(res))
  }
  else return co_error(`expected debugger but found ${i.kind} at (${i.range.start.row}, ${i.range.start.column})`)
}))

let tc_dbg: Parser = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected identifier")
  let i = s.first()
  if (i.kind == "tc-dbg") {
    let res = mk_tc_dbg(i.range)
    return co_set_state<ParserState, ParserError>(s.rest().toList()).then(_ => co_unit(res))
  }
  else return co_error(`expected typecheker debugger but found ${i.kind} at (${i.range.start.row}, ${i.range.start.column})`)
}))

let string: Parser = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected number")
  let i = s.first()
  if (i.kind == "string") {
    let res = mk_string(i.v, i.range)
    return co_set_state<ParserState, ParserError>(s.rest().toList()).then(_ => co_unit(res))
  }
  else return co_error("expected int")
}))

let int: Parser = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected number")
  let i = s.first()
  if (i.kind == "int") {
    let res = mk_int(i.v, i.range)
    return co_set_state<ParserState, ParserError>(s.rest().toList()).then(_ => co_unit(res))
  }
  else return co_error("expected int")
}))

let identifier: Parser = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected identifier")
  let i = s.first()
  if (i.kind == "id") {
    let res = mk_identifier(i.v, i.range)
    return co_set_state<ParserState, ParserError>(s.rest().toList()).then(_ => co_unit(res))
  }
  else return co_error(`expected identifier but found ${i.kind} at (${i.range.start.row}, ${i.range.start.column})`)
}))

let equal_sign: Coroutine<ParserState,ParserError,Unit> = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected equal")
  let i = s.first()
  if (i.kind == "=") {
    return co_set_state<ParserState, ParserError>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("expected '='")
}))

let semicolon_sign: Coroutine<ParserState,ParserError,Unit> = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected equal")
  let i = s.first()
  if (i.kind == ";") {
    return co_set_state<ParserState, ParserError>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error(`expected ';' at (${i.range.start.to_string()})`)
}))

let left_bracket: Coroutine<ParserState,ParserError,Unit> = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected dot")
  let i = s.first()
  if (i.kind == "(") {
    return co_set_state<ParserState, ParserError>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("expected '('")
}))

let right_bracket: Coroutine<ParserState,ParserError,Unit> = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected dot")
  let i = s.first()
  if (i.kind == ")") {
    return co_set_state<ParserState, ParserError>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("expected ')'")
}))

let dot_sign: Coroutine<ParserState,ParserError,Unit> = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected dot")
  let i = s.first()
  if (i.kind == ".") {
    return co_set_state<ParserState, ParserError>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("expected '.'")
}))

let plus_op: Coroutine<ParserState,ParserError,Unit> = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected dot")
  let i = s.first()
  if (i.kind == "+") {
    return co_set_state<ParserState, ParserError>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("expected '+'")
}))

let times_op: Coroutine<ParserState,ParserError,Unit> = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected dot")
  let i = s.first()
  if (i.kind == "*") {
    return co_set_state<ParserState, ParserError>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("expected '*'")
}))

let eof: Coroutine<ParserState,ParserError,Unit> = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.isEmpty())
    return co_unit({})
  return co_error("expected eof")
}))

let field_ref:  () => Parser = () => identifier.then(l =>
  dot_sign.then(_ =>
  co_catch<ParserState,ParserError,ParserRes>(snd_err)(field_ref())(identifier).then(r =>
  co_unit(mk_field_ref(l,r)))))

let mk_empty_render_grid_prs : () => Parser = () =>
  mk_empty_render_grid_sign.then(_ =>
  expr().then(l =>
  expr().then(r =>
  co_unit(mk_empty_render_grid(l,r))
  )))

let render_grid_pixel_prs : () => Parser = () =>
  mk_render_grid_pixel_sign.then(_ =>
  expr().then(l =>
  expr().then(r =>
  expr().then(st =>
  co_unit(mk_render_grid_pixel(l,r,st))
  ))))


let term : () => Parser = () =>
  co_catch<ParserState,ParserError,ParserRes>(both_errors)(mk_empty_render_grid_prs())(
  co_catch<ParserState,ParserError,ParserRes>(both_errors)(render_grid_pixel_prs())(
  co_catch<ParserState,ParserError,ParserRes>(both_errors)(identifier)(
  co_catch<ParserState,ParserError,ParserRes>(both_errors)(int)(
  co_catch<ParserState,ParserError,ParserRes>(both_errors)(string)(
  left_bracket.then(_ =>
  expr().then(e =>
  right_bracket.then(_ =>
  co_unit(e)
  ))))))))

let expr : () => Parser = () =>
  term().then(l =>
  co_catch<ParserState,ParserError,ParserRes>(both_errors)(plus_op.then(_ => expr().then(r => co_unit(mk_plus(l,r)))))(
  co_catch<ParserState,ParserError,ParserRes>(both_errors)(times_op.then(_ => expr().then(r => co_unit(mk_times(l,r)))))(
  co_unit(l)
  )))

let assign : () => Parser = () =>
  co_catch<ParserState,ParserError,ParserRes>(snd_err)(field_ref())(identifier).then(l =>
  equal_sign.then(_ =>
  expr().then(r =>
  co_unit(mk_assign(l,r))
  )))

let decl : () => Parser = () =>
  identifier.then(l =>
  identifier.then(r =>
  co_unit(mk_decl(l, r))))

let outer_statement : () => Parser = () =>
  co_catch<ParserState,ParserError,ParserRes>(both_errors)(decl())
  (co_catch<ParserState,ParserError,ParserRes>(both_errors)(assign())((co_catch<ParserState,ParserError,ParserRes>(both_errors)(dbg)(tc_dbg))))
  .then(l => whitespace().then(_ => semicolon_sign.then(_ => whitespace().then(_ => co_unit(l)))))

export let program_prs : () => Parser = () =>
  outer_statement().then(l =>
  co_catch<ParserState,ParserError,ParserRes>(snd_err)(program_prs().then(r =>
  co_unit(mk_semicolon(l, r))
  ))(
    co_catch<ParserState,ParserError,ParserRes>(snd_err)(eof.then(_ => co_unit(l)))(co_error("gnegne")))
  )
