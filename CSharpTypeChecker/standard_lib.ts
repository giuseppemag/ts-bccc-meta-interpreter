import { Map } from "immutable"
import { co_run, co_unit, Coroutine, Fun, fun, Prod, Sum, Unit, apply, inl, inr } from 'ts-bccc';
import * as CCC from 'ts-bccc';
import * as Co from 'ts-bccc';
import * as FastCo from '../fast_coroutine';

import * as CSharp from './csharp';
import * as Sem from '../Python/python';
import { minus_two_range, SourceRange } from '../source_range';
import { Typing, State, MethodTyping, FieldType, Err, CallingContext, string_type, unit_type, bool_type } from './csharp';
import { mk_tuple_val, mk_string_val } from "../Python/python";
import { POINT_CONVERSION_UNCOMPRESSED } from "constants";

let from_js  = (t:CSharp.Type, sem:Sem.StmtRt) : CSharp.Stmt => _ => co_unit(CSharp.mk_typing(t, sem))

let to_string  = (t:CSharp.Type, op:(a_v:Sem.Val) => Sem.Val) =>
  (_:CallingContext) : CSharp.MethodDefinition => ({ modifiers:["public", "static"], is_constructor:false, range:minus_two_range,
  return_t:CSharp.string_type, name:"ToString", parameters:[{ name:"a", type:t }],
  params_base_call:apply(inr(),{}),
  body:from_js(
        CSharp.string_type,
        Sem.get_v_rt(minus_two_range, "a").then(a_v =>
          Sem.return_rt(Sem.val_expr(apply(inl(), op(a_v.value))))
        )) })

let unary_operator = (name:string, t:CSharp.Type, op:(a_v:Sem.Val) => Sem.Val) =>
  (_:CallingContext) : CSharp.MethodDefinition => ({ modifiers:["static", "public", "operator"], is_constructor:false, range:minus_two_range,
  return_t:t, name:name, parameters:[{ name:"a", type:t }],
  params_base_call:apply(inr(),{}),
  body:from_js(
        t,
        Sem.get_v_rt(minus_two_range, "a").then(a_v =>
          Sem.return_rt(Sem.val_expr(apply(inl(), op(a_v.value))))
        )) })

let binary_operator = (name:string, t:CSharp.Type, op:(a_v:Sem.Val, b_v:Sem.Val) => Sem.Val) =>
  (_:CallingContext) : CSharp.MethodDefinition => ({ modifiers:["static", "public", "operator"], is_constructor:false, range:minus_two_range,
  return_t:t, name:name, parameters:[{ name:"a", type:t }, { name:"b", type:t }],
  params_base_call:apply(inr(),{}),
  body:from_js(
        t,
        Sem.get_v_rt(minus_two_range, "a").then(a_v => Sem.get_v_rt(minus_two_range, "b").then(b_v =>
          Sem.return_rt(Sem.val_expr(apply(inl(), op(a_v.value, b_v.value))))
        ))) })

let comparison_operator = (name:string, t:CSharp.Type, op:(a_v:Sem.Val, b_v:Sem.Val) => Sem.Val) =>
  (_:CallingContext) : CSharp.MethodDefinition => ({ modifiers:["static", "public", "operator"], is_constructor:false, range:minus_two_range,
  return_t:CSharp.bool_type, name:name, parameters:[{ name:"a", type:t }, { name:"b", type:t }],
  params_base_call:apply(inr(),{}),
  body:from_js(
        CSharp.bool_type,
        Sem.get_v_rt(minus_two_range, "a").then(a_v => Sem.get_v_rt(minus_two_range, "b").then(b_v =>
          Sem.return_rt(Sem.val_expr(apply(inl(), op(a_v.value, b_v.value))))
        ))) })

