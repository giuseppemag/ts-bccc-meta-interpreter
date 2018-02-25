import * as Immutable from "immutable"
import { Prod, apply, curry, inl, inr, unit, Option, Sum, Unit, Fun, distribute_sum_prod, swap_prod, snd, fst, defun, Coroutine, co_get_state, co_error, co_set_state, co_unit, constant, State, CoCont, CoRet, mk_coroutine, Co, fun, CoPreRes, CoRes } from "ts-bccc"
import * as CCC from "ts-bccc"
import { SourceRange, join_source_ranges, mk_range, zero_range, max_source_range } from "../source_range";
import * as Lexer from "../lexer";
import { some, none, option_plus, comm_list_coroutine, co_catch, co_repeat, co_run_to_end, co_lookup } from "../ccc_aux"
import * as CSharp from "./csharp"
import { CallingContext, var_type } from "./bindings";
import { ValueName } from "../main";

export type BinOpKind = "+"|"*"|"/"|"-"|"%"|">"|"<"|"<="|">="|"=="|"!="|"&&"|"||"|"xor"|"=>"|","
export type UnaryOpKind = "not"

export type Token = ({ kind:"string", v:string } | { kind:"int", v:number } | { kind:"float", v:number } | { kind:"bool", v:boolean }
  | { kind:"for" } | { kind:"while" } | { kind:"if" } | { kind:"then" } | { kind:"else" }
  | { kind:"private" } | { kind:"public" } | { kind:"static" } | { kind:"protected" } | { kind:"virtual" } | { kind:"override" }
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
  | { kind:RenderingKind }
  | { kind:"RenderGrid", v:number } | { kind:"mk_empty_render_grid" } | { kind:"pixel" } | {kind:"return"}
  ) & { range:SourceRange }

export type RenderingKind = "empty_surface" | "circle" | "square" | "rectangle" | "ellipse" | "sprite" | "other_surface"


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

    parse_prefix_regex(/^for/, (s,r) => ({range:r, kind:"for"})),
    parse_prefix_regex(/^while/, (s,r) => ({range:r, kind:"while"})),
    parse_prefix_regex(/^if/, (s,r) => ({range:r, kind:"if"})),
    parse_prefix_regex(/^else/, (s,r) => ({range:r, kind:"else"})),

    parse_prefix_regex(/^other_surface/, (s,r) => ({range:r, kind:"other_surface"})),
    parse_prefix_regex(/^empty_surface/, (s,r) => ({range:r, kind:"empty_surface"})),
    parse_prefix_regex(/^ellipse/, (s,r) => ({range:r, kind:"ellipse"})),
    parse_prefix_regex(/^sprite/, (s,r) => ({range:r, kind:"sprite"})),
    parse_prefix_regex(/^circle/, (s,r) => ({range:r, kind:"circle"})),
    parse_prefix_regex(/^rectangle/, (s,r) => ({range:r, kind:"rectangle"})),
    parse_prefix_regex(/^square/, (s,r) => ({range:r, kind:"square"})),

    parse_prefix_regex(/^empty_render_grid/, (s,r) => ({range:r, kind:"mk_empty_render_grid"})),
    parse_prefix_regex(/^pixel/, (s,r) => ({range:r, kind:"pixel"})),
    parse_prefix_regex(/^debugger/, (s,r) => ({range:r, kind:"dbg"})),
    parse_prefix_regex(/^typechecker_debugger/, (s,r) => ({range:r, kind:"tc-dbg"})),
    parse_prefix_regex(/^private/, (s,r) => ({range:r, kind:"private"})),
    parse_prefix_regex(/^public/, (s,r) => ({range:r, kind:"public"})),
    parse_prefix_regex(/^protected/, (s,r) => ({range:r, kind:"protected"})),
    parse_prefix_regex(/^virtual/, (s,r) => ({range:r, kind:"virtual"})),
    parse_prefix_regex(/^override/, (s,r) => ({range:r, kind:"override"})),
    parse_prefix_regex(/^static/, (s,r) => ({range:r, kind:"static"})),
    parse_prefix_regex(/^\n/, (s,r) => ({range:r, kind:"nl"})),
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



let priority_operators_table =
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
  .set("=>", 4)
  .set(",", 3)

export type ModifierAST = { kind:"private" } | { kind:"public" } | { kind:"static" } | { kind:"protected" } | { kind:"virtual" } | { kind:"override" }

export interface DebuggerAST { kind: "dbg" }
export interface TCDebuggerAST { kind: "tc-dbg" }

export interface UnitAST { kind: "unit" }
export interface StringAST { kind: "string", value:string }
export interface BoolAST { kind: "bool", value: boolean }
export interface IntAST { kind: "int", value: number }
export interface IdAST { kind: "id", value: string }
export interface ForAST { kind: "for", i:ParserRes, c:ParserRes, s:ParserRes, b:ParserRes }
export interface WhileAST { kind: "while", c:ParserRes, b:ParserRes }
export interface IfAST { kind: "if", c:ParserRes, t:ParserRes, e:Option<ParserRes> }
export interface DeclAST { kind: "decl", l:ParserRes, r:{value:string, range:SourceRange} }
export interface DeclAndInitAST { kind: "decl and init", l:ParserRes, r:{value:string, range:SourceRange}, v:ParserRes }
export interface AssignAST { kind: "=", l:ParserRes, r:ParserRes }
export interface FieldRefAST { kind: ".", l:ParserRes, r:ParserRes }
export interface SemicolonAST { kind: ";", l:ParserRes, r:ParserRes }
export interface ReturnAST { kind: "return", value:ParserRes }
export interface NoopAST { kind: "noop" }
export interface ArgsAST { kind: "args", value:Immutable.List<DeclAST> }
export interface BracketAST { kind:"bracket", e:ParserRes }

export interface FieldAST { decl:DeclAST, modifiers:Immutable.List<{ range:SourceRange, ast:ModifierAST }> }
export interface MethodAST { decl:FunctionDeclarationAST, modifiers:Immutable.List<{ range:SourceRange, ast:ModifierAST }> }
export interface ConstructorAST { decl:ConstructorDeclarationAST, modifiers:Immutable.List<{ range:SourceRange, ast:ModifierAST }> }
export interface ClassAST { kind: "class", C_name:string, fields:Immutable.List<FieldAST>, methods:Immutable.List<MethodAST>, constructors:Immutable.List<ConstructorAST> }

export interface BinOpAST { kind: BinOpKind, l:ParserRes, r:ParserRes }
export interface UnaryOpAST { kind: UnaryOpKind, e:ParserRes }
export interface ConstructorDeclarationAST { kind:"cons_decl", name:string, arg_decls:Immutable.List<DeclAST>, body:ParserRes }
export interface FunctionDeclarationAST { kind:"func_decl", name:string, return_type:ParserRes, arg_decls:Immutable.List<DeclAST>, body:ParserRes }
export interface FunctionCallAST { kind:"func_call", name:ParserRes, actuals:Array<ParserRes> }
export interface ConstructorCallAST { kind:"cons_call", name:string, actuals:Array<ParserRes> }
export interface ArrayConstructorCallAST { kind:"array_cons_call", type:ParserRes, actual:ParserRes }

