import * as Immutable from "immutable"
import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, fun2, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair, distribute_sum_prod_inv, distribute_sum_prod, fun3, co_get_state, co_set_state, Option } from "ts-bccc"
import * as CCC from "ts-bccc"
import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
import * as Co from "ts-bccc"
import { SourceRange, mk_range, zero_range } from "../source_range"
import * as Sem from "../Python/python"
import { comm_list_coroutine, co_stateless } from "../ccc_aux";
import { ValueName, tuple_to_record, ExprRt, Val, mk_expr_from_val } from "../main";
import { Stmt } from "./csharp";
import { MultiMap } from "../multi_map";

export type Name = string
export interface Err { message:string, range:SourceRange }
export interface MethodTyping { typing:Typing, modifiers:Immutable.Set<Modifier> }
export interface FieldType { type:Type, is_used_as_base:boolean,modifiers:Immutable.Set<Modifier>, initial_value:Option<Stmt> }
export type RenderOperationType = { kind:"circle"} | { kind:"square"} | { kind:"rectangle"} | { kind:"ellipse"}
                                | { kind:"line" } | { kind:"polygon" } | { kind:"text" }
                                | { kind:"other surface"} | { kind:"sprite"}
export type ObjType = { kind:"obj", C_name:string,
                        is_internal:boolean, methods:MultiMap<Name, MethodTyping>,
                        class_kind:"normal"|"abstract"|"interface"
                        fields:Immutable.Map<Name, FieldType>, range: SourceRange }
export type Type = { kind:"render-grid-pixel"} | { kind:"render-grid"}
                 | { kind:"render surface"} | RenderOperationType
                 | { kind:"unit"} | { kind:"bool"} | { kind:"var"} | { kind:"int"} | { kind:"double"} | { kind:"float"} | { kind:"string"} | { kind:"fun", in:Type, out:Type, range: SourceRange }
                 | ObjType
                 | { kind:"ref", C_name:string } | { kind:"arr", arg:Type }
                 | { kind:"record", args:Immutable.Map<Name, Type> }
                 | { kind:"tuple", args:Array<Type> }
                 | { kind:"generic type instance", C_name:string, args:Array<Type> }
                 | { kind:"generic type decl", instantiate:(_:Immutable.Map<Name, Type>) => Stmt, params:Array<GenericParameter>, C_name:string }
export type GenericParameter = { name:string, variance:"co" | "contra" | "inv" }
export let type_to_string = (t:Type) : string =>
  t.kind == "unit" ? "void"
  : t.kind == "int" || t.kind == "double" || t.kind == "float" || t.kind == "string" || t.kind == "var" || t.kind == "bool" ? t.kind
  : t.kind == "ref" ? t.C_name
  : t.kind == "tuple" ? `(${t.args.map(t => t && type_to_string(t)).reduce((a,b) => a + "," + b)})`
  : t.kind == "record" ? `(${t.args.map((t, l) => t && `${type_to_string(t)} ${l}`).reduce((a,b) => a + "," + b)})`
  : t.kind == "fun" && t.in.kind == "tuple" ? `Func<${t.in.args.length == 0 ? "" : t.in.args.map(t => t && type_to_string(t)).reduce((a,b) => a + "," + b)},${type_to_string(t.out)}>`
  : t.kind == "fun" ? `Func<${type_to_string(t.in)},${type_to_string(t.out)}>`
  : t.kind == "arr" ? `${type_to_string(t.arg)}[]`
  : t.kind == "generic type instance" ? t.args.length == 0 ? t.C_name : `${t.C_name}<${t.args.map(t => t && type_to_string(t)).reduce((a,b) => a + "," + b)}>`
  : console.log(`Error: type_to_string(${JSON.stringify(t)}) is not implemented`) ||  "not implemented"
export let render_grid_type : Type = { kind:"render-grid" }
export let render_grid_pixel_type : Type = { kind:"render-grid-pixel" }

export let render_surface_type : Type = { kind:"render surface" }
export let circle_type : Type = { kind:"circle" }
export let square_type : Type = { kind:"square" }
export let ellipse_type : Type = { kind:"ellipse" }
export let rectangle_type : Type = { kind:"rectangle" }
export let line_type : Type = { kind:"line" }
export let polygon_type : Type = { kind:"polygon" }
export let text_type : Type = { kind:"text" }
export let sprite_type : Type = { kind:"sprite" }
export let other_render_surface_type : Type = { kind:"other surface" }

export let unit_type : Type = { kind:"unit" }
export let int_type : Type = { kind:"int" }
export let var_type : Type = { kind:"var" }
export let string_type : Type = { kind:"string" }
export let bool_type : Type = { kind:"bool" }
export let float_type : Type = { kind:"float" }
export let double_type : Type = { kind:"double" }
export let fun_type : (i:Type,o:Type,range:SourceRange) => Type = (i,o,range) => ({ kind:"fun", in:i, out:o, range:range })
export let fun_stmts_type : (i:Stmt[],o:Type,range:SourceRange) => FunWithStmts =
  (i,o,range) => ({ kind:"fun_with_input_as_stmts", in:i, out:o, range:range })