let casting_operator = (name:string, from_t:CSharp.Type, to_t:CSharp.Type, conv:(a_v:Sem.Val) => Sem.Val) =>
  (_:CallingContext) : CSharp.MethodDefinition => ({ modifiers:["static", "public", "casting", "operator"], is_constructor:false, range:minus_two_range,
  return_t:to_t, name:name, parameters:[{ name:"a", type:from_t }],
  params_base_call:apply(inr(),{}),
  body:from_js(
        to_t,
        Sem.get_v_rt(minus_two_range, "a").then(a_v =>
        Sem.return_rt(Sem.val_expr(apply(inl(), conv(a_v.value))))
        )) })

let bool = CSharp.def_class(minus_two_range, [], "normal", "bool", [], [
    casting_operator("string", CSharp.bool_type, CSharp.string_type, a_v => Sem.mk_string_val((a_v.v as boolean).toString())),
    to_string(CSharp.bool_type, a_v => Sem.mk_string_val((a_v.v as boolean).toString())),
    unary_operator("!", CSharp.bool_type, (a_v) => Sem.mk_bool_val(!(a_v.v as boolean))),
    binary_operator("^", CSharp.bool_type, (a_v, b_v) => Sem.mk_bool_val((a_v.v as boolean) != (b_v.v as boolean))),
    binary_operator("&&", CSharp.bool_type, (a_v, b_v) => Sem.mk_bool_val((a_v.v as boolean) && (b_v.v as boolean))),
    binary_operator("||", CSharp.bool_type, (a_v, b_v) => Sem.mk_bool_val((a_v.v as boolean) || (b_v.v as boolean))),
  ],
  [], true)

let int = CSharp.def_class(minus_two_range, [], "normal", "int", [], [
    casting_operator("string", CSharp.int_type, CSharp.string_type, a_v => Sem.mk_string_val((a_v.v as number).toString())),
    to_string(CSharp.int_type, a_v => Sem.mk_string_val((a_v.v as number).toString())),
    casting_operator("float", CSharp.int_type, CSharp.float_type, a_v => Sem.mk_float_val(a_v.v as number)),
    binary_operator("+", CSharp.int_type, (a_v, b_v) => Sem.mk_int_val((a_v.v as number) + (b_v.v as number))),
    binary_operator("-", CSharp.int_type, (a_v, b_v) => Sem.mk_int_val((a_v.v as number) - (b_v.v as number))),
    // unary_operator("-", CSharp.int_type, (a_v) => Sem.mk_int_val(-(a_v.v as number))),
    binary_operator("*", CSharp.int_type, (a_v, b_v) => Sem.mk_int_val((a_v.v as number) * (b_v.v as number))),
    binary_operator("/", CSharp.int_type, (a_v, b_v) => Sem.mk_int_val((a_v.v as number) / (b_v.v as number))),
    binary_operator("%", CSharp.int_type, (a_v, b_v) => Sem.mk_int_val((a_v.v as number) % (b_v.v as number))),
    comparison_operator(">", CSharp.int_type, (a_v, b_v) => Sem.mk_bool_val((a_v.v as number) > (b_v.v as number))),
    comparison_operator("<", CSharp.int_type, (a_v, b_v) => Sem.mk_bool_val((a_v.v as number) < (b_v.v as number))),
    comparison_operator(">=", CSharp.int_type, (a_v, b_v) => Sem.mk_bool_val((a_v.v as number) >= (b_v.v as number))),
    comparison_operator("<=", CSharp.int_type, (a_v, b_v) => Sem.mk_bool_val((a_v.v as number) <= (b_v.v as number))),
    comparison_operator("==", CSharp.int_type, (a_v, b_v) => Sem.mk_bool_val((a_v.v as number) == (b_v.v as number))),
    comparison_operator("!=", CSharp.int_type, (a_v, b_v) => Sem.mk_bool_val((a_v.v as number) != (b_v.v as number))),
  ],
  [], true)