export interface MethodCallAST {kind:"method_call", object:ParserRes, name:ParserRes, actuals:Array<ParserRes> }
export interface GetArrayValueAtAST {kind:"get_array_value_at", array:ParserRes, index:ParserRes }


export interface MkEmptyRenderGrid { kind: "mk-empty-render-grid", w:ParserRes, h:ParserRes }
export interface MkRenderGridPixel { kind: "mk-render-grid-pixel", w:ParserRes, h:ParserRes, status:ParserRes }

export interface EmptySurface { kind: "empty surface", w:ParserRes, h:ParserRes, color:ParserRes }
export interface Sprite { kind: "sprite", cx:ParserRes, cy:ParserRes, w:ParserRes, h:ParserRes, sprite:ParserRes, rotation:ParserRes }
export interface Circle { kind: "circle", cx:ParserRes, cy:ParserRes, r:ParserRes, color:ParserRes }
export interface Square { kind: "square", cx:ParserRes, cy:ParserRes, s:ParserRes, color:ParserRes }
export interface Ellipse { kind: "ellipse", cx:ParserRes, cy:ParserRes, w:ParserRes, h:ParserRes, color:ParserRes }
export interface Rectangle { kind: "rectangle", cx:ParserRes, cy:ParserRes, w:ParserRes, h:ParserRes, color:ParserRes }
export interface OtherSurface { kind: "other surface", s:ParserRes, dx:ParserRes, dy:ParserRes, sx:ParserRes, sy:ParserRes }
export type RenderSurfaceAST = EmptySurface | Circle | Square | Ellipse | Rectangle | Sprite | OtherSurface

export interface GenericTypeDeclAST { kind:"generic type decl", f:ParserRes, args:Array<ParserRes> }
export interface ArrayTypeDeclAST { kind:"array decl", t:ParserRes }

let mk_generic_type_decl = (r:SourceRange, f:ParserRes, args:Array<ParserRes>) : { range:SourceRange, ast:AST } =>
  ({ range:r, ast:{ kind:"generic type decl", f:f, args:args } })

let mk_get_array_value_at = (r:SourceRange, a:ParserRes, actual:ParserRes) : { range:SourceRange, ast:AST } =>
  ({ range:r, ast:{ kind:"get_array_value_at", array:a, index:actual } })

let mk_array_decl = (r:SourceRange, t:ParserRes) : { range:SourceRange, ast:AST } =>
  ({ range:r, ast:{ kind:"array decl", t:t } })

export interface TupleTypeDeclAST { kind:"tuple type decl", args:Array<ParserRes> }
let mk_tuple_type_decl = (r:SourceRange, args:Array<ParserRes>) : { range:SourceRange, ast:AST } =>
  ({ range:r, ast:{ kind:"tuple type decl", args:args } })

export interface RecordTypeDeclAST { kind:"record type decl", args:Array<DeclAST> }
let mk_record_type_decl = (r:SourceRange, args:Array<DeclAST>) : { range:SourceRange, ast:AST } =>
  ({ range:r, ast:{ kind:"record type decl", args:args } })

export type AST = UnitAST | StringAST | IntAST | BoolAST | IdAST | FieldRefAST
                | GenericTypeDeclAST | TupleTypeDeclAST | RecordTypeDeclAST
                | AssignAST | DeclAST | DeclAndInitAST | IfAST | ForAST | WhileAST | SemicolonAST | ReturnAST | ArgsAST
                | BinOpAST | UnaryOpAST | FunctionDeclarationAST | FunctionCallAST
                | ClassAST | ConstructorCallAST | ArrayConstructorCallAST | MethodCallAST
                | DebuggerAST | TCDebuggerAST | NoopAST
                | MkEmptyRenderGrid | MkRenderGridPixel
                | RenderSurfaceAST | ArrayTypeDeclAST
                | ModifierAST | GetArrayValueAtAST | BracketAST
export interface ParserRes { range:SourceRange, ast:AST }

let mk_string = (v:string, sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "string", value:v }})
let mk_braket = (e:ParserRes, r:SourceRange) : ParserRes => ({ range:r, ast:{ kind: "bracket", e:e }})
let mk_unit = (sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "unit" }})
let mk_bool = (v:boolean, sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "bool", value:v }})
let mk_int = (v:number, sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "int", value:v }})
let mk_identifier = (v:string, sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "id", value:v }})
let mk_noop = () : ParserRes => ({ range:mk_range(-1,-1,-1,-1), ast:{ kind: "noop" }})

let mk_return = (e:ParserRes) : ParserRes => ({ range:e.range, ast:{ kind: "return", value:e }})
let mk_args = (sr:SourceRange,ds:Array<DeclAST>) : ParserRes => ({ range:sr, ast:{ kind: "args", value:Immutable.List<DeclAST>(ds) }})
let mk_decl_and_init = (l:ParserRes,r:string,v:ParserRes, r_range:SourceRange) : DeclAndInitAST => ({ kind: "decl and init", l:l, r:{value:r, range:r_range}, v:v })
let mk_decl = (l:ParserRes,r:string, r_range:SourceRange) : DeclAST => ({ kind: "decl", l:l, r:{value:r, range:r_range} })
let mk_assign = (l:ParserRes,r:ParserRes) : ParserRes => ({ range:join_source_ranges(l.range, r.range), ast:{ kind: "=", l:l, r:r }})
let mk_for = (i:ParserRes,c:ParserRes,s:ParserRes,b:ParserRes, for_keyword_range:SourceRange) : ParserRes => ({ range:join_source_ranges(for_keyword_range, b.range), ast:{ kind: "for", i:i, c:c, s:s, b:b }})
let mk_while = (c:ParserRes,b:ParserRes, while_keyword_range:SourceRange) : ParserRes => ({ range:join_source_ranges(while_keyword_range, b.range), ast:{ kind: "while", c:c, b:b }})
let mk_if_then = (c:ParserRes,t:ParserRes, if_keyword_range:SourceRange) : ParserRes => ({ range:join_source_ranges(if_keyword_range, t.range), ast:{ kind: "if", c:c, t:t, e:apply(none<ParserRes>(), {}) }})
let mk_if_then_else = (c:ParserRes,t:ParserRes,e:ParserRes, if_keyword_range:SourceRange) : ParserRes => ({ range:join_source_ranges(if_keyword_range, e.range), ast:{ kind: "if", c:c, t:t, e:apply(some<ParserRes>(), e) }})
let mk_field_ref = (l:ParserRes,r:ParserRes) : ParserRes => ({ range:join_source_ranges(l.range, r.range), ast:{ kind: ".", l:l, r:r }})
let mk_semicolon = (l:ParserRes,r:ParserRes) : ParserRes => ({ range:join_source_ranges(l.range, r.range), ast:{ kind: ";", l:l, r:r }})

