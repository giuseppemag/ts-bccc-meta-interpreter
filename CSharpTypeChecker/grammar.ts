import * as Immutable from 'immutable';
import { apply, co_error, co_get_state, co_set_state, co_unit, Coroutine, inl, inr, Option, Prod, Sum, Unit } from 'ts-bccc';
import * as CCC from 'ts-bccc';

import { co_catch, co_lookup, co_stateless } from '../ccc_aux';
import { join_source_ranges, mk_range, SourceRange, zero_range } from '../source_range';
import { BinOpKind, Token, UnaryOpKind } from './lexer';
import {
  and_op,
  arrow_op,
  class_keyword,
  comma_sign,
  div_op,
  dot_sign,
  else_keyword,
  eof,
  eq_op,
  equal_sign,
  for_keyword,
  geq_op,
  gt_op,
  identifier,
  identifier_token,
  if_keyword,
  ignore_whitespace,
  left_bracket,
  left_curly_bracket,
  left_square_bracket,
  leq_op,
  lt_op,
  merge_errors,
  minus_op,
  mk_and,
  mk_array_cons_call,
  mk_array_decl,
  mk_arrow,
  mk_assign,
  mk_bracket,
  mk_call,
  mk_class_declaration,
  mk_constructor_call,
  mk_constructor_declaration,
  mk_dbg,
  mk_decl,
  mk_decl_and_init,
  mk_div,
  mk_eq,
  mk_field_ref,
  mk_for,
  mk_function_declaration,
  mk_generic_type_decl,
  mk_geq,
  mk_get_array_value_at,
  mk_gt,
  mk_if_then,
  mk_if_then_else,
  mk_leq,
  mk_lt,
  mk_minus,
  mk_mod,
  mk_neq,
  mk_noop,
  mk_or,
  mk_override,
  mk_pair,
  mk_plus,
  mk_private,
  mk_protected,
  mk_public,
  mk_record_type_decl,
  mk_return,
  mk_semicolon,
  mk_static,
  mk_tc_dbg,
  mk_times,
  mk_tuple_type_decl,
  mk_unit,
  mk_virtual,
  mk_while,
  mk_xor,
  mod_op,
  neq_op,
  new_keyword,
  or_op,
  override_modifier,
  plus_op,
  private_modifier,
  protected_modifier,
  public_modifier,
  return_sign,
  right_bracket,
  right_curly_bracket,
  right_square_bracket,
  semicolon_sign,
  static_modifier,
  term,
  times_op,
  virtual_modifier,
  while_keyword,
  xor_op,
  negative_number,
  parser_or,
  mk_not,
  not_op,
  mk_array_cons_call_and_init,
} from './primitives';

let priority_operators_table =
  Immutable.Map<string, {priority:number, associativity:"left"|"right"}>()
  .set("()", {priority:12, associativity:"left"})
  .set("[]", {priority:12, associativity:"left"})
  .set(".", {priority:12, associativity:"left"})
  .set("*", {priority:10, associativity:"right"})
  .set("/", {priority:10, associativity:"right"})
  .set("%", {priority:10, associativity:"right"})
  .set("+", {priority:7, associativity:"right"})
  .set("-", {priority:7, associativity:"right"})
  .set(">", {priority:6, associativity:"right"})
  .set("<", {priority:6, associativity:"right"})
  .set("<=", {priority:6, associativity:"right"})
  .set(">=", {priority:6, associativity:"right"})
  .set("==", {priority:5, associativity:"right"})
  .set("!=", {priority:5, associativity:"right"})
  .set("not", {priority:4, associativity:"right"})
  .set("xor", {priority:4, associativity:"right"})
  .set("&&", {priority:4, associativity:"right"})
  .set("||", {priority:4, associativity:"right"})
  .set("=>", {priority:4, associativity:"right"})
  .set(",", {priority:3, associativity:"right"})


export type ModifierAST = { kind:"private" } | { kind:"public" } | { kind:"static" } | { kind:"protected" } | { kind:"virtual" } | { kind:"override" }

export interface DebuggerAST { kind: "debugger" }
export interface TCDebuggerAST { kind: "typechecker_debugger" }

