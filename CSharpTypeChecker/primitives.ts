import { Coroutine, co_error, co_set_state, Unit, co_get_state, co_unit, apply, Option } from "ts-bccc";
import { ParserState, ParserError, Parser, ParserRes, DeclAST, DeclAndInitAST, ConstructorDeclarationAST, FunctionDeclarationAST, ConstructorAST, MethodAST, FieldAST, ModifierAST, expr, par } from "./grammar";
import { mk_range, SourceRange, zero_range, join_source_ranges, print_range } from "../source_range";
import { BinOpKind, UnaryOpKind } from "./lexer";
import { co_catch, co_repeat, some, none } from "../ccc_aux";
import * as Immutable from 'immutable'

export let parser_or = <a>(p:Coroutine<ParserState,ParserError,a>, q:Coroutine<ParserState,ParserError,a>) : Coroutine<ParserState,ParserError,a> =>
  co_catch<ParserState,ParserError,a>(merge_errors)(p)(q)

export const mk_generic_type_decl = (r:SourceRange, f:ParserRes, args:Array<ParserRes>) : ParserRes =>
  ({ range:r, ast:{ kind:"generic type decl", f:f, args:args } })

export const mk_get_array_value_at = (r:SourceRange, a:ParserRes, actual:ParserRes) : ParserRes =>
  ({ range:r, ast:{ kind:"get_array_value_at", array:a, index:actual } })

export const mk_ternary_if = (r:SourceRange, condition:ParserRes, then_else:ParserRes) : ParserRes =>
  ({ range:r, ast:{ kind:"ternary_if", condition:condition, then_else:then_else } })

export const mk_ternary_then_else = (r:SourceRange, _then:ParserRes, _else:ParserRes) : ParserRes =>
  ({ range:r, ast:{ kind:"ternary_then_else", _then:_then, _else:_else } })

export const mk_array_decl = (r:SourceRange, t:ParserRes) : ParserRes =>
  ({ range:r, ast:{ kind:"array decl", t:t } })

export const mk_tuple_type_decl = (r:SourceRange, args:Array<ParserRes>) : ParserRes =>
  ({ range:r, ast:{ kind:"tuple type decl", args:args } })

export const mk_record_type_decl = (r:SourceRange, args:Array<DeclAST>) : ParserRes =>
  ({ range:r, ast:{ kind:"record type decl", args:args } })

export const mk_string = (v:string, sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "string", value:v }})
export const mk_bracket = (e:ParserRes, r:SourceRange) : ParserRes => ({ range:r, ast:{ kind: "bracket", e:e }})
export const mk_unit = (sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "unit" }})
export const mk_bool = (v:boolean, sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "bool", value:v }})
export const mk_int = (v:number, sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "int", value:v }})
export const mk_float = (v:number, sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "float", value:v }})
export const mk_double = (v:number, sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "double", value:v }})
export const mk_identifier = (v:string, sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "id", value:v }})
export const mk_noop = () : ParserRes => ({ range:mk_range(-1,-1,-1,-1), ast:{ kind: "noop" }})