export let float = CSharp.def_class(minus_two_range, [], "normal", "float", [],[
  casting_operator("string", CSharp.float_type, CSharp.string_type, a_v => Sem.mk_string_val((a_v.v as number).toString())),
  to_string(CSharp.float_type, a_v => Sem.mk_string_val((a_v.v as number).toString())),
  casting_operator("double", CSharp.float_type, CSharp.double_type, a_v => Sem.mk_float_val(a_v.v as number)),
  binary_operator("+", CSharp.float_type, (a_v, b_v) => Sem.mk_float_val((a_v.v as number) + (b_v.v as number))),
  binary_operator("-", CSharp.float_type, (a_v, b_v) => Sem.mk_float_val((a_v.v as number) - (b_v.v as number))),
  // unary_operator("-", CSharp.float_type, (a_v) => Sem.mk_float_val(-(a_v.v as number))),
  binary_operator("*", CSharp.float_type, (a_v, b_v) => Sem.mk_float_val((a_v.v as number) * (b_v.v as number))),
  binary_operator("/", CSharp.float_type, (a_v, b_v) => Sem.mk_float_val((a_v.v as number) / (b_v.v as number))),
  comparison_operator(">", CSharp.float_type, (a_v, b_v) => Sem.mk_bool_val((a_v.v as number) > (b_v.v as number))),
  comparison_operator("<", CSharp.float_type, (a_v, b_v) => Sem.mk_bool_val((a_v.v as number) < (b_v.v as number))),
  comparison_operator(">=", CSharp.float_type, (a_v, b_v) => Sem.mk_bool_val((a_v.v as number) >= (b_v.v as number))),
  comparison_operator("<=", CSharp.float_type, (a_v, b_v) => Sem.mk_bool_val((a_v.v as number) <= (b_v.v as number))),
  comparison_operator("==", CSharp.float_type, (a_v, b_v) => Sem.mk_bool_val((a_v.v as number) == (b_v.v as number))),
  comparison_operator("!=", CSharp.float_type, (a_v, b_v) => Sem.mk_bool_val((a_v.v as number) != (b_v.v as number))),
],
[], true)

export let double = CSharp.def_class(minus_two_range, [], "normal", "double", [],[
  casting_operator("string", CSharp.double_type, CSharp.string_type, a_v => Sem.mk_string_val((a_v.v as number).toString())),
  to_string(CSharp.double_type, a_v => Sem.mk_string_val((a_v.v as number).toString())),
  binary_operator("+", CSharp.double_type, (a_v, b_v) => Sem.mk_float_val((a_v.v as number) + (b_v.v as number))),
  // unary_operator("-", CSharp.double_type, (a_v) => Sem.mk_float_val(-(a_v.v as number))),
  binary_operator("-", CSharp.double_type, (a_v, b_v) => Sem.mk_float_val((a_v.v as number) - (b_v.v as number))),
  binary_operator("*", CSharp.double_type, (a_v, b_v) => Sem.mk_float_val((a_v.v as number) * (b_v.v as number))),
  binary_operator("/", CSharp.double_type, (a_v, b_v) => Sem.mk_float_val((a_v.v as number) / (b_v.v as number))),
  comparison_operator(">", CSharp.double_type, (a_v, b_v) => Sem.mk_bool_val((a_v.v as number) > (b_v.v as number))),
  comparison_operator("<", CSharp.double_type, (a_v, b_v) => Sem.mk_bool_val((a_v.v as number) < (b_v.v as number))),
  comparison_operator(">=", CSharp.double_type, (a_v, b_v) => Sem.mk_bool_val((a_v.v as number) >= (b_v.v as number))),
  comparison_operator("<=", CSharp.double_type, (a_v, b_v) => Sem.mk_bool_val((a_v.v as number) <= (b_v.v as number))),
  comparison_operator("==", CSharp.double_type, (a_v, b_v) => Sem.mk_bool_val((a_v.v as number) == (b_v.v as number))),
  comparison_operator("!=", CSharp.double_type, (a_v, b_v) => Sem.mk_bool_val((a_v.v as number) != (b_v.v as number))),
],
[], true)