export interface StringAST { kind: "string", value:string }
export interface BoolAST { kind: "bool", value: boolean }
export interface IntAST { kind: "int", value: number }
export interface FloatAST { kind: "float", value: number }
export interface DoubleAST { kind: "double", value: number }
export interface IdAST { kind: "id", value: string }
export interface ForAST { kind: "for", i:ParserRes, c:ParserRes, s:ParserRes, b:ParserRes }
export interface WhileAST { kind: "while", c:ParserRes, b:ParserRes }
export interface IfAST { kind: "if", c:ParserRes, t:ParserRes, e:Option<ParserRes> }
export interface DeclAST { kind: "decl", l:ParserRes, r:ParserRes }
export interface DeclAndInitAST { kind: "decl and init", l:ParserRes, r:ParserRes, v:ParserRes }
export interface AssignAST { kind: "=", l:ParserRes, r:ParserRes }
export interface FieldRefAST { kind: ".", l:ParserRes, r:ParserRes }
export interface SemicolonAST { kind: ";", l:ParserRes, r:ParserRes }
export interface ReturnAST { kind: "return", value:ParserRes }
export interface NoopAST { kind: "noop" }
export interface ArgsAST { kind: "args", value:Immutable.List<DeclAST> }
export interface BracketAST { kind:"bracket", e:ParserRes }
export interface UnitAST { kind: "unit" }

export interface FieldAST { decl:DeclAST | DeclAndInitAST, modifiers:Immutable.List<{ range:SourceRange, ast:ModifierAST }> }
export interface MethodAST { decl:FunctionDeclarationAST, modifiers:Immutable.List<{ range:SourceRange, ast:ModifierAST }> }
export interface ConstructorAST { decl:ConstructorDeclarationAST, modifiers:Immutable.List<{ range:SourceRange, ast:ModifierAST }> }
export interface ClassAST { kind: "class", C_name:string, fields:Immutable.List<FieldAST>, methods:Immutable.List<MethodAST>, constructors:Immutable.List<ConstructorAST> }

export interface BinOpAST { kind: BinOpKind, l:ParserRes, r:ParserRes }
export interface UnaryOpAST { kind: UnaryOpKind, e:ParserRes }
export interface ConstructorDeclarationAST { kind:"cons_decl", range:SourceRange, name:string, arg_decls:Immutable.List<DeclAST>, body:ParserRes }
export interface FunctionDeclarationAST { kind:"func_decl", range:SourceRange, name:string, return_type:ParserRes, arg_decls:Immutable.List<DeclAST>, body:ParserRes }
export interface FunctionCallAST { kind:"func_call", name:ParserRes, actuals:Array<ParserRes> }
export interface ConstructorCallAST { kind:"cons_call", name:string, actuals:Array<ParserRes> }
export interface ArrayConstructorCallAST { kind:"array_cons_call", type:ParserRes, actual:ParserRes }
export interface ArrayConstructorCallAndInitAST { kind:"array_cons_call_and_init", type:ParserRes, actuals:ParserRes[] }

export interface GetArrayValueAtAST {kind:"get_array_value_at", array:ParserRes, index:ParserRes }

export interface EmptySurface { kind: "empty surface", w:ParserRes, h:ParserRes, color:ParserRes }
export interface Sprite { kind: "sprite", cx:ParserRes, cy:ParserRes, w:ParserRes, h:ParserRes, sprite:ParserRes, rotation:ParserRes }
export interface Circle { kind: "circle", cx:ParserRes, cy:ParserRes, r:ParserRes, color:ParserRes }
export interface Square { kind: "square", cx:ParserRes, cy:ParserRes, s:ParserRes, color:ParserRes, rotation:ParserRes }
export interface Ellipse { kind: "ellipse", cx:ParserRes, cy:ParserRes, w:ParserRes, h:ParserRes, color:ParserRes, rotation:ParserRes }
export interface Rectangle { kind: "rectangle", cx:ParserRes, cy:ParserRes, w:ParserRes, h:ParserRes, color:ParserRes, rotation:ParserRes }
export interface Line { kind:"line", x1:ParserRes, y1:ParserRes, x2:ParserRes, y2:ParserRes, width:ParserRes, color:ParserRes, rotation:ParserRes }
export interface Polygon { kind:"polygon", points:ParserRes, color:ParserRes, rotation:ParserRes }
export interface Text { kind:"text", t:ParserRes, x:ParserRes, y:ParserRes, size:ParserRes, color:ParserRes, rotation:ParserRes }
export interface OtherSurface { kind: "other surface", s:ParserRes, dx:ParserRes, dy:ParserRes, sx:ParserRes, sy:ParserRes, rotation:ParserRes }
export type RenderSurfaceAST = EmptySurface | Circle | Square | Ellipse | Rectangle | Line | Polygon | Text | Sprite | OtherSurface