let mk_bin_op = (k:BinOpKind) => (l:ParserRes,r:ParserRes) : ParserRes => ({ range:join_source_ranges(l.range, r.range), ast:{ kind: k, l:l, r:r }})
let mk_pair = mk_bin_op(",")
let mk_arrow = mk_bin_op("=>")
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

let mk_array_cons_call = (new_range:SourceRange, _type:ParserRes, actual:ParserRes) : ParserRes =>
  ({ range:new_range, ast:{ kind:"array_cons_call", type:_type, actual:actual } })

let mk_constructor_declaration = (function_name:string, arg_decls:Immutable.List<DeclAST>, body:ParserRes) : ConstructorDeclarationAST =>
  ({kind:"cons_decl", name:function_name, arg_decls:arg_decls, body:body})

let mk_function_declaration = (return_type:ParserRes, function_name:string, arg_decls:Immutable.List<DeclAST>, body:ParserRes) : FunctionDeclarationAST =>
  ({kind:"func_decl", name:function_name, return_type:return_type, arg_decls:arg_decls, body:body})

let mk_class_declaration = (C_name:string, fields:Immutable.List<FieldAST>, methods:Immutable.List<MethodAST>, constructors:Immutable.List<ConstructorAST>, range:SourceRange) : ParserRes =>
  ({  range: range,
      ast: {kind:"class", C_name:C_name, fields:fields, methods:methods, constructors:constructors } })

let mk_private = (sr:SourceRange) : { range:SourceRange, ast:ModifierAST } => ({ range:sr, ast:{ kind:"private"}})
let mk_public = (sr:SourceRange) : { range:SourceRange, ast:ModifierAST } => ({ range:sr, ast:{ kind:"public"}})
let mk_protected = (sr:SourceRange) : { range:SourceRange, ast:ModifierAST } => ({ range:sr, ast:{ kind:"protected"}})
let mk_static = (sr:SourceRange) : { range:SourceRange, ast:ModifierAST } => ({ range:sr, ast:{ kind:"static"}})
let mk_override = (sr:SourceRange) : { range:SourceRange, ast:ModifierAST } => ({ range:sr, ast:{ kind:"override"}})
let mk_virtual = (sr:SourceRange) : { range:SourceRange, ast:ModifierAST } => ({ range:sr, ast:{ kind:"virtual"}})

let mk_dbg = (sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "dbg" }})
let mk_tc_dbg = (sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "tc-dbg" }})

let mk_empty_render_grid = (w:ParserRes, h:ParserRes) : ParserRes => ({ range:join_source_ranges(w.range, h.range), ast:{ kind: "mk-empty-render-grid", w:w, h:h }})
let mk_render_grid_pixel = (w:ParserRes, h:ParserRes, status:ParserRes) : ParserRes => ({ range:join_source_ranges(w.range, join_source_ranges(h.range, status.range)), ast:{ kind: "mk-render-grid-pixel", w:w, h:h, status:status }})

let mk_empty_surface = (sr:SourceRange, w:ParserRes, h:ParserRes, col:ParserRes) : ParserRes => ({ range:sr, ast:{ kind: "empty surface", w:w, h:h, color:col } })
let mk_circle = (sr:SourceRange, cx:ParserRes, cy:ParserRes, r:ParserRes, col:ParserRes) : ParserRes => ({ range:sr, ast:{ kind: "circle", cx:cx, cy:cy, r:r, color:col } })
let mk_square = (sr:SourceRange, cx:ParserRes, cy:ParserRes, s:ParserRes, col:ParserRes) : ParserRes => ({ range:sr, ast:{ kind: "square", cx:cx, cy:cy, s:s, color:col } })
let mk_ellipse = (sr:SourceRange, cx:ParserRes, cy:ParserRes, w:ParserRes, h:ParserRes, col:ParserRes) : ParserRes => ({ range:sr, ast:{ kind: "ellipse", cx:cx, cy:cy, w:w, h:h, color:col } })
let mk_rectangle = (sr:SourceRange, cx:ParserRes, cy:ParserRes, w:ParserRes, h:ParserRes, col:ParserRes) : ParserRes => ({ range:sr, ast:{ kind: "rectangle", cx:cx, cy:cy, w:w, h:h, color:col } })
let mk_sprite = (sr:SourceRange, sprite:ParserRes, cx:ParserRes, cy:ParserRes, w:ParserRes, h:ParserRes, rot:ParserRes) : ParserRes => ({ range:sr, ast:{ kind: "sprite", cx:cx, cy:cy, w:w, h:h, sprite:sprite, rotation:rot } })
let mk_other_surface = (sr:SourceRange, s:ParserRes, dx:ParserRes, dy:ParserRes, sx:ParserRes, sy:ParserRes) : ParserRes => ({ range:sr, ast:{ kind: "other surface", s:s, dx:dx, dy:dy, sx:sx, sy:sy } })

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

let binop_sign: (_:BinOpKind) => Coroutine<ParserState,ParserError,SourceRange> = k => ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.tokens.isEmpty())
    return co_error({ range:mk_range(-1,0,0,0), priority:s.branch_priority, message:`found empty state, expected ${k}` })
  let i = s.tokens.first()
  if (i.kind == k) {
    return co_set_state<ParserState, ParserError>({...s, tokens: s.tokens.rest().toList() }).then(_ => co_unit(i.range))
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
let for_keyword = symbol("for", "for")
let while_keyword = symbol("while", "while")
let if_keyword = symbol("if", "if")
let else_keyword = symbol("else", "else")
let equal_sign = symbol("=", "=")
let semicolon_sign = symbol(";", "semicolon")
let comma_sign = symbol(",", "comma")
let class_keyword = symbol("class", "class")
let new_keyword = symbol("new", "new")

let surface_keyword = symbol("surface", "surface")
let empty_surface_keyword = symbol("empty_surface", "empty_surface")
let sprite_keyword = symbol("sprite", "sprite")
let circle_keyword = symbol("circle", "circle")
let square_keyword = symbol("square", "square")
let rectangle_keyword = symbol("rectangle", "rectangle")
let ellipse_keyword = symbol("ellipse", "ellipse")
let other_surface_keyword = symbol("other_surface", "other_surface")

let left_bracket = symbol("(", "(")
let right_bracket = symbol(")", ")")

let left_square_bracket = symbol("[", "[")
let right_square_bracket = symbol("]", "]")

let left_curly_bracket = symbol("{", "{")
let right_curly_bracket = symbol("}", "}")

let dot_sign = symbol(".", ".")

let private_modifier = symbol("private", "private")
let public_modifier = symbol("public", "public")
let protected_modifier = symbol("protected", "protected")
let static_modifier = symbol("static", "static")
let override_modifier = symbol("override", "override")
let virtual_modifier = symbol("virtual", "virtual")

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

let arrow_op = binop_sign("=>")

let not_op = unaryop_sign("not")

let eof: Coroutine<ParserState,ParserError,SourceRange> = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.tokens.isEmpty())
    return co_unit(zero_range)
  return co_error({ range:s.tokens.first().range, message:`expected eof, found ${s.tokens.first().kind}`, priority:s.branch_priority })
}))


