import * as Immutable from "immutable"
import { Prod, apply, curry, inl, inr, unit, Option, Sum, Unit, Fun, distribute_sum_prod, swap_prod, snd, fst, defun, Coroutine, co_get_state, co_error, co_set_state, co_unit, constant, State, CoCont, CoRet, mk_coroutine, Co, fun, CoPreRes, CoRes } from "ts-bccc"
import * as CCC from "ts-bccc"
import { SourceRange, join_source_ranges, mk_range, zero_range, max_source_range } from "../source_range";
import * as Lexer from "../lexer";
import { some, none, option_plus, comm_list_coroutine, co_catch, co_repeat, co_run_to_end, co_lookup } from "../ccc_aux"
import * as CSharp from "./csharp"

export type BinOpKind = "+"|"*"|"/"|"-"|"%"|">"|"<"|"<="|">="|"=="|"!="|"&&"|"||" | "xor"
export type UnaryOpKind = "not"

export type Token = ({ kind:"string", v:string } | { kind:"int", v:number } | { kind:"float", v:number } | { kind:"bool", v:boolean }
  | { kind:"while" } | { kind:"if" } | { kind:"then" } | { kind:"else" }
  | { kind:"class" } | { kind:"new" }
  | { kind:"id", v:string }
  | { kind:"=" } | { kind:BinOpKind } | {kind:UnaryOpKind}
  | { kind:";" } | { kind:"." }
  | { kind:"dbg" } | { kind:"tc-dbg" }
  | { kind:"(" } | { kind:")" }
  | { kind:"{" } | { kind:"}" }
  | { kind:"[" } | { kind:"]" }
  | { kind:"eof" } | { kind:"nl" }
  | { kind:" " }
  | { kind:"," }
  | { kind:"RenderGrid", v:number } | { kind:"mk_empty_render_grid" } | { kind:"pixel" } | {kind:"return"}
  ) & { range:SourceRange }

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
    parse_prefix_regex(/^class/, (s,r) => ({range:r, kind:"class"})),
    parse_prefix_regex(/^new/, (s,r) => ({range:r, kind:"new"})),
    parse_prefix_regex(/^return/, (s,r) => ({range:r, kind:"return"})),

    parse_prefix_regex(/^while/, (s,r) => ({range:r, kind:"while"})),
    parse_prefix_regex(/^if/, (s,r) => ({range:r, kind:"if"})),
    parse_prefix_regex(/^else/, (s,r) => ({range:r, kind:"else"})),

    parse_prefix_regex(/^empty_render_grid/, (s,r) => ({range:r, kind:"mk_empty_render_grid"})),
    parse_prefix_regex(/^pixel/, (s,r) => ({range:r, kind:"pixel"})),
    parse_prefix_regex(/^debugger/, (s,r) => ({range:r, kind:"dbg"})),
    parse_prefix_regex(/^typechecker_debugger/, (s,r) => ({range:r, kind:"tc-dbg"})),
    parse_prefix_regex(/^\n/, (s,r) => ({range:r, kind:"nl"})),
    parse_prefix_regex(/^\+/, (s,r) => ({range:r, kind:"+"})),
    parse_prefix_regex(/^\*/, (s,r) => ({range:r, kind:"*"})),
    parse_prefix_regex(/^\-/, (s,r) => ({range:r, kind:"-"})),
    parse_prefix_regex(/^\//, (s,r) => ({range:r, kind:"/"})),
    parse_prefix_regex(/^%/, (s,r) => ({range:r, kind:"%"})),
    parse_prefix_regex(/^<=/, (s,r) => ({range:r, kind:"<="})),
    parse_prefix_regex(/^>=/, (s,r) => ({range:r, kind:"<="})),
    parse_prefix_regex(/^</, (s,r) => ({range:r, kind:"<"})),
    parse_prefix_regex(/^>/, (s,r) => ({range:r, kind:">"})),
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
    parse_prefix_regex(/^".*"/, (s,r) => ({range:r,  kind:"string", v:s })),
    parse_prefix_regex(/^[0-9]+/, (s,r) => ({range:r,  kind:"int", v:parseInt(s) })),
    parse_prefix_regex(/^((true)|(false))/, (s,r) => ({range:r,  kind:"bool", v:(s == "true") })),
    parse_prefix_regex(/^[0-9]+.[0-9]+/, (s,r) => ({range:r,  kind:"float", v:parseFloat(s) })),
    parse_prefix_regex(/^=/, (s,r) => ({range:r, kind:"="})),
    parse_prefix_regex(/^\s+/, (s,r) => ({range:r, kind:" "})),
    parse_prefix_regex(/^[a-zA-Z_][a-zA-Z0-9_]*/, (s,r) => ({range:r,  kind:"id", v:s }))
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



let proprity_operators_table =
  Immutable.Map<string, number>()
  .set(".", 11)
  .set("*", 10)
  .set("/", 10)
  .set("%", 10)
  .set("+", 7)
  .set("-", 7)
  .set(">", 6)
  .set("<", 6)
  .set("<=", 6)
  .set(">=", 6)
  .set("==", 5)
  .set("!=", 5)
  .set("not", 4)
  .set("xor", 4)
  .set("&&", 4)
  .set("||", 4)

export interface DebuggerAST { kind: "dbg" }
export interface TCDebuggerAST { kind: "tc-dbg" }
export interface UnitAST { kind: "unit" }
export interface StringAST { kind: "string", value:string }
export interface BoolAST { kind: "bool", value: boolean }
export interface IntAST { kind: "int", value: number }
export interface IdAST { kind: "id", value: string }
export interface WhileAST { kind: "while", c:ParserRes, b:ParserRes }
export interface IfAST { kind: "if", c:ParserRes, t:ParserRes, e:Option<ParserRes> }
export interface DeclAST { kind: "decl", l:ParserRes, r:{value:string, range:SourceRange} }
export interface AssignAST { kind: "=", l:ParserRes, r:ParserRes }
export interface FieldRefAST { kind: ".", l:ParserRes, r:ParserRes }
export interface SemicolonAST { kind: ";", l:ParserRes, r:ParserRes }
export interface ReturnAST { kind: "return", value:ParserRes }
export interface ArgsAST { kind: "args", value:Immutable.List<DeclAST> }
export interface ClassAST { kind: "class", C_name:string, fields:Immutable.List<DeclAST>, methods:Immutable.List<FunctionDeclarationAST>, constructors:Immutable.List<ConstructorDeclarationAST> }

export interface BinOpAST { kind: BinOpKind, l:ParserRes, r:ParserRes }
export interface UnaryOpAST { kind: UnaryOpKind, e:ParserRes }
export interface MkEmptyRenderGrid { kind: "mk-empty-render-grid", w:ParserRes, h:ParserRes }
export interface MkRenderGridPixel { kind: "mk-render-grid-pixel", w:ParserRes, h:ParserRes, status:ParserRes }
export interface ConstructorDeclarationAST { kind:"cons_decl", name:string, arg_decls:Immutable.List<DeclAST>, body:ParserRes }
export interface FunctionDeclarationAST { kind:"func_decl", name:string, return_type:ParserRes, arg_decls:Immutable.List<DeclAST>, body:ParserRes }
export interface FunctionCallAST { kind:"func_call", name:ParserRes, actuals:Array<ParserRes> }
export interface ConstructorCallAST { kind:"cons_call", name:string, actuals:Array<ParserRes> }
export interface MethodCallAST {kind:"method_call", object:ParserRes, name:ParserRes, actuals:Array<ParserRes> }

export type AST = UnitAST | StringAST | IntAST | BoolAST | IdAST | FieldRefAST
                | AssignAST | DeclAST | IfAST | WhileAST | SemicolonAST | ReturnAST | ArgsAST
                | BinOpAST | UnaryOpAST | FunctionDeclarationAST | FunctionCallAST
                | ClassAST | ConstructorCallAST | MethodCallAST
                | DebuggerAST | TCDebuggerAST
                | MkEmptyRenderGrid | MkRenderGridPixel
export interface ParserRes { range:SourceRange, ast:AST }

let mk_string = (v:string, sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "string", value:v }})
let mk_unit = (sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "unit" }})
let mk_bool = (v:boolean, sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "bool", value:v }})
let mk_int = (v:number, sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "int", value:v }})
let mk_identifier = (v:string, sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "id", value:v }})
let mk_return = (e:ParserRes) : ParserRes => ({ range:e.range, ast:{ kind: "return", value:e }})
let mk_args = (sr:SourceRange,ds:Array<DeclAST>) : ParserRes => ({ range:sr, ast:{ kind: "args", value:Immutable.List<DeclAST>(ds) }})
let mk_decl = (l:ParserRes,r:string, r_range:SourceRange) : DeclAST => ({ kind: "decl", l:l, r:{value:r, range:r_range} })
let mk_assign = (l:ParserRes,r:ParserRes) : ParserRes => ({ range:join_source_ranges(l.range, r.range), ast:{ kind: "=", l:l, r:r }})
let mk_while = (c:ParserRes,b:ParserRes) : ParserRes => ({ range:join_source_ranges(c.range, b.range), ast:{ kind: "while", c:c, b:b }})
let mk_if_then = (c:ParserRes,t:ParserRes) : ParserRes => ({ range:join_source_ranges(c.range, t.range), ast:{ kind: "if", c:c, t:t, e:apply(none<ParserRes>(), {}) }})
let mk_if_then_else = (c:ParserRes,t:ParserRes,e:ParserRes) : ParserRes => ({ range:join_source_ranges(c.range, t.range), ast:{ kind: "if", c:c, t:t, e:apply(some<ParserRes>(), e) }})
let mk_field_ref = (l:ParserRes,r:ParserRes) : ParserRes => ({ range:join_source_ranges(l.range, r.range), ast:{ kind: ".", l:l, r:r }})
let mk_semicolon = (l:ParserRes,r:ParserRes) : ParserRes => ({ range:join_source_ranges(l.range, r.range), ast:{ kind: ";", l:l, r:r }})


