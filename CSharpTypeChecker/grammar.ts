import * as Immutable from "immutable"
import { Prod, apply, curry, inl, inr, unit, Option, Sum, Unit, Fun, distribute_sum_prod, swap_prod, snd, fst, defun, Coroutine, co_get_state, co_error, co_set_state, co_unit, constant, State, CoCont, CoRet, mk_coroutine, Co, fun, CoPreRes, CoRes } from "ts-bccc"
import * as CCC from "ts-bccc"
import { SourceRange, join_source_ranges, mk_range } from "../source_range";
import * as Lexer from "../lexer";
import { some, none, option_plus, comm_list_coroutine, co_catch, co_repeat, co_run_to_end } from "../ccc_aux"
import * as CSharp from "./csharp"

export type BinOpKind = "+"|"*"|"/"|"-"|"%"|">"|"<"|"<="|">="|"=="|"!="|"&&"|"||" | "xor"
export type UnaryOpKind = "not"

export type Token = ({ kind:"string", v:string } | { kind:"int", v:number } | { kind:"float", v:number } | { kind:"bool", v:boolean }
  | { kind:"while" } | { kind:"if" } | { kind:"then" } | { kind:"else" }
  | { kind:"id", v:string }
  | { kind:"=" } | { kind:BinOpKind } | {kind:UnaryOpKind}
  | { kind:";" } | { kind:"." }
  | { kind:"dbg" } | { kind:"tc-dbg" }
  | { kind:"(" } | { kind:")" }
  | { kind:"{" } | { kind:"}" }
  | { kind:"eof" } | { kind:"nl" }
  | { kind:" " }
  | { kind:"," }
  | { kind:"RenderGrid", v:number } | { kind:"mk_empty_render_grid" } | { kind:"pixel" } | {kind:"return"}
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
  let minus = parse_prefix_regex(/^\-/, (s,r) => ({range:r, kind:"-"}))
  let div = parse_prefix_regex(/^\//, (s,r) => ({range:r, kind:"/"}))
  let mod = parse_prefix_regex(/^%/, (s,r) => ({range:r, kind:"%"}))
  let lt = parse_prefix_regex(/^</, (s,r) => ({range:r, kind:"<"}))
  let gt = parse_prefix_regex(/^>/, (s,r) => ({range:r, kind:">"}))
  let leq = parse_prefix_regex(/^<=/, (s,r) => ({range:r, kind:"<="}))
  let geq = parse_prefix_regex(/^>=/, (s,r) => ({range:r, kind:"<="}))
  let eq = parse_prefix_regex(/^==/, (s,r) => ({range:r, kind:"=="}))
  let neq = parse_prefix_regex(/^!=/, (s,r) => ({range:r, kind:"!="}))
  let and = parse_prefix_regex(/^&&/, (s,r) => ({range:r, kind:"&&"}))
  let xor = parse_prefix_regex(/^\^/, (s,r) => ({range:r, kind:"xor"}))
  let not = parse_prefix_regex(/^!/, (s,r) => ({range:r, kind:"not"}))
  let comma = parse_prefix_regex(/^,/, (s,r) => ({range:r, kind:","}))
  let or = parse_prefix_regex(/^\|\|/, (s,r) => ({range:r, kind:"||"}))
  let ret = parse_prefix_regex(/^return/, (s,r) => ({range:r, kind:"return"}))
  let dot = parse_prefix_regex(/^\./, (s,r) => ({range:r, kind:"."}))
  let lbr = parse_prefix_regex(/^\(/, (s,r) => ({range:r, kind:"("}))
  let rbr = parse_prefix_regex(/^\)/, (s,r) => ({range:r, kind:")"}))
  let lcbr = parse_prefix_regex(/^{/, (s,r) => ({range:r, kind:"{"}))
  let rcbr = parse_prefix_regex(/^}/, (s,r) => ({range:r, kind:"}"}))
  let string = parse_prefix_regex(/^".*"/, (s,r) => ({range:r,  kind:"string", v:s }))
  let int = parse_prefix_regex(/^[0-9]+/, (s,r) => ({range:r,  kind:"int", v:parseInt(s) }))
  let bool = parse_prefix_regex(/^((true)|(false))/, (s,r) => ({range:r,  kind:"bool", v:(s == "true") }))
  let float = parse_prefix_regex(/^[0-9]+.[0-9]+/, (s,r) => ({range:r,  kind:"float", v:parseFloat(s) }))
  let _while = parse_prefix_regex(/^while/, (s,r) => ({range:r, kind:"while"}))
  let _if = parse_prefix_regex(/^if/, (s,r) => ({range:r, kind:"if"}))
  let _eq = parse_prefix_regex(/^=/, (s,r) => ({range:r, kind:"="}))
  let _else = parse_prefix_regex(/^else/, (s,r) => ({range:r, kind:"else"}))
  let identifier = parse_prefix_regex(/^[a-zA-Z][a-zA-Z0-9]*/, (s,r) => ({range:r,  kind:"id", v:s }))

  let fst_err = (x:LexerError,y:LexerError) => x
  let lex_catch = co_catch<LexerState,LexerError,Token>(fst_err)

  let token = lex_catch(semicolon)(
              lex_catch(comma)(
              lex_catch(not)(
              lex_catch(and)(
              lex_catch(or)(
              lex_catch(xor)(
              lex_catch(leq)(
              lex_catch(geq)(
              lex_catch(lt)(
              lex_catch(gt)(
              lex_catch(eq)(
              lex_catch(neq)(
              lex_catch(plus)(
              lex_catch(times)(
              lex_catch(int)(
              lex_catch(minus)(
              lex_catch(div)(
              lex_catch(mod)(
              lex_catch(dot)(
              lex_catch(lbr)(
              lex_catch(rbr)(
              lex_catch(lcbr)(
              lex_catch(rcbr)(
              lex_catch(dbg)(
              lex_catch(dbg_tc)(
              lex_catch(bool)(
              lex_catch(string)(
              lex_catch(float)(
              lex_catch(_while)(
              lex_catch(_if)(
              lex_catch(_eq)(
              lex_catch(_else)(
              lex_catch(int)(
              lex_catch(empty_render_grid)(
              lex_catch(pixel)(
              lex_catch(ret)(
              lex_catch(identifier)(
              whitespace
              )))))))))))))))))))))))))))))))))))))

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



let proprity_operators_table = 
  Immutable.Map<string, number>()
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
export interface StringAST { kind: "string", value:string }
export interface BoolAST { kind: "bool", value: boolean }
export interface IntAST { kind: "int", value: number }
export interface IdAST { kind: "id", value: string }
export interface WhileAST { kind: "while", c:ParserRes, b:ParserRes }
export interface IfAST { kind: "if", c:ParserRes, t:ParserRes, e:Option<ParserRes> }
export interface DeclAST { kind: "decl", l:ParserRes, r:ParserRes }
export interface AssignAST { kind: "=", l:ParserRes, r:ParserRes }
export interface FieldRefAST { kind: ".", l:ParserRes, r:ParserRes }
export interface SemicolonAST { kind: ";", l:ParserRes, r:ParserRes }
export interface ReturnAST { kind: "return", value:ParserRes }
export interface ArgsAST { kind: "args", value:Immutable.List<DeclAST> }

export interface BinOpAST { kind: BinOpKind, l:ParserRes, r:ParserRes }
export interface UnaryOpAST { kind: UnaryOpKind, e:ParserRes }
export interface FunDefAST { kind: "fun", n:IdAST, args:Array<AST>, body:AST }
export interface MkEmptyRenderGrid { kind: "mk-empty-render-grid", w:ParserRes, h:ParserRes }
export interface MkRenderGridPixel { kind: "mk-render-grid-pixel", w:ParserRes, h:ParserRes, status:ParserRes }
export interface FunctionDeclarationAST { kind:"func_decl", name:ParserRes, return_type:ParserRes, arg_decls:ParserRes, body:ParserRes }
export interface FunctionCallAST { kind:"func_call", name:ParserRes, actuals:Array<ParserRes> }

export type AST = StringAST | IntAST | BoolAST | IdAST | FieldRefAST
                | AssignAST | DeclAST | IfAST | WhileAST | SemicolonAST | FunDefAST | ReturnAST | ArgsAST
                | BinOpAST | UnaryOpAST | FunctionDeclarationAST | FunctionCallAST
                | DebuggerAST | TCDebuggerAST
                | MkEmptyRenderGrid | MkRenderGridPixel
export interface ParserRes { range:SourceRange, ast:AST }

let mk_string = (v:string, sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "string", value:v }})
let mk_bool = (v:boolean, sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "bool", value:v }})
let mk_int = (v:number, sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "int", value:v }})
let mk_identifier = (v:string, sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "id", value:v }})
let mk_return = (e:ParserRes) : ParserRes => ({ range:e.range, ast:{ kind: "return", value:e }})
let mk_args = (sr:SourceRange,ds:Array<DeclAST>) : ParserRes => ({ range:sr, ast:{ kind: "args", value:Immutable.List<DeclAST>(ds) }})
let mk_decl = (l:ParserRes,r:ParserRes) : DeclAST => ({ kind: "decl", l:l, r:r })
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