export let arr_type : (el:Type) => Type = (arg) => ({ kind:"arr", arg:arg })
export let tuple_type : (args:Array<Type>) => Type = (args) => ({ kind:"tuple", args:args })
export let record_type : (args:Immutable.Map<Name, Type>) => Type = (args) => ({ kind:"record", args:args })
export let generic_type_instance = (C_name:string, args:Array<Type>) : Type => ({ kind:"generic type instance", C_name:C_name, args:args })
export let ref_type : (C_name:string) => Type = (C_name) => ({ kind:"ref", C_name:C_name })
export let generic_type_decl = (instantiate:(_:Immutable.Map<Name, Type>) => Stmt, params:Array<GenericParameter>, C_name:string) : Type => ({ kind:"generic type decl", instantiate:instantiate, params:params, C_name:C_name })
export type TypeInformation = Type & { is_constant:boolean }
export interface Bindings extends Immutable.Map<Name, TypeInformation> {}
export interface State { highlighting:SourceRange, bindings:Bindings }
export interface Typing { type:TypeInformation, sem:Sem.ExprRt<Sum<Sem.Val,Sem.Val>> }
export let mk_typing = (t:Type,s:ExprRt<Sum<Val,Val>>,is_constant?:boolean) : Typing => ({ type:{...t, is_constant:is_constant == undefined ? false : is_constant}, sem:s })
export let mk_typing_cat = fun2(mk_typing)
export let mk_typing_cat_full = fun2<TypeInformation, Sem.ExprRt<Sum<Sem.Val,Sem.Val>>, Typing>((t,s) => mk_typing(t,s,t.is_constant))

export let empty_state : State = { highlighting:zero_range, bindings:Immutable.Map<Name, TypeInformation>() }

export let load: Fun<Prod<string, State>, Sum<Unit,TypeInformation>> = fun(x =>
  x.snd.bindings.has(x.fst) ?
    apply(inr<Unit,TypeInformation>(), x.snd.bindings.get(x.fst))
  : apply(inl<Unit,TypeInformation>(), {}))
export let store: Fun<Prod<Prod<string, TypeInformation>, State>, State> = fun(x =>
    ({...x.snd, bindings:x.snd.bindings.set(x.fst.fst, x.fst.snd) }))

export let type_equals = (t1:Type,t2:Type) : boolean => {
  if (t1.kind == "fun" && t2.kind == "fun") return type_equals(t1.in,t2.in) && type_equals(t1.out,t2.out)
  if (t1.kind == "tuple" && t2.kind == "tuple") return t1.args.length == t2.args.length &&
    t1.args.every((t1_arg,i) => type_equals(t1_arg, t2.args[i]))
  if (t1.kind == "record" && t2.kind == "record") return t1.args.count() == t2.args.count() &&
    t1.args.every((t1_arg,i) => t1_arg != undefined && i != undefined && t2.args.has(i) && type_equals(t1_arg, t2.args.get(i)))
  if (t1.kind == "arr" && t2.kind == "arr") return type_equals(t1.arg,t2.arg)
  if (t1.kind == "obj" && t2.kind == "obj") return t1.C_name == t2.C_name
  if (t1.kind == "ref" && t2.kind == "ref") return t1.C_name == t2.C_name
  if (t1.kind == "generic type instance" && t2.kind == "generic type instance") return t1.args.length == t2.args.length &&
    t1.args.every((t1_arg,i) => type_equals(t1_arg, t2.args[i]))
  if (t1.kind != t2.kind &&
      (t1.kind == "var" || t2.kind == "var")) return true
  return t1.kind == t2.kind
}

export type Modifier = "private" | "public" | "static" | "protected" | "virtual" | "override" | "operator" | "casting" | "abstract" | "interface"
export interface Parameter { name:Name, type:Type }
export interface LambdaDefinition { return_t:Type, parameters:Array<Parameter>, body:Stmt,  }
export interface FunDefinition extends LambdaDefinition { name:string, range:SourceRange }
export interface MethodDefinition extends FunDefinition { modifiers:Array<Modifier>, is_constructor:boolean, params_base_call:Option<Stmt[]>  }
export interface FieldDefinition extends Parameter { modifiers:Array<Modifier>, initial_value:Option<Stmt>, is_used_as_base:boolean }
export type CallingContext = { kind:"global scope" } | { kind:"class", C_name:string, looking_up_base:boolean }
export type FunWithStmts = {kind:"fun_with_input_as_stmts", in: Stmt[],out:Type, range: SourceRange}
export type TypeConstraints = Option<Type | FunWithStmts>
export let no_constraints:TypeConstraints = inr<Type,Unit>().f({})
export type Stmt = (constraints:TypeConstraints) => Coroutine<State, Err, Typing>