export const mk_return = (e:ParserRes, range:SourceRange) : ParserRes => ({ range:range, ast:{ kind: "return", value:e }})
export const mk_args = (sr:SourceRange,ds:Array<DeclAST>) : ParserRes => ({ range:sr, ast:{ kind: "args", value:Immutable.List<DeclAST>(ds) }})
export const mk_decl_and_init = (l:ParserRes,r:ParserRes,v:ParserRes) : DeclAndInitAST => ({ kind: "decl and init", l:l, r:r, v:v })
export const mk_decl = (l:ParserRes,r:ParserRes) : DeclAST => ({ kind: "decl", l:l, r:r })
export const mk_assign = (l:ParserRes,r:ParserRes) : ParserRes => ({ range:join_source_ranges(l.range, r.range), ast:{ kind: "=", l:l, r:r }})
export const mk_for = (range:SourceRange, i:ParserRes,c:ParserRes,s:ParserRes,b:ParserRes) : ParserRes => ({ range:range, ast:{ kind: "for", i:i, c:c, s:s, b:b }})
export const mk_while = (range:SourceRange, c:ParserRes,b:ParserRes) : ParserRes => ({ range:range, ast:{ kind: "while", c:c, b:b }})
export const mk_if_then = (range:SourceRange, c:ParserRes,t:ParserRes) : ParserRes => ({ range:range, ast:{ kind: "if", c:c, t:t, e:apply(none<ParserRes>(), {}) }})
export const mk_if_then_else = (range:SourceRange, c:ParserRes,t:ParserRes,e:ParserRes) : ParserRes => ({ range:range, ast:{ kind: "if", c:c, t:t, e:apply(some<ParserRes>(), e) }})
export const mk_field_ref = (l:ParserRes,r:ParserRes) : ParserRes => ({ range:join_source_ranges(l.range, r.range), ast:{ kind: ".", l:l, r:r }})
export const mk_semicolon = (l:ParserRes,r:ParserRes) : ParserRes => ({ range:join_source_ranges(l.range, r.range), ast:{ kind: ";", l:l, r:r }})

export const mk_bin_op = (k:BinOpKind) => (l:ParserRes,r:ParserRes) : ParserRes => ({ range:join_source_ranges(l.range, r.range), ast:{ kind: k, l:l, r:r }})
export const mk_pair = mk_bin_op(",")
export const mk_arrow = mk_bin_op("=>")
export const mk_as = mk_bin_op("as")
export const mk_plus = mk_bin_op("+")
export const mk_minus = mk_bin_op("-")
export const mk_times = mk_bin_op("*")
export const mk_div = mk_bin_op("/")
export const mk_mod = mk_bin_op("%")
export const mk_lt = mk_bin_op("<")
export const mk_gt = mk_bin_op(">")
export const mk_leq = mk_bin_op("<=")
export const mk_geq = mk_bin_op(">=")
export const mk_eq = mk_bin_op("==")
export const mk_neq = mk_bin_op("!=")
export const mk_and = mk_bin_op("&&")
export const mk_or = mk_bin_op("||")
export const mk_xor = mk_bin_op("xor")

export const mk_unary_op = (k:UnaryOpKind) => (e:ParserRes) : ParserRes => ({ range:e.range, ast:{ kind: k, e:e }})
export const mk_not = mk_unary_op("not")

export const mk_call = (f_name:ParserRes, actuals:Array<ParserRes>, range:SourceRange) : ParserRes =>
  ({  range: range,
      ast: {kind:"func_call", name:f_name, actuals:actuals} })

export const mk_constructor_call = (new_range:SourceRange, C_name:string, actuals:Array<ParserRes>) : ParserRes =>
  ({ range:new_range, ast:{ kind:"cons_call", name:C_name, actuals:actuals } })

export const mk_array_cons_call = (new_range:SourceRange, _type:ParserRes, actual:ParserRes) : ParserRes =>
  ({ range:new_range, ast:{ kind:"array_cons_call", type:_type, actual:actual } })

export const mk_array_cons_call_and_init = (new_range:SourceRange, _type:ParserRes, actuals:ParserRes[]) : ParserRes =>
  ({ range:new_range, ast:{ kind:"array_cons_call_and_init", type:_type, actuals:actuals } })

export const mk_constructor_declaration = (range:SourceRange, function_name:string, arg_decls:Immutable.List<DeclAST>, params_base_call:Option<ParserRes[]>, body:ParserRes) : ConstructorDeclarationAST =>
  ({kind:"cons_decl", name:function_name, arg_decls:arg_decls, body:body, params_base_call: params_base_call, range:range})

export const mk_function_declaration = (range:SourceRange, return_type:ParserRes, function_name:string, arg_decls:Immutable.List<DeclAST>, body:ParserRes) : FunctionDeclarationAST =>
  ({kind:"func_decl", name:function_name, return_type:return_type, arg_decls:arg_decls, body:body, range:range, params_base_call:[]})