export interface GenericTypeDeclAST { kind:"generic type decl", f:ParserRes, args:Array<ParserRes> }

export interface ArrayTypeDeclAST { kind:"array decl", t:ParserRes }

export interface TupleTypeDeclAST { kind:"tuple type decl", args:Array<ParserRes> }
export interface RecordTypeDeclAST { kind:"record type decl", args:Array<DeclAST> }

export type AST = UnitAST | StringAST | IntAST | FloatAST | DoubleAST | BoolAST | IdAST | FieldRefAST
                | GenericTypeDeclAST | TupleTypeDeclAST | RecordTypeDeclAST
                | AssignAST | DeclAST | DeclAndInitAST | IfAST | ForAST | WhileAST | SemicolonAST | ReturnAST | ArgsAST
                | BinOpAST | UnaryOpAST | FunctionDeclarationAST | FunctionCallAST
                | ClassAST | ConstructorCallAST | ArrayConstructorCallAST
                | DebuggerAST | TCDebuggerAST | NoopAST
                | RenderSurfaceAST | ArrayTypeDeclAST
                | ModifierAST | GetArrayValueAtAST | BracketAST | ArrayConstructorCallAndInitAST

export interface ParserRes { range:SourceRange, ast:AST }
export interface ParserError { priority:number, message:string, range:SourceRange }
export interface ParserState { tokens:Immutable.List<Token>, branch_priority:number }
export type Parser = Coroutine<ParserState, ParserError, ParserRes>

export let mk_parser_state = (tokens:Immutable.List<Token>) => ({ tokens:tokens, branch_priority:0 })
let no_match : Coroutine<ParserState,ParserError,Unit> = co_get_state<ParserState,ParserError>().then(s => co_set_state<ParserState,ParserError>({...s, branch_priority:0}))
let partial_match : Coroutine<ParserState,ParserError,Unit> = co_get_state<ParserState,ParserError>().then(s => co_set_state<ParserState,ParserError>({...s, branch_priority:50}))
let full_match : Coroutine<ParserState,ParserError,Unit> = co_get_state<ParserState,ParserError>().then(s => co_set_state<ParserState,ParserError>({...s, branch_priority:100}))

let dbg: Parser = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.tokens.isEmpty())
    return co_error({ range:mk_range(-1,0,0,0), priority:s.branch_priority, message:"found empty state, expected identifier" })
  let i = s.tokens.first()
  if (i.kind == "debugger") {
    let res = mk_dbg(i.range)
    return co_set_state<ParserState, ParserError>({...s, tokens: s.tokens.rest().toList() }).then(_ => co_unit(res))
  }
  else return co_error({ range:i.range, priority:s.branch_priority, message:`expected debugger but found ${i.kind}` })
}))

let tc_dbg: Parser = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.tokens.isEmpty())
    return co_error({ range:mk_range(-1,0,0,0), priority:s.branch_priority, message:"found empty state, expected identifier" })
  let i = s.tokens.first()
  if (i.kind == "typechecker_debugger") {
    let res = mk_tc_dbg(i.range)
    return co_set_state<ParserState, ParserError>({...s, tokens: s.tokens.rest().toList() }).then(_ => co_unit(res))
  }
  else return co_error({ range:i.range, priority:s.branch_priority, message:`expected typecheker debugger but found ${i.kind}` })
}))

let index_of : Coroutine<ParserState,ParserError,{val:ParserRes, range:SourceRange}> =
                left_square_bracket.then(ls =>
                  expr().then(actual =>
                  right_square_bracket.then(rs =>
                  co_unit({val:actual, range:join_source_ranges(ls,rs)})
                  )))

export let par : Coroutine<ParserState,ParserError,{val:ParserRes[], range:SourceRange}> =
  no_match.then(_ =>
  left_bracket.then(lb =>
  partial_match.then(_ =>
  actuals().then((actuals:Array<ParserRes>) =>
  right_bracket.then(rb =>
  full_match.then(_ =>
  co_unit({val:actuals, range:join_source_ranges(lb,rb)})))))))

