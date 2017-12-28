import * as Immutable from "immutable"
import { Prod, apply, curry, inl, inr, unit, Option, Sum, Unit, Fun, distribute_sum_prod, swap_prod, snd, fst, defun, Coroutine, co_get_state, co_error, co_set_state, co_unit, constant, State, CoCont, CoRet, mk_coroutine, Co, fun, CoPreRes, CoRes } from "ts-bccc"
import * as CCC from "ts-bccc"
import { SourceRange } from "../source_range";
import * as Lexer from "../lexer";
import { some, none, option_plus, comm_list_coroutine, co_catch, co_repeat, co_run_to_end } from "../ccc_aux"

export type Token = { kind:"Newline"} | { kind:"Indent"} | { kind:"Deindent"}
  | { kind:"int", v:number } | { kind:"float", v:number }
  | { kind:"if" } | { kind:"then" } | { kind:"else" }
  | { kind:"id", v:string }
  | { kind:"=" } | { kind:"+" } | { kind:"*" }
  | { kind:";" } | { kind:"." }
  | { kind:"(" } | { kind:")" }
  | { kind:"eof" } | { kind:"\n" }
  | { kind:" " }

export module GrammarBasics {
  type Error = string
  type Lexer = Coroutine<string,Error,Token>

  let parse_prefix_regex : (r:RegExp,t:(_:string)=>Token) => Lexer
  = (r,t) => mk_coroutine<string,Error,Token>(fun(s => {
    let m = s.match(r)
    if (m == null || m.length == 0) {
      return apply(inl<Error, CoRes<string,Error,Token>>(), "No match")
    } else {
      let rest = s.split(r)[1]
      let f = (constant<Unit,Token>(t(m[0])).times(constant<Unit,string>(rest || "")))
      let g = f.then(inr<CoCont<string,Error,Token>, CoRet<string,Error,Token>>())
      let h = g.then(inr<Error, CoRes<string,Error,Token>>())
      return apply(h, {})
    }
  }))

  let eof = parse_prefix_regex(/^$/, s => ({kind:"eof"}))
  let newline = parse_prefix_regex(/^\n/, s => ({kind:"\n"}))
  let whitespace = parse_prefix_regex(/^\s+/, s => ({kind:" "}))
  let semicolon = parse_prefix_regex(/^;/, s => ({kind:";"}))
  let plus = parse_prefix_regex(/^\+/, s => ({kind:"+"}))
  let times = parse_prefix_regex(/^\*/, s => ({kind:"*"}))
  let dot = parse_prefix_regex(/^\./, s => ({kind:"."}))
  let lbr = parse_prefix_regex(/^\(/, s => ({kind:"("}))
  let rbr = parse_prefix_regex(/^\)/, s => ({kind:")"}))
  let int = parse_prefix_regex(/^[0-9]+/, s => ({ kind:"int", v:parseInt(s) }))
  let float = parse_prefix_regex(/^[0-9]+.[0-9]+/, s => ({ kind:"float", v:parseFloat(s) }))
  let _if = parse_prefix_regex(/^if/, s => ({kind:"if"}))
  let _eq = parse_prefix_regex(/^=/, s => ({kind:"="}))
  let _then = parse_prefix_regex(/^then/, s => ({kind:"then"}))
  let _else = parse_prefix_regex(/^else/, s => ({kind:"else"}))
  let identifier = parse_prefix_regex(/^[a-zA-Z][a-zA-Z0-9]*/, s => ({ kind:"id", v:s }))

  let token = co_catch(semicolon)(
              co_catch(plus)(
              co_catch(times)(
              co_catch(dot)(
              co_catch(lbr)(
              co_catch(rbr)(
              co_catch(int)(
              co_catch(float)(
              co_catch(_if)(
              co_catch(_eq)(
              co_catch(_then)(
              co_catch(_else)(
              co_catch(int)(
              co_catch(identifier)(
              co_catch(newline)(
              whitespace
              )))))))))))))))

  export let tokenize = (source:string) : Token[] => {
    let res = co_run_to_end(co_repeat(token).then(ts => eof.then(_ => co_unit(ts))), source)
    return res.kind == "left" ? [] : res.value.fst
  }
}

export interface IntAST { kind: "int", value: number }
export interface IdAST { kind: "id", value: string }
export interface DeclAST { kind: "decl", l:Node, r:Node }
let mk_decl = (l:Node,r:Node) : Node => ({ kind: "decl", l:l, r:r })
export interface AssignAST { kind: "=", l:Node, r:Node }
let mk_assign = (l:Node,r:Node) : Node => ({ kind: "=", l:l, r:r })
export interface FieldRefAST { kind: ".", l:Node, r:Node }
let mk_field_ref = (l:Node,r:Node) : Node => ({ kind: ".", l:l, r:r })
export interface SemicolonAST { kind: ";", l:Node, r:Node }
let mk_semicolon = (l:Node,r:Node) : Node => ({ kind: ";", l:l, r:r })
export interface PlusAST { kind: "+", l:Node, r:Node }
let mk_plus = (l:Node,r:Node) : Node => ({ kind: "+", l:l, r:r })
export interface TimesAST { kind: "*", l:Node, r:Node }
let mk_times = (l:Node,r:Node) : Node => ({ kind: "*", l:l, r:r })
export interface FunDefAST { kind: "fun", n:IdAST, args:Array<Node>, body:Node }
export type Node = IntAST | IdAST | AssignAST | FieldRefAST | DeclAST | SemicolonAST | FunDefAST | PlusAST | TimesAST
// interface AST { range:SourceRange, node:Node }