export const mk_class_declaration = (C_name:string, extends_or_implements:string[],fields:Immutable.List<FieldAST>, methods:Immutable.List<MethodAST>, constructors:Immutable.List<ConstructorAST>, modifiers:Immutable.List<ModifierAST>, range:SourceRange) : ParserRes =>
  ({  range: range,
      ast: {kind:"class", C_name:C_name, 
            extends_or_implements: extends_or_implements,
            modifiers:modifiers,
            fields:fields, methods:methods, constructors:constructors } })

export const mk_private = (sr:SourceRange) : { range:SourceRange, ast:ModifierAST } => ({ range:sr, ast:{ kind:"private"}})
export const mk_public = (sr:SourceRange) : { range:SourceRange, ast:ModifierAST } => ({ range:sr, ast:{ kind:"public"}})
export const mk_protected = (sr:SourceRange) : { range:SourceRange, ast:ModifierAST } => ({ range:sr, ast:{ kind:"protected"}})
export const mk_static = (sr:SourceRange) : { range:SourceRange, ast:ModifierAST } => ({ range:sr, ast:{ kind:"static"}})
export const mk_override = (sr:SourceRange) : { range:SourceRange, ast:ModifierAST } => ({ range:sr, ast:{ kind:"override"}})
export const mk_abstract = (sr:SourceRange) : { range:SourceRange, ast:ModifierAST } => ({ range:sr, ast:{ kind:"abstract"}})
export const mk_interface = (sr:SourceRange) : { range:SourceRange, ast:ModifierAST } => ({ range:sr, ast:{ kind:"interface"}})
export const mk_virtual = (sr:SourceRange) : { range:SourceRange, ast:ModifierAST } => ({ range:sr, ast:{ kind:"virtual"}})

export const mk_dbg = (sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "debugger" }})
export const mk_tc_dbg = (sr:SourceRange) : ParserRes => ({ range:sr, ast:{ kind: "typechecker_debugger" }})

export const mk_empty_surface = (sr:SourceRange, w:ParserRes, h:ParserRes, col:ParserRes) : ParserRes => ({ range:sr, ast:{ kind: "empty surface", w:w, h:h, color:col } })
export const mk_circle = (sr:SourceRange, cx:ParserRes, cy:ParserRes, r:ParserRes, col:ParserRes) : ParserRes => ({ range:sr, ast:{ kind: "circle", cx:cx, cy:cy, r:r, color:col } })
export const mk_square = (sr:SourceRange, cx:ParserRes, cy:ParserRes, s:ParserRes, col:ParserRes, rotation:ParserRes) : ParserRes => ({ range:sr, ast:{ kind: "square", cx:cx, cy:cy, s:s, color:col, rotation } })
export const mk_ellipse = (sr:SourceRange, cx:ParserRes, cy:ParserRes, w:ParserRes, h:ParserRes, col:ParserRes, rotation:ParserRes) : ParserRes => ({ range:sr, ast:{ kind: "ellipse", cx:cx, cy:cy, w:w, h:h, color:col, rotation } })
export const mk_rectangle = (sr:SourceRange, cx:ParserRes, cy:ParserRes, w:ParserRes, h:ParserRes, col:ParserRes, rotation:ParserRes) : ParserRes => ({ range:sr, ast:{ kind: "rectangle", cx:cx, cy:cy, w:w, h:h, color:col, rotation } })
export const mk_sprite = (sr:SourceRange, sprite:ParserRes, cx:ParserRes, cy:ParserRes, w:ParserRes, h:ParserRes, rot:ParserRes) : ParserRes => ({ range:sr, ast:{ kind: "sprite", cx:cx, cy:cy, w:w, h:h, sprite:sprite, rotation:rot } })
export const mk_line = (sr:SourceRange, x1:ParserRes, y1:ParserRes, x2:ParserRes, y2:ParserRes, width:ParserRes, color:ParserRes, rotation:ParserRes) : ParserRes => ({ range:sr, ast:{ kind: "line", x1, y1, x2, y2, width, color, rotation } })
export const mk_polygon = (sr:SourceRange, points:ParserRes, color:ParserRes, rotation:ParserRes) : ParserRes => ({ range:sr, ast:{ kind: "polygon", points, color, rotation } })
export const mk_text = (sr:SourceRange, t:ParserRes, x:ParserRes, y:ParserRes, size:ParserRes, color:ParserRes, rotation:ParserRes) : ParserRes => ({ range:sr, ast:{ kind: "text", t, x, y, size, color, rotation } })
export const mk_other_surface = (sr:SourceRange, s:ParserRes, dx:ParserRes, dy:ParserRes, sx:ParserRes, sy:ParserRes, rotation:ParserRes) : ParserRes => ({ range:sr, ast:{ kind: "other surface", s:s, dx:dx, dy:dy, sx:sx, sy:sy, rotation } })

