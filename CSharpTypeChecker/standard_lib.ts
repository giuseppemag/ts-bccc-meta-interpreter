import { Map } from "immutable"
import { co_run, co_unit, Coroutine, Fun, fun, Prod, Sum, Unit, apply, inl } from 'ts-bccc';
import * as CCC from 'ts-bccc';
import * as Co from 'ts-bccc';

import * as CSharp from './csharp';
import * as Sem from '../Python/python';
import { minus_two_range, SourceRange } from '../source_range';
import { Typing, State, MethodTyping, FieldType, Err, CallingContext } from './csharp';

let from_js  = (t:CSharp.Type, sem:Sem.StmtRt) : CSharp.Stmt => _ => co_unit(CSharp.mk_typing(t, sem))

let unary_operator = (name:string, t:CSharp.Type, op:(a_v:Sem.Val) => Sem.Val) =>
  (_:CallingContext) : CSharp.MethodDefinition => ({ modifiers:["static", "public", "operator"], is_constructor:false, range:minus_two_range,
  return_t:t, name:name, parameters:[{ name:"a", type:t }],
  body:from_js(
        t,
        Sem.get_v_rt("a").then(a_v =>
          Sem.return_rt(Sem.val_expr(apply(inl(), op(a_v.value))))
        )) })

let binary_operator = (name:string, t:CSharp.Type, op:(a_v:Sem.Val, b_v:Sem.Val) => Sem.Val) =>
  (_:CallingContext) : CSharp.MethodDefinition => ({ modifiers:["static", "public", "operator"], is_constructor:false, range:minus_two_range,
  return_t:t, name:name, parameters:[{ name:"a", type:t }, { name:"b", type:t }],
  body:from_js(
        t,
        Sem.get_v_rt("a").then(a_v => Sem.get_v_rt("b").then(b_v =>
          Sem.return_rt(Sem.val_expr(apply(inl(), op(a_v.value, b_v.value))))
        ))) })

let comparison_operator = (name:string, t:CSharp.Type, op:(a_v:Sem.Val, b_v:Sem.Val) => Sem.Val) =>
  (_:CallingContext) : CSharp.MethodDefinition => ({ modifiers:["static", "public", "operator"], is_constructor:false, range:minus_two_range,
  return_t:CSharp.bool_type, name:name, parameters:[{ name:"a", type:t }, { name:"b", type:t }],
  body:from_js(
        CSharp.bool_type,
        Sem.get_v_rt("a").then(a_v => Sem.get_v_rt("b").then(b_v =>
          Sem.return_rt(Sem.val_expr(apply(inl(), op(a_v.value, b_v.value))))
        ))) })

let casting_operator = (name:string, from_t:CSharp.Type, to_t:CSharp.Type, conv:(a_v:Sem.Val) => Sem.Val) =>
  (_:CallingContext) : CSharp.MethodDefinition => ({ modifiers:["static", "public", "casting", "operator"], is_constructor:false, range:minus_two_range,
  return_t:to_t, name:name, parameters:[{ name:"a", type:from_t }],
  body:from_js(
        to_t,
        Sem.get_v_rt("a").then(a_v =>
        Sem.return_rt(Sem.val_expr(apply(inl(), conv(a_v.value))))
        )) })

let bool = CSharp.def_class(minus_two_range, "bool", [
    casting_operator("string", CSharp.int_type, CSharp.string_type, a_v => Sem.mk_string_val((a_v.v as boolean).toString())),
    unary_operator("!", CSharp.bool_type, (a_v) => Sem.mk_bool_val(!(a_v.v as boolean))),
    binary_operator("^", CSharp.bool_type, (a_v, b_v) => Sem.mk_bool_val((a_v.v as boolean) != (b_v.v as boolean))),
    binary_operator("&&", CSharp.bool_type, (a_v, b_v) => Sem.mk_bool_val((a_v.v as boolean) && (b_v.v as boolean))),
    binary_operator("||", CSharp.bool_type, (a_v, b_v) => Sem.mk_bool_val((a_v.v as boolean) || (b_v.v as boolean))),
  ],
  [], true)

let int = CSharp.def_class(minus_two_range, "int", [
    casting_operator("string", CSharp.int_type, CSharp.string_type, a_v => Sem.mk_string_val((a_v.v as number).toString())),
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

export let float = CSharp.def_class(minus_two_range, "float", [
  casting_operator("string", CSharp.int_type, CSharp.string_type, a_v => Sem.mk_string_val((a_v.v as number).toString())),
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

export let double = CSharp.def_class(minus_two_range, "double", [
  casting_operator("string", CSharp.double_type, CSharp.string_type, a_v => Sem.mk_string_val((a_v.v as number).toString())),
  binary_operator("+", CSharp.double_type, (a_v, b_v) => Sem.mk_float_val((a_v.v as number) + (b_v.v as number))),
  unary_operator("-", CSharp.double_type, (a_v) => Sem.mk_float_val(-(a_v.v as number))),
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

let string = CSharp.def_class(minus_two_range, "string", [
    binary_operator("+", CSharp.string_type, (a_v, b_v) => Sem.mk_string_val((a_v.v as string) + (b_v.v as string))),
    comparison_operator("==", CSharp.string_type, (a_v, b_v) => Sem.mk_bool_val((a_v.v as string) == (b_v.v as string))),
    comparison_operator("!=", CSharp.string_type, (a_v, b_v) => Sem.mk_bool_val((a_v.v as string) != (b_v.v as string))),
  ],
[], true)

let math = CSharp.def_class(minus_two_range, "Math", [
      _ => ({ modifiers:["static", "public"], is_constructor:false, range:minus_two_range,
            return_t:CSharp.double_type, name:"sqrt", parameters:[{ name:"a", type:CSharp.double_type }],
            body:from_js(
                  CSharp.double_type,
                  Sem.get_v_rt("a").then(a_v =>
                  Sem.return_rt(Sem.float_expr(Math.sqrt(a_v.value.v as number))
                  ))) }),
      ],
    [], true)

export let standard_lib = () => CSharp.semicolon(minus_two_range, int,
  CSharp.semicolon(minus_two_range, float,
  CSharp.semicolon(minus_two_range, double,
  CSharp.semicolon(minus_two_range, string,
  CSharp.semicolon(minus_two_range, bool, math)))))