let empty_table = {
  symbols: Immutable.Stack<ParserRes>(),
  callables: Immutable.Stack<boolean>(),
  ops: Immutable.Stack<Prod<string, unary_or_binary_op>>()
}

let reduce_table = (table: {
  symbols: Immutable.Stack<ParserRes>,
  callables: Immutable.Stack<boolean>,
  ops: Immutable.Stack<Prod<string, unary_or_binary_op>>
}): ParserRes => {
  if (table.symbols.count() == 0 && table.ops.count() == 0) return { ast: { kind: "unit" }, range: mk_range(-1, -1, -1, -1) }
  if (table.symbols.count() == 1 && table.ops.count() == 0) return table.symbols.peek()
  let res = reduce_table_2(table.symbols, table.ops, table.callables, true)
  return res.new_top
}
let is_callable = (e: ParserRes): boolean => {

  let e_k = e.ast.kind
  // console.log("")
  // console.log("is callable", e_k)
  // console.log("")
  return e_k == "." ||
    e_k == "func_call" ||
    e_k == "get_array_value_at" ||
    e_k == "bracket" ||
    e_k == "id"
}

let reduce_table_2 = (symbols: Immutable.Stack<ParserRes>,
  ops: Immutable.Stack<Prod<string, unary_or_binary_op>>,
  callables: Immutable.Stack<boolean>,
  reduce_to_end: boolean): { new_top: ParserRes, symbols: Immutable.Stack<ParserRes>, ops: Immutable.Stack<Prod<string, unary_or_binary_op>>, callables: Immutable.Stack<boolean> } => {

  if (reduce_to_end && symbols.count() == 1 && ops.count() == 0) {
    return { new_top: symbols.peek(), callables: callables.pop().push(is_callable(symbols.peek())), symbols: symbols, ops: ops }
  }

  let op = ops.peek()
  // console.log("ops_count", ops.count(), JSON.stringify(ops))
  // console.log("symbols_count", symbols.count(), JSON.stringify(symbols))
  // console.log("callables_count", callables.count(), JSON.stringify(callables))
  // console.log("op", callables.count(), JSON.stringify(callables))

  if (op.snd.kind == "binary") {
    let snd = symbols.peek()
    let fst = symbols.pop().peek()
    symbols = symbols.pop().pop()
    let new_top = op.snd.f(fst, snd)
    callables = callables.pop().pop().pop()
    let is_new_top_callable = is_callable(new_top)
    callables = callables.push(is_new_top_callable)

    if (reduce_to_end) {
      return reduce_table_2(symbols.push(new_top), ops.pop(), callables, reduce_to_end)
    }
    return { new_top: new_top, symbols: symbols.push(new_top), callables: callables, ops: ops.pop() }
  }
  else {
    let fst = symbols.peek()
    symbols = symbols.pop()


    let is_fst_callable = fst == undefined ? false
      : callables.count() == 0 ? false
        : callables.peek()
    callables = callables.pop()

    let new_top = op.snd.f(fst == undefined ? "none" : fst, is_fst_callable)

    if (new_top.kind == "0-ary_push_back") {
      symbols = fst == undefined ? symbols : symbols.push(fst)
      symbols = symbols.push(new_top.value)
      callables = callables.pop().push(is_callable(new_top.value))
    }
    else {
      callables = callables.pop().pop().push(is_callable(new_top.value))
      symbols = symbols.push(new_top.value)
    }

    if (reduce_to_end && symbols.count() > 0) {
      return reduce_table_2(symbols, ops.pop(), callables, reduce_to_end)
    }

    return { new_top: new_top.value, symbols: symbols, callables: callables, ops: ops.pop() }
  }
}

