import * as Immutable from 'immutable';
import {
  apply,
  co_error,
  co_unit,
  CoCont,
  constant,
  CoRes,
  CoRet,
  Coroutine,
  fun,
  inl,
  inr,
  mk_coroutine,
  Sum,
  Unit,
} from 'ts-bccc'

import { co_catch, co_repeat, co_run_to_end } from '../ccc_aux'
import { mk_range, SourceRange } from '../source_range'

export type BinOpKind = "+"|"*"|"/"|"-"|"%"|">"|"<"|"<="|">="|"=="|"!="|"&&"|"||"|"xor"|"=>"|","|"as"
export type UnaryOpKind = "not"

export type ReservedKeyword = "for"|"while"|"if"|"then"|"else"|"private"|"public"|"static"|"protected"|"virtual"|"override"|"class"|"new"|"debugger"|"typechecker_debugger"|"return"|"?"|":"
export type Token = ({ kind:"string", v:string } | { kind:"int", v:number } | { kind:"double", v:number } | { kind:"float", v:number } | { kind:"bool", v:boolean }
  | { kind:ReservedKeyword }
  | { kind:"id", v:string }
  | { kind:"=" } | { kind:BinOpKind } | {kind:UnaryOpKind}
  | { kind:";" } | { kind:"." }
  | { kind:"(" } | { kind:")" }
  | { kind:"{" } | { kind:"}" }
  | { kind:"[" } | { kind:"]" }
  | { kind:"eof" } | { kind:"nl" }
  | { kind:" " }
  | { kind:"," }
  | { kind:RenderingKind }
  | { kind:"RenderGrid", v:number }
  ) & { range:SourceRange }

export type RenderingKind = "empty_surface" | "circle" | "square" | "rectangle" | "ellipse" | "sprite" | "other_surface" | "text" | "line" | "polygon"


export module GrammarBasics {
  type LexerError = string
  type LexerState = { buffer:string, line_index:number, column_index:number }
  interface Lexer extends Coroutine<LexerState,LexerError,Token> {}

