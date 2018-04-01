import { Map } from "immutable"
import { co_run, co_unit, Coroutine, Fun, fun, Prod, Sum, Unit } from 'ts-bccc';
import * as CCC from 'ts-bccc';
import * as Co from 'ts-bccc';

import * as CSharp from './csharp';
import * as Sem from '../Python/python';
import { minus_two_range, SourceRange } from '../source_range';
import { Typing, State, MethodTyping, FieldType, Err } from './csharp';

let from_js  = (t:CSharp.Type, sem:Sem.StmtRt) : CSharp.Stmt => _ => co_unit(CSharp.mk_typing(t, sem))

export let int = CSharp.def_class(minus_two_range, "int", [
    _ => ({ modifiers:["static", "public", "casting", "operator"], is_constructor:false, range:minus_two_range,
            return_t:CSharp.int_type, name:"string", parameters:[{ name:"a", type:CSharp.int_type }],
            body:from_js(
                  CSharp.int_type,
                  Sem.get_v_rt("a").then(a_v =>
                  Sem.return_rt(Sem.str_expr((a_v.value.v as number).toString()))
                  )) }),
    _ => ({ modifiers:["static", "public", "casting", "operator"], is_constructor:false, range:minus_two_range,
            return_t:CSharp.int_type, name:"float", parameters:[{ name:"a", type:CSharp.int_type }],
            body:from_js(
                  CSharp.int_type,
                  Sem.get_v_rt("a").then(a_v =>
                  Sem.return_rt(Sem.float_expr((a_v.value.v as number)))
                  )) }),
    _ => ({ modifiers:["static", "public", "operator"], is_constructor:false, range:minus_two_range,
            return_t:CSharp.int_type, name:"+", parameters:[{ name:"a", type:CSharp.int_type }, { name:"b", type:CSharp.int_type }],
            body:from_js(
                  CSharp.int_type,
                  Sem.get_v_rt("a").then(a_v => Sem.get_v_rt("b").then(b_v =>
                    Sem.return_rt(Sem.int_expr((a_v.value.v as number) + (b_v.value.v as number)))
                  ))) }),
    _ => ({ modifiers:["static", "public", "operator"], is_constructor:false, range:minus_two_range,
            return_t:CSharp.int_type, name:"-", parameters:[{ name:"a", type:CSharp.int_type }, { name:"b", type:CSharp.int_type }],
            body:from_js(
                  CSharp.int_type,
                  Sem.get_v_rt("a").then(a_v => Sem.get_v_rt("b").then(b_v =>
                  Sem.return_rt(Sem.int_expr((a_v.value.v as number) - (b_v.value.v as number)))
                  ))) }),
  ],
  [], true)
export let math = CSharp.def_class(minus_two_range, "Math", [
      _ => ({ modifiers:["static", "public"], is_constructor:false, range:minus_two_range,
            return_t:CSharp.double_type, name:"sqrt", parameters:[{ name:"a", type:CSharp.double_type }],
            body:from_js(
                  CSharp.double_type,
                  Sem.get_v_rt("a").then(a_v =>
                  Sem.return_rt(Sem.float_expr(Math.sqrt(a_v.value.v as number))
                  ))) }),
      ],
    [], true)

export let standard_lib = () => CSharp.semicolon(minus_two_range, int, math)