let mk_function_declaration = (return_type:ParserRes, function_name:ParserRes, arg_decls:ParserRes, body:ParserRes) : ParserRes => 
  ({  range: join_source_ranges(return_type.range, body.range), 
      ast: {kind:"func_decl", name:function_name, return_type:return_type, arg_decls:arg_decls, body:body} })


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

let bool: Parser = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected boolean")
  let i = s.first()
  if (i.kind == "bool") {
    let res = mk_bool(i.v, i.range)
    return co_set_state<ParserState, ParserError>(s.rest().toList()).then(_ => co_unit(res))
  }
  else return co_error("expected boolean")
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

let return_sign: Coroutine<ParserState,ParserError,Unit> = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected return")
  let i = s.first()
  if (i.kind == "return") {
    return co_set_state<ParserState, ParserError>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error(`expected return but found ${i.kind} at (${i.range.start.row}, ${i.range.start.column})`)
}))

let while_keyword: Coroutine<ParserState,ParserError,Unit> = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected while")
  let i = s.first()
  if (i.kind == "while") {
    return co_set_state<ParserState, ParserError>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("expected keyword 'while'")
}))

let if_keyword: Coroutine<ParserState,ParserError,Unit> = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected if")
  let i = s.first()
  if (i.kind == "if") {
    return co_set_state<ParserState, ParserError>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("expected keyword 'if'")
}))