let mk_bin_op = (k:BinOpKind) => (l:ParserRes,r:ParserRes) : ParserRes => ({ range:join_source_ranges(l.range, r.range), ast:{ kind: k, l:l, r:r }})
let mk_plus = mk_bin_op("+")
let mk_minus = mk_bin_op("-")
let mk_times = mk_bin_op("*")
let mk_div = mk_bin_op("/")
let mk_mod = mk_bin_op("%")
let mk_lt = mk_bin_op("<")
let mk_gt = mk_bin_op(">")
let mk_leq = mk_bin_op("<=")
let mk_geq = mk_bin_op(">=")
let mk_eq = mk_bin_op("==")
let mk_neq = mk_bin_op("!=")
let mk_and = mk_bin_op("&&")
let mk_or = mk_bin_op("||")
let mk_xor = mk_bin_op("xor")

let mk_unary_op = (k:UnaryOpKind) => (e:ParserRes) : ParserRes => ({ range:e.range, ast:{ kind: k, e:e }})
let mk_not = mk_unary_op("not")

let mk_call = (f_name:ParserRes, actuals:Array<ParserRes>) : ParserRes =>
  ({  range: f_name.range,
      ast: {kind:"func_call", name:f_name, actuals:actuals} })

let mk_method_call = (obj:ParserRes, f_name:ParserRes, actuals:Array<ParserRes>) : ParserRes =>
  ({  range: join_source_ranges(obj.range, f_name.range),
      ast: {kind:"method_call", object:obj, name:f_name, actuals:actuals} })

let mk_constructor_call = (new_range:SourceRange, C_name:string, actuals:Array<ParserRes>) : ParserRes =>
  ({ range:new_range, ast:{ kind:"cons_call", name:C_name, actuals:actuals } })

let mk_constructor_declaration = (function_name:string, arg_decls:Immutable.List<DeclAST>, body:ParserRes) : ConstructorDeclarationAST =>
  ({kind:"cons_decl", name:function_name, arg_decls:arg_decls, body:body})

let mk_function_declaration = (return_type:ParserRes, function_name:string, arg_decls:Immutable.List<DeclAST>, body:ParserRes) : FunctionDeclarationAST =>
  ({kind:"func_decl", name:function_name, return_type:return_type, arg_decls:arg_decls, body:body})

let mk_class_declaration = (C_name:string, fields:Immutable.List<DeclAST>, methods:Immutable.List<FunctionDeclarationAST>, constructors:Immutable.List<ConstructorDeclarationAST>, range:SourceRange) : ParserRes =>
  ({  range: range,
      ast: {kind:"class", C_name:C_name, fields:fields, methods:methods, constructors:constructors } })

let mk_dbg = (sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "dbg" }})
let mk_tc_dbg = (sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "tc-dbg" }})
let mk_empty_render_grid = (w:ParserRes, h:ParserRes) : ParserRes => ({ range:join_source_ranges(w.range, h.range), ast:{ kind: "mk-empty-render-grid", w:w, h:h }})
let mk_render_grid_pixel = (w:ParserRes, h:ParserRes, status:ParserRes) : ParserRes => ({ range:join_source_ranges(w.range, join_source_ranges(h.range, status.range)), ast:{ kind: "mk-render-grid-pixel", w:w, h:h, status:status }})