export const mk_empty_surface_prs : () => Parser = () =>
  empty_surface_keyword.then(esk =>
  term(true).then(l =>
  term(true).then(r =>
  term(true).then(col =>
  co_unit(mk_empty_surface(join_source_ranges(esk, col.range), l,r,col))
  ))))

export const mk_circle_prs : () => Parser = () =>
  circle_keyword.then(kw =>
  term(true).then(cx =>
  term(true).then(cy =>
  term(true).then(r =>
  term(true).then(col =>
  co_unit(mk_circle(join_source_ranges(kw, col.range), cx, cy, r, col))
  )))))

export const mk_square_prs : () => Parser = () =>
  square_keyword.then(kw =>
  term(true).then(cx =>
  term(true).then(cy =>
  term(true).then(r =>
  term(true).then(col =>
  term(true).then(rot =>
  co_unit(mk_square(join_source_ranges(kw, col.range), cx, cy, r, col, rot))
  ))))))

export const mk_ellipse_prs : () => Parser = () =>
  ellipse_keyword.then(kw =>
  term(true).then(cx =>
  term(true).then(cy =>
  term(true).then(w =>
  term(true).then(h =>
  term(true).then(col =>
  term(true).then(rot =>
  co_unit(mk_ellipse(join_source_ranges(kw, col.range), cx, cy, w, h, col, rot))
  )))))))

export const mk_rectangle_prs : () => Parser = () =>
  rectangle_keyword.then(kw =>
  term(true).then(cx =>
  term(true).then(cy =>
  term(true).then(w =>
  term(true).then(h =>
  term(true).then(col =>
  term(true).then(rot =>
  co_unit(mk_rectangle(join_source_ranges(kw, col.range), cx, cy, w, h, col, rot))
  )))))))

export const mk_line_prs : () => Parser = () =>
  line_keyword.then(kw =>
  term(true).then(x1 =>
  term(true).then(y1 =>
  term(true).then(x2 =>
  term(true).then(y2 =>
  term(true).then(w =>
  term(true).then(col =>
  term(true).then(rot =>
  co_unit(mk_line(join_source_ranges(kw, col.range), x1, y1, x2, y2, w, col, rot))
  ))))))))

export const mk_polygon_prs : () => Parser = () =>
  polygon_keyword.then(kw =>
  term(true).then(points =>
  term(true).then(col =>
  term(true).then(rot =>
  co_unit(mk_polygon(join_source_ranges(kw, col.range), points, col, rot))
  ))))

export const mk_text_prs : () => Parser = () =>
  text_keyword.then(kw =>
  term(true).then(t =>
  term(true).then(x =>
  term(true).then(y =>
  term(true).then(size =>
  term(true).then(col =>
  term(true).then(rot =>
  co_unit(mk_text(join_source_ranges(kw, col.range), t, x, y, size, col, rot))
  )))))))

export const mk_sprite_prs : () => Parser = () =>
  sprite_keyword.then(kw =>
  term(true).then(sprite =>
  term(true).then(cx =>
  term(true).then(cy =>
  term(true).then(w =>
  term(true).then(h =>
  term(true).then(rot =>
  co_unit(mk_sprite(join_source_ranges(kw, rot.range), sprite, cx, cy, w, h, rot))
  )))))))