let else_keyword: Coroutine<ParserState,ParserError,Unit> = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected else")
  let i = s.first()
  if (i.kind == "else") {
    return co_set_state<ParserState, ParserError>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("expected keyword 'else'")
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

let comma_sign: Coroutine<ParserState,ParserError,Unit> = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected equal")
  let i = s.first()
  if (i.kind == ",") {
    return co_set_state<ParserState, ParserError>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error(`expected ',' at (${i.range.start.to_string()})`)
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

let left_curly_bracket: Coroutine<ParserState,ParserError,Unit> = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected {")
  let i = s.first()
  if (i.kind == "{") {
    return co_set_state<ParserState, ParserError>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("expected '{'")
}))

let right_curly_bracket: Coroutine<ParserState,ParserError,Unit> = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected }")
  let i = s.first()
  if (i.kind == "}") {
    return co_set_state<ParserState, ParserError>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error("expected '}'")
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

let binop_sign: (_:BinOpKind) => Coroutine<ParserState,ParserError,Unit> = k => ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.isEmpty())
    return co_error(`found empty state, expected ${k}`)
  let i = s.first()
  if (i.kind == k) {
    return co_set_state<ParserState, ParserError>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error(`expected '${k}'`)
}))

let unaryop_sign: (_:UnaryOpKind) => Coroutine<ParserState,ParserError,Unit> = k => ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.isEmpty())
    return co_error(`found empty state, expected ${k}`)
  let i = s.first()
  if (i.kind == k) {
    return co_set_state<ParserState, ParserError>(s.rest().toList()).then(_ => co_unit({}))
  }
  else return co_error(`expected '${k}'`)
}))


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

let eof: Coroutine<ParserState,ParserError,Unit> = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.isEmpty())
    return co_unit({})
  return co_error(`expected eof, found ${JSON.stringify(s.first())}`)
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


