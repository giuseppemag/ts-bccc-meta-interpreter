import * as Immutable from "immutable"
import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair, fun2 } from "ts-bccc"
// import * as CCC from "ts-bccc"
// import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
// import * as Co from "ts-bccc"
import { SourceRange, mk_range } from "../source_range"
// import { comm_list_coroutine } from "../ccc_aux";
import { FileSystem } from "./filesystem";
import { Type } from "../CSharpTypeChecker/types";
import { co_error, Coroutine, mk_coroutine, co_unit, co_res, CoRes, co_change_state, co_from_state, co_from_and_change_state, comm_list_coroutine } from "../fast_coroutine";

export let runtime_error = function(r:SourceRange, e:string) : ExprRt<Sum<Val,Val>> { return co_error<MemRt, ErrVal, Sum<Val,Val>>({ message:e, range:r }) }
export type Bool = boolean

export interface Lambda { body:ExprRt<Sum<Val,Val>>, parameters:Array<ValueName>, closure: Scope, range:SourceRange }
export interface HeapRef { v:string, k:"ref" }
export interface ArrayVal { elements:Immutable.Map<number, Val>, length:number }
export interface RenderSurface { operations:Immutable.List<RenderSurfaceOperation>, width:number, height:number }
export type RenderSurfaceOperation = { kind:"circle", x:number, y:number, radius:number, color:string }
                            | { kind:"square", x:number, y:number, side:number, color:string, rotation:number }
                            | { kind:"rectangle", x:number, y:number, width:number, height:number, color:string, rotation:number }
                            | { kind:"ellipse", x:number, y:number, width:number, height:number, color:string, rotation:number }
                            | { kind:"line", x1:number, y1:number, x2:number, y2:number, width:number, color:string, rotation:number }
                            | { kind:"polygon", points:Array<{ x:number, y:number }>, color:string, rotation:number }
                            | { kind:"text", t:string, x:number, y:number, size:number, color:string, rotation:number }
                            | { kind:"sprite", sprite:string, x:number, y:number, width:number, height:number, rotation:number }
                            | { kind:"other surface", s:RenderSurface, dx:number, dy:number, sx:number, sy:number, rotation:number }

export let init_array_val : (_:number) => ArrayVal = (len:number) => ({ elements: Immutable.Map<number, Val>(Immutable.Range(0,len).map(i => [i, mk_unit_val])), length:len })

export let init_array_with_args_val : (_:Val[]) => ArrayVal = (vals:Val[]) => ({ elements: Immutable.Map<number, Val>(Immutable.Range(0,vals.length).toArray().map(i => [i, vals[i]])), length:vals.length })

export type ValueName = string
export type NestingLevel = number
export type Val = { v:Unit, k:"u" } | { v:string, k:"s" } | { v:number, k:"f" } | { v:number, k:"i" }
                | { v:Bool, k:"b" } | { v:ArrayVal, k:"arr" } | { v:Scope, k:"obj" } | { v:Scope, k:"record" } | { v:Lambda, k:"lambda" }
                | { v:Array<Val>, k:"tuple" }
                | HeapRef
                | { v:RenderSurface, k:"render surface" } | { v:RenderSurfaceOperation, k:"render surface operation" }
export interface Scope extends Immutable.Map<ValueName, Val> {}
export interface Scopes extends Immutable.Map<NestingLevel, Immutable.Map<ValueName, Val>> {}
export interface Interface {  base:Sum<Interface, Unit>,
                              static_methods:Immutable.Map<ValueName, StmtRt>,
                              methods:Immutable.Map<ValueName, StmtRt>,
                              generic_methods: Immutable.Map<ValueName, StmtRt>,
                              static_fields:Immutable.Map<ValueName, Val>,
                              is_internal:boolean,
                              range:SourceRange }

