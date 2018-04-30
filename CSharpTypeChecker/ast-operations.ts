import * as Immutable from 'immutable';

import { ValueName } from '../main'
import { join_source_ranges, print_range } from '../source_range'
import {
  and,
  arrow,
  bool,
  breakpoint,
  call_cons,
  call_lambda,
  decl_and_init_v,
  decl_v,
  def_class,
  def_generic_class,
  def_fun,
  div,
  done,
  double,
  eq,
  field_get,
  field_set,
  float,
  for_loop,
  geq,
  get_arr_el,
  get_v,
  gt,
  if_then_else,
  int,
  leq,
  lt,
  minus,
  mk_circle,
  mk_ellipse,
  mk_empty_surface,
  mk_line,
  mk_other_surface,
  mk_polygon,
  mk_rectangle,
  mk_sprite,
  mk_square,
  mk_text,
  mod,
  neq,
  new_array,
  new_array_and_init,
  not,
  or,
  plus,
  ret,
  semicolon,
  set_arr_el,
  set_v,
  str,
  times,
  typechecker_breakpoint,
  while_do,
  xor,
  tuple_value,
  coerce,
  mk_fs_key_value,
  mk_filesystem_and_program,
  mk_filesystem,
  mk_fs_file,
} from './bindings'
import {
  float_type,
  double_type,
  arr_type,
  bool_type,
  CallingContext,
  circle_type,
  ellipse_type,
  fun_type,
  int_type,
  record_type,
  rectangle_type,
  ref_type,
  render_grid_pixel_type,
  render_grid_type,
  render_surface_type,
  string_type,
  tuple_type,
  Type,
  unit_type,
  var_type,
  sprite_type,
  square_type,
  Stmt,
} from './types'
import { ParserRes } from './grammar'
import { inr, apply, inl, Unit } from 'ts-bccc';
import { mk_constructor_call, mk_semicolon, mk_assign, mk_field_ref } from './primitives';