export interface ParserError { priority:number, message:string, range:SourceRange }
export interface ParserState { tokens:Immutable.List<Token>, branch_priority:number }
export type Parser = Coroutine<ParserState, ParserError, ParserRes>

export let mk_parser_state = (tokens:Immutable.List<Token>) => ({ tokens:tokens, branch_priority:0 })
let no_match : Coroutine<ParserState,ParserError,Unit> = co_get_state<ParserState,ParserError>().then(s => co_set_state<ParserState,ParserError>({...s, branch_priority:0}))
let partial_match : Coroutine<ParserState,ParserError,Unit> = co_get_state<ParserState,ParserError>().then(s => co_set_state<ParserState,ParserError>({...s, branch_priority:50}))
let full_match : Coroutine<ParserState,ParserError,Unit> = co_get_state<ParserState,ParserError>().then(s => co_set_state<ParserState,ParserError>({...s, branch_priority:100}))

let mk_empty_render_grid_sign: Coroutine<ParserState,ParserError,Unit> = co_get_state<ParserState, ParserError>().then(s => {
  if (s.tokens.isEmpty())
    return co_error({ range:mk_range(-1,0,0,0), priority:s.branch_priority, message:"found empty state, expected empty_render_grid" })
  let i = s.tokens.first()
  if (i.kind == "mk_empty_render_grid") {
    return co_set_state<ParserState, ParserError>({...s, tokens: s.tokens.rest().toList() }).then(_ => co_unit({}))
  }
  else return co_error({ range:i.range, priority:s.branch_priority, message:"expected empty_render_grid" })
})

let mk_render_grid_pixel_sign: Coroutine<ParserState,ParserError,Unit> = co_get_state<ParserState, ParserError>().then(s => {
  if (s.tokens.isEmpty())
    return co_error({ range:mk_range(-1,0,0,0), priority:s.branch_priority, message:"found empty state, expected pixel" })
  let i = s.tokens.first()
  if (i.kind == "pixel") {
    return co_set_state<ParserState, ParserError>({...s, tokens: s.tokens.rest().toList() }).then(_ => co_unit({}))
  }
  else return co_error({ range:i.range, priority:s.branch_priority, message:"expected pixel" })
})

let newline_sign: Coroutine<ParserState,ParserError,Unit> = co_get_state<ParserState, ParserError>().then(s => {
  if (s.tokens.isEmpty())
    return co_error({ range:mk_range(-1,0,0,0), priority:s.branch_priority, message:"found empty state, expected newline" })
  let i = s.tokens.first()
  if (i.kind == "nl") {
    return co_set_state<ParserState, ParserError>({...s, tokens: s.tokens.rest().toList() }).then(_ => co_unit({}))
  }
  else return co_error({ range:i.range, priority:s.branch_priority, message:"expected newline" })
})

let whitespace_sign: Coroutine<ParserState,ParserError,Unit> = co_get_state<ParserState, ParserError>().then(s => {
  if (s.tokens.isEmpty())
    return co_error({ range:mk_range(-1,0,0,0), priority:s.branch_priority, message:"found empty state, expected whitespace" })
  let i = s.tokens.first()
  if (i.kind == " ") {
    return co_set_state<ParserState, ParserError>({...s, tokens: s.tokens.rest().toList() }).then(_ => co_unit({}))
  }
  else return co_error({ range:i.range, priority:s.branch_priority, message:"expected whitespace" })
})

let merge_errors = (e1:ParserError, e2:ParserError) => {
  let res = e1.priority > e2.priority ? e1 :
  e2.priority > e1.priority ? e2 :
  ({ priority:Math.max(e1.priority, e2.priority), message:`${e1.message} or ${e2.message}`, range:join_source_ranges(e1.range, e2.range) })
  // let show = [{p:e1.priority, m:e1.message},{p:e2.priority, m:e2.message},{p:res.priority, m:res.message}]
  // if (res.priority > 50) console.log("merging errors", JSON.stringify(show))
  return res
}

let parser_or = <a>(p:Coroutine<ParserState,ParserError,a>, q:Coroutine<ParserState,ParserError,a>) : Coroutine<ParserState,ParserError,a> =>
  co_catch<ParserState,ParserError,a>(merge_errors)(p)(q)

let whitespace = () =>
  co_repeat(parser_or<Unit>(newline_sign, whitespace_sign)).then(_ => co_unit({}))

let ignore_whitespace = function<a>(p:Coroutine<ParserState,ParserError,a>) : Coroutine<ParserState,ParserError,a> { return whitespace().then(_ => p.then(p_res => whitespace().then(_ => co_unit(p_res)))) }

let symbol = (token_kind:string, token_name:string) : Coroutine<ParserState,ParserError,SourceRange> => ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.tokens.isEmpty())
    return co_error({ range:mk_range(-1,0,0,0), priority:s.branch_priority, message:`found empty state, expected ${token_name}` })
  let i = s.tokens.first()
  if (i.kind == token_kind) {
    return co_set_state<ParserState, ParserError>({...s, tokens: s.tokens.rest().toList() }).then(_ => co_unit(i.range))
  }
  else {
    // if (token_kind == ";") console.log(`Failed ; lookup on ${s.branch_priority}`)
    return co_error({ range:i.range, priority:s.branch_priority, message:`expected '${token_name}', found '${i.kind}'` })
  }
}))

let binop_sign: (_:BinOpKind) => Coroutine<ParserState,ParserError,Unit> = k => ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.tokens.isEmpty())
    return co_error({ range:mk_range(-1,0,0,0), priority:s.branch_priority, message:`found empty state, expected ${k}` })
  let i = s.tokens.first()
  if (i.kind == k) {
    return co_set_state<ParserState, ParserError>({...s, tokens: s.tokens.rest().toList() }).then(_ => co_unit({}))
  }
  else return co_error({ range:i.range, priority:s.branch_priority, message:`expected '${k}'` })
}))

let unaryop_sign: (_:UnaryOpKind) => Coroutine<ParserState,ParserError,Unit> = k => ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.tokens.isEmpty())
    return co_error({ range:mk_range(-1,0,0,0), priority:s.branch_priority, message:`found empty state, expected ${k}` })
  let i = s.tokens.first()
  if (i.kind == k) {
    return co_set_state<ParserState, ParserError>({...s, tokens: s.tokens.rest().toList() }).then(_ => co_unit({}))
  }
  else return co_error({ range:i.range, priority:s.branch_priority, message:`expected '${k}'` })
}))