export const mk_other_surface_prs : () => Parser = () =>
  other_surface_keyword.then(kw =>
  term(true).then(s =>
  term(true).then(dx =>
  term(true).then(dy =>
  term(true).then(sx =>
  term(true).then(sy =>
  term(true).then(rot =>
  co_unit(mk_other_surface(join_source_ranges(kw, sy.range), s, dx, dy, sx, sy, rot))
  )))))))

export const term : (try_par:boolean) => Parser = (try_par:boolean) : Parser =>
  parser_or<ParserRes>(mk_empty_surface_prs(),
  parser_or<ParserRes>(mk_circle_prs(),
  parser_or<ParserRes>(mk_square_prs(),
  parser_or<ParserRes>(mk_ellipse_prs(),
  parser_or<ParserRes>(mk_rectangle_prs(),
  parser_or<ParserRes>(mk_line_prs(),
  parser_or<ParserRes>(mk_polygon_prs(),
  parser_or<ParserRes>(mk_text_prs(),
  parser_or<ParserRes>(mk_sprite_prs(),
  parser_or<ParserRes>(mk_other_surface_prs(),

  parser_or<ParserRes>(bool,
  parser_or<ParserRes>(float,
  parser_or<ParserRes>(double,
  parser_or<ParserRes>(int,
  parser_or<ParserRes>(string,
  try_par ?
    parser_or<ParserRes>(identifier,
      par.then(res => co_unit(mk_bracket(res.val[0], res.range))))
  : identifier
  )))))))))))))))

export const unary_expr : () => Parser = () =>
  not_op.then(_ =>
  expr().then(e =>
  co_unit<ParserState,ParserError,ParserRes>(mk_not(e))))

export const newline_sign: Coroutine<ParserState,ParserError,Unit> = co_get_state<ParserState, ParserError>().then(s => {
  if (s.tokens.isEmpty())
    return co_error({ range:mk_range(-1,0,0,0), priority:s.branch_priority, message:"found empty state, expected newline" })
  let i = s.tokens.first()
  if (i.kind == "nl") {
    return co_set_state<ParserState, ParserError>({...s, tokens: s.tokens.rest().toList() }).then(_ => co_unit({}))
  }
  else return co_error({ range:i.range, priority:s.branch_priority, message:"expected newline" })
})

export const whitespace_sign: Coroutine<ParserState,ParserError,Unit> = co_get_state<ParserState, ParserError>().then(s => {
  if (s.tokens.isEmpty())
    return co_error({ range:mk_range(-1,0,0,0), priority:s.branch_priority, message:"found empty state, expected whitespace" })
  let i = s.tokens.first()
  if (i.kind == " ") {
    return co_set_state<ParserState, ParserError>({...s, tokens: s.tokens.rest().toList() }).then(_ => co_unit({}))
  }
  else return co_error({ range:i.range, priority:s.branch_priority, message:"expected whitespace" })
})

export const merge_errors = (e1:ParserError, e2:ParserError) => {
  let res = e1.priority > e2.priority ? e1 :
  e2.priority > e1.priority ? e2 :
  ({ priority:Math.max(e1.priority, e2.priority), message:`${e1.message} or ${e2.message}`, range:join_source_ranges(e1.range, e2.range) })
  // let show = [{p:e1.priority, m:e1.message},{p:e2.priority, m:e2.message},{p:res.priority, m:res.message}]
  // if (res.priority > 50) console.log("merging errors", JSON.stringify(show))
  return res
}

export const whitespace = () =>
  co_repeat(parser_or<Unit>(newline_sign, whitespace_sign)).then(_ => co_unit({}))

export const ignore_whitespace = function<a>(p:Coroutine<ParserState,ParserError,a>) : Coroutine<ParserState,ParserError,a> { return whitespace().then(_ => p.then(p_res => whitespace().then(_ => co_unit(p_res)))) }

export const symbol = (token_kind:string, token_name:string) : Coroutine<ParserState,ParserError,SourceRange> => ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
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