export let empty_scope_val = Immutable.Map<ValueName, Val>()
export let empty_scopes_val = Immutable.Map<NestingLevel, Scope>().set(0,empty_scope_val)
export let mk_unit_val : Val = ({ v:apply(unit(),{}), k:"u" })
export let mk_string_val : (_:string) => Val = v => ({ v:v, k:"s" })
export let mk_int_val : (_:number) => Val = v => ({ v:Math.floor(v), k:"i" })
export let mk_float_val : (_:number) => Val = v => ({ v:v, k:"f" })
export let mk_arr_val : (_:ArrayVal) => Val = v => ({ v:v, k:"arr" })
export let mk_tuple_val : (_:Array<Val>) => Val = v => ({ v:v, k:"tuple" })
export let mk_bool_val : (_:boolean) => Val = v => ({ v:v, k:"b" })
export let mk_lambda_val : (_:Lambda) => Val = l => ({ v:l, k:"lambda" })
export let mk_obj_val : (_:Scope) => Val = o => ({ v:o, k:"obj" })
export let mk_record_val : (_:Scope) => Val = o => ({ v:o, k:"record" })
export let mk_ref_val : (_:ValueName) => Val = r => ({ v:r, k:"ref" })
export let mk_render_surface_val = (s:RenderSurface) : Val => ({ v:s, k:"render surface" })
export let mk_circle_op = (x:number, y:number, radius:number, color:string) : RenderSurfaceOperation => ({ kind:"circle", x, y, radius, color })
export let mk_square_op = (x:number, y:number, side:number, color:string, rotation:number) : RenderSurfaceOperation => ({ kind:"square", x, y, side, color, rotation })
export let mk_ellipse_op = (x:number, y:number, width:number, height:number, color:string, rotation:number) : RenderSurfaceOperation => ({ kind:"ellipse", x, y, width, height, color, rotation })
export let mk_rectangle_op = (x:number, y:number, width:number, height:number, color:string, rotation:number) : RenderSurfaceOperation => ({ kind:"rectangle", x, y, width, height, color, rotation })
export let mk_line_op = (x1:number, y1:number, x2:number, y2:number, width:number, color:string, rotation:number) : RenderSurfaceOperation =>
  ({ kind:"line", x1, y1, x2, y2, width, color, rotation })
export let mk_polygon_op = (points:Array<{ x:number, y:number }>, color:string, rotation:number) : RenderSurfaceOperation =>
  ({ kind:"polygon", points, color, rotation })
export let mk_text_op = (t:string, x:number, y:number, size:number, color:string, rotation:number) : RenderSurfaceOperation =>
  ({ kind:"text", t, x, y, size, color, rotation })

export let mk_sprite_op = (sprite:string, x:number, y:number, width:number, height:number, rotation:number) : RenderSurfaceOperation => ({ kind:"sprite", sprite, x, y, width, height, rotation })
export let mk_other_surface_op = (s:RenderSurface, dx:number, dy:number, sx:number, sy:number, rotation:number) : RenderSurfaceOperation => ({ kind:"other surface", s, dx, dy, sx, sy, rotation })
export let mk_render_surface_operation_val = (s:RenderSurfaceOperation) : Val => ({ v:s, k:"render surface operation" })
export let tuple_to_record = (v:Val, labels:Array<string>) : Val => v.k == "tuple" ?
  mk_record_val(Immutable.Map<ValueName, Val>(v.v.map((a,a_i) => [labels[a_i], a]))) : v

export interface ErrVal { message:string, range:SourceRange }

let find_last_scope = <T>(scopes: Scopes, p:(_:Scope) => Sum<Unit, T>) : Sum<Unit, T> => {
  let i = scopes.count() - 1

  for (var index = i; index >= 0; index--){
    let current:Scope = scopes.get(index)
    let res = p(current)
    if(res.kind == "right")
      return res
  }
  return { kind: "left", value: {} }
}
// Mem[][], v,
let update_variable = (name:ValueName, value:Val, scopes: Scopes, assign_if_not_present:boolean) : Sum<Unit, Scopes> => {
  let i = scopes.count() - 1

  for (var index = i; index >= 0; index--){
    let current:Scope = scopes.get(index)
    if(current.has(name)){
      current = current.set(name, value)
      scopes = scopes.set(index, current)
      return { kind: "right", value: scopes }
    }
  }
  if(assign_if_not_present){
      let current:Scope = scopes.get(i)
      current = current.set(name, value)
      scopes = scopes.set(i, current)
      return { kind: "right", value: scopes }
  }
  return { kind: "left", value: {} }
}