let dbg: Parser = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.tokens.isEmpty())
    return co_error({ range:mk_range(-1,0,0,0), priority:s.branch_priority, message:"found empty state, expected identifier" })
  let i = s.tokens.first()
  if (i.kind == "dbg") {
    let res = mk_dbg(i.range)
    return co_set_state<ParserState, ParserError>({...s, tokens: s.tokens.rest().toList() }).then(_ => co_unit(res))
  }
  else return co_error({ range:i.range, priority:s.branch_priority, message:`expected debugger but found ${i.kind}` })
}))

let tc_dbg: Parser = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.tokens.isEmpty())
    return co_error({ range:mk_range(-1,0,0,0), priority:s.branch_priority, message:"found empty state, expected identifier" })
  let i = s.tokens.first()
  if (i.kind == "tc-dbg") {
    let res = mk_tc_dbg(i.range)
    return co_set_state<ParserState, ParserError>({...s, tokens: s.tokens.rest().toList() }).then(_ => co_unit(res))
  }
  else return co_error({ range:i.range, priority:s.branch_priority, message:`expected typecheker debugger but found ${i.kind}` })
}))

let string: Parser = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.tokens.isEmpty())
    return co_error({ range:mk_range(-1,0,0,0), priority:s.branch_priority, message:`found empty state, expected number` })
  let i = s.tokens.first()
  if (i.kind == "string") {
    let res = mk_string(i.v, i.range)
    return co_set_state<ParserState, ParserError>({...s, tokens: s.tokens.rest().toList() }).then(_ => co_unit(res))
  }
  else return co_error({ range:i.range, priority:s.branch_priority, message:`expected int` })
}))

let bool: Parser = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.tokens.isEmpty())
    return co_error({ range:mk_range(-1,0,0,0), priority:s.branch_priority, message:"found empty state, expected boolean" })
  let i = s.tokens.first()
  if (i.kind == "bool") {
    let res = mk_bool(i.v, i.range)
    return co_set_state<ParserState, ParserError>({...s, tokens: s.tokens.rest().toList() }).then(_ => co_unit(res))
  }
  else return co_error({ range:i.range, priority:s.branch_priority, message:"expected boolean" })
}))

let int: Parser = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.tokens.isEmpty())
    return co_error({ range:mk_range(-1,0,0,0), priority:s.branch_priority, message:"found empty state, expected number" })
  let i = s.tokens.first()
  if (i.kind == "int") {
    let res = mk_int(i.v, i.range)
    return co_set_state<ParserState, ParserError>({...s, tokens: s.tokens.rest().toList() }).then(_ => co_unit(res))
  }
  else return co_error({ range:i.range, priority:s.branch_priority, message:"expected int" })
}))

let identifier_token: Coroutine<ParserState, ParserError, {id:string, range:SourceRange}> = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.tokens.isEmpty())
    return co_error({ range:mk_range(-1,0,0,0), priority:s.branch_priority, message:"found empty state, expected identifier" })
  let i = s.tokens.first()
  if (i.kind == "id") {
    let res = i.v
    let range = i.range
    return co_set_state<ParserState, ParserError>({...s, tokens: s.tokens.rest().toList() }).then(_ => co_unit({id:res, range:range}))
  }
  else return co_error({ range:i.range, priority:s.branch_priority, message:`expected identifier but found ${i.kind}` })
}))

let identifier: Parser = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.tokens.isEmpty())
    return co_error({ range:mk_range(-1,0,0,0), priority:s.branch_priority, message:"found empty state, expected identifier" })
  let i = s.tokens.first()
  if (i.kind == "id") {
    let res = mk_identifier(i.v, i.range)
    let range = i.range    
    return co_set_state<ParserState, ParserError>({...s, tokens: s.tokens.rest().toList() }).then(_ => co_unit(res))
  }
  else return co_error({ range:i.range, priority:s.branch_priority, message:`expected identifier but found ${i.kind}` })
}))

let return_sign = symbol("return", "return")

let while_keyword = symbol("while", "while")

let if_keyword = symbol("if", "if")

let else_keyword = symbol("else", "else")

let equal_sign = symbol("=", "=")

let semicolon_sign = symbol(";", "semicolon")

let comma_sign = symbol(",", "comma")

let class_keyword = symbol("class", "class")

let new_keyword = symbol("new", "new")

let left_bracket = symbol("(", "(")
let right_bracket = symbol(")", ")")

let left_square_bracket = symbol("[", "[")
let right_square_bracket = symbol("]", "]")

let left_curly_bracket = symbol("{", "{")
let right_curly_bracket = symbol("}", "}")

let dot_sign = symbol(".", ".")

let plus_op = binop_sign("+")
let minus_op = binop_sign("-")
let times_op = binop_sign("*")
let div_op = binop_sign("/")
let mod_op = binop_sign("%")

let lt_op = binop_sign("<")
let gt_op = binop_sign(">")
let leq_op = binop_sign("<=")
let geq_op = binop_sign(">=")
let eq_op = binop_sign("==")
let neq_op = binop_sign("!=")
let and_op = binop_sign("&&")
let or_op = binop_sign("||")
let xor_op = binop_sign("xor")

let not_op = unaryop_sign("not")

let eof: Coroutine<ParserState,ParserError,SourceRange> = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.tokens.isEmpty())
    return co_unit(zero_range)
  return co_error({ range:s.tokens.first().range, message:`expected eof, found ${s.tokens.first().kind}`, priority:s.branch_priority })
}))

let field_ref_elements = (identifiers:Immutable.List<ParserRes>) : Coroutine<ParserState,ParserError,Immutable.List<ParserRes>> =>
  parser_or<Immutable.List<ParserRes>>(identifier.then(l =>
  dot_sign.then(_ =>
  field_ref_elements(identifiers.push(l)))),
  co_unit(identifiers))

let field_ref:  () => Parser = () => identifier.then(first =>
  dot_sign.then(_ =>
  field_ref_elements(Immutable.List<ParserRes>([first])).then(identifiers =>
  identifier.then(last => co_unit(identifiers.push(last).toArray().reduce((l,r) => mk_field_ref(l,r)))))))

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