let string = CSharp.def_class(minus_two_range, [], "normal", "string", [],[
  to_string(CSharp.string_type, a_v => Sem.mk_string_val(a_v.v as string)),
  binary_operator("+", CSharp.string_type, (a_v, b_v) => Sem.mk_string_val((a_v.v as string) + (b_v.v as string))),
  comparison_operator("==", CSharp.string_type, (a_v, b_v) => Sem.mk_bool_val((a_v.v as string) == (b_v.v as string))),
  comparison_operator("!=", CSharp.string_type, (a_v, b_v) => Sem.mk_bool_val((a_v.v as string) != (b_v.v as string))),
],
[], true)

let unit = CSharp.def_class(minus_two_range, [], "normal", "unit", [],[
  to_string(CSharp.unit_type, a_v => Sem.mk_string_val("")),
],
[], true)

let math = CSharp.def_class(minus_two_range, [], "normal", "Math", [], [
      _ => ({ modifiers:["static", "public"], is_constructor:false, range:minus_two_range,
            return_t:CSharp.double_type, name:"sqrt", parameters:[{ name:"a", type:CSharp.double_type }],
            params_base_call:apply(inr(),{}),
            body:from_js(
                  CSharp.double_type,
                  Sem.get_v_rt(minus_two_range, "a").then(a_v =>
                  Sem.return_rt(Sem.float_expr(Math.sqrt(a_v.value.v as number))
                  ))) }),
      _ => ({ modifiers:["static", "public"], is_constructor:false, range:minus_two_range,
            return_t:CSharp.double_type, name:"pow", parameters:[{ name:"a", type:CSharp.double_type },
                                                                 { name:"b", type:CSharp.double_type }],
            params_base_call:apply(inr(),{}),
            body:from_js(
                  CSharp.double_type,
                  Sem.get_v_rt(minus_two_range, "a").then(a_v =>
                  Sem.get_v_rt(minus_two_range, "b").then(b_v =>
                  Sem.return_rt(Sem.float_expr(Math.pow(a_v.value.v as number, b_v.value.v as number))
                  )))) }),
      _ => ({ modifiers:["static", "public"], is_constructor:false, range:minus_two_range,
            return_t:CSharp.double_type, name:"min", parameters:[{ name:"a", type:CSharp.double_type },
                                                                 { name:"b", type:CSharp.double_type }],
            params_base_call:apply(inr(),{}),
            body:from_js(
                  CSharp.double_type,
                  Sem.get_v_rt(minus_two_range, "a").then(a_v =>
                  Sem.get_v_rt(minus_two_range, "b").then(b_v =>
                  Sem.return_rt(Sem.float_expr(Math.min(a_v.value.v as number, b_v.value.v as number))
                  )))) }),
      _ => ({ modifiers:["static", "public"], is_constructor:false, range:minus_two_range,
                  return_t:CSharp.double_type, name:"max", parameters:[{ name:"a", type:CSharp.double_type },
                                                                       { name:"b", type:CSharp.double_type }],
                  params_base_call:apply(inr(),{}),
                  body:from_js(
                        CSharp.double_type,
                        Sem.get_v_rt(minus_two_range, "a").then(a_v =>
                        Sem.get_v_rt(minus_two_range, "b").then(b_v =>
                        Sem.return_rt(Sem.float_expr(Math.max(a_v.value.v as number, b_v.value.v as number))
                        )))) }),
      ],
    [], true)

let file_read_all_text = (_:CallingContext) : CSharp.MethodDefinition => ({
  modifiers:["static", "public"],
  is_constructor:false,
  range:minus_two_range,
  return_t: string_type,
  name: "ReadAllText",
  parameters:[{ name:"path", type: string_type }],
  params_base_call:apply(inr(),{}),
  body: from_js(string_type,
    Sem.return_rt(
    Sem.get_file(
      minus_two_range,
      Sem.get_v_rt(minus_two_range, "path"))))
})