export interface MemRt { highlighting:SourceRange,
                         globals:Scopes,
                         heap:Scope,
                         functions:Immutable.Map<ValueName,Lambda>,
                         classes:Immutable.Map<ValueName, Interface>,
                         stack:Immutable.Map<number, Scopes>,
                         steps_counter:number,
                         custom_alert:(s:string) => boolean,
                         fs: FileSystem  }
export let load_rt = (v_name:string) => (x:MemRt) : Sum<Unit,Sum<Val,Val>> =>
  {
    if(!x.stack.isEmpty()){
      let res = find_last_scope<Scope>(x.stack.get(x.stack.count()-1), (scope:Scope) => scope.has(v_name) ? { kind: "right", value: scope } : { kind: "left", value: {} })
      if(res.kind == "right")
        return apply(inr<Unit,Sum<Val,Val>>(), apply(inl<Val,Val>(),res.value.get(v_name)))
    }
    let maybe_in_globals = find_last_scope<Scope>(x.globals, (scope:Scope) => scope.has(v_name) ? { kind: "right", value: scope } : { kind: "left", value: {} })
    if(maybe_in_globals.kind == "right"){
      return apply(inr<Unit,Sum<Val,Val>>(), apply(inl<Val,Val>(),maybe_in_globals.value.get(v_name)))
    }
    return apply(inl<Unit,Sum<Val,Val>>(), {})
  }

export let store_rt = (v_name:string, val:Val) => (m:MemRt) : MemRt => {
  if(!m.stack.isEmpty()){
    let scopes1 = update_variable(v_name,val,m.stack.get(m.stack.count() - 1), true)
    if(scopes1.kind == "right"){
      return ({...m, stack:m.stack.set(m.stack.count() - 1, scopes1.value) })
    }
  }
  let scopes1 = update_variable(v_name,val,m.globals, true)
  if(scopes1.kind == "right"){
    return ({...m, globals:scopes1.value })
  }
  return m
}

export let decl_rt = (v_name:string, val:Val) => (m:MemRt) : MemRt => {
    if(m.stack.count() > 0){
      return ({...m, stack:m.stack.set(m.stack.count() - 1, m.stack.last().set(m.stack.last().count() - 1, m.stack.last().last().set(v_name, val))) })
    }
    else{
      return  ({...m, globals:m.globals.set(m.globals.count() - 1, m.globals.last().set(v_name, val)) })
    }
  }

export let load_class_def_rt = (v_name:ValueName) => (x:MemRt) : Sum<Unit,Interface> =>
  x.classes.has(v_name) ? apply(inr(), x.classes.get(v_name)) : apply(inl<Unit,Interface>(), {})

export let store_class_def_rt = (v_name:ValueName, i:Interface) => (x:MemRt) : MemRt =>
  ({...x, classes:x.classes.set(v_name, i) })
export let load_fun_def_rt = (v_name:ValueName) => (x:MemRt) : Sum<Unit,Lambda> =>
  x.functions.has(v_name) ?
    apply(inr(), x.functions.get(v_name))
  : apply(inl(), {})

export let store_fun_def_rt = (v_name:ValueName, l:Lambda) => (x:MemRt) : MemRt =>
  ({...x, functions:x.functions.set(v_name, l) })
export let load_heap_rt = (v_name:ValueName) => (x:MemRt) : Sum<Unit,Val> =>
  x.heap.has(v_name) ?
    apply(inr(), x.heap.get(v_name))
  : apply(inl(), {})