let term : () => Parser = () : Parser =>
  parser_or<ParserRes>(mk_empty_render_grid_prs(),
  parser_or<ParserRes>(render_grid_pixel_prs(),
  parser_or<ParserRes>(bool,
  parser_or<ParserRes>(int,
  parser_or<ParserRes>(string,
  parser_or<ParserRes>(call(),
  parser_or<ParserRes>(method_call(),
  parser_or<ParserRes>(field_ref(),
  parser_or<ParserRes>(identifier,
  parser_or<ParserRes>(unary_expr(),
  left_bracket.then(_ =>
  expr().then(e =>
  right_bracket.then(_ =>
  co_unit(e)))
  )))))))))))

let unary_expr : () => Parser = () =>
  not_op.then(_ =>
  expr().then(e =>
  co_unit<ParserState,ParserError,ParserRes>(mk_not(e))))

let method_ref: () => Coroutine<ParserState,ParserError,{ object:ParserRes, method:ParserRes }> = () => identifier.then(first =>
  dot_sign.then(_ =>
  field_ref_elements(Immutable.List<ParserRes>([first])).then(identifiers =>
  identifier.then(last => co_unit(
    { object:identifiers.toArray().reduce((l,r) => mk_field_ref(l,r)),
      method:last }
    )))))

let method_call : () => Parser = () =>
  no_match.then(_ =>
  method_ref().then(({ object:obj, method:f_name }) =>
  left_bracket.then(_ =>
  partial_match.then(_ =>
  actuals().then((actuals:Array<ParserRes>) =>
  right_bracket.then(_ =>
  full_match.then(_ =>
  co_unit<ParserState,ParserError,ParserRes>(mk_method_call(obj, f_name, actuals)))))))))

let call : () => Parser = () =>
  no_match.then(_ =>
  identifier.then(f_name =>
  left_bracket.then(_ =>
  partial_match.then(_ =>
  actuals().then((actuals:Array<ParserRes>) =>
  right_bracket.then(_ =>
  full_match.then(_ =>
  co_unit<ParserState,ParserError,ParserRes>(mk_call(f_name, actuals)))))))))


let empty_table = {symbols:Immutable.Stack<ParserRes>(),
                   ops:Immutable.Stack<Prod<string, (l:ParserRes, r:ParserRes)=>ParserRes>>()}
let reduce_table = (table:{symbols:Immutable.Stack<ParserRes>,
                     ops:Immutable.Stack<Prod<string, (l:ParserRes, r:ParserRes)=>ParserRes>>}) : ParserRes => {

  let res = reduce_table_2(table.symbols,table.ops, true)
  return res.new_top
}


let reduce_table_2 = (symbols:Immutable.Stack<ParserRes>,
                ops:Immutable.Stack<Prod<string, (l:ParserRes, r:ParserRes)=>ParserRes>>, reduce_to_end:boolean) :
                {new_top: ParserRes, symbols:Immutable.Stack<ParserRes>, ops:Immutable.Stack<Prod<string, (l:ParserRes, r:ParserRes)=>ParserRes>>} => {
  if(reduce_to_end && symbols.count() == 1 && ops.count() == 0)
    return {new_top: symbols.peek(), symbols:symbols.pop(), ops:ops}

  let snd = symbols.peek()
  let fst = symbols.pop().peek()
  symbols = symbols.pop().pop()
  let op = ops.peek()
  let new_top = op.snd(fst, snd)

  if(reduce_to_end)
    return reduce_table_2(symbols.push(new_top), ops.pop(), reduce_to_end)
  return {new_top: new_top, symbols:symbols.push(new_top), ops:ops.pop()}
}

let expr_after_op = (symbols:Immutable.Stack<ParserRes>,
                         ops:Immutable.Stack<Prod<string, (l:ParserRes, r:ParserRes)=>ParserRes>>,
                         current_op:string,
                         compose_current:(l:ParserRes, r:ParserRes)=>ParserRes) : Coroutine<ParserState, ParserError, { symbols:Immutable.Stack<ParserRes>,
                                                                                                                        ops:Immutable.Stack<Prod<string, (l:ParserRes, r:ParserRes)=>ParserRes>>}> =>
    {
      if(ops.count() >= 1 &&
         symbols.count() >= 2 && proprity_operators_table.get(ops.peek().fst) >= proprity_operators_table.get(current_op)){
        let res = reduce_table_2(symbols, ops, false)
        return expr_after_op(res.symbols, res.ops, current_op, compose_current)
      }
      return expr_AUX({symbols:symbols, ops: ops.push({fst:current_op,snd:compose_current})})
    }

type SymTable = {symbols:Immutable.Stack<ParserRes>,
                 ops:Immutable.Stack<Prod<string, (l:ParserRes, r:ParserRes)=>ParserRes>>}

let expr_AUX = (table: {symbols:Immutable.Stack<ParserRes>,
  ops:Immutable.Stack<Prod<string, (l:ParserRes, r:ParserRes)=>ParserRes>>}) : Coroutine<ParserState, ParserError, SymTable> =>
  term().then(l =>
    parser_or<SymTable>(plus_op.then(_ => expr_after_op(table.symbols.push(l), table.ops, "+", (l,r)=> mk_plus(l,r))),
    parser_or<SymTable>(minus_op.then(_ => expr_after_op(table.symbols.push(l), table.ops, "-", (l,r)=> mk_minus(l,r))),
    parser_or<SymTable>(times_op.then(_ => expr_after_op(table.symbols.push(l), table.ops, "*", (l,r)=> mk_times(l,r))),
    parser_or<SymTable>(div_op.then(_ => expr_after_op(table.symbols.push(l), table.ops, "/", (l,r)=> mk_div(l,r))),
    parser_or<SymTable>(mod_op.then(_ => expr_after_op(table.symbols.push(l), table.ops, "%", (l,r)=> mk_mod(l,r))),
    parser_or<SymTable>(lt_op.then(_ => expr_after_op(table.symbols.push(l), table.ops, "<", (l,r)=> mk_lt(l,r))),
    parser_or<SymTable>(gt_op.then(_ => expr_after_op(table.symbols.push(l), table.ops, ">", (l,r)=> mk_gt(l,r))),
    parser_or<SymTable>(leq_op.then(_ => expr_after_op(table.symbols.push(l), table.ops, "<=", (l,r)=> mk_leq(l,r))),
    parser_or<SymTable>(geq_op.then(_ => expr_after_op(table.symbols.push(l), table.ops, ">=", (l,r)=> mk_geq(l,r))),
    parser_or<SymTable>(eq_op.then(_ => expr_after_op(table.symbols.push(l), table.ops, "==", (l,r)=> mk_eq(l,r))),
    parser_or<SymTable>(neq_op.then(_ => expr_after_op(table.symbols.push(l), table.ops, "!=", (l,r)=> mk_neq(l,r))),
    parser_or<SymTable>(and_op.then(_ => expr_after_op(table.symbols.push(l), table.ops, "&&", (l,r)=> mk_and(l,r))),
    parser_or<SymTable>(or_op.then(_ => expr_after_op(table.symbols.push(l), table.ops, "||", (l,r)=> mk_or(l,r))),
    parser_or<SymTable>(xor_op.then(_ => expr_after_op(table.symbols.push(l), table.ops, "xor", (l,r)=> mk_xor(l,r))),
    co_unit({...table, symbols:table.symbols.push(l)})
    )))))))))))))))