export type Error = string
export type Tokens = Immutable.List<Token>
export type Parser = Coroutine<Tokens, Error, Node>

let int: Parser = co_get_state<Tokens, Error>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected number")
  let i = s.first()
  if (i.kind == "int") {
    let res: Node = { kind: "int", value: i.v }
    return co_set_state<Tokens, Error>(s.rest().toList()).then(_ => co_unit(res))
  }
  else return co_error("error, int")
})

let id: Parser = co_get_state<Tokens, Error>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected identifier")
  let i = s.first()
  if (i.kind == "id") {
    let res: Node = { kind: "id", value: i.v }
    return co_set_state<Tokens, Error>(s.rest().toList()).then(_ => co_unit(res))
  }
  else return co_error("error, int")
})

let equal_sign: Coroutine<Tokens,Error,Unit> = co_get_state<Tokens, Error>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected equal")
  let i = s.first()
  if (i.kind == "=") {
    return co_set_state<Tokens, Error>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("error, int")
})

let semicolon_sign: Coroutine<Tokens,Error,Unit> = co_get_state<Tokens, Error>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected equal")
  let i = s.first()
  if (i.kind == ";") {
    return co_set_state<Tokens, Error>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("error, int")
})

let left_bracket: Coroutine<Tokens,Error,Unit> = co_get_state<Tokens, Error>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected dot")
  let i = s.first()
  if (i.kind == "(") {
    return co_set_state<Tokens, Error>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("error, dot")
})

let right_bracket: Coroutine<Tokens,Error,Unit> = co_get_state<Tokens, Error>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected dot")
  let i = s.first()
  if (i.kind == ")") {
    return co_set_state<Tokens, Error>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("error, dot")
})

let dot_sign: Coroutine<Tokens,Error,Unit> = co_get_state<Tokens, Error>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected dot")
  let i = s.first()
  if (i.kind == ".") {
    return co_set_state<Tokens, Error>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("error, dot")
})

let plus_op: Coroutine<Tokens,Error,Unit> = co_get_state<Tokens, Error>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected dot")
  let i = s.first()
  if (i.kind == "+") {
    return co_set_state<Tokens, Error>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("error, dot")
})

let newline_sign: Coroutine<Tokens,Error,Unit> = co_get_state<Tokens, Error>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected dot")
  let i = s.first()
  if (i.kind == "Newline") {
    return co_set_state<Tokens, Error>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("error, dot")
})

let times_op: Coroutine<Tokens,Error,Unit> = co_get_state<Tokens, Error>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected dot")
  let i = s.first()
  if (i.kind == "*") {
    return co_set_state<Tokens, Error>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("error, dot")
})

let eof: Coroutine<Tokens,Error,Unit> = co_get_state<Tokens, Error>().then(s => {
  if (s.isEmpty())
    return co_unit({})
  return co_error("found non-empty state, expected eof")
})

let field_ref:  () => Parser = () => id.then(l =>
  dot_sign.then(_ =>
  co_catch(field_ref())(id).then(r =>
  co_unit(mk_field_ref(l,r)))))

let term : () => Parser = () =>
  co_catch(id)(
  co_catch(int)(
  left_bracket.then(_ =>
  expr().then(e =>
  right_bracket.then(_ =>
  co_unit(e)
  )))))

let expr : () => Parser = () =>
  term().then(l =>
  co_catch(plus_op.then(_ => expr().then(r => co_unit(mk_plus(l,r)))))(
  co_catch(times_op.then(_ => expr().then(r => co_unit(mk_times(l,r)))))(
  co_unit(l)
  )))

let assign : () => Parser = () =>
  co_catch(field_ref())(id).then(l =>
  equal_sign.then(_ =>
  expr().then(r =>
  co_unit(mk_assign(l,r))
  )))

let whitespace : () => Coroutine<Tokens,Error,Unit> = () =>
  co_catch(newline_sign.then(_ => whitespace()))(co_unit({}))

let decl : () => Parser = () =>
  id.then(l =>
  whitespace().then(_ =>
  id.then(r =>
  co_unit(mk_decl(l, r)))))

let outer_statement : () => Parser = () =>
  co_catch(decl())(assign()).then(l => whitespace().then(_ => semicolon_sign.then(_ => whitespace().then(_ => co_unit(l)))))

export let program : () => Parser = () =>
  outer_statement().then(l =>
  co_catch(program().then(r =>
  co_unit(mk_semicolon(l, r))
  ))(eof.then(_ => co_unit(l))))