let expr_after_op = (symbols: Immutable.Stack<ParserRes>,
  callables: Immutable.Stack<boolean>,
  ops: Immutable.Stack<Prod<string, unary_or_binary_op>>,
  current_op: string,
  compose_current: unary_or_binary_op):
  Coroutine<ParserState, ParserError, {
    symbols: Immutable.Stack<ParserRes>,
    callables: Immutable.Stack<boolean>,
    ops: Immutable.Stack<Prod<string, unary_or_binary_op>>
  }> => {
  if (ops.count() > 0 &&
    ((ops.peek().snd.kind == "binary" &&
      symbols.count() >= 2) ||
      (ops.peek().snd.kind == "unary" &&
        symbols.count() >= 1)
    )) {

    // console.log("A")
    let op_p = priority_operators_table.get(ops.peek().fst)
    let current_p = priority_operators_table.get(current_op)
    if (op_p.priority > current_p.priority ||
      (op_p.priority == current_p.priority &&
        op_p.associativity == "left")) {
        let res = reduce_table_2(symbols, ops, callables, false)
        return expr_after_op(res.symbols, res.callables, res.ops, current_op, compose_current)
    }
  }
  // console.log("B")
  return expr_AUX({ symbols: symbols, ops: ops.push({ fst: current_op, snd: compose_current }), callables: current_op == "()" ? callables : callables.push(false) })
}

type SymTable = {
  symbols: Immutable.Stack<ParserRes>,
  callables: Immutable.Stack<boolean>,
  ops: Immutable.Stack<Prod<string, unary_or_binary_op>>
}
let comma_to_array = (comma:ParserRes) : ParserRes[] =>
  {
    if(comma.ast.kind == ","){
      let left = comma.ast.l
      let right = comma_to_array(comma.ast.r)
      return [left].concat(right)
    }
    else
    {
      return [comma]
    }
  }
  
type unary_or_binary_op =
  { kind: "binary", f: (l: ParserRes, r: ParserRes) => ParserRes } |
  { kind: "unary", f: (l: ParserRes | "none", is_callable: boolean) => { kind: "res" | "0-ary_push_back", value: ParserRes } }

let mk_unary = (f: (l: ParserRes | "none", is_callable: boolean) => { kind: "res" | "0-ary_push_back", value: ParserRes }): unary_or_binary_op => ({ kind: "unary", f: f })
let mk_binary = (f: (l: ParserRes, r: ParserRes) => ParserRes): unary_or_binary_op => ({ kind: "binary", f: f })