let cons_call = () : Coroutine<ParserState, ParserError, ParserRes> =>
    new_keyword.then(new_range =>
    identifier_token.then(class_name =>
    left_bracket.then(_ =>
    actuals().then((actuals:Array<ParserRes>) =>
    right_bracket.then(_ =>
    co_unit(mk_constructor_call(new_range, class_name.id, actuals))
    )))))

let expr = () : Coroutine<ParserState, ParserError, ParserRes> =>
  {
    let res = expr_AUX(empty_table).then(e => co_unit(reduce_table(e)))
    return parser_or<ParserRes>(
      res
    ,
      cons_call()
    )
  }


let semicolon = ignore_whitespace(semicolon_sign)
let comma = ignore_whitespace(comma_sign)
let with_semicolon = <A>(p:Coroutine<ParserState, ParserError, A>) => p.then(p_res => ignore_whitespace(semicolon_sign).then(_ => co_unit(p_res)))

let assign_left : (l:ParserRes) => Parser = (l) =>
  no_match.then(_ =>
  equal_sign.then(_ =>
  partial_match.then(_ =>
  expr().then(r =>
  full_match.then(_ =>
  co_unit(mk_assign(l,r))
  )))))

let assign : () => Parser = () =>
  parser_or<ParserRes>(field_ref(),identifier).then(l =>
  assign_left(l)
  )

let decl_init : () => Coroutine<ParserState,ParserError,ParserRes> = () =>
  no_match.then(_ =>
  identifier.then(l =>
  identifier_token.then(r =>
  partial_match.then(_ =>
  assign_left(mk_identifier(r.id, l.range)).then(a =>
  full_match.then(_ =>
  co_unit(mk_semicolon({ range: l.range, ast:mk_decl(l, r.id, r.range) }, a))))))))

let decl : () => Coroutine<ParserState,ParserError,DeclAST> = () =>
  no_match.then(_ =>
  identifier.then(l =>
  identifier_token.then(r =>
  partial_match.then(_ =>
  co_unit(mk_decl(l, r.id, r.range))))))

let actuals = () : Coroutine<ParserState, ParserError, Array<ParserRes>> =>
  parser_or<Array<ParserRes>>(
    term().then(a =>
    parser_or<Array<ParserRes>>(
      comma.then(_ =>
       actuals().then(as =>
      co_unit([a, ...as]))),
      co_unit([a]))),
    co_unit(Array<ParserRes>()))

let arg_decls = () : Coroutine<ParserState, ParserError, Array<DeclAST>> =>
  parser_or<Array<DeclAST>>(
    decl().then(d =>
    parser_or<Array<DeclAST>>(
      comma.then(_ =>
      arg_decls().then(ds =>
      co_unit([d, ...ds]))),
      co_unit([d]))),
    co_unit(Array<DeclAST>()))

let return_statement : () => Parser = () =>
  no_match.then(_ =>
  return_sign.then(return_range =>
  partial_match.then(_ =>
  parser_or<ParserRes>(
    expr().then(e =>
    co_unit<ParserState,ParserError,ParserRes>(mk_return(e)))
  ,
    co_unit<ParserState,ParserError,ParserRes>(mk_unit(return_range))
  ))))

let if_conditional : (_:() => Parser) => Parser = (stmt:() => Parser) =>
  no_match.then(_ =>
  if_keyword.then(_ =>
  partial_match.then(_ =>
  expr().then(c =>
  stmt().then(t =>
  parser_or<ParserRes>(
    else_keyword.then(_ =>
    stmt().then(e =>
    full_match.then(_ =>
    co_unit(mk_if_then_else(c, t, e))))),
    co_unit(mk_if_then(c, t))))))))

let while_loop : (_:() => Parser) => Parser = (stmt:() => Parser) =>
  no_match.then(_ =>
  while_keyword.then(_ =>
  partial_match.then(_ =>
  expr().then(c =>
  stmt().then(b =>
  full_match.then(_ =>
  co_unit(mk_while(c, b))))))))

let bracketized_statement = () =>
  no_match.then(_ =>
  left_curly_bracket.then(_ =>
  partial_match.then(_ =>
  function_statements(co_lookup(right_curly_bracket).then(_ => co_unit({}))).then(s =>
  right_curly_bracket.then(_ =>
  full_match.then(_ =>
  co_unit(s)))))))

let constructor_declaration = () =>
  no_match.then(_ =>
  identifier_token.then(function_name =>
  left_bracket.then(_ =>
  partial_match.then(_ =>
  arg_decls().then(arg_decls =>
  right_bracket.then(_ =>
  left_curly_bracket.then(_ =>
  function_statements(co_lookup(right_curly_bracket).then(_ => co_unit({}))).then(body =>
  right_curly_bracket.then(_ =>
  full_match.then(_ =>
  co_unit(mk_constructor_declaration(function_name.id,
                                  Immutable.List<DeclAST>(arg_decls),
                                  body))))))))))))

let function_declaration = () =>
  no_match.then(_ =>
  identifier.then(return_type =>
  identifier_token.then(function_name =>
  left_bracket.then(_ =>
  partial_match.then(_ =>
  arg_decls().then(arg_decls =>
  right_bracket.then(_ =>
  left_curly_bracket.then(_ =>
  function_statements(co_lookup(right_curly_bracket).then(_ => co_unit({}))).then(body =>
  right_curly_bracket.then(_ =>
  full_match.then(_ =>
  co_unit(mk_function_declaration(return_type,
                                  function_name.id,
                                  Immutable.List<DeclAST>(arg_decls),
                                  body)))))))))))))

let class_declaration = () =>
  no_match.then(_ =>
  class_keyword.then(initial_range =>
  partial_match.then(_ =>
  identifier_token.then(class_name =>
  left_curly_bracket.then(_ =>
  class_statements().then(declarations =>
  right_curly_bracket.then(closing_curly_range =>
  full_match.then(_ =>
  co_unit(
    mk_class_declaration(
      class_name.id,
      declarations.fst,
      declarations.snd.fst,
      declarations.snd.snd,
      join_source_ranges(initial_range, closing_curly_range))
  )))))))))