let index_of : Coroutine<ParserState,ParserError,ParserRes> = identifier.then(from =>
                left_square_bracket.then(_ =>
                  expr().then(actual =>
                  right_square_bracket.then(rs =>
                    co_unit(mk_get_array_value_at(join_source_ranges(from.range, rs), from, actual))
                  ))))

let field_ref_elements = (identifiers:Immutable.List<ParserRes>) : Coroutine<ParserState,ParserError,Immutable.List<ParserRes>> =>
  parser_or<Immutable.List<ParserRes>>(
    parser_or<ParserRes>(index_of, identifier).then(l =>
    dot_sign.then(_ =>
    field_ref_elements(identifiers.push(l)))),
  co_unit(identifiers))

let field_ref:  () => Parser = () =>
  parser_or<ParserRes>(index_of, identifier).then(first =>
  dot_sign.then(_ =>
  field_ref_elements(Immutable.List<ParserRes>([first])).then(identifiers =>
  parser_or<ParserRes>(index_of, identifier).then(last => co_unit(identifiers.push(last).toArray().reduce((l,r) => mk_field_ref(l,r)))))))

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

let mk_empty_surface_prs : () => Parser = () =>
  empty_surface_keyword.then(esk =>
  expr().then(l =>
  expr().then(r =>
  expr().then(col =>
  co_unit(mk_empty_surface(join_source_ranges(esk, col.range), l,r,col))
  ))))

let mk_circle_prs : () => Parser = () =>
  circle_keyword.then(kw =>
  expr().then(cx =>
  expr().then(cy =>
  expr().then(r =>
  expr().then(col =>
  co_unit(mk_circle(join_source_ranges(kw, col.range), cx, cy, r, col))
  )))))

let mk_square_prs : () => Parser = () =>
  square_keyword.then(kw =>
  expr().then(cx =>
  expr().then(cy =>
  expr().then(r =>
  expr().then(col =>
  co_unit(mk_square(join_source_ranges(kw, col.range), cx, cy, r, col))
  )))))

let mk_ellipse_prs : () => Parser = () =>
  ellipse_keyword.then(kw =>
  expr().then(cx =>
  expr().then(cy =>
  expr().then(w =>
  expr().then(h =>
  expr().then(col =>
  co_unit(mk_ellipse(join_source_ranges(kw, col.range), cx, cy, w, h, col))
  ))))))

let mk_rectangle_prs : () => Parser = () =>
  rectangle_keyword.then(kw =>
  expr().then(cx =>
  expr().then(cy =>
  expr().then(w =>
  expr().then(h =>
  expr().then(col =>
  co_unit(mk_rectangle(join_source_ranges(kw, col.range), cx, cy, w, h, col))
  ))))))

let mk_sprite_prs : () => Parser = () =>
  sprite_keyword.then(kw =>
  expr().then(sprite =>
  expr().then(cx =>
  expr().then(cy =>
  expr().then(w =>
  expr().then(h =>
  expr().then(col =>
  co_unit(mk_sprite(join_source_ranges(kw, col.range), sprite, cx, cy, w, h, col))
  )))))))

let mk_other_surface_prs : () => Parser = () =>
  other_surface_keyword.then(kw =>
  expr().then(s =>
  expr().then(dx =>
  expr().then(dy =>
  expr().then(sx =>
  expr().then(sy =>
  co_unit(mk_other_surface(join_source_ranges(kw, sy.range), s, dx, dy, sx, sy))
  ))))))

let term : () => Parser = () : Parser =>
  parser_or<ParserRes>(mk_empty_surface_prs(),
  parser_or<ParserRes>(mk_circle_prs(),
  parser_or<ParserRes>(mk_square_prs(),
  parser_or<ParserRes>(mk_ellipse_prs(),
  parser_or<ParserRes>(mk_rectangle_prs(),
  parser_or<ParserRes>(mk_sprite_prs(),
  parser_or<ParserRes>(mk_other_surface_prs(),

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
  left_bracket.then(lb =>
  expr().then(e =>
  right_bracket.then(rb =>
  co_unit(mk_braket(e, join_source_ranges(lb, rb)))))
  ))))))))))))))))))

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
         symbols.count() >= 2 && priority_operators_table.get(ops.peek().fst) >= priority_operators_table.get(current_op)){
        let res = reduce_table_2(symbols, ops, false)
        return expr_after_op(res.symbols, res.ops, current_op, compose_current)
      }
      return expr_AUX({symbols:symbols, ops: ops.push({fst:current_op,snd:compose_current})})
    }

type SymTable = {symbols:Immutable.Stack<ParserRes>,
                 ops:Immutable.Stack<Prod<string, (l:ParserRes, r:ParserRes)=>ParserRes>>}

let expr_AUX = (table: {symbols:Immutable.Stack<ParserRes>,
  ops:Immutable.Stack<Prod<string, (l:ParserRes, r:ParserRes)=>ParserRes>>}) : Coroutine<ParserState, ParserError, SymTable> =>

  term().then(from =>
    parser_or<ParserRes>(
      left_square_bracket.then(_ =>
        expr().then(actual =>
        right_square_bracket.then(rs =>
          co_unit(mk_get_array_value_at(join_source_ranges(from.range, rs), from, actual))
        ))),
      co_unit(from)))
  .then(l =>
    parser_or<SymTable>(comma.then(_ => expr_after_op(table.symbols.push(l), table.ops, ",", (l,r)=> mk_pair(l,r))),
    parser_or<SymTable>(arrow_op.then(_ => expr_after_op(table.symbols.push(l), table.ops, "=>", (l,r)=> mk_arrow(l,r))),
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
    )))))))))))))))))

let cons_call = () : Coroutine<ParserState, ParserError, ParserRes> =>
    new_keyword.then(new_range =>
    identifier_token.then(class_name =>
    left_bracket.then(_ =>
    actuals().then((actuals:Array<ParserRes>) =>
    right_bracket.then(_ =>
    co_unit(mk_constructor_call(new_range, class_name.id, actuals))
    )))))

let array_new = () : Coroutine<ParserState, ParserError, ParserRes> =>
    new_keyword.then(new_range  =>
    identifier.then(array_type =>
    left_square_bracket.then(_ =>
    term().then((actual:ParserRes) =>
    right_square_bracket.then(rs =>
    co_unit(mk_array_cons_call(join_source_ranges(new_range, rs), array_type, actual))
    )))))


let expr = () : Coroutine<ParserState, ParserError, ParserRes> =>
  {
    let res = expr_AUX(empty_table).then(e => co_unit(reduce_table(e)))
    return parser_or<ParserRes>(
      res,
      parser_or<ParserRes>(cons_call(),array_new())
    )
  }


let semicolon = ignore_whitespace(semicolon_sign)
let comma = ignore_whitespace(comma_sign)
let with_semicolon = <A>(p:Coroutine<ParserState, ParserError, A>) => p.then(p_res => ignore_whitespace(semicolon_sign).then(_ => co_unit(p_res)))