let term : () => Parser = () : Parser =>
  co_catch<ParserState,ParserError,ParserRes>(both_errors)(mk_empty_render_grid_prs())(
  co_catch<ParserState,ParserError,ParserRes>(both_errors)(render_grid_pixel_prs())(
  co_catch<ParserState,ParserError,ParserRes>(both_errors)(bool)(
  co_catch<ParserState,ParserError,ParserRes>(both_errors)(int)(
  co_catch<ParserState,ParserError,ParserRes>(both_errors)(string)(
  co_catch<ParserState,ParserError,ParserRes>(both_errors)(call())(
  co_catch<ParserState,ParserError,ParserRes>(both_errors)(identifier)(
  co_catch<ParserState,ParserError,ParserRes>(both_errors)(unary_expr())(
  left_bracket.then(_ =>
                                                           expr().then(e =>
                                                           right_bracket.then(_ =>
                                                           co_unit(e)))
                                                          )))))))))

let unary_expr : () => Parser = () =>
  not_op.then(_ =>
    expr().then(e => co_unit<ParserState,ParserError,ParserRes>(mk_not(e))))
    

let call : () => Parser = () => 
  identifier.then(f_name =>
  left_bracket.then(_ =>
  actuals().then((actuals:Array<ParserRes>) =>
  right_bracket.then(_ =>
  co_unit<ParserState,ParserError,ParserRes>(mk_call(f_name, actuals))))))


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
                         compose_current:(l:ParserRes, r:ParserRes)=>ParserRes) : Coroutine<Immutable.List<Token>, string,{symbols:Immutable.Stack<ParserRes>, 
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
  ops:Immutable.Stack<Prod<string, (l:ParserRes, r:ParserRes)=>ParserRes>>}) : Coroutine<Immutable.List<Token>, string, SymTable> =>
  term().then(l =>
    co_catch<ParserState,ParserError,SymTable>(both_errors)(plus_op.then(_ => expr_after_op(table.symbols.push(l), table.ops, "+", (l,r)=> mk_plus(l,r))))(
    co_catch<ParserState,ParserError,SymTable>(both_errors)(minus_op.then(_ => expr_after_op(table.symbols.push(l), table.ops, "-", (l,r)=> mk_minus(l,r))))(
    co_catch<ParserState,ParserError,SymTable>(both_errors)(times_op.then(_ => expr_after_op(table.symbols.push(l), table.ops, "*", (l,r)=> mk_times(l,r))))(
    co_catch<ParserState,ParserError,SymTable>(both_errors)(div_op.then(_ => expr_after_op(table.symbols.push(l), table.ops, "/", (l,r)=> mk_div(l,r))))(
    co_catch<ParserState,ParserError,SymTable>(both_errors)(mod_op.then(_ => expr_after_op(table.symbols.push(l), table.ops, "%", (l,r)=> mk_mod(l,r))))(
    co_catch<ParserState,ParserError,SymTable>(both_errors)(lt_op.then(_ => expr_after_op(table.symbols.push(l), table.ops, "<", (l,r)=> mk_lt(l,r))))(
    co_catch<ParserState,ParserError,SymTable>(both_errors)(gt_op.then(_ => expr_after_op(table.symbols.push(l), table.ops, ">", (l,r)=> mk_gt(l,r))))(
    co_catch<ParserState,ParserError,SymTable>(both_errors)(leq_op.then(_ => expr_after_op(table.symbols.push(l), table.ops, "<=", (l,r)=> mk_leq(l,r))))(
    co_catch<ParserState,ParserError,SymTable>(both_errors)(geq_op.then(_ => expr_after_op(table.symbols.push(l), table.ops, ">=", (l,r)=> mk_geq(l,r))))(
    co_catch<ParserState,ParserError,SymTable>(both_errors)(eq_op.then(_ => expr_after_op(table.symbols.push(l), table.ops, "==", (l,r)=> mk_eq(l,r))))(
    co_catch<ParserState,ParserError,SymTable>(both_errors)(neq_op.then(_ => expr_after_op(table.symbols.push(l), table.ops, "!=", (l,r)=> mk_neq(l,r))))(
    co_catch<ParserState,ParserError,SymTable>(both_errors)(and_op.then(_ => expr_after_op(table.symbols.push(l), table.ops, "&&", (l,r)=> mk_and(l,r))))(
    co_catch<ParserState,ParserError,SymTable>(both_errors)(or_op.then(_ => expr_after_op(table.symbols.push(l), table.ops, "||", (l,r)=> mk_or(l,r))))(
    co_catch<ParserState,ParserError,SymTable>(both_errors)(xor_op.then(_ => expr_after_op(table.symbols.push(l), table.ops, "xor", (l,r)=> mk_xor(l,r))))(
    co_unit({...table, symbols:table.symbols.push(l)})
    )))))))))))))))


