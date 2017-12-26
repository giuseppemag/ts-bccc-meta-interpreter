import * as Immutable from "immutable"
import { fun, Prod, apply, curry, inl, inr, unit, Option, Sum, Unit, Fun, distribute_sum_prod, swap_prod, snd, fst, defun, Coroutine, co_get_state, co_error, co_set_state, co_unit } from "ts-bccc"
import * as CCC from "ts-bccc"
import { SourceRange } from "../source_range";
import * as Lexer from "../lexer";
import { some, none, option_plus, comm_list_coroutine, co_catch } from "../ccc_aux"

export type Token = { kind:"Newline"} | { kind:"Indent"} | { kind:"Deindent"}
  | { kind:"int", v:number } | { kind:"float", v:number }
  | { kind:"if" } | { kind:"then" } | { kind:"else" }
  | { kind:"id", v:string }
  | { kind:"=" } | { kind:"+" } | { kind:"*" }
  | { kind:";" } | { kind:"." }
  | { kind:"(" } | { kind:")" }

export module GrammarBasics {
  let newline:Token = ({ kind:"Newline" })
  let indent:Token = ({ kind:"Indent" })
  let deindent:Token = ({ kind:"Deindent" })
  let semicolon : (_:string) => Option<Token>
  = s => !/;$/.test(s) ? none<Token>().f({}) : some<Token>().f({ kind:";" })
  let plus : (_:string) => Option<Token>
  = s => !/\+$/.test(s) ? none<Token>().f({}) : some<Token>().f({ kind:"+" })
  let times : (_:string) => Option<Token>
  = s => !/\*$/.test(s) ? none<Token>().f({}) : some<Token>().f({ kind:"*" })
  let dot : (_:string) => Option<Token>
  = s => !/\.$/.test(s) ? none<Token>().f({}) : some<Token>().f({ kind:"." })
  let lbr : (_:string) => Option<Token>
  = s => !/\($/.test(s) ? none<Token>().f({}) : some<Token>().f({ kind:"(" })
  let rbr : (_:string) => Option<Token>
  = s => !/\)$/.test(s) ? none<Token>().f({}) : some<Token>().f({ kind:")" })
  let int : (_:string) => Option<Token>
  = s => !/^[0-9]+$/.test(s) ? none<Token>().f({}) : some<Token>().f({ kind:"int", v:parseInt(s) })
  let float : (_:string) => Option<Token>
  = s => !/^[0-9]+.[0-9]+$/.test(s) ? none<Token>().f({}) : some<Token>().f({ kind:"float", v:parseFloat(s) })
  let _if : (_:string) => Option<Token>
  = s => !/^if$/.test(s) ? none<Token>().f({}) : some<Token>().f({ kind:"if" })
  let _eq : (_:string) => Option<Token>
  = s => !/^=$/.test(s) ? none<Token>().f({}) : some<Token>().f({ kind:"=" })
  let _then : (_:string) => Option<Token>
  = s => !/^then$/.test(s) ? none<Token>().f({}) : some<Token>().f({ kind:"then" })
  let _else : (_:string) => Option<Token>
  = s => !/^else$/.test(s) ? none<Token>().f({}) : some<Token>().f({ kind:"else" })
  let id : (_:string) => Option<Token>
  = s => !/^[a-zA-Z][a-zA-Z0-9]*$/.test(s) ? none<Token>().f({}) : some<Token>().f({ kind:"id", v:s })

  export let tokenize = (source:string) : Token[] => {
    let res = Lexer.tokenize<Token>(Lexer.pre_process_indentation(source),
      _ => newline, _ => indent, _ => deindent,
        defun(
          option_plus<string, Token>(fun(semicolon),
          option_plus<string, Token>(fun(dot),
          option_plus<string, Token>(fun(plus),
          option_plus<string, Token>(fun(times),
          option_plus<string, Token>(fun(int),
          option_plus<string, Token>(fun(lbr),
          option_plus<string, Token>(fun(rbr),
          option_plus<string, Token>(fun(float),
          option_plus<string, Token>(fun(_if),
          option_plus<string, Token>(fun(_eq),
          option_plus<string, Token>(fun(_then),
          option_plus<string, Token>(fun(_else),
          fun(id)))))))))))))))
    return res.kind == "right" ? Array<Token>() : res.value
  }
}