let assign_right = () : Parser =>
  no_match.then(_ =>
  equal_sign.then(_ =>
  partial_match.then(_ =>
  expr().then(r =>
  full_match.then(_ =>
  co_unit(r)
  )))))

let assign : () => Parser = () =>
  parser_or<ParserRes>(
    field_ref(),
    parser_or<ParserRes>(
      identifier.then(from =>
        left_square_bracket.then(_ =>
        term().then(actual =>
        right_square_bracket.then(rs =>
          co_unit(mk_get_array_value_at(join_source_ranges(from.range, rs), from, actual))
        )))),
      identifier)
  ).then(l =>
      assign_right().then(r => co_unit(mk_assign(l,r)))
    )

let type_args = () : Coroutine<ParserState, ParserError, Array<ParserRes>> =>
  parser_or<Array<ParserRes>>(
    type_decl().then(a =>
    parser_or<Array<ParserRes>>(
      comma.then(_ =>
        type_args().then(as =>
      co_unit([a, ...as]))),
      co_unit([a]))),
    co_unit(Array<ParserRes>()))

let type_decl = () : Coroutine<ParserState,ParserError,ParserRes> =>
  parser_or<ParserRes>(
    left_bracket.then(lb =>
      parser_or<ParserRes>(type_args().then(as =>
        right_bracket.then(rb =>
        co_unit(mk_tuple_type_decl(join_source_ranges(lb, rb), as)))),
        arg_decls().then(as =>
        right_bracket.then(rb =>
        co_unit(mk_record_type_decl(join_source_ranges(lb, rb), as))))
      )
    ),
    identifier.then(i =>
      parser_or<ParserRes>(
        lt_op.then(_ =>
          partial_match.then(_ =>
          type_args().then(args =>
          gt_op.then(end_range =>
          co_unit(mk_generic_type_decl(join_source_ranges(i.range, end_range), i, args))
        )))),
        parser_or<ParserRes>(
          left_square_bracket.then(_ =>
            partial_match.then(_ =>
            right_square_bracket.then(end_range =>
            co_unit(mk_array_decl(join_source_ranges(i.range, end_range), i))
          ))),
          co_unit(i))
      )))

let decl_init : () => Coroutine<ParserState,ParserError,ParserRes> = () =>
  no_match.then(_ =>
  type_decl().then(l =>
  identifier_token.then(r =>
  partial_match.then(_ =>
  assign_right().then(v =>
  full_match.then(_ =>
  co_unit<ParserState,ParserError,ParserRes>({ range:join_source_ranges(l.range, v.range), ast:mk_decl_and_init(l, r.id, v, r.range) })))))))