let expr = () : Coroutine<Immutable.List<Token>, string, ParserRes> =>
  {
    let res = expr_AUX(empty_table).then(e => co_unit(reduce_table(e)))
    return res
  }

  
let semicolon = ignore_whitespace(semicolon_sign)
let comma = ignore_whitespace(comma_sign)
let with_semicolon = (p:Parser) => p.then(p_res => ignore_whitespace(semicolon_sign).then(_ => co_unit(p_res)))

let assign : () => Parser = () =>
  co_catch<ParserState,ParserError,ParserRes>(snd_err)(field_ref())(identifier).then(l =>
  equal_sign.then(_ =>
  expr().then(r =>
  co_unit(mk_assign(l,r))
  )))

let decl : () => Coroutine<ParserState,ParserError,DeclAST> = () =>
  identifier.then(l =>
  identifier.then(r =>
  co_unit(mk_decl(l, r))))

let actuals = () : Coroutine<Immutable.List<Token>, string, Array<ParserRes>> =>
  co_catch<ParserState,ParserError,Array<ParserRes>>(both_errors)(
    term().then(a => 
      co_catch<ParserState,ParserError,Array<ParserRes>>(both_errors)
        (comma.then(_ =>
          actuals().then(as =>
        co_unit([a, ...as]))))
        (co_unit([a]))))
    (co_unit(Array<ParserRes>()))

let arg_decls = () : Coroutine<Immutable.List<Token>, string, Array<DeclAST>> =>
  co_catch<ParserState,ParserError,Array<DeclAST>>(both_errors)(
    decl().then(d => 
      co_catch<ParserState,ParserError,Array<DeclAST>>(both_errors)
        (comma.then(_ =>
         arg_decls().then(ds =>
         co_unit([d, ...ds]))))
        (co_unit([d]))))
    (co_unit(Array<DeclAST>()))

let return_statement : () => Parser = () =>
  return_sign.then(_ =>
  expr().then(e =>
  co_unit(mk_return(e))))

let if_conditional : (_:() => Parser) => Parser = (stmt:() => Parser) =>
  if_keyword.then(_ =>
  expr().then(c =>
  stmt().then(t =>
  co_catch<ParserState,ParserError,ParserRes>(fst_err)(
    else_keyword.then(_ =>
    stmt().then(e =>
    co_unit(mk_if_then_else(c, t, e))
  )))
  (co_unit(mk_if_then(c, t))))))

let while_loop : (_:() => Parser) => Parser = (stmt:() => Parser) =>
  while_keyword.then(_ =>
  expr().then(c =>
  stmt().then(b =>
  co_unit(mk_while(c, b)))))

let bracketized_statement = () =>
  left_curly_bracket.then(_ =>
  function_statements().then(s =>
  right_curly_bracket.then(_ =>
  co_unit(s))))

let function_declaration = () =>
  identifier.then(return_type =>
  identifier.then(function_name =>
  left_bracket.then(_ =>
  arg_decls().then(arg_decls =>
  right_bracket.then(_ =>
  left_curly_bracket.then(_ => 
  function_statements().then(body => 
  right_curly_bracket.then(_ => 
  co_unit(mk_function_declaration(return_type, 
                                  function_name, 
                                  {range:[function_name.range, ...arg_decls.map(d => d.r.range)].reduce(join_source_ranges), 
                                   ast:{kind:"args", value:Immutable.List<DeclAST>(arg_decls)}}, 
                                  body))))))))))
    