let expr_AUX = (
  table: {
  symbols: Immutable.Stack<ParserRes>,
  callables: Immutable.Stack<boolean>,
  ops: Immutable.Stack<Prod<string, unary_or_binary_op>>
},
try_par?:boolean): Coroutine<ParserState, ParserError, SymTable> => {

  let cases = (l: ParserRes | "none") => {
    let symbols = table.symbols
    let callables = table.callables
    if (l != "none") {
      symbols = table.symbols.push(l)
      callables = table.callables.push(is_callable(l))
    }
    else {
    }
    // to improve
    // not_op.then(_ =>
    //   expr().then(e =>
    //   co_unit<ParserState,ParserError,ParserRes>(mk_not(e))))
    return parser_or<SymTable>(not_op.then(_ => expr_after_op(symbols, callables, table.ops, "not", mk_unary((l, is_callable) => ({ kind: "res", value: mk_not(l as any) })))),
          parser_or<SymTable>(index_of.then(res => expr_after_op(symbols, callables, table.ops, "[]", mk_unary((l, is_callable) => ({ kind: "res", value: mk_get_array_value_at(res.range, l as any, res.val) })))),
          parser_or<SymTable>(dot_sign.then(_ => expr_after_op(symbols, callables, table.ops, ".", mk_binary((l, r) => mk_field_ref(l, r)))),
          parser_or<SymTable>(par.then(res => {
            let actuals = res.val
            let range = res.range
            actuals = actuals.length == 1 && actuals[0].ast.kind == "unit" ? [] : actuals
            return expr_after_op(symbols,  l!= "none" ? callables.push(is_callable(l)) : callables, table.ops, "()",
              mk_unary((_l, is_callable) => {
                

                return _l == "none" ? { kind: "0-ary_push_back", value: mk_bracket(actuals[0], range) }
                  : !is_callable ? { kind: "0-ary_push_back", value: mk_bracket(actuals[0], range) }
                    : { kind: "res", value: mk_call(_l, actuals.length == 1 && actuals[0].ast.kind == "," ? comma_to_array(actuals[0]) : actuals, join_source_ranges(_l.range, res.range)) }
              }))
          }),
          parser_or<SymTable>(comma.then(_ => expr_after_op(symbols, callables, table.ops, ",", mk_binary((l, r) => mk_pair(l, r)))),
          parser_or<SymTable>(arrow_op.then(_ => expr_after_op(symbols, callables, table.ops, "=>", mk_binary((l, r) => //console.log("mk_arrow-1", JSON.stringify(l)) ||
                                                                                                                        //console.log("mk_arrow-2", JSON.stringify(r)) ||
                                                                                                                        mk_arrow(l, r)))),
          parser_or<SymTable>(plus_op.then(_ => expr_after_op(symbols, callables, table.ops, "+", mk_binary((l, r) => mk_plus(l, r)))),
          parser_or<SymTable>(minus_op.then(_ => expr_after_op(symbols, callables, table.ops, "-", mk_binary((l, r) => mk_minus(l, r)))),
          parser_or<SymTable>(co_stateless<ParserState, ParserError, ParserRes>(negative_number).then(_ => expr_after_op(symbols, callables, table.ops, "+", mk_binary((l, r) => mk_plus(l, r)))),
          parser_or<SymTable>(times_op.then(_ => expr_after_op(symbols, callables, table.ops, "*", mk_binary((l, r) => mk_times(l, r)))),
          parser_or<SymTable>(div_op.then(_ => expr_after_op(symbols, callables, table.ops, "/", mk_binary((l, r) => mk_div(l, r)))),
          parser_or<SymTable>(mod_op.then(_ => expr_after_op(symbols, callables, table.ops, "%", mk_binary((l, r) => mk_mod(l, r)))),
          parser_or<SymTable>(lt_op.then(_ => expr_after_op(symbols, callables, table.ops, "<", mk_binary((l, r) => mk_lt(l, r)))),
          parser_or<SymTable>(gt_op.then(_ => expr_after_op(symbols, callables, table.ops, ">", mk_binary((l, r) => mk_gt(l, r)))),
          parser_or<SymTable>(leq_op.then(_ => expr_after_op(symbols, callables, table.ops, "<=", mk_binary((l, r) => mk_leq(l, r)))),
          parser_or<SymTable>(geq_op.then(_ => expr_after_op(symbols, callables, table.ops, ">=", mk_binary((l, r) => mk_geq(l, r)))),
          parser_or<SymTable>(eq_op.then(_ => expr_after_op(symbols, callables, table.ops, "==", mk_binary((l, r) => mk_eq(l, r)))),
          parser_or<SymTable>(neq_op.then(_ => expr_after_op(symbols, callables, table.ops, "!=", mk_binary((l, r) => mk_neq(l, r)))),
          parser_or<SymTable>(and_op.then(_ => expr_after_op(symbols, callables, table.ops, "&&", mk_binary((l, r) => mk_and(l, r)))),
          parser_or<SymTable>(or_op.then(_ => expr_after_op(symbols, callables, table.ops, "||", mk_binary((l, r) => mk_or(l, r)))),
          parser_or<SymTable>(xor_op.then(_ => expr_after_op(symbols, callables, table.ops, "xor", mk_binary((l, r) => mk_xor(l, r)))),
          co_unit({ ...table, symbols: symbols, callables: callables })
        )))))))))))))))))))))
      }
  
  // return parser_or<SymTable>(term().then(l => cases(l).then(res => console.log("RES1", res)||co_unit(res))), cases("none").then(res => console.log("RES2", res) || co_unit(res)))
  return parser_or<SymTable>(term(try_par?try_par:false).then(l => cases(l)), cases("none"))
}

let cons_call = () : Coroutine<ParserState, ParserError, ParserRes> =>
    new_keyword.then(new_range =>
    identifier_token.then(class_name =>
    left_bracket.then(_ =>
    actuals().then((actuals:Array<ParserRes>) =>
    right_bracket.then(rb =>

    {
      let args = 
        actuals.length == 1 && actuals[0].ast.kind == "unit" ? [] :
        actuals.length == 1 && actuals[0].ast.kind == "," ? comma_to_array(actuals[0]) : actuals
      return co_unit(mk_constructor_call(join_source_ranges(new_range, rb), class_name.id, args))}
    )))))