export const binop_sign: (_:BinOpKind) => Coroutine<ParserState,ParserError,SourceRange> = k => ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.tokens.isEmpty())
    return co_error({ range:mk_range(-1,0,0,0), priority:s.branch_priority, message:`found empty state, expected ${k}` })
  let i = s.tokens.first()
  if (i.kind == k) {
    return co_set_state<ParserState, ParserError>({...s, tokens: s.tokens.rest().toList() }).then(_ => co_unit(i.range))
  }
  else return co_error({ range:i.range, priority:s.branch_priority, message:`expected '${k}'` })
}))

export const unaryop_sign: (_:UnaryOpKind) => Coroutine<ParserState,ParserError,Unit> = k => ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.tokens.isEmpty())
    return co_error({ range:mk_range(-1,0,0,0), priority:s.branch_priority, message:`found empty state, expected ${k}` })
  let i = s.tokens.first()
  if (i.kind == k) {
    return co_set_state<ParserState, ParserError>({...s, tokens: s.tokens.rest().toList() }).then(_ => co_unit({}))
  }
  else return co_error({ range:i.range, priority:s.branch_priority, message:`expected '${k}'` })
}))

export const string: Parser = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.tokens.isEmpty())
    return co_error({ range:mk_range(-1,0,0,0), priority:s.branch_priority, message:`found empty state, expected number` })
  let i = s.tokens.first()
  if (i.kind == "string") {
    let res = mk_string(i.v, i.range)
    return co_set_state<ParserState, ParserError>({...s, tokens: s.tokens.rest().toList() }).then(_ => co_unit(res))
  }
  else return co_error({ range:i.range, priority:s.branch_priority, message:`expected int` })
}))

export const bool: Parser = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.tokens.isEmpty())
    return co_error({ range:mk_range(-1,0,0,0), priority:s.branch_priority, message:"found empty state, expected boolean" })
  let i = s.tokens.first()
  if (i.kind == "bool") {
    let res = mk_bool(i.v, i.range)
    return co_set_state<ParserState, ParserError>({...s, tokens: s.tokens.rest().toList() }).then(_ => co_unit(res))
  }
  else return co_error({ range:i.range, priority:s.branch_priority, message:"expected boolean" })
}))

export const int: Parser = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.tokens.isEmpty())
    return co_error({ range:mk_range(-1,0,0,0), priority:s.branch_priority, message:"found empty state, expected int" })
  let i = s.tokens.first()
  if (i.kind == "int") {
    let res = mk_int(i.v, i.range)
    return co_set_state<ParserState, ParserError>({...s, tokens: s.tokens.rest().toList() }).then(_ => co_unit(res))
  }
  else return co_error({ range:i.range, priority:s.branch_priority, message:"expected int" })
}))

export const float: Parser = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.tokens.isEmpty())
    return co_error({ range:mk_range(-1,0,0,0), priority:s.branch_priority, message:"found empty state, expected float" })
  let i = s.tokens.first()
  if (i.kind == "float") {
    let res = mk_float(i.v, i.range)
    return co_set_state<ParserState, ParserError>({...s, tokens: s.tokens.rest().toList() }).then(_ => co_unit(res))
  }
  else return co_error({ range:i.range, priority:s.branch_priority, message:"expected float" })
}))

export const double: Parser = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.tokens.isEmpty())
    return co_error({ range:mk_range(-1,0,0,0), priority:s.branch_priority, message:"found empty state, expected double" })
  let i = s.tokens.first()
  if (i.kind == "double") {
    let res = mk_double(i.v, i.range)
    return co_set_state<ParserState, ParserError>({...s, tokens: s.tokens.rest().toList() }).then(_ => co_unit(res))
  }
  else return co_error({ range:i.range, priority:s.branch_priority, message:"expected double" })
}))