let outer_statement : () => Parser = () =>
  co_catch<ParserState,ParserError,ParserRes>(both_errors)(function_declaration())(inner_statement())

let inner_statement : () => Parser = () =>
  co_catch<ParserState,ParserError,ParserRes>(both_errors)(bracketized_statement())(
  co_catch<ParserState,ParserError,ParserRes>(both_errors)(while_loop(function_statement))(
  co_catch<ParserState,ParserError,ParserRes>(both_errors)(if_conditional(function_statement))(
  co_catch<ParserState,ParserError,ParserRes>(both_errors)(with_semicolon(call()))(
  co_catch<ParserState,ParserError,ParserRes>(both_errors)(with_semicolon(decl().then(d => co_unit<ParserState,ParserError,ParserRes>({ range:join_source_ranges(d.l.range, d.r.range), ast:d }))))(
  co_catch<ParserState,ParserError,ParserRes>(both_errors)(with_semicolon(assign()))((
  co_catch<ParserState,ParserError,ParserRes>(both_errors)(with_semicolon(dbg))(
  with_semicolon(tc_dbg)))))))))

let function_statement : () => Parser = () =>
  co_catch<ParserState,ParserError,ParserRes>(both_errors)(with_semicolon(return_statement()))(inner_statement())

let generic_statements = (stmt: () => Coroutine<Immutable.List<Token>, string, ParserRes>) : Parser =>
    stmt().then(l =>
    co_catch<ParserState,ParserError,ParserRes>(snd_err)(generic_statements(stmt).then(r =>
    co_unit(mk_semicolon(l, r))
    ))(
      co_unit(l)
    ))

let function_statements : () => Parser = () => generic_statements (function_statement)
let inner_statements : () => Parser = () => generic_statements (() => inner_statement())
let outer_statements : () => Parser = () => generic_statements (outer_statement)


export let program_prs : () => Parser = () =>
  outer_statements().then(s =>
  eof.then(_ => co_unit(s)))


let string_to_csharp_type : (_:string) => CSharp.Type = s => 
  s == "int" ? CSharp.int_type
  : s == "bool" ? CSharp.bool_type
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
  : n.ast.kind == "func_call" &&
    n.ast.name.ast.kind == "id" ?
    CSharp.call_by_name(n.ast.name.ast.value, n.ast.actuals.map(a => ast_to_type_checker(a)))
  : n.ast.kind == "func_decl" && 
    n.ast.return_type.ast.kind == "id" && 
    n.ast.name.ast.kind == "id" &&
    n.ast.arg_decls.ast.kind == "args" &&
    !n.ast.arg_decls.ast.value.some(d => d == undefined || d.l.ast.kind != "id" || d.r.ast.kind != "id") ? 
    CSharp.def_fun({ name:n.ast.name.ast.value, 
                     return_t:string_to_csharp_type(n.ast.return_type.ast.value), 
                     parameters:n.ast.arg_decls.ast.value.toArray().map(d => ({name:(d.r.ast as IdAST).value, type:string_to_csharp_type((d.l.ast as IdAST).value)})), 
                     body:ast_to_type_checker(n.ast.body),
                     range:n.range },
                     [])
  : n.ast.kind == "decl" && n.ast.l.ast.kind == "id" && n.ast.r.ast.kind == "id" ?
    CSharp.decl_v(n.ast.r.ast.value, string_to_csharp_type(n.ast.l.ast.value))
  : n.ast.kind == "dbg" ?
    CSharp.breakpoint(n.range)(CSharp.done)
  : n.ast.kind == "tc-dbg" ?
    CSharp.typechecker_breakpoint(n.range)(CSharp.done)
  : n.ast.kind == "mk-empty-render-grid" ?
    CSharp.mk_empty_render_grid(ast_to_type_checker(n.ast.w), ast_to_type_checker(n.ast.h))
  : n.ast.kind == "mk-render-grid-pixel" ?
    CSharp.mk_render_grid_pixel(ast_to_type_checker(n.ast.w), ast_to_type_checker(n.ast.h), ast_to_type_checker(n.ast.status))
  : (() => { console.log(`Error: unsupported ast node: ${JSON.stringify(n)}`); throw new Error(`Unsupported ast node: ${JSON.stringify(n)}`)})()