export let store_heap_rt = (v_name:ValueName, val:Val) => (x:MemRt) : MemRt => {
  let res:MemRt = ({...x, heap:x.heap.set(v_name, val) })
  return res
}

export let heap_alloc_rt = (val:Val) => (x:MemRt) : [Sum<Val,Val>,MemRt] => {
  let new_ref = `ref_${x.heap.count()}`
  return [apply(inl<Val,Val>(),mk_ref_val(new_ref)), {...x, heap:x.heap.set(new_ref, val) }]
}


export let push_inner_scope_rt = (s:Scope) : ExprRt<Unit> => co_change_state(m => {
  if(!m.stack.isEmpty()){
    let stack_count = m.stack.count()
    let top_stack = m.stack.last()
    let top_stack_count = top_stack.count()
    return ({...m, stack:m.stack.set(stack_count - 1, top_stack.set(top_stack_count, s))})
  }
  else {
    return ({...m, globals:m.globals.set(m.globals.count(), s)})
  }
})

export let pop_inner_scope_rt = () : ExprRt<Unit> => co_change_state((m) => {
  if(!m.stack.isEmpty()){
    let stack_count = m.stack.count()
    let top_stack = m.stack.get(stack_count - 1)
    let top_stack_count = top_stack.count()

    return ({...m, stack:m.stack.set(stack_count - 1, top_stack.remove(top_stack_count - 1))})
  }
  else{
    return ({...m, globals:m.globals.remove(m.globals.count() - 1)})
  }
})

export let push_scope_rt = (s:Scope) : ExprRt<Unit> => co_change_state(m =>
  ({...m, stack:m.stack.set(m.stack.count(), Immutable.Map<NestingLevel, Immutable.Map<ValueName, Val>>().set(0, s))}))

export let pop_scope_rt = (x:MemRt) : Sum<Unit,MemRt> =>
  !x.stack.isEmpty() ?
    apply(inr(), ({...x, stack:x.stack.remove(x.stack.count()-1)}))
  : apply(inl(), {})

export type ExprRt<A> = Coroutine<MemRt, ErrVal, A>
export type StmtRt = ExprRt<Sum<Val,Val>>

export let empty_memory_rt = (c_a:(_:string) => boolean) : MemRt => ({ highlighting:mk_range(0,0,0,0),
                                     globals:empty_scopes_val,
                                     heap:empty_scope_val,
                                     functions:Immutable.Map<ValueName,Lambda>(),
                                     classes:Immutable.Map<ValueName, Interface>(),
                                     stack:Immutable.Map<number, Scopes>(),
                                     fs: Immutable.Map(),
                                     custom_alert: c_a,
                                     steps_counter:0 })

export let set_highlighting_rt = function(r:SourceRange) : StmtRt {
  return co_change_state<MemRt, ErrVal>(m => ({...m, highlighting:r})).combine(co_unit(apply(inl<Val,Val>(),mk_unit_val)))
}
export let set_v_expr_rt = function (v: ValueName, e: ExprRt<Sum<Val,Val>>): StmtRt {
  return e.then(e_val =>
    // console.log(`Setting ${v} to ${JSON.stringify(e_val)}`) ||
    set_v_rt(v, e_val))
}
export let set_v_rt = function (v: ValueName, vals: Sum<Val,Val>): StmtRt {
  let val = vals.value

  let f = store_rt(v, val)
  return co_change_state<MemRt, ErrVal>(f).combine(co_unit(apply(inl<Val,Val>(),mk_unit_val)))
}
export let decl_v_rt = function (v: ValueName, vals: Sum<Val,Val>): StmtRt {
  let val = vals.value

  let f = decl_rt(v, val)
  return co_change_state<MemRt, ErrVal>(f).combine(co_unit(apply(inl<Val,Val>(),mk_unit_val)))
}
export let get_v_rt = function (r:SourceRange, v: ValueName): ExprRt<Sum<Val,Val>> {
  return co_from_state<MemRt, ErrVal, Sum<Unit,Sum<Val,Val>>>(load_rt(v)).then(load_res => {
    if (load_res.kind == "left") return co_error<MemRt,ErrVal,Sum<Val,Val>>({ message:`Error: variable ${v} cannot be found.`, range:r })
    return co_unit(load_res.value)
  })
}