export const negative_number: Parser = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.tokens.isEmpty())
    return co_error({ range:mk_range(-1,0,0,0), priority:s.branch_priority, message:"found empty state, expected a negative number" })
  let i = s.tokens.first()
  if (i.kind == "int" && i.v < 0) {
    let res = mk_int(i.v, i.range)
    return co_set_state<ParserState, ParserError>({...s, tokens: s.tokens.rest().toList() }).then(_ => co_unit(res))
  } else if (i.kind == "float" && i.v < 0) {
    let res = mk_float(i.v, i.range)
    return co_set_state<ParserState, ParserError>({...s, tokens: s.tokens.rest().toList() }).then(_ => co_unit(res))
  } else if (i.kind == "double" && i.v < 0) {
    let res = mk_double(i.v, i.range)
    return co_set_state<ParserState, ParserError>({...s, tokens: s.tokens.rest().toList() }).then(_ => co_unit(res))
  } else return co_error({ range:i.range, priority:s.branch_priority, message:"expected a negative number" })
}))

export const identifier_token: Coroutine<ParserState, ParserError, {id:string, range:SourceRange}> = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
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

export const identifier: Parser = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
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

export const return_sign = symbol("return", "return")
export const for_keyword = symbol("for", "for")
export const while_keyword = symbol("while", "while")
export const if_keyword = symbol("if", "if")
export const question_mark_keyword = symbol("?", "?")
export const colon_keyword = symbol(":", ":")
export const else_keyword = symbol("else", "else")
export const equal_sign = symbol("=", "=")
export const semicolon_sign = symbol(";", "semicolon")
export const comma_sign = symbol(",", "comma")
export const class_keyword = symbol("class", "class")
export const new_keyword = symbol("new", "new")

export const base = symbol("base", "base")
export const surface_keyword = symbol("surface", "surface")
export const empty_surface_keyword = symbol("empty_surface", "empty_surface")
export const sprite_keyword = symbol("sprite", "sprite")
export const circle_keyword = symbol("circle", "circle")
export const square_keyword = symbol("square", "square")
export const rectangle_keyword = symbol("rectangle", "rectangle")
export const ellipse_keyword = symbol("ellipse", "ellipse")
export const line_keyword = symbol("line", "line")
export const polygon_keyword = symbol("polygon", "polygon")
export const text_keyword = symbol("text", "text")
export const other_surface_keyword = symbol("other_surface", "other_surface")

export const filesystem_keyword = symbol("filesystem", "filesystem")
export const file_keyword = symbol("fsfile", "fsfile")

export const left_bracket = symbol("(", "(")
export const right_bracket = symbol(")", ")")

export const left_square_bracket = symbol("[", "[")
export const right_square_bracket = symbol("]", "]")

export const left_curly_bracket = symbol("{", "{")
export const right_curly_bracket = symbol("}", "}")

export const dot_sign = symbol(".", ".")

export const private_modifier = symbol("private", "private")
export const public_modifier = symbol("public", "public")
export const protected_modifier = symbol("protected", "protected")
export const static_modifier = symbol("static", "static")
export const override_modifier = symbol("override", "override")
export const virtual_modifier = symbol("virtual", "virtual")
export const abstract_modifier = symbol("abstract", "abstract")
export const interface_modifier = symbol("interface", "interface")

export const as_op = binop_sign("as")

export const plus_op = binop_sign("+")
export const minus_op = binop_sign("-")
export const times_op = binop_sign("*")
export const div_op = binop_sign("/")
export const mod_op = binop_sign("%")

export const lt_op = binop_sign("<")
export const gt_op = binop_sign(">")
export const leq_op = binop_sign("<=")
export const geq_op = binop_sign(">=")
export const eq_op = binop_sign("==")
export const neq_op = binop_sign("!=")
export const and_op = binop_sign("&&")
export const or_op = binop_sign("||")
export const xor_op = binop_sign("xor")

export const arrow_op = binop_sign("=>")

export const not_op = unaryop_sign("not")

export const eof: Coroutine<ParserState,ParserError,SourceRange> = ignore_whitespace(co_get_state<ParserState, ParserError>().then(s => {
  if (s.tokens.isEmpty())
    return co_unit(zero_range)
    return co_error({ range:s.tokens.first().range, message:`expected eof, found ${s.tokens.first().kind} at ${print_range(s.tokens.first().range)}`, priority:s.branch_priority })
  }))