  let parse_prefix_regex : (r:RegExp,t:(s:string,r:SourceRange)=>Token) => Lexer
  = (r,t) => mk_coroutine<LexerState,LexerError,Token>(fun(s => {
    let m = s.buffer.match(r)
    if (m == null || m.length == 0) {
      return apply(inl<LexerError, CoRes<LexerState,LexerError,Token>>(), `Syntax error: cannot match token at (${s.line_index}, ${s.column_index}), ${s.buffer.substr(0, Math.min(s.buffer.length, 5))}...`)
    } else {
      let rest = s.buffer.replace(r, "")
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

  let fst_err = (x:LexerError,y:LexerError) => x
  let lex_catch = co_catch<LexerState,LexerError,Token>(fst_err)

  let lex_catch_many = (tokens:Immutable.List<Lexer>) : Lexer => tokens.isEmpty() ?
      co_error<LexerState,LexerError,Token>("No lexer available.")
    :
      lex_catch(tokens.first())(lex_catch_many(tokens.rest().toList()))

  let eof = parse_prefix_regex(/^$/, (s,r) => ({range:r, kind:"eof"}))

  let token:Lexer = lex_catch_many(Immutable.List<Lexer>([
    parse_prefix_regex(/^;/, (s,r) => ({range:r, kind:";"})),

    parse_prefix_regex(/^[a-zA-Z_][a-zA-Z0-9_]*/, (s,r) =>
      s == "class" || s == "new" || s == "return" || s == "for"
      || s == "for" || s == "while" || s == "if" || s == "else"
      || s == "debugger" || s == "typechecker_debugger"
      || s == "private" || s == "public" || s == "protected"
      || s == "virtual" || s == "override"
      || s == "static" ? ({range:r, kind:s as ReservedKeyword})

      : s == "other_surface" || s == "empty_surface" || s == "ellipse"
      || s == "sprite" || s == "circle" || s == "rectangle" || s == "text"
      || s == "line" || s == "polygon" || s == "square" ? ({range:r, kind:s as RenderingKind})
      : s == "as" ? ({range:r, kind:"as" })

      : s == "true" || s == "false" ? ({range:r, kind:"bool", v:(s == "true") })
      : ({range:r, kind:"id", v:s })),

    parse_prefix_regex(/^-?[0-9]+\.[0-9]*f/, (s,r) => ({range:r,  kind:"float", v:parseFloat(s) })),
    parse_prefix_regex(/^-?[0-9]+\.[0-9]+/, (s,r) => ({range:r,  kind:"double", v:parseFloat(s) })),
    parse_prefix_regex(/^-?[0-9]+/, (s,r) => ({range:r,  kind:"int", v:parseInt(s) })),

    parse_prefix_regex(/^\n/, (s,r) => ({range:r, kind:"nl"})),
    parse_prefix_regex(/^\?/, (s,r) => ({range:r, kind:"?"})),
    parse_prefix_regex(/^\:/, (s,r) => ({range:r, kind:":"})),
    parse_prefix_regex(/^\+/, (s,r) => ({range:r, kind:"+"})),
    parse_prefix_regex(/^\*/, (s,r) => ({range:r, kind:"*"})),
    parse_prefix_regex(/^\-/, (s,r) => ({range:r, kind:"-"})),
    parse_prefix_regex(/^\//, (s,r) => ({range:r, kind:"/"})),
    parse_prefix_regex(/^%/, (s,r) => ({range:r, kind:"%"})),
    parse_prefix_regex(/^<=/, (s,r) => ({range:r, kind:"<="})),
    parse_prefix_regex(/^>=/, (s,r) => ({range:r, kind:">="})),
    parse_prefix_regex(/^</, (s,r) => ({range:r, kind:"<"})),
    parse_prefix_regex(/^>/, (s,r) => ({range:r, kind:">"})),
    parse_prefix_regex(/^=>/, (s,r) => ({range:r, kind:"=>"})),
    parse_prefix_regex(/^==/, (s,r) => ({range:r, kind:"=="})),
    parse_prefix_regex(/^!=/, (s,r) => ({range:r, kind:"!="})),
    parse_prefix_regex(/^&&/, (s,r) => ({range:r, kind:"&&"})),
    parse_prefix_regex(/^\^/, (s,r) => ({range:r, kind:"xor"})),
    parse_prefix_regex(/^!/, (s,r) => ({range:r, kind:"not"})),
    parse_prefix_regex(/^,/, (s,r) => ({range:r, kind:","})),
    parse_prefix_regex(/^\|\|/, (s,r) => ({range:r, kind:"||"})),
    parse_prefix_regex(/^\./, (s,r) => ({range:r, kind:"."})),
    parse_prefix_regex(/^\(/, (s,r) => ({range:r, kind:"("})),
    parse_prefix_regex(/^\)/, (s,r) => ({range:r, kind:")"})),
    parse_prefix_regex(/^\[/, (s,r) => ({range:r, kind:"["})),
    parse_prefix_regex(/^\]/, (s,r) => ({range:r, kind:"]"})),
    parse_prefix_regex(/^{/, (s,r) => ({range:r, kind:"{"})),
    parse_prefix_regex(/^}/, (s,r) => ({range:r, kind:"}"})),
    parse_prefix_regex(/^"[^"]*"/, (s,r) => ({range:r,  kind:"string", v:s.replace(/^"/, "").replace(/"$/, "") })),
    parse_prefix_regex(/^=/, (s,r) => ({range:r, kind:"="})),
    parse_prefix_regex(/^\s+/, (s,r) => ({range:r, kind:" "})),
  ]))

  export let tokenize = (source:string) : Sum<LexerError,Token[]> => {
    let lines = source.split("\n")
    let tokens = Immutable.List<Token>()
    let line_index = 0
    while (line_index < lines.length) {
      let line = lines[line_index]
      let line_tokens = co_run_to_end(co_repeat(token).then((ts:Array<Token>) => eof.then(_ => co_unit(ts))),
                                      { buffer:line, line_index:line_index, column_index:0})
      if (line_tokens.kind == "left") return line_tokens
      tokens = tokens.push(...line_tokens.value.fst)
      tokens = tokens.push({kind:"nl", range:mk_range(line_index, line.length, line_index, line.length+1)})
      line_index = line_index + 1
    }
    return apply(inr<LexerError,Token[]>(), tokens.toArray())
  }
}