export let new_obj_rt = function (): ExprRt<Sum<Val,Val>> {
  return co_from_and_change_state(heap_alloc_rt(mk_obj_val(empty_scope_val)))
}
export let new_arr_rt = function (len:number): ExprRt<Sum<Val,Val>> {
  return co_from_and_change_state(heap_alloc_rt(mk_arr_val(init_array_val(len))))
}
export let mk_expr_from_val = function (v:Val): ExprRt<Sum<Val,Val>> {
  return co_unit(apply(inl<Val,Val>(), v))
}

export let new_arr_with_args_rt = function (args:Sum<Val,Val>[]): ExprRt<Sum<Val,Val>> {
  return co_from_and_change_state(heap_alloc_rt(mk_arr_val(init_array_with_args_val(args.map(arg => arg.value)))))
}

export let new_arr_expr_rt = function (r:SourceRange, len:ExprRt<Sum<Val,Val>>): ExprRt<Sum<Val,Val>> {
  return len.then(len_v => len_v.value.k != "i" ? runtime_error(r, `Cannot create array of length ${len_v.value.v} as it is not an integer.`) : new_arr_rt(len_v.value.v))
}
export let new_arr_expr_with_values_rt = function (args:Array<ExprRt<Sum<Val,Val>>>): ExprRt<Sum<Val,Val>> {
  return comm_list_coroutine<MemRt,ErrVal,Sum<Val,Val>>(Immutable.List<ExprRt<Sum<Val,Val>>>(args)).then(args_v => new_arr_with_args_rt(args_v.toArray()))
  // len.then(len_v => len_v.value.k != "i" ? runtime_error(r, `Cannot create array of length ${len_v.value.v} as it is not an integer.`) : new_arr_rt(len_v.value.v))
}
export let get_arr_len_rt = function(r:SourceRange, a_ref:Val) : ExprRt<Sum<Val,Val>> {
  return a_ref.k != "ref" ? runtime_error(r, `Cannot lookup element on ${a_ref.v} as it is not an array reference.`) :
         get_heap_v_rt(r, a_ref.v).then(a_val =>
         a_val.value.k != "arr" ? runtime_error(r, `Cannot lookup element on ${a_val.value.v} as it is not an array.`) :
         co_unit<MemRt,ErrVal,Sum<Val,Val>>(apply(inl(), mk_int_val(a_val.value.v.length))))
}
export let get_arr_len_expr_rt = function(r:SourceRange, a:ExprRt<Sum<Val,Val>>) : ExprRt<Sum<Val,Val>> {
  return a.then(a_val => get_arr_len_rt(r, a_val.value))
}
export let get_arr_el_rt = function(r:SourceRange, a_ref:Val, i:number) : ExprRt<Sum<Val,Val>> {
  return a_ref.k != "ref" ? runtime_error(r, `Cannot lookup element on ${a_ref.v} as it is not an array reference.`) :
         get_heap_v_rt(r, a_ref.v).then(a_val =>
         a_val.value.k != "arr" ? runtime_error(r, `Cannot lookup element on ${a_val.value.v} as it is not an array.`) :
         !a_val.value.v.elements.has(i) ? runtime_error(r, `Cannot find element ${i} on ${a_val.value.v}.`) :
         co_unit<MemRt,ErrVal,Sum<Val,Val>>(apply(inl(), a_val.value.v.elements.get(i))))
}
export let get_arr_el_expr_rt = function(r:SourceRange, a:ExprRt<Sum<Val,Val>>, i:ExprRt<Sum<Val,Val>>) : ExprRt<Sum<Val,Val>> {
  return a.then(a_val =>
         i.then(i_val =>
         i_val.value.k != "i" ? runtime_error(r, `Index ${i_val} is not an integer.`) :
         get_arr_el_rt(r, a_val.value, i_val.value.v)))
}
export let set_arr_el_rt = function(r:SourceRange, a_ref:Val, i:number, v:Val) : StmtRt {
  return a_ref.k != "ref" ? runtime_error(r, `Cannot lookup element on ${a_ref.v} as it is not an array reference.`) :
         get_heap_v_rt(r, a_ref.v).then(a_val =>
         a_val.value.k != "arr" ? runtime_error(r, `Cannot lookup element on ${a_val.value.v} as it is not an array.`) :
         set_heap_v_rt(a_ref.v, {...a_val.value, v:{...a_val.value.v, length:Math.max(i+1, a_val.value.v.length), elements:a_val.value.v.elements.set(i, v)} }))
}
export let set_arr_el_expr_rt = function(r:SourceRange, a:ExprRt<Sum<Val,Val>>, i:ExprRt<Sum<Val,Val>>, e:ExprRt<Sum<Val,Val>>) : StmtRt {
  return a.then(a_val =>
         i.then(i_val =>
         {
           if(i_val.value.k != "i") return runtime_error(r, `Index ${i_val} is not an integer.`)
           let i = i_val.value
           return e.then(e_val => set_arr_el_rt(r, a_val.value, i.v, e_val.value))
          }))
}
export let set_heap_v_rt = function (v: ValueName, val: Val): StmtRt {
  return co_change_state<MemRt,ErrVal>(store_heap_rt(v,val)).combine(co_unit(apply(inl<Val,Val>(),mk_unit_val)))
}
export let get_heap_v_rt = function (r:SourceRange, v: ValueName): ExprRt<Sum<Val,Val>> {
  return co_from_state<MemRt,ErrVal,Sum<Unit,Val>>(load_heap_rt(v)).then(loaded_val => {
    if (loaded_val.kind == "left") return co_error({ message:`Cannot find heap entry ${v}.`, range:r })
    return co_unit(apply(inl<Val,Val>(), loaded_val.value))
  })
}
export let set_class_def_rt = function (v: ValueName, int: Interface): StmtRt {
  return co_change_state<MemRt,ErrVal>(store_class_def_rt(v, int)).combine(co_unit(apply(inl<Val,Val>(),mk_unit_val)))
}
export let add_method_def_rt = function (class_name: ValueName, method_name:ValueName, method_body:StmtRt): StmtRt {
  return co_change_state<MemRt,ErrVal>(prev_state => ({...prev_state, classes: prev_state.classes.set(class_name, 
                                                                                                      {...prev_state.classes.get(class_name), 
                                                                                                          methods: prev_state.classes.get(class_name).methods.set(method_name, method_body)})
                                                      })).combine(co_unit(apply(inl<Val,Val>(),mk_unit_val)))
}

export let get_class_def_rt = function (r:SourceRange, v: ValueName): ExprRt<Interface> {
  return co_from_state<MemRt,ErrVal,Sum<Unit,Interface>>(load_class_def_rt(v)).then(loaded_val => {
    if (loaded_val.kind == "left") return co_error({ message:`Cannot find class ${v}.`, range:r })
    return co_unit(loaded_val.value)
  })
}
export let set_fun_def_rt = function (v: ValueName, l: Lambda): StmtRt {
  return co_change_state<MemRt,ErrVal>(store_fun_def_rt(v, l)).combine(co_unit(apply(inl<Val,Val>(),mk_unit_val)))
}
export let get_fun_def_rt = function (r:SourceRange, v: ValueName): ExprRt<Lambda> {
  return co_from_state<MemRt,ErrVal,Sum<Unit,Lambda>>(load_fun_def_rt(v)).then(loaded_val => {
    if (loaded_val.kind == "left") return co_error({ message:`Cannot find function definition ${v}.`, range:r })
    return co_unit(loaded_val.value)
  })
}