let array_new = () : Coroutine<ParserState, ParserError, ParserRes> =>
    new_keyword.then(new_range  =>
    type_decl().then(array_type =>
    left_square_bracket.then(_ =>
    parser_or(expr(), term(false))
    .then((actual:ParserRes) =>
    right_square_bracket.then(rs =>
    co_unit(mk_array_cons_call(join_source_ranges(new_range, rs), array_type, actual))
    )))))

let array_new_and_init = () : Coroutine<ParserState, ParserError, ParserRes> =>
    new_keyword.then(new_range  =>
    type_decl(false).then(array_type =>
    left_square_bracket.then(_ =>
    right_square_bracket.then(_ =>
    left_curly_bracket.then(_ => 
    actuals().then(_actuals =>
    right_curly_bracket.then(rs => 
    {
      
      let actuals = _actuals[0].ast.kind == "," ? comma_to_array(_actuals[0]) : _actuals
      return co_unit(mk_array_cons_call_and_init(join_source_ranges(new_range, rs), array_type, actuals))
    }
    )))))))

export let expr = () : Coroutine<ParserState, ParserError, ParserRes> =>
  {
    let res = expr_AUX(empty_table, true).then(e => co_unit(reduce_table(e)))
    return parser_or<ParserRes>(array_new_and_init(),
          parser_or<ParserRes>(array_new(),
          parser_or<ParserRes>(cons_call(),
                                res)))
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
  expr().then(l =>
    assign_right().then(r => co_unit(mk_assign(l,r))))

let type_args = () : Coroutine<ParserState, ParserError, Array<ParserRes>> =>
  parser_or<Array<ParserRes>>(
    type_decl().then(a =>
    parser_or<Array<ParserRes>>(
      comma.then(_ =>
        type_args().then(as =>
      co_unit([a, ...as]))),
      co_unit([a]))),
    co_unit(Array<ParserRes>()))

let tuple_or_record : Coroutine<ParserState,ParserError,ParserRes> =
  left_bracket.then(lb =>
    parser_or<ParserRes>(type_args().then(as =>
      right_bracket.then(rb =>
      co_unit(mk_tuple_type_decl(join_source_ranges(lb, rb), as)))),
      arg_decls().then(as =>
      right_bracket.then(rb =>
      co_unit(mk_record_type_decl(join_source_ranges(lb, rb), as))))
    )
  )

let array = (t:ParserRes) =>
  left_square_bracket.then(_ =>
    partial_match.then(_ =>
    right_square_bracket.then(end_range =>
    co_unit(mk_array_decl(join_source_ranges(t.range, end_range), t))
  )))

let type_decl = (check_array_decl=true) : Coroutine<ParserState,ParserError,ParserRes> =>
  parser_or<ParserRes>(
    check_array_decl ?
      parser_or<ParserRes>(
        tuple_or_record.then(t => 
          array(t)
        ),
        tuple_or_record) : tuple_or_record,
    identifier.then(i =>
      parser_or<ParserRes>( (check_array_decl ? array(i) : co_error({ range:zero_range, priority: -1, message:"" })),
      parser_or<ParserRes>(
        lt_op.then(_ =>
          partial_match.then(_ =>
          type_args().then(args =>
          gt_op.then(end_range =>
          co_unit(mk_generic_type_decl(join_source_ranges(i.range, end_range), i, args))
        )))),
      check_array_decl ?
        parser_or<ParserRes>(
          left_square_bracket.then(_ =>
            partial_match.then(_ =>
            right_square_bracket.then(end_range =>
            co_unit(mk_array_decl(join_source_ranges(i.range, end_range), i))
          ))),
        co_unit(i)) : co_unit(i)
      ))))

let decl_init : () => Coroutine<ParserState,ParserError,DeclAndInitAST> = () =>
  no_match.then(_ =>
  type_decl().then(l =>
  identifier.then(r =>
  partial_match.then(_ =>
  assign_right().then(v =>
  full_match.then(_ =>
  co_unit<ParserState,ParserError,DeclAndInitAST>(mk_decl_and_init(l, r, v))))))))

let decl : () => Coroutine<ParserState,ParserError,DeclAST> = () =>
  no_match.then(_ =>
  type_decl().then(l =>
  identifier.then(r =>
  partial_match.then(_ =>
  co_unit(mk_decl(l, r))))))

let actuals = () : Coroutine<ParserState, ParserError, Array<ParserRes>> =>
  parser_or<Array<ParserRes>>(
    expr().then(a =>
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
    co_unit<ParserState,ParserError,ParserRes>(mk_return(e, join_source_ranges(return_range, e.range))))
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
    co_unit(mk_if_then_else(join_source_ranges(if_keyword, e.range),c, t, e))))),
    co_unit(mk_if_then(join_source_ranges(if_keyword, t.range),c, t))))))))