let decl : () => Coroutine<ParserState,ParserError,DeclAST> = () =>
  no_match.then(_ =>
  type_decl().then(l =>
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
  if_keyword.then(if_keyword =>
  partial_match.then(_ =>
  expr().then(c =>
  stmt().then(t =>
  parser_or<ParserRes>(
    else_keyword.then(_ =>
    stmt().then(e =>
    full_match.then(_ =>
    co_unit(mk_if_then_else(c, t, e, if_keyword))))),
    co_unit(mk_if_then(c, t, if_keyword))))))))

let for_loop : (_:() => Parser) => Parser = (stmt:(ignore_semicolon?:boolean) => Parser) =>
  no_match.then(_ =>
  for_keyword.then(for_keyword_range =>
  partial_match.then(_ =>
  left_bracket.then(lb =>
  stmt().then(i =>
  expr().then(c =>
  semicolon.then(_ =>
  stmt(true).then(s =>
  right_bracket.then(rb =>
  stmt().then(b =>
  full_match.then(_ =>
  co_unit(mk_for(i, c, s, b, for_keyword_range)))))))))))))

let while_loop : (_:() => Parser) => Parser = (stmt:() => Parser) =>
  no_match.then(_ =>
  while_keyword.then(while_keyword_range =>
  partial_match.then(_ =>
  expr().then(c =>
  stmt().then(b =>
  full_match.then(_ =>
  co_unit(mk_while(c, b, while_keyword_range))))))))

let bracketized_statement = () =>
  no_match.then(_ =>
  left_curly_bracket.then(l_b_r =>
  partial_match.then(_ =>
  function_statements(co_lookup(right_curly_bracket).then(_ => co_unit({}))).then(s =>
  right_curly_bracket.then(r_b_r =>
  full_match.then(_ =>
  co_unit({...s, range:join_source_ranges(l_b_r, r_b_r)})))))))

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
  type_decl().then(return_type =>
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

let unchanged = CCC.id<Coroutine<ParserState, ParserError, ParserRes>>().f

let inner_statement = (skip_semicolon?:boolean) : Parser =>
  parser_or<ParserRes>(with_semicolon(co_unit(mk_noop())),
  parser_or<ParserRes>(bracketized_statement(),
  parser_or<ParserRes>(for_loop(function_statement),
  parser_or<ParserRes>(while_loop(function_statement),
  parser_or<ParserRes>(if_conditional(function_statement),
  parser_or<ParserRes>((skip_semicolon ? unchanged : with_semicolon)(call()),
  parser_or<ParserRes>((skip_semicolon ? unchanged : with_semicolon)(method_call()),
  parser_or<ParserRes>((skip_semicolon ? unchanged : with_semicolon)(decl().then(d =>
    co_unit<ParserState,ParserError,ParserRes>({ range:join_source_ranges(d.l.range, d.r.range), ast:d }))),
  parser_or<ParserRes>((skip_semicolon ? unchanged : with_semicolon)(decl_init()),
  parser_or<ParserRes>((skip_semicolon ? unchanged : with_semicolon)(assign()),
  parser_or<ParserRes>((skip_semicolon ? unchanged : with_semicolon)(no_match.then(_ => dbg)),
  with_semicolon(no_match.then(_ => tc_dbg))
  )))))))))))

let function_statement = (skip_semicolon?:boolean) : Parser =>
  parser_or<ParserRes>(with_semicolon(return_statement()),inner_statement(skip_semicolon))

let generic_statements = (stmt: () => Parser, check_trailer: Coroutine<ParserState,ParserError,Unit>) : Parser =>
    stmt().then(l =>
    parser_or<ParserRes>(
      generic_statements(stmt, check_trailer).then(r => co_unit(r.ast.kind == "noop" ? l : mk_semicolon(l, r))),
      check_trailer.then(_ => co_unit(l)))
    )

let function_statements = (check_trailer: Coroutine<ParserState,ParserError,Unit>) : Parser =>
  generic_statements (function_statement, check_trailer)
let inner_statements = (check_trailer: Coroutine<ParserState,ParserError,Unit>) : Parser => generic_statements (() => inner_statement(), check_trailer)
let outer_statements = (check_trailer: Coroutine<ParserState,ParserError,Unit>) : Parser => generic_statements (outer_statement, check_trailer)

let modifier = () : Coroutine<ParserState, ParserError, { range:SourceRange, ast:ModifierAST }> =>
  parser_or<{ range:SourceRange, ast:ModifierAST }>(private_modifier.then(r => co_unit(mk_private(r))),
  parser_or<{ range:SourceRange, ast:ModifierAST }>(public_modifier.then(r => co_unit(mk_public(r))),
  parser_or<{ range:SourceRange, ast:ModifierAST }>(protected_modifier.then(r => co_unit(mk_protected(r))),
  parser_or<{ range:SourceRange, ast:ModifierAST }>(virtual_modifier.then(r => co_unit(mk_virtual(r))),
  parser_or<{ range:SourceRange, ast:ModifierAST }>(override_modifier.then(r => co_unit(mk_override(r))),
  static_modifier.then(r => co_unit(mk_static(r))))))))

let modifiers = () : Coroutine<ParserState, ParserError, Immutable.List<{ range:SourceRange, ast:ModifierAST }>> =>
  parser_or<Immutable.List<{ range:SourceRange, ast:ModifierAST }>>(
  modifier().then(m =>
  modifiers().then(ms =>
  m.ast.kind == "private" && ms.some(m => !m || m.ast.kind == "public") ||
  m.ast.kind == "public" && ms.some(m => !m || m.ast.kind == "private") ||
  m.ast.kind == "virtual" && ms.some(m => !m || m.ast.kind == "override") ||
  m.ast.kind == "override" && ms.some(m => !m || m.ast.kind == "virtual") ?
    co_get_state<ParserState, ParserError>().then(s =>
    co_error({ range:m.range, priority:s.branch_priority, message:"Error: incompatible modifiers." }))
  : co_unit(ms.push(m)))),
  co_unit(Immutable.List<{ range:SourceRange, ast:ModifierAST }>()))

let class_statements : () => Coroutine<ParserState, ParserError, Prod<Immutable.List<FieldAST>, Prod<Immutable.List<MethodAST>, Immutable.List<ConstructorAST>>>> = () =>
  parser_or<Prod<Immutable.List<FieldAST>, Prod<Immutable.List<MethodAST>, Immutable.List<ConstructorAST>>>>(
    parser_or<Sum<FieldAST, Sum<MethodAST, ConstructorAST>>>(
      with_semicolon(modifiers().then(ms => decl().then(d =>
      co_unit<ParserState, ParserError, Sum<FieldAST, Sum<MethodAST, ConstructorAST>>>(
        apply(inl<FieldAST, Sum<MethodAST, ConstructorAST>>(), { decl:d, modifiers:ms })))))
    ,
      parser_or<Sum<FieldAST, Sum<MethodAST, ConstructorAST>>>(
        modifiers().then(ms => function_declaration().then(d =>
          co_unit<ParserState, ParserError, Sum<FieldAST, Sum<MethodAST, ConstructorAST>>>(
            apply(inr<FieldAST, Sum<MethodAST, ConstructorAST>>().after(inl<MethodAST, ConstructorAST>()), { decl:d, modifiers:ms }))))
      ,
      modifiers().then(ms => constructor_declaration().then(d =>
          co_unit<ParserState, ParserError, Sum<FieldAST, Sum<MethodAST, ConstructorAST>>>(
            apply(inr<FieldAST, Sum<MethodAST, ConstructorAST>>().after(inr<MethodAST, ConstructorAST>()), { decl:d, modifiers:ms }))))
      )
    ).then(decl =>
    class_statements().then(decls =>
      co_unit<ParserState, ParserError, Prod<Immutable.List<FieldAST>, Prod<Immutable.List<MethodAST>, Immutable.List<ConstructorAST>>>>({
        fst:decl.kind == "left" ? decls.fst.push(decl.value) : decls.fst,
        snd:decl.kind == "right" ?
              decl.value.kind == "left" ?
                {...decls.snd, fst:decls.snd.fst.push(decl.value.value)}
              :
                {...decls.snd, snd:decls.snd.snd.push(decl.value.value)}
            : decls.snd })
  )),
    co_lookup(right_curly_bracket).then(_ =>
    co_unit<ParserState, ParserError, Prod<Immutable.List<FieldAST>, Prod<Immutable.List<MethodAST>, Immutable.List<ConstructorAST>>>>({
      fst:Immutable.List<FieldAST>(),
      snd:{
        fst:Immutable.List<MethodAST>(),
        snd:Immutable.List<ConstructorAST>() }
      })))

export let program_prs : () => Parser = () =>
  outer_statements(co_lookup(eof).then(_ => co_unit({}))).then(s =>
  eof.then(_ => co_unit(s)))


let ast_to_csharp_type = (s:ParserRes) : CSharp.Type =>
  s.ast.kind == "id" ?
    s.ast.value == "int" ? CSharp.int_type
    : s.ast.value == "bool" ? CSharp.bool_type
    : s.ast.value == "string" ? CSharp.string_type
    : s.ast.value == "void" ? CSharp.unit_type
    : s.ast.value == "RenderGrid" ? CSharp.render_grid_type
    : s.ast.value == "RenderGridPixel" ? CSharp.render_grid_pixel_type
    : s.ast.value == "surface" ? CSharp.render_surface_type
    : s.ast.value == "sprite" ? CSharp.sprite_type
    : s.ast.value == "circle" ? CSharp.circle_type
    : s.ast.value == "square" ? CSharp.square_type
    : s.ast.value == "ellipse" ? CSharp.ellipse_type
    : s.ast.value == "rectangle" ? CSharp.rectangle_type
    : s.ast.value == "var" ? CSharp.var_type
    : CSharp.ref_type(s.ast.value) :
  s.ast.kind == "array decl" ? CSharp.arr_type(ast_to_csharp_type(s.ast.t))
  : s.ast.kind == "generic type decl" && s.ast.f.ast.kind == "id" && s.ast.f.ast.value == "Func" && s.ast.args.length >= 1 ?
    CSharp.fun_type(CSharp.tuple_type(Immutable.Seq(s.ast.args).take(s.ast.args.length - 1).toArray().map(a => ast_to_csharp_type(a))), ast_to_csharp_type(s.ast.args[s.ast.args.length - 1]))
  : s.ast.kind == "tuple type decl" ?
    CSharp.tuple_type(s.ast.args.map(a => ast_to_csharp_type(a)))
  : s.ast.kind == "record type decl" ?
    CSharp.record_type(Immutable.Map<string,CSharp.Type>(s.ast.args.map(a => [a.r.value, ast_to_csharp_type(a.l)])))
  : (() => { console.log(`Error: unsupported ast type: ${JSON.stringify(s)}`); throw new Error(`Unsupported ast type: ${JSON.stringify(s)}`)})()

export let global_calling_context:CallingContext =  ({ kind:"global scope" })

let union_many = <a>(a:Array<Immutable.Set<a>>) : Immutable.Set<a> => {
  let res = Immutable.Set<a>()
  a.forEach(x => { res = res.union(x)})
  return res
}

let free_variables = (n:ParserRes, bound:Immutable.Set<ValueName>) : Immutable.Set<ValueName> =>
  n.ast.kind == ";" || n.ast.kind == "+" || n.ast.kind == "-" || n.ast.kind == "/" || n.ast.kind == "*"
  || n.ast.kind == "%" || n.ast.kind == "<" || n.ast.kind == ">" || n.ast.kind == "<=" || n.ast.kind == ">="
  || n.ast.kind == "==" || n.ast.kind == "!=" || n.ast.kind == "xor" || n.ast.kind == "&&" || n.ast.kind == "||"
  || n.ast.kind == "," ?
    free_variables(n.ast.l, bound).union(free_variables(n.ast.r, bound))

  : n.ast.kind == "not" || n.ast.kind == "bracket" ? free_variables(n.ast.e, bound)

  : n.ast.kind == "=>" && n.ast.l.ast.kind == "id" ? free_variables(n.ast.r, bound.add(n.ast.l.ast.value))
  : n.ast.kind == "id" ? (!bound.has(n.ast.value) ? Immutable.Set<ValueName>([n.ast.value]) : Immutable.Set<ValueName>())
  : n.ast.kind == "int" || n.ast.kind == "string" || n.ast.kind == "bool"   ?  Immutable.Set<ValueName>()
  : n.ast.kind == "func_call" ? free_variables(n.ast.name, bound).union(union_many(n.ast.actuals.map(a => free_variables(a, bound))))
  : (() => { console.log(`Error (FV): unsupported ast node: ${JSON.stringify(n)}`); throw new Error(`(FV) Unsupported ast node: ${JSON.stringify(n)}`)})()


export let extract_tuple_args = (n:ParserRes) : Array<ParserRes> =>
  n.ast.kind == "," ? [...extract_tuple_args(n.ast.l), n.ast.r]
  : n.ast.kind == "bracket" ? extract_tuple_args(n.ast.e)
  : [n]

export let ast_to_type_checker : (_:ParserRes) => (_:CallingContext) => CSharp.Stmt = n => context =>
  n.ast.kind == "int" ? CSharp.int(n.ast.value)
  : n.ast.kind == "string" ? CSharp.str(n.ast.value)
  : n.ast.kind == "bracket" ? ast_to_type_checker(n.ast.e)(context)
  : n.ast.kind == "bool" ? CSharp.bool(n.ast.value)
  : n.ast.kind == ";" ? CSharp.semicolon(n.range, ast_to_type_checker(n.ast.l)(context), ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == "for" ? CSharp.for_loop(n.range, ast_to_type_checker(n.ast.i)(context), ast_to_type_checker(n.ast.c)(context), ast_to_type_checker(n.ast.s)(context), ast_to_type_checker(n.ast.b)(context))
  : n.ast.kind == "while" ? CSharp.while_do(n.range, ast_to_type_checker(n.ast.c)(context), ast_to_type_checker(n.ast.b)(context))
  : n.ast.kind == "if" ? CSharp.if_then_else(n.range, ast_to_type_checker(n.ast.c)(context), ast_to_type_checker(n.ast.t)(context),
                            n.ast.e.kind == "right" ? CSharp.done : ast_to_type_checker(n.ast.e.value)(context))
  : n.ast.kind == "+" ? CSharp.plus(n.range, ast_to_type_checker(n.ast.l)(context),
                                             ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == "-" ? CSharp.minus(n.range, ast_to_type_checker(n.ast.l)(context),
                                              ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == "*" ? CSharp.times(n.range, ast_to_type_checker(n.ast.l)(context),
                                              ast_to_type_checker(n.ast.r)(context), n.range)
  : n.ast.kind == "/" ? CSharp.div(n.range, ast_to_type_checker(n.ast.l)(context), ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == "%" ? CSharp.mod(n.range, ast_to_type_checker(n.ast.l)(context), ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == "<" ? CSharp.lt(n.range, ast_to_type_checker(n.ast.l)(context), ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == ">" ? CSharp.gt(n.range, ast_to_type_checker(n.ast.l)(context), ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == "<=" ? CSharp.leq(n.range, ast_to_type_checker(n.ast.l)(context), ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == ">=" ? CSharp.geq(n.range, ast_to_type_checker(n.ast.l)(context), ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == "==" ? CSharp.eq(n.range, ast_to_type_checker(n.ast.l)(context), ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == "!=" ? CSharp.neq(n.range, ast_to_type_checker(n.ast.l)(context), ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == "xor" ? CSharp.xor(n.range, ast_to_type_checker(n.ast.l)(context), ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == "not" ? CSharp.not(n.range, ast_to_type_checker(n.ast.e)(context))
  : n.ast.kind == "&&" ? CSharp.and(n.range, ast_to_type_checker(n.ast.l)(context), ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == "||" ? CSharp.or(n.range, ast_to_type_checker(n.ast.l)(context), ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == "=>" ? CSharp.arrow(n.range,
      extract_tuple_args(n.ast.l).map(a => {
        if (a.ast.kind != "id") {
          console.log(`Error: unsupported ast node: ${JSON.stringify(n)}`)
          throw new Error(`Unsupported ast node: ${JSON.stringify(n)}`)
        }
        return { name:a.ast.value, type:var_type }
      }),
      // [ { name:n.ast.l.ast.value, type:var_type } ],
      free_variables(n.ast.r, Immutable.Set<ValueName>(      extract_tuple_args(n.ast.l).map(a => {
        if (a.ast.kind != "id") {
          console.log(`Error: unsupported ast node: ${JSON.stringify(n)}`)
          throw new Error(`Unsupported ast node: ${JSON.stringify(n)}`)
        }
        return a.ast.value
      }))).toArray(), ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == "," ? CSharp.tuple_value(n.range, [...extract_tuple_args(n.ast.l), n.ast.r].map(a => ast_to_type_checker(a)(context)))
  : n.ast.kind == "id" ? CSharp.get_v(n.range, n.ast.value)
  : n.ast.kind == "return" ? CSharp.ret(n.range, ast_to_type_checker(n.ast.value)(context))
  : n.ast.kind == "." && n.ast.r.ast.kind == "id" ? CSharp.field_get(n.range, context, ast_to_type_checker(n.ast.l)(context), n.ast.r.ast.value)


  : n.ast.kind == "=" && n.ast.l.ast.kind == "get_array_value_at" ?
    CSharp.set_arr_el(n.range,
                      ast_to_type_checker(n.ast.l.ast.array)(context),
                      ast_to_type_checker(n.ast.l.ast.index)(context),
                      ast_to_type_checker(n.ast.r)(context))

  : n.ast.kind == "=" &&
    n.ast.l.ast.kind == "." &&
    n.ast.l.ast.r.ast.kind == "get_array_value_at" &&
    n.ast.l.ast.r.ast.array.ast.kind == "id" ?

    //(this.b)[i] = c
    //set([this.b], i, c)
    //set(ref(T), i, c)
    CSharp.set_arr_el(n.range,
      ast_to_type_checker({...n.ast.l, ast: {...n.ast.l.ast, r: {...n.ast.l.ast.r, ast:n.ast.l.ast.r.ast.array.ast}}})(context),
      ast_to_type_checker(n.ast.l.ast.r.ast.index)(context),
      ast_to_type_checker(n.ast.r)(context))

  : n.ast.kind == "=" && n.ast.l.ast.kind == "id" ? CSharp.set_v(n.range, n.ast.l.ast.value, ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == "=" && n.ast.l.ast.kind == "." && n.ast.l.ast.r.ast.kind == "id" ?
    CSharp.field_set(n.range, context, ast_to_type_checker(n.ast.l.ast.l)(context), {att_name:n.ast.l.ast.r.ast.value, kind:"att"}, ast_to_type_checker(n.ast.r)(context))



  : n.ast.kind == "cons_call" ?
    CSharp.call_cons(n.range, context, n.ast.name, n.ast.actuals.map(a => ast_to_type_checker(a)(context)))
  : n.ast.kind == "func_call" &&
    n.ast.name.ast.kind == "id" ?
    CSharp.call_by_name(n.range, n.ast.name.ast.value, n.ast.actuals.map(a => ast_to_type_checker(a)(context)))
  : n.ast.kind == "method_call" &&
    n.ast.name.ast.kind == "id" ?
    CSharp.call_method(n.range, context, ast_to_type_checker(n.ast.object)(context), n.ast.name.ast.value, n.ast.actuals.map(a => ast_to_type_checker(a)(context)))
  : n.ast.kind == "func_decl" ?
    CSharp.def_fun(n.range,
      { name:n.ast.name,
        return_t:ast_to_csharp_type(n.ast.return_type),
        parameters:n.ast.arg_decls.toArray().map(d => ({name:d.r.value, type:ast_to_csharp_type(d.l)})),
        body:ast_to_type_checker(n.ast.body)(context),
        range:n.range },
        [])
  : n.ast.kind == "class" ?
    CSharp.def_class(n.range, n.ast.C_name,
      n.ast.methods.toArray().map(m => (context:CallingContext) => ({
          name:m.decl.name,
          return_t:ast_to_csharp_type(m.decl.return_type),
          parameters:m.decl.arg_decls.toArray().map(a => ({ name:a.r.value, type:ast_to_csharp_type(a.l) })),
          body:ast_to_type_checker(m.decl.body)(context),
          range:join_source_ranges(m.decl.return_type.range, m.decl.body.range),
          modifiers:m.modifiers.toArray().map(mod => mod.ast.kind)
        })).concat(
        n.ast.constructors.toArray().map(c => (context:CallingContext) => ({
          name:c.decl.name,
          return_t:CSharp.unit_type,
          parameters:c.decl.arg_decls.toArray().map(a => ({ name:a.r.value, type:ast_to_csharp_type(a.l) })),
          body:ast_to_type_checker(c.decl.body)(context),
          range:c.decl.body.range,
          modifiers:c.modifiers.toArray().map(mod => mod.ast.kind)
        })) ),
      n.ast.fields.toArray().map(f => (context:CallingContext) => ({
        name:f.decl.r.value,
        type:ast_to_csharp_type(f.decl.l),
        modifiers:f.modifiers.toArray().map(mod => mod.ast.kind)
      }))
    )

  : n.ast.kind == "decl" ?
    CSharp.decl_v(n.range, n.ast.r.value, ast_to_csharp_type(n.ast.l))
  : n.ast.kind == "decl and init" ?
    CSharp.decl_and_init_v(n.range, n.ast.r.value, ast_to_csharp_type(n.ast.l), ast_to_type_checker(n.ast.v)(context))
  : n.ast.kind == "dbg" ?
    CSharp.breakpoint(n.range)(CSharp.done)
  : n.ast.kind == "tc-dbg" ?
    CSharp.typechecker_breakpoint(n.range)(CSharp.done)

  : n.ast.kind == "array_cons_call" ?
    CSharp.new_array(n.range, ast_to_csharp_type(n.ast.type), ast_to_type_checker(n.ast.actual)(context))
  : n.ast.kind == "get_array_value_at" ?
    CSharp.get_arr_el(n.range, ast_to_type_checker(n.ast.array)(context), ast_to_type_checker(n.ast.index)(context))



  : n.ast.kind == "empty surface" ?
    CSharp.mk_empty_surface(n.range, ast_to_type_checker(n.ast.w)(context), ast_to_type_checker(n.ast.h)(context), ast_to_type_checker(n.ast.color)(context))
  : n.ast.kind == "circle" ?
    CSharp.mk_circle(n.range, ast_to_type_checker(n.ast.cx)(context), ast_to_type_checker(n.ast.cy)(context), ast_to_type_checker(n.ast.r)(context), ast_to_type_checker(n.ast.color)(context))
  : n.ast.kind == "square" ?
    CSharp.mk_square(n.range, ast_to_type_checker(n.ast.cx)(context), ast_to_type_checker(n.ast.cy)(context), ast_to_type_checker(n.ast.s)(context), ast_to_type_checker(n.ast.color)(context))
  : n.ast.kind == "ellipse" ?
    CSharp.mk_ellipse(n.range, ast_to_type_checker(n.ast.cx)(context), ast_to_type_checker(n.ast.cy)(context), ast_to_type_checker(n.ast.w)(context), ast_to_type_checker(n.ast.h)(context), ast_to_type_checker(n.ast.color)(context))
  : n.ast.kind == "rectangle" ?
    CSharp.mk_rectangle(n.range, ast_to_type_checker(n.ast.cx)(context), ast_to_type_checker(n.ast.cy)(context), ast_to_type_checker(n.ast.w)(context), ast_to_type_checker(n.ast.h)(context), ast_to_type_checker(n.ast.color)(context))
  : n.ast.kind == "sprite" ?
    CSharp.mk_sprite(n.range, ast_to_type_checker(n.ast.sprite)(context), ast_to_type_checker(n.ast.cx)(context), ast_to_type_checker(n.ast.cy)(context), ast_to_type_checker(n.ast.w)(context), ast_to_type_checker(n.ast.h)(context), ast_to_type_checker(n.ast.rotation)(context))
  : n.ast.kind == "other surface" ?
    CSharp.mk_other_surface(n.range, ast_to_type_checker(n.ast.s)(context), ast_to_type_checker(n.ast.dx)(context), ast_to_type_checker(n.ast.dy)(context), ast_to_type_checker(n.ast.sx)(context), ast_to_type_checker(n.ast.sy)(context))

  : n.ast.kind == "mk-empty-render-grid" ?
    CSharp.mk_empty_render_grid(n.range, ast_to_type_checker(n.ast.w)(context), ast_to_type_checker(n.ast.h)(context))
  : n.ast.kind == "mk-render-grid-pixel" ?
    CSharp.mk_render_grid_pixel(n.range, ast_to_type_checker(n.ast.w)(context), ast_to_type_checker(n.ast.h)(context), ast_to_type_checker(n.ast.status)(context))
  : (() => { console.log(`Error: unsupported ast node: ${JSON.stringify(n)}`); throw new Error(`Unsupported ast node: ${JSON.stringify(n)}`)})()