export interface int { kind: "int", value: number }
export interface id { kind: "id", value: string }
export interface decl { kind: "decl", l:Node, r:Node }
let mk_decl = (l:Node,r:Node) : Node => ({ kind: "decl", l:l, r:r })
export interface assign { kind: "=", l:Node, r:Node }
let mk_assign = (l:Node,r:Node) : Node => ({ kind: "=", l:l, r:r })
export interface field_ref { kind: ".", l:Node, r:Node }
let mk_field_ref = (l:Node,r:Node) : Node => ({ kind: ".", l:l, r:r })
export interface semicolon { kind: ";", l:Node, r:Node }
let mk_semicolon = (l:Node,r:Node) : Node => ({ kind: ";", l:l, r:r })
export interface plus { kind: "+", l:Node, r:Node }
let mk_plus = (l:Node,r:Node) : Node => ({ kind: "+", l:l, r:r })
export interface times { kind: "*", l:Node, r:Node }
let mk_times = (l:Node,r:Node) : Node => ({ kind: "*", l:l, r:r })
export interface fun_def { kind: "fun", n:id, args:Array<Node>, body:Node }
export type Node = int | id | assign | field_ref | decl | semicolon | fun_def | plus | times
// interface AST { range:SourceRange, node:Node }

export type Error = string
export type State = Immutable.List<Token>
export type Parser = Coroutine<State, Error, Node>

let int: Parser = co_get_state<State, Error>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected number")
  let i = s.first()
  if (i.kind == "int") {
    let res: Node = { kind: "int", value: i.v }
    return co_set_state<State, Error>(s.rest().toList()).then(_ => co_unit(res))
  }
  else return co_error("error, int")
})

let id: Parser = co_get_state<State, Error>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected identifier")
  let i = s.first()
  if (i.kind == "id") {
    let res: Node = { kind: "id", value: i.v }
    return co_set_state<State, Error>(s.rest().toList()).then(_ => co_unit(res))
  }
  else return co_error("error, int")
})

let equal_sign: Coroutine<State,Error,Unit> = co_get_state<State, Error>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected equal")
  let i = s.first()
  if (i.kind == "=") {
    return co_set_state<State, Error>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("error, int")
})

let semicolon_sign: Coroutine<State,Error,Unit> = co_get_state<State, Error>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected equal")
  let i = s.first()
  if (i.kind == ";") {
    return co_set_state<State, Error>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("error, int")
})

let left_bracket: Coroutine<State,Error,Unit> = co_get_state<State, Error>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected dot")
  let i = s.first()
  if (i.kind == "(") {
    return co_set_state<State, Error>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("error, dot")
})

let right_bracket: Coroutine<State,Error,Unit> = co_get_state<State, Error>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected dot")
  let i = s.first()
  if (i.kind == ")") {
    return co_set_state<State, Error>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("error, dot")
})

let dot_sign: Coroutine<State,Error,Unit> = co_get_state<State, Error>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected dot")
  let i = s.first()
  if (i.kind == ".") {
    return co_set_state<State, Error>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("error, dot")
})

let plus_op: Coroutine<State,Error,Unit> = co_get_state<State, Error>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected dot")
  let i = s.first()
  if (i.kind == "+") {
    return co_set_state<State, Error>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("error, dot")
})

let newline_sign: Coroutine<State,Error,Unit> = co_get_state<State, Error>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected dot")
  let i = s.first()
  if (i.kind == "Newline") {
    return co_set_state<State, Error>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("error, dot")
})

let times_op: Coroutine<State,Error,Unit> = co_get_state<State, Error>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected dot")
  let i = s.first()
  if (i.kind == "*") {
    return co_set_state<State, Error>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("error, dot")
})

let eof: Coroutine<State,Error,Unit> = co_get_state<State, Error>().then(s => {
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

let whitespace : () => Coroutine<State,Error,Unit> = () =>
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