let outer_statement : () => Parser = () =>
  parser_or<ParserRes>(
    function_declaration().then(fun_decl =>
    co_unit<ParserState,ParserError,ParserRes>({ range: join_source_ranges(fun_decl.return_type.range, fun_decl.body.range), ast:fun_decl })),
  parser_or<ParserRes>(class_declaration(),
  inner_statement()))

let inner_statement : () => Parser = () =>
  parser_or<ParserRes>(bracketized_statement(),
  parser_or<ParserRes>(while_loop(function_statement),
  parser_or<ParserRes>(if_conditional(function_statement),
  parser_or<ParserRes>(with_semicolon(call()),
  parser_or<ParserRes>(with_semicolon(method_call()),
  parser_or<ParserRes>(with_semicolon(decl().then(d =>
    co_unit<ParserState,ParserError,ParserRes>({ range:d.l.range, ast:d }))),
  parser_or<ParserRes>(with_semicolon(decl_init()),
  parser_or<ParserRes>(with_semicolon(assign()),
  parser_or<ParserRes>(with_semicolon(no_match.then(_ => dbg)),
  with_semicolon(no_match.then(_ => tc_dbg))
  )))))))))

let function_statement : () => Parser = () =>
  parser_or<ParserRes>(with_semicolon(return_statement()),inner_statement())

let generic_statements = (stmt: () => Parser, check_trailer: Coroutine<ParserState,ParserError,Unit>) : Parser =>
    stmt().then(l =>
    parser_or<ParserRes>(
      generic_statements(stmt, check_trailer).then(r =>
      co_unit(mk_semicolon(l, r))),
      check_trailer.then(_ =>
      co_unit(l)))
    )

let function_statements = (check_trailer: Coroutine<ParserState,ParserError,Unit>) : Parser =>
  generic_statements (function_statement, check_trailer)
let inner_statements = (check_trailer: Coroutine<ParserState,ParserError,Unit>) : Parser => generic_statements (() => inner_statement(), check_trailer)
let outer_statements = (check_trailer: Coroutine<ParserState,ParserError,Unit>) : Parser => generic_statements (outer_statement, check_trailer)

let class_statements : () => Coroutine<ParserState, ParserError, Prod<Immutable.List<DeclAST>, Prod<Immutable.List<FunctionDeclarationAST>, Immutable.List<ConstructorDeclarationAST>>>> = () =>
  parser_or<Prod<Immutable.List<DeclAST>, Prod<Immutable.List<FunctionDeclarationAST>, Immutable.List<ConstructorDeclarationAST>>>>(
    parser_or<Sum<DeclAST, Sum<FunctionDeclarationAST, ConstructorDeclarationAST>>>(
      with_semicolon(decl().then(d =>
      co_unit<ParserState, ParserError, Sum<DeclAST, Sum<FunctionDeclarationAST, ConstructorDeclarationAST>>>(apply(inl<DeclAST, Sum<FunctionDeclarationAST, ConstructorDeclarationAST>>(), d))))
    ,
      parser_or<Sum<DeclAST, Sum<FunctionDeclarationAST, ConstructorDeclarationAST>>>(
        function_declaration().then(d =>
          co_unit<ParserState, ParserError, Sum<DeclAST, Sum<FunctionDeclarationAST, ConstructorDeclarationAST>>>(
            apply(inr<DeclAST, Sum<FunctionDeclarationAST, ConstructorDeclarationAST>>().after(inl<FunctionDeclarationAST, ConstructorDeclarationAST>()), d)))
      ,
        constructor_declaration().then(d =>
          co_unit<ParserState, ParserError, Sum<DeclAST, Sum<FunctionDeclarationAST, ConstructorDeclarationAST>>>(
            apply(inr<DeclAST, Sum<FunctionDeclarationAST, ConstructorDeclarationAST>>().after(inr<FunctionDeclarationAST, ConstructorDeclarationAST>()), d)))
      )
    ).then(decl =>
    class_statements().then(decls =>
      co_unit<ParserState, ParserError, Prod<Immutable.List<DeclAST>, Prod<Immutable.List<FunctionDeclarationAST>, Immutable.List<ConstructorDeclarationAST>>>>({
        fst:decl.kind == "left" ? decls.fst.push(decl.value) : decls.fst,
        snd:decl.kind == "right" ?
              decl.value.kind == "left" ?
                {...decls.snd, fst:decls.snd.fst.push(decl.value.value)}
              :
                {...decls.snd, snd:decls.snd.snd.push(decl.value.value)}
            : decls.snd })
  )),
    co_lookup(right_curly_bracket).then(_ =>
    co_unit<ParserState, ParserError, Prod<Immutable.List<DeclAST>, Prod<Immutable.List<FunctionDeclarationAST>, Immutable.List<ConstructorDeclarationAST>>>>({
      fst:Immutable.List<DeclAST>(),
      snd:{
        fst:Immutable.List<FunctionDeclarationAST>(),
        snd:Immutable.List<ConstructorDeclarationAST>() }
      })))

export let program_prs : () => Parser = () =>
  outer_statements(co_lookup(eof).then(_ => co_unit({}))).then(s =>
  eof.then(_ => co_unit(s)))


let string_to_csharp_type : (_:string) => CSharp.Type = s =>
  s == "int" ? CSharp.int_type
  : s == "bool" ? CSharp.bool_type
  : s == "string" ? CSharp.string_type
  : s == "void" ? CSharp.unit_type
  : s == "RenderGrid" ? CSharp.render_grid_type
  : s == "RenderGridPixel" ? CSharp.render_grid_pixel_type
  : CSharp.ref_type(s)