let ast_to_csharp_type = (s:ParserRes) : Type =>
  s.ast.kind == "id" ?
    s.ast.value == "int" ? int_type
    : s.ast.value == "float" ? float_type
    : s.ast.value == "double" ? double_type
    : s.ast.value == "bool" ? bool_type
    : s.ast.value == "string" ? string_type
    : s.ast.value == "void" ? unit_type
    : s.ast.value == "RenderGrid" ? render_grid_type
    : s.ast.value == "RenderGridPixel" ? render_grid_pixel_type
    : s.ast.value == "surface" ? render_surface_type
    : s.ast.value == "sprite" ? sprite_type
    : s.ast.value == "circle" ? circle_type
    : s.ast.value == "square" ? square_type
    : s.ast.value == "ellipse" ? ellipse_type
    : s.ast.value == "rectangle" ? rectangle_type
    : s.ast.value == "var" ? var_type
    : ref_type(s.ast.value) :
  s.ast.kind == "array decl" ? arr_type(ast_to_csharp_type(s.ast.t))
  : s.ast.kind == "generic type decl" && s.ast.f.ast.kind == "id" && s.ast.f.ast.value == "Func" && s.ast.args.length >= 1 ?
    fun_type(tuple_type(Immutable.Seq(s.ast.args).take(s.ast.args.length - 1).toArray().map(a => ast_to_csharp_type(a))), ast_to_csharp_type(s.ast.args[s.ast.args.length - 1]), s.range)
  : s.ast.kind == "tuple type decl" ?
    tuple_type(s.ast.args.map(a => ast_to_csharp_type(a)))
  : s.ast.kind == "record type decl" ?
    record_type(Immutable.Map<string,Type>(s.ast.args.map(a => [a.r.ast.kind == "id" ? a.r.ast.value : "", ast_to_csharp_type(a.l)])))
  : (() => {
    //console.log(`Error: unsupported ast type: ${JSON.stringify(s)}`);
    throw new Error(`Unsupported ast type: ${print_range(s.range)}`)
  })()

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
  || n.ast.kind == "," || n.ast.kind == "as" ?
    free_variables(n.ast.l, bound).union(free_variables(n.ast.r, bound))

  : n.ast.kind == "empty surface" ?
    free_variables(n.ast.w, bound).union(free_variables(n.ast.h, bound))
        .union(free_variables(n.ast.color, bound))
  : n.ast.kind == "circle" ?
    free_variables(n.ast.cx, bound).union(free_variables(n.ast.cy, bound)).union(free_variables(n.ast.r, bound))
        .union(free_variables(n.ast.color, bound))
  : n.ast.kind == "square" ?
    free_variables(n.ast.cx, bound).union(free_variables(n.ast.cy, bound)).union(free_variables(n.ast.s, bound))
        .union(free_variables(n.ast.color, bound)).union(free_variables(n.ast.rotation, bound))
  : n.ast.kind == "rectangle" ?
    free_variables(n.ast.cx, bound).union(free_variables(n.ast.cy, bound)).union(free_variables(n.ast.w, bound)).union(free_variables(n.ast.h, bound))
        .union(free_variables(n.ast.color, bound)).union(free_variables(n.ast.rotation, bound))
  : n.ast.kind == "ellipse" ?
    free_variables(n.ast.cx, bound).union(free_variables(n.ast.cy, bound)).union(free_variables(n.ast.w, bound)).union(free_variables(n.ast.h, bound))
        .union(free_variables(n.ast.color, bound)).union(free_variables(n.ast.rotation, bound))
  : n.ast.kind == "sprite" ?
    free_variables(n.ast.cx, bound).union(free_variables(n.ast.cy, bound)).union(free_variables(n.ast.w, bound)).union(free_variables(n.ast.h, bound))
        .union(free_variables(n.ast.sprite, bound)).union(free_variables(n.ast.rotation, bound))
  : n.ast.kind == "line" ?
    free_variables(n.ast.x1, bound).union(free_variables(n.ast.y1, bound)).union(free_variables(n.ast.x2, bound)).union(free_variables(n.ast.y2, bound))
        .union(free_variables(n.ast.width, bound)).union(free_variables(n.ast.color, bound)).union(free_variables(n.ast.rotation, bound))
  : n.ast.kind == "text" ?
    free_variables(n.ast.x, bound).union(free_variables(n.ast.y, bound)).union(free_variables(n.ast.t, bound)).union(free_variables(n.ast.size, bound))
        .union(free_variables(n.ast.color, bound)).union(free_variables(n.ast.rotation, bound))
  : n.ast.kind == "polygon" ?
    free_variables(n.ast.color, bound).union(free_variables(n.ast.rotation, bound))
        .union(free_variables(n.ast.points, bound))
  : n.ast.kind == "other surface" ?
    free_variables(n.ast.s, bound).union(free_variables(n.ast.dx, bound)).union(free_variables(n.ast.dy, bound))
        .union(free_variables(n.ast.sx, bound)).union(free_variables(n.ast.sy, bound))


  // export interface MkEmptyRenderGrid { kind: "mk-empty-render-grid", w:ParserRes, h:ParserRes }
  // export interface MkRenderGridPixel { kind: "mk-render-grid-pixel", w:ParserRes, h:ParserRes, status:ParserRes }

  : n.ast.kind == "not" || n.ast.kind == "bracket" ? free_variables(n.ast.e, bound)
  : n.ast.kind == "return" ? free_variables(n.ast.value, bound)

  : n.ast.kind == "if" ? free_variables(n.ast.c, bound).union(free_variables(n.ast.t, bound)).union(n.ast.e.kind == "left" ? free_variables(n.ast.e.value, bound) : Immutable.Set<string>())
  : n.ast.kind == "while" ? free_variables(n.ast.c, bound).union(free_variables(n.ast.b, bound))

  : n.ast.kind == "ternary_if" ? free_variables(n.ast.condition, bound).union(free_variables(n.ast.then_else, bound))
  : n.ast.kind == "ternary_then_else" ? free_variables(n.ast._then, bound).union(free_variables(n.ast._else, bound))

  : n.ast.kind == "=>" && n.ast.l.ast.kind == "id" ? free_variables(n.ast.r, bound.add(n.ast.l.ast.value))
  : n.ast.kind == "id" ? (!bound.has(n.ast.value) ? Immutable.Set<ValueName>([n.ast.value]) : Immutable.Set<ValueName>())
  : n.ast.kind == "int" || n.ast.kind == "double" || n.ast.kind == "float" ||n.ast.kind == "string" || n.ast.kind == "bool" || n.ast.kind == "get_array_value_at" || n.ast.kind == "array_cons_call_and_init" ?  Immutable.Set<ValueName>()
  : n.ast.kind == "func_call" ? free_variables(n.ast.name, bound).union(union_many(n.ast.actuals.map(a => free_variables(a, bound))))

  : n.ast.kind == "debugger" || n.ast.kind == "typechecker_debugger" ? Immutable.Set<string>()

  : (() => {
    console.log(`Error (FV): unsupported ast node: ${JSON.stringify(n)}`);
    throw new Error(`(FV) Unsupported ast node: ${print_range(n.range)}`)
  })()