let file_write_all_text = (_:CallingContext) : CSharp.MethodDefinition => ({
  modifiers:["static", "public"],
  is_constructor:false,
  range:minus_two_range,
  return_t: unit_type,
  name: "WriteAllText",
  parameters:[
    { name:"path", type: string_type },
    { name:"contents", type: string_type }
  ],
  params_base_call:apply(inr(),{}),
  body: from_js(string_type,
    Sem.return_rt(
    Sem.set_file(
      minus_two_range,
      Sem.get_v_rt(minus_two_range, "path"),
      Sem.get_v_rt(minus_two_range, "contents"))))
})

let file_exists = (_:CallingContext) : CSharp.MethodDefinition => ({
  modifiers:["static", "public"],
  is_constructor:false,
  range:minus_two_range,
  return_t: bool_type,
  name: "Exists",
  parameters:[{ name:"path", type: string_type }],
  params_base_call:apply(inr(),{}),
  body: from_js(string_type,
    Sem.return_rt(
    Sem.exists(Sem.get_v_rt(minus_two_range, "path"))))
})

let file_copy = (_:CallingContext) : CSharp.MethodDefinition => ({
  modifiers:["static", "public"],
  is_constructor:false,
  range:minus_two_range,
  return_t: bool_type,
  name: "Copy",
  parameters:[
    { name:"path_to",   type: string_type },
    { name:"path_from", type: string_type },
  ],
  params_base_call:apply(inr(),{}),
  body: from_js(string_type,
    Sem.return_rt(
    Sem.copy_file(
      minus_two_range,
      Sem.get_v_rt(minus_two_range, "path_to"),
      Sem.get_v_rt(minus_two_range, "path_from"))))
})

let file_create = (_:CallingContext) : CSharp.MethodDefinition => ({
  modifiers:["static", "public"],
  is_constructor:false,
  range:minus_two_range,
  return_t: bool_type,
  name: "Create",
  parameters:[
    { name:"path",   type: string_type }
  ],
  params_base_call:apply(inr(),{}),
  body: from_js(string_type,
    Sem.return_rt(
    Sem.set_file(
      minus_two_range,
      Sem.get_v_rt(minus_two_range, "path"),
      FastCo.co_unit(apply(inl(), mk_string_val(""))))))
})

let file_delete = (_:CallingContext) : CSharp.MethodDefinition => ({
  modifiers:["static", "public"],
  is_constructor:false,
  range:minus_two_range,
  return_t: bool_type,
  name: "Delete",
  parameters:[
    { name:"path",   type: string_type }
  ],
  params_base_call:apply(inr(),{}),
  body: from_js(string_type,
    Sem.return_rt(
    Sem.delete_file(
      minus_two_range,
      Sem.get_v_rt(minus_two_range, "path"))))
})

let file_move = (_:CallingContext) : CSharp.MethodDefinition => ({
  modifiers:["static", "public"],
  is_constructor:false,
  range:minus_two_range,
  return_t: unit_type,
  name: "Move",
  parameters:[
    { name:"path_to",   type: string_type },
    { name:"path_from", type: string_type }
  ],
  params_base_call:apply(inr(),{}),
  body: from_js(string_type,
    Sem.return_rt(
    Sem.move_file(
      minus_two_range,
      Sem.get_v_rt(minus_two_range, "path_to"),
      Sem.get_v_rt(minus_two_range, "path_from"))))
})

export const path = CSharp.def_class(minus_two_range, [], "normal", "Path", [], [
  file_copy,
  file_create,
  file_delete,
  file_exists,
  file_move,
  file_read_all_text,
  file_write_all_text,
], [], true);

export let standard_lib = () =>
  CSharp.semicolon(minus_two_range, int,
  CSharp.semicolon(minus_two_range, float,
  CSharp.semicolon(minus_two_range, double,
  CSharp.semicolon(minus_two_range, string,
  CSharp.semicolon(minus_two_range, bool,
  CSharp.semicolon(minus_two_range, unit,
  CSharp.semicolon(minus_two_range, math, path)))))))