export let ast_to_type_checker : (_:ParserRes) => CSharp.Stmt = n =>
  n.ast.kind == "int" ? CSharp.int(n.ast.value)
  : n.ast.kind == "string" ? CSharp.str(n.ast.value)
  : n.ast.kind == "bool" ? CSharp.bool(n.ast.value)
  : n.ast.kind == ";" ? CSharp.semicolon(ast_to_type_checker(n.ast.l), ast_to_type_checker(n.ast.r))
  : n.ast.kind == "while" ? CSharp.while_do(ast_to_type_checker(n.ast.c), ast_to_type_checker(n.ast.b))
  : n.ast.kind == "if" ? CSharp.if_then_else(ast_to_type_checker(n.ast.c), ast_to_type_checker(n.ast.t),
                            n.ast.e.kind == "right" ? CSharp.done : ast_to_type_checker(n.ast.e.value))
  : n.ast.kind == "+" ? CSharp.plus(ast_to_type_checker(n.ast.l), ast_to_type_checker(n.ast.r))
  : n.ast.kind == "-" ? CSharp.minus(ast_to_type_checker(n.ast.l), ast_to_type_checker(n.ast.r))
  : n.ast.kind == "*" ? CSharp.times(ast_to_type_checker(n.ast.l), ast_to_type_checker(n.ast.r), n.range)
  : n.ast.kind == "/" ? CSharp.div(ast_to_type_checker(n.ast.l), ast_to_type_checker(n.ast.r))
  : n.ast.kind == "%" ? CSharp.mod(ast_to_type_checker(n.ast.l), ast_to_type_checker(n.ast.r))
  : n.ast.kind == "<" ? CSharp.lt(ast_to_type_checker(n.ast.l), ast_to_type_checker(n.ast.r))
  : n.ast.kind == ">" ? CSharp.gt(ast_to_type_checker(n.ast.l), ast_to_type_checker(n.ast.r))
  : n.ast.kind == "<=" ? CSharp.leq(ast_to_type_checker(n.ast.l), ast_to_type_checker(n.ast.r))
  : n.ast.kind == ">=" ? CSharp.geq(ast_to_type_checker(n.ast.l), ast_to_type_checker(n.ast.r))
  : n.ast.kind == "==" ? CSharp.eq(ast_to_type_checker(n.ast.l), ast_to_type_checker(n.ast.r))
  : n.ast.kind == "!=" ? CSharp.neq(ast_to_type_checker(n.ast.l), ast_to_type_checker(n.ast.r))
  : n.ast.kind == "xor" ? CSharp.xor(ast_to_type_checker(n.ast.l), ast_to_type_checker(n.ast.r))
  : n.ast.kind == "not" ? CSharp.not(ast_to_type_checker(n.ast.e))
  : n.ast.kind == "&&" ? CSharp.and(ast_to_type_checker(n.ast.l), ast_to_type_checker(n.ast.r))
  : n.ast.kind == "||" ? CSharp.or(ast_to_type_checker(n.ast.l), ast_to_type_checker(n.ast.r))
  : n.ast.kind == "id" ? CSharp.get_v(n.ast.value)
  : n.ast.kind == "return" ? CSharp.ret(ast_to_type_checker(n.ast.value))
  : n.ast.kind == "." && n.ast.r.ast.kind == "id" ? CSharp.field_get(ast_to_type_checker(n.ast.l), n.ast.r.ast.value)
  : n.ast.kind == "=" && n.ast.l.ast.kind == "id" ? CSharp.set_v(n.ast.l.ast.value, ast_to_type_checker(n.ast.r))
  : n.ast.kind == "=" && n.ast.l.ast.kind == "." && n.ast.l.ast.r.ast.kind == "id" ? CSharp.field_set(ast_to_type_checker(n.ast.l.ast.l), n.ast.l.ast.r.ast.value, ast_to_type_checker(n.ast.r))
  : n.ast.kind == "cons_call" ?
    CSharp.call_cons(n.ast.name, n.ast.actuals.map(a => ast_to_type_checker(a)))
  : n.ast.kind == "func_call" &&
    n.ast.name.ast.kind == "id" ?
    CSharp.call_by_name(n.ast.name.ast.value, n.ast.actuals.map(a => ast_to_type_checker(a)))
  : n.ast.kind == "method_call" &&
    n.ast.name.ast.kind == "id" ?
    CSharp.call_method(ast_to_type_checker(n.ast.object), n.ast.name.ast.value, n.ast.actuals.map(a => ast_to_type_checker(a)))
  : n.ast.kind == "func_decl" &&
    n.ast.return_type.ast.kind == "id" ?
    CSharp.def_fun({ name:n.ast.name,
                     return_t:string_to_csharp_type(n.ast.return_type.ast.value),
                     parameters:n.ast.arg_decls.toArray().map(d => ({name:d.r.value, type:string_to_csharp_type((d.l.ast as IdAST).value)})),
                     body:ast_to_type_checker(n.ast.body),
                     range:n.range },
                     [])
  : n.ast.kind == "class" && !n.ast.methods.some(m => !m || m.return_type.ast.kind != "id" || m.arg_decls.some(a => !a || a.l.ast.kind != "id"))
    && !n.ast.fields.some(f => !f || f.l.ast.kind != "id") ?
    CSharp.def_class(n.ast.C_name,
      n.ast.methods.toArray().map(m => ({
          name:m.name,
          return_t:string_to_csharp_type((m.return_type.ast as IdAST).value),
          parameters:m.arg_decls.toArray().map(a => ({ name:a.r.value, type:string_to_csharp_type((a.l.ast as IdAST).value) })),
          body:ast_to_type_checker(m.body),
          range:join_source_ranges(m.return_type.range, m.body.range)
        })).concat(
        n.ast.constructors.toArray().map(c => ({
          name:c.name,
          return_t:CSharp.unit_type,
          parameters:c.arg_decls.toArray().map(a => ({ name:a.r.value, type:string_to_csharp_type((a.l.ast as IdAST).value) })),
          body:ast_to_type_checker(c.body),
          range:c.body.range
        })) ),
      n.ast.fields.toArray().map(f => ({ name:f.r.value, type:string_to_csharp_type((f.l.ast as IdAST).value) }))
    )
  : n.ast.kind == "decl" && n.ast.l.ast.kind == "id" ?
    CSharp.decl_v(n.ast.r.value, string_to_csharp_type(n.ast.l.ast.value))
  : n.ast.kind == "dbg" ?
    CSharp.breakpoint(n.range)(CSharp.done)
  : n.ast.kind == "tc-dbg" ?
    CSharp.typechecker_breakpoint(n.range)(CSharp.done)
  : n.ast.kind == "mk-empty-render-grid" ?
    CSharp.mk_empty_render_grid(ast_to_type_checker(n.ast.w), ast_to_type_checker(n.ast.h))
  : n.ast.kind == "mk-render-grid-pixel" ?
    CSharp.mk_render_grid_pixel(ast_to_type_checker(n.ast.w), ast_to_type_checker(n.ast.h), ast_to_type_checker(n.ast.status))
  : (() => { console.log(`Error: unsupported ast node: ${JSON.stringify(n)}`); throw new Error(`Unsupported ast node: ${JSON.stringify(n)}`)})()