export let extract_tuple_args = (n:ParserRes) : Array<ParserRes> =>
  {
  return n.ast.kind == "," ? [n.ast.l, ...extract_tuple_args(n.ast.r)]
  : n.ast.kind == "bracket" ? extract_tuple_args(n.ast.e)
  : [n]}

export let ast_to_type_checker : (_:ParserRes) => (_:CallingContext) => Stmt = n => context =>
  n.ast.kind == "int" ? int(n.range, n.ast.value)
  : n.ast.kind == "double" ? double(n.range, n.ast.value)
  : n.ast.kind == "float" ? float(n.range, n.ast.value)
  : n.ast.kind == "string" ? str(n.range, n.ast.value)
  : n.ast.kind == "bracket" ? ast_to_type_checker(n.ast.e)(context)
  : n.ast.kind == "bool" ? bool(n.range, n.ast.value)
  : n.ast.kind == "noop" ? done
  : n.ast.kind == ";" ? semicolon(n.range, ast_to_type_checker(n.ast.l)(context), ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == "for" ? for_loop(n.range, ast_to_type_checker(n.ast.i)(context), ast_to_type_checker(n.ast.c)(context), ast_to_type_checker(n.ast.s)(context), ast_to_type_checker(n.ast.b)(context))
  : n.ast.kind == "while" ? while_do(n.range, ast_to_type_checker(n.ast.c)(context), ast_to_type_checker(n.ast.b)(context))
  : n.ast.kind == "if" ? if_then_else(n.range, ast_to_type_checker(n.ast.c)(context), ast_to_type_checker(n.ast.t)(context),
                            n.ast.e.kind == "right" ? done : ast_to_type_checker(n.ast.e.value)(context))
  : n.ast.kind == "as" ? coerce(n.range, ast_to_type_checker(n.ast.l)(context), ast_to_csharp_type(n.ast.r))
  : n.ast.kind == "+" ? plus(n.range, ast_to_type_checker(n.ast.l)(context),
                                             ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == "-" ? minus(n.range, ast_to_type_checker(n.ast.l)(context),
                                              ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == "*" ? times(n.range, ast_to_type_checker(n.ast.l)(context),
                                              ast_to_type_checker(n.ast.r)(context), n.range)
  : n.ast.kind == "/" ? div(n.range, ast_to_type_checker(n.ast.l)(context), ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == "%" ? mod(n.range, ast_to_type_checker(n.ast.l)(context), ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == "<" ? lt(n.range, ast_to_type_checker(n.ast.l)(context), ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == ">" ? gt(n.range, ast_to_type_checker(n.ast.l)(context), ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == "<=" ? leq(n.range, ast_to_type_checker(n.ast.l)(context), ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == ">=" ? geq(n.range, ast_to_type_checker(n.ast.l)(context), ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == "==" ? eq(n.range, ast_to_type_checker(n.ast.l)(context), ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == "!=" ? neq(n.range, ast_to_type_checker(n.ast.l)(context), ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == "xor" ? xor(n.range, ast_to_type_checker(n.ast.l)(context), ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == "not" ? not(n.range, ast_to_type_checker(n.ast.e)(context))
  : n.ast.kind == "&&" ? and(n.range, ast_to_type_checker(n.ast.l)(context), ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == "||" ? or(n.range, ast_to_type_checker(n.ast.l)(context), ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == "=>" ? arrow(n.range,
      extract_tuple_args(n.ast.l).map(a => {
        if (a.ast.kind != "id") {
          //console.log(`Error: unsupported ast node: ${print_range(n.range)}`)
          throw new Error(`Unsupported ast node: ${print_range(n.range)}`)
        }
        return { name:a.ast.value, type:var_type }
      }),
      // [ { name:n.ast.l.ast.value, type:var_type } ],
      free_variables(n.ast.r, Immutable.Set<ValueName>(extract_tuple_args(n.ast.l).map(a => {
        if (a.ast.kind != "id") {
          //console.log(`Error: unsupported ast node: ${JSON.stringify(n)}`)
          throw new Error(`Unsupported ast node: ${print_range(n.range)}`)
        }
        return a.ast.value
      }))).toArray(), ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == "," ? tuple_value(n.range, ([n.ast.l].concat(extract_tuple_args(n.ast.r))).map(a => ast_to_type_checker(a)(context)))
  : n.ast.kind == "id" ? get_v(n.range, n.ast.value)
  : n.ast.kind == "return" ? ret(n.range, ast_to_type_checker(n.ast.value)(context))
  : n.ast.kind == "." && n.ast.r.ast.kind == "id" ? field_get(n.range, context, ast_to_type_checker(n.ast.l)(context), n.ast.r.ast.value)
  : n.ast.kind == "ternary_if" && n.ast.then_else.ast.kind == "ternary_then_else" ?
    if_then_else(n.range, ast_to_type_checker(n.ast.condition)(context), ast_to_type_checker(n.ast.then_else.ast._then)(context), ast_to_type_checker(n.ast.then_else.ast._else)(context))


  : n.ast.kind == "=" && n.ast.l.ast.kind == "get_array_value_at" ?
    set_arr_el(n.range,
                      ast_to_type_checker(n.ast.l.ast.array)(context),
                      ast_to_type_checker(n.ast.l.ast.index)(context),
                      ast_to_type_checker(n.ast.r)(context))


  : n.ast.kind == "=" && n.ast.l.ast.kind == "id" ? set_v(n.range, n.ast.l.ast.value, ast_to_type_checker(n.ast.r)(context))
  : n.ast.kind == "=" && n.ast.l.ast.kind == "." && n.ast.l.ast.r.ast.kind == "id" ?
    field_set(n.range, context, ast_to_type_checker(n.ast.l.ast.l)(context), {att_name:n.ast.l.ast.r.ast.value, kind:"att"}, ast_to_type_checker(n.ast.r)(context))



  : n.ast.kind == "cons_call" ?
    call_cons(n.range, context, n.ast.name, n.ast.actuals.map(a => ast_to_type_checker(a)(context)))
  : n.ast.kind == "func_call" ?
    call_lambda(n.range, ast_to_type_checker(n.ast.name)(context), n.ast.actuals.map(a => ast_to_type_checker(a)(context)))


  : n.ast.kind == "func_decl" ?
    def_fun(n.range,
      { name:n.ast.name,
        return_t:ast_to_csharp_type(n.ast.return_type),
        parameters:n.ast.arg_decls.toArray().map(d => ({name:d.r.ast.kind == "id" ? d.r.ast.value : "", type:ast_to_csharp_type(d.l)})),
        body:ast_to_type_checker(n.ast.body)(context),
        range:n.range },
        []
        // free_variables(n.ast.body,
        //   Immutable.Set<string>(n.ast.arg_decls.toArray().map(d => d.r.ast.kind == "id" ? d.r.ast.value : ""))).toArray()
        )
  : n.ast.kind == "class" && n.ast.generic_parameters.length == 0 ?
    def_class(n.range,
      n.ast.modifiers.toArray().map(m => m.kind),
      (n.ast.modifiers.toArray().some(m => m.kind == "abstract")  ? "abstract" :
      n.ast.modifiers.toArray().some(m => m.kind == "interface")  ? "interface" : "normal") as "normal" | "abstract" | "interface",
      n.ast.C_name,
      n.ast.extends_or_implements,
      n.ast.methods.toArray().map(m => (context:CallingContext) => ({
          name:m.decl.name,
          return_t:ast_to_csharp_type(m.decl.return_type),
          params_base_call: apply(inr<Stmt[], Unit>(), {}),
          parameters:m.decl.arg_decls.toArray().map(a => ({ name:a.r.ast.kind == "id" ? a.r.ast.value : "", type:ast_to_csharp_type(a.l) })),
          body:ast_to_type_checker(m.decl.body)(context),
          range:join_source_ranges(m.decl.return_type.range, m.decl.body.range),
          modifiers:m.modifiers.toArray().map(mod => mod.ast.kind),
          is_constructor:false
        })).concat(
        n.ast.constructors.toArray().map(c => (context:CallingContext) => ({
          name:c.decl.name,
          params_base_call: c.decl.params_base_call.kind == "left"
                            ? apply(inl<Stmt[], Unit>(), c.decl.params_base_call.value.map(e => ast_to_type_checker(e)(context)))
                            : apply(inr<Stmt[], Unit>(), {}),//c.decl.params_base_call,
          return_t:unit_type,
          parameters:c.decl.arg_decls.toArray().map(a => ({ name:a.r.ast.kind == "id" ? a.r.ast.value : "", type:ast_to_csharp_type(a.l) })),
          body:ast_to_type_checker(c.decl.body)(context),
          range:c.decl.body.range,
          modifiers:c.modifiers.toArray().map(mod => mod.ast.kind),
          is_constructor:true
        }))),
      n.ast.fields.toArray().map(f => (context:CallingContext) => ({
        name:f.decl.r.ast.kind == "id" ? f.decl.r.ast.value : "",
        type:ast_to_csharp_type(f.decl.l),
        is_used_as_base:false,
        modifiers:f.modifiers.toArray().map(mod => mod.ast.kind),
        initial_value:f.decl.kind == "decl" ? inr<Stmt, Unit>().f({}) : apply(inl<Stmt, Unit>(), ast_to_type_checker(f.decl.v)(context))
      }))
    )
  : n.ast.kind == "class" && n.ast.generic_parameters.length > 0 && !n.ast.generic_parameters.some(p => p.name.ast.kind != "id") ?
    def_generic_class(n.range, n.ast.C_name, n.ast.generic_parameters.map(p => ({ name:p.name.ast.kind == "id" ? p.name.ast.value : "_anonymous_type_parameter?", variance:p.variant })),
    (generic_arguments:Immutable.Map<string, Type>) : Stmt => {
      if (n.ast.kind != "class") throw new Error(`Unsupported ast node: ${print_range(n.range)}`)
      return def_class(n.range,
        n.ast.modifiers.toArray().map(m => m.kind),
        (n.ast.modifiers.toArray().some(m => m.kind == "abstract")  ? "abstract" :
        n.ast.modifiers.toArray().some(m => m.kind == "interface")  ? "interface" : "normal") as "normal" | "abstract" | "interface",
        n.ast.C_name,
        n.ast.extends_or_implements,
        n.ast.methods.toArray().map(m => (context:CallingContext) => ({
            name:m.decl.name,
            return_t:ast_to_csharp_type(m.decl.return_type),
            params_base_call: apply(inr<Stmt[], Unit>(), {}),
            parameters:m.decl.arg_decls.toArray().map(a => ({ name:a.r.ast.kind == "id" ? a.r.ast.value : "", type:ast_to_csharp_type(a.l) })),
            body:ast_to_type_checker(m.decl.body)(context),
            range:join_source_ranges(m.decl.return_type.range, m.decl.body.range),
            modifiers:m.modifiers.toArray().map(mod => mod.ast.kind),
            is_constructor:false
          })).concat(
          n.ast.constructors.toArray().map(c => (context:CallingContext) => ({
            name:c.decl.name,
            params_base_call: c.decl.params_base_call.kind == "left"
                              ? apply(inl<Stmt[], Unit>(), c.decl.params_base_call.value.map(e => ast_to_type_checker(e)(context)))
                              : apply(inr<Stmt[], Unit>(), {}),//c.decl.params_base_call,
            return_t:unit_type,
            parameters:c.decl.arg_decls.toArray().map(a => ({ name:a.r.ast.kind == "id" ? a.r.ast.value : "", type:ast_to_csharp_type(a.l) })),
            body:ast_to_type_checker(c.decl.body)(context),
            range:c.decl.body.range,
            modifiers:c.modifiers.toArray().map(mod => mod.ast.kind),
            is_constructor:true
          }))),
        n.ast.fields.toArray().map(f => (context:CallingContext) => ({
          name:f.decl.r.ast.kind == "id" ? f.decl.r.ast.value : "",
          type:ast_to_csharp_type(f.decl.l),
          is_used_as_base:false,
          modifiers:f.modifiers.toArray().map(mod => mod.ast.kind),
          initial_value:f.decl.kind == "decl" ? inr<Stmt, Unit>().f({}) : apply(inl<Stmt, Unit>(), ast_to_type_checker(f.decl.v)(context))
        }))
      ) })

  : n.ast.kind == "decl" && n.ast.r.ast.kind == "id" ?
    decl_v(n.range, n.ast.r.ast.value, ast_to_csharp_type(n.ast.l))
  : n.ast.kind == "decl and init" && n.ast.r.ast.kind == "id" ?
    decl_and_init_v(n.range, n.ast.r.ast.value, ast_to_csharp_type(n.ast.l), ast_to_type_checker(n.ast.v)(context))
  : n.ast.kind == "debugger" ?
    breakpoint(n.range)(done)
  : n.ast.kind == "typechecker_debugger" ?
    typechecker_breakpoint(n.range)(done)

  : n.ast.kind == "array_cons_call" ?
    new_array(n.range, ast_to_csharp_type(n.ast.type), ast_to_type_checker(n.ast.actual)(context))
  : n.ast.kind == "array_cons_call_and_init" ?
    new_array_and_init(n.range, ast_to_csharp_type(n.ast.type), n.ast.actuals.map(a => ast_to_type_checker(a)(context)))
  : n.ast.kind == "get_array_value_at" ?
    get_arr_el(n.range, ast_to_type_checker(n.ast.array)(context), ast_to_type_checker(n.ast.index)(context))



  : n.ast.kind == "empty surface" ?
    mk_empty_surface(n.range, ast_to_type_checker(n.ast.w)(context), ast_to_type_checker(n.ast.h)(context), ast_to_type_checker(n.ast.color)(context))
  : n.ast.kind == "circle" ?
    mk_circle(n.range, ast_to_type_checker(n.ast.cx)(context), ast_to_type_checker(n.ast.cy)(context), ast_to_type_checker(n.ast.r)(context), ast_to_type_checker(n.ast.color)(context))
  : n.ast.kind == "square" ?
    mk_square(n.range, ast_to_type_checker(n.ast.cx)(context), ast_to_type_checker(n.ast.cy)(context), ast_to_type_checker(n.ast.s)(context), ast_to_type_checker(n.ast.color)(context), ast_to_type_checker(n.ast.rotation)(context))
  : n.ast.kind == "ellipse" ?
    mk_ellipse(n.range, ast_to_type_checker(n.ast.cx)(context), ast_to_type_checker(n.ast.cy)(context), ast_to_type_checker(n.ast.w)(context), ast_to_type_checker(n.ast.h)(context), ast_to_type_checker(n.ast.color)(context), ast_to_type_checker(n.ast.rotation)(context))
  : n.ast.kind == "rectangle" ?
    mk_rectangle(n.range, ast_to_type_checker(n.ast.cx)(context), ast_to_type_checker(n.ast.cy)(context), ast_to_type_checker(n.ast.w)(context), ast_to_type_checker(n.ast.h)(context), ast_to_type_checker(n.ast.color)(context), ast_to_type_checker(n.ast.rotation)(context))
  : n.ast.kind == "line" ?
    mk_line(n.range, ast_to_type_checker(n.ast.x1)(context), ast_to_type_checker(n.ast.y1)(context), ast_to_type_checker(n.ast.x2)(context), ast_to_type_checker(n.ast.y2)(context), ast_to_type_checker(n.ast.width)(context), ast_to_type_checker(n.ast.color)(context), ast_to_type_checker(n.ast.rotation)(context))
  : n.ast.kind == "polygon" ?
    mk_polygon(n.range, ast_to_type_checker(n.ast.points)(context), ast_to_type_checker(n.ast.color)(context), ast_to_type_checker(n.ast.rotation)(context))
  : n.ast.kind == "text" ?
    mk_text(n.range, ast_to_type_checker(n.ast.t)(context), ast_to_type_checker(n.ast.x)(context), ast_to_type_checker(n.ast.y)(context), ast_to_type_checker(n.ast.size)(context), ast_to_type_checker(n.ast.color)(context), ast_to_type_checker(n.ast.rotation)(context))
  : n.ast.kind == "sprite" ?
    mk_sprite(n.range, ast_to_type_checker(n.ast.sprite)(context), ast_to_type_checker(n.ast.cx)(context), ast_to_type_checker(n.ast.cy)(context), ast_to_type_checker(n.ast.w)(context), ast_to_type_checker(n.ast.h)(context), ast_to_type_checker(n.ast.rotation)(context))
  : n.ast.kind == "other surface" ?
    mk_other_surface(n.range, ast_to_type_checker(n.ast.s)(context), ast_to_type_checker(n.ast.dx)(context), ast_to_type_checker(n.ast.dy)(context), ast_to_type_checker(n.ast.sx)(context), ast_to_type_checker(n.ast.sy)(context), ast_to_type_checker(n.ast.rotation)(context))
  : n.ast.kind == "filesystem+program" ?
    mk_filesystem_and_program(n.range, ast_to_type_checker(n.ast.filesystem)(context), ast_to_type_checker(n.ast.program)(context))
  : n.ast.kind == "filesystem" ?
    mk_filesystem(n.range, n.ast.nodes.toArray().map(n => ast_to_type_checker(n)(context)))
  : n.ast.kind == "filesystem.file" ?
    mk_fs_file(n.range, ast_to_type_checker(n.ast.path)(context), n.ast.attributes.toArray().map(n => ast_to_type_checker(n)(context)))
  : n.ast.kind == "filesystem.keyvalue" ?
    mk_fs_key_value(n.range, ast_to_type_checker(n.ast.key)(context), ast_to_type_checker(n.ast.value)(context))
  : (() => {
    //console.log(`Error: unsupported ast node: ${JSON.stringify(print_range(n.range))}`);
    throw new Error(`Unsupported ast node: ${print_range(n.range)}`)
  })()