let for_loop : (_:() => Parser) => Parser = (stmt:(ignore_semicolon?:boolean) => Parser) =>
  no_match.then(_ =>
  for_keyword.then(for_keyword_range =>
  partial_match.then(_ =>
  left_bracket.then(lb =>
  stmt().then(i =>
  expr().then(c =>
  semicolon.then(_ =>
  stmt(true).then(s =>
  right_bracket.then(_ =>
  stmt().then(b =>
  full_match.then(_ =>
  co_unit(mk_for(join_source_ranges(for_keyword_range, b.range), i, c, s, b)))))))))))))

let while_loop : (_:() => Parser) => Parser = (stmt:() => Parser) =>
  no_match.then(_ =>
  while_keyword.then(while_keyword_range =>
  partial_match.then(_ =>
  expr().then(c =>
  stmt().then(b =>
  full_match.then(_ =>
  co_unit(mk_while(join_source_ranges(while_keyword_range, b.range), c, b))))))))

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
  right_curly_bracket.then(rb =>
  full_match.then(_ =>
  co_unit(mk_constructor_declaration(join_source_ranges(function_name.range, rb),
                                  function_name.id,
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
  right_curly_bracket.then(rb =>
  full_match.then(_ =>
  co_unit(mk_function_declaration(join_source_ranges(return_type.range, rb),
                                  return_type,
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
    co_unit<ParserState,ParserError,ParserRes>({ range: fun_decl.range, ast:fun_decl })),
  parser_or<ParserRes>(class_declaration(),
  inner_statement()))

let unchanged = CCC.id<Coroutine<ParserState, ParserError, ParserRes>>().f

let inner_statement = (skip_semicolon?:boolean) : Parser =>
  parser_or<ParserRes>(with_semicolon(co_unit(mk_noop())),
  parser_or<ParserRes>(bracketized_statement(),
  parser_or<ParserRes>(for_loop(function_statement),
  parser_or<ParserRes>(while_loop(function_statement),
  parser_or<ParserRes>(if_conditional(function_statement),
  parser_or<ParserRes>((skip_semicolon ? unchanged : with_semicolon)(decl().then(d =>
    co_unit<ParserState,ParserError,ParserRes>({ range:join_source_ranges(d.l.range, d.r.range), ast:d }))),
  parser_or<ParserRes>((skip_semicolon ? unchanged : with_semicolon)(decl_init().then(d_i =>
    co_unit<ParserState,ParserError,ParserRes>({ range:join_source_ranges(d_i.l.range, d_i.v.range), ast:d_i }))),
  parser_or<ParserRes>((skip_semicolon ? unchanged : with_semicolon)(assign()),
  parser_or<ParserRes>((skip_semicolon ? unchanged : with_semicolon)(expr()),
  parser_or<ParserRes>((skip_semicolon ? unchanged : with_semicolon)(no_match.then(_ => dbg)),
  with_semicolon(no_match.then(_ => tc_dbg))
  ))))))))))

let function_statement = (skip_semicolon?:boolean) : Parser =>
  parser_or<ParserRes>(with_semicolon(return_statement()),inner_statement(skip_semicolon))

let generic_statements = (stmt: () => Parser, check_trailer: Coroutine<ParserState,ParserError,Unit>) : Parser =>
    parser_or<ParserRes>(
      stmt().then(l =>
      parser_or<ParserRes>(
        generic_statements(stmt, check_trailer).then(r => co_unit(r.ast.kind == "noop" ? l : mk_semicolon(l, r))),
        check_trailer.then(_ => co_unit(l)))
      ),
      co_unit(mk_noop())
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
      with_semicolon(modifiers().then(ms =>
        parser_or<DeclAST | DeclAndInitAST>(
          decl_init().then(d => co_unit<ParserState, ParserError, DeclAST | DeclAndInitAST>(d)),
          decl().then(d => co_unit<ParserState, ParserError, DeclAST | DeclAndInitAST>(d))).then(d =>
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