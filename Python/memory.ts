import * as Immutable from "immutable"
import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair, fun2 } from "ts-bccc"
import * as CCC from "ts-bccc"
import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
import * as Co from "ts-bccc"
import { SourceRange, mk_range } from "../source_range"
import { comm_list_coroutine } from "../ccc_aux";

export let runtime_error = function(e:ErrVal) : ExprRt<Sum<Val,Val>> { return co_error<MemRt, ErrVal, Sum<Val,Val>>(e) }
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
                              static_fields:Immutable.Map<ValueName, Val>,
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

export type ErrVal = string

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

export interface MemRt { highlighting:SourceRange, globals:Scopes, heap:Scope, functions:Immutable.Map<ValueName,Lambda>, classes:Immutable.Map<ValueName, Interface>, stack:Immutable.Map<number, Scopes> }
let highlight : Fun<Prod<SourceRange, MemRt>, MemRt> = fun(x => ({...x.snd, highlighting:x.fst }))
export let load_rt: Fun<Prod<string, MemRt>, Sum<Unit,Sum<Val,Val>>> = fun(x =>
  {
    if(!x.snd.stack.isEmpty()){
      let res = find_last_scope<Scope>(x.snd.stack.get(x.snd.stack.count()-1), (scope:Scope) => scope.has(x.fst) ? { kind: "right", value: scope } : { kind: "left", value: {} })
      if(res.kind == "right")
        return apply(inr<Unit,Sum<Val,Val>>(), apply(inl<Val,Val>(),res.value.get(x.fst)))
    }
    let maybe_in_globals = find_last_scope<Scope>(x.snd.globals, (scope:Scope) => scope.has(x.fst) ? { kind: "right", value: scope } : { kind: "left", value: {} })
    if(maybe_in_globals.kind == "right"){
      return apply(inr<Unit,Sum<Val,Val>>(), apply(inl<Val,Val>(),maybe_in_globals.value.get(x.fst)))
    }
    return apply(inl<Unit,Sum<Val,Val>>(), {})
  })

export let store_rt: Fun<Prod<Prod<string, Val>, MemRt>, MemRt> = fun(x => {

  if(!x.snd.stack.isEmpty()){
    let scopes1 = update_variable(x.fst.fst,x.fst.snd,x.snd.stack.get(x.snd.stack.count() - 1), true)
    if(scopes1.kind == "right"){
      return ({...x.snd, stack:x.snd.stack.set(x.snd.stack.count() - 1, scopes1.value) })
    }
  }
  let scopes1 = update_variable(x.fst.fst,x.fst.snd,x.snd.globals, true)
  if(scopes1.kind == "right"){
    return ({...x.snd, globals:scopes1.value })
  }
  return x.snd
})

export let decl_rt: Fun<Prod<Prod<string, Val>, MemRt>, MemRt> = fun(x => {

    if(x.snd.stack.count() > 0){
      return ({...x.snd, stack:x.snd.stack.set(x.snd.stack.count() - 1, x.snd.stack.last().set(x.snd.stack.last().count() - 1, x.snd.stack.last().last().set(x.fst.fst, x.fst.snd))) })
    }
    else{
      return  ({...x.snd, globals:x.snd.globals.set(x.snd.globals.count() - 1, x.snd.globals.last().set(x.fst.fst, x.fst.snd)) })
    }
  })

export let load_class_def_rt: Fun<Prod<ValueName, MemRt>, Sum<Unit,Interface>> = fun(x =>
  x.snd.classes.has(x.fst) ? apply(inr(), x.snd.classes.get(x.fst)) : apply(inl<Unit,Interface>(), {}))
export let store_class_def_rt: Fun<Prod<Prod<ValueName, Interface>, MemRt>, MemRt> = fun(x => ({...x.snd, classes:x.snd.classes.set(x.fst.fst, x.fst.snd) }))
export let load_fun_def_rt: Fun<Prod<ValueName, MemRt>, Sum<Unit,Lambda>> = fun(x =>
  x.snd.functions.has(x.fst) ?
    apply(inr(), x.snd.functions.get(x.fst))
  : apply(inl(), {}))
export let store_fun_def_rt: Fun<Prod<Prod<ValueName, Lambda>, MemRt>, MemRt> = fun(x => ({...x.snd, functions:x.snd.functions.set(x.fst.fst, x.fst.snd) }))
export let load_heap_rt: Fun<Prod<ValueName, MemRt>, Sum<Unit,Val>> = fun(x =>
  x.snd.heap.has(x.fst) ?
    apply(inr(), x.snd.heap.get(x.fst))
  : apply(inl(), {}))
export let store_heap_rt: Fun<Prod<Prod<ValueName, Val>, MemRt>, MemRt> = fun(x => {
  let res:MemRt = ({...x.snd, heap:x.snd.heap.set(x.fst.fst, x.fst.snd) })
  return res
})
export let heap_alloc_rt: Fun<Prod<Val,MemRt>, Prod<Val, MemRt>> = fun(x => {
  let new_ref = `ref_${x.snd.heap.count()}`
  return ({ fst:mk_ref_val(new_ref), snd:{...x.snd, heap:x.snd.heap.set(new_ref, x.fst) }})
})


export let push_inner_scope_rt = curry(fun2<Scope,MemRt,MemRt>((s,m) => {
  if(!m.stack.isEmpty()){
    let stack_count = m.stack.count()
    let top_stack = m.stack.last()
    let top_stack_count = top_stack.count()
    return ({...m, stack:m.stack.set(stack_count - 1, top_stack.set(top_stack_count, s))})
  }
  else {
    return ({...m, globals:m.globals.set(m.globals.count(), s)})
  }
}))
export let pop_inner_scope_rt = curry(fun2<Scope,MemRt,MemRt>((s,m) => {
  if(!m.stack.isEmpty()){
    let stack_count = m.stack.count()
    let top_stack = m.stack.get(stack_count - 1)
    let top_stack_count = top_stack.count()

    return ({...m, stack:m.stack.set(stack_count - 1, top_stack.remove(top_stack_count - 1))})
  }
  else{
    return ({...m, globals:m.globals.remove(m.globals.count() - 1)})
  }
}))

export let push_scope_rt = curry(fun2<Scope,MemRt,MemRt>((s,m) => ({...m, stack:m.stack.set(m.stack.count(), Immutable.Map<NestingLevel, Immutable.Map<ValueName, Val>>().set(0, s))})))

export let pop_scope_rt: Fun<MemRt, Sum<Unit,MemRt>> = fun(x =>
  !x.stack.isEmpty() ?
    apply(inr(), ({...x, stack:x.stack.remove(x.stack.count()-1)}))
  : apply(inl(), {}))

export interface ExprRt<A> extends Coroutine<MemRt, ErrVal, A> {}
export type StmtRt = ExprRt<Sum<Val,Val>>

export let empty_memory_rt:MemRt = { highlighting:mk_range(0,0,0,0),
                                     globals:empty_scopes_val,
                                     heap:empty_scope_val,
                                     functions:Immutable.Map<ValueName,Lambda>(),
                                     classes:Immutable.Map<ValueName, Interface>(),
                                     stack:Immutable.Map<number, Scopes>() }

export let set_highlighting_rt = function(r:SourceRange) : StmtRt {
  return mk_coroutine(constant<MemRt, SourceRange>(r).times(id<MemRt>()).then(highlight).then(constant<MemRt,Sum<Val,Val>>(apply(inl(),mk_unit_val)).times(id<MemRt>())).then(Co.value<MemRt, ErrVal, Sum<Val,Val>>().then(Co.result<MemRt, ErrVal, Sum<Val,Val>>().then(Co.no_error<MemRt, ErrVal, Sum<Val,Val>>()))))
}
export let set_v_expr_rt = function (v: ValueName, e: ExprRt<Sum<Val,Val>>): StmtRt {
  return e.then(e_val =>
    // console.log(`Setting ${v} to ${JSON.stringify(e_val)}`) ||
    set_v_rt(v, e_val))
}
export let set_v_rt = function (v: ValueName, vals: Sum<Val,Val>): StmtRt {
  let val = vals.value
  let store_co = store_rt.then((constant<MemRt,Val>(mk_unit_val).then(inl<Val,Val>())).times(id<MemRt>()).then(Co.value<MemRt, ErrVal, Sum<Val,Val>>().then(Co.result<MemRt, ErrVal, Sum<Val,Val>>().then(Co.no_error<MemRt, ErrVal, Sum<Val,Val>>()))))
  let f = ((constant<MemRt, string>(v).times(constant<MemRt, Val>(val))).times(id<MemRt>())).then(store_co)
  return mk_coroutine(f)
}
export let decl_v_rt = function (v: ValueName, vals: Sum<Val,Val>): StmtRt {
  let val = vals.value
  let store_co = decl_rt.then((constant<MemRt,Val>(mk_unit_val).then(inl<Val,Val>())).times(id<MemRt>()).then(Co.value<MemRt, ErrVal, Sum<Val,Val>>().then(Co.result<MemRt, ErrVal, Sum<Val,Val>>().then(Co.no_error<MemRt, ErrVal, Sum<Val,Val>>()))))
  let f = ((constant<MemRt, string>(v).times(constant<MemRt, Val>(val))).times(id<MemRt>())).then(store_co)
  return mk_coroutine(f)
}
export let get_v_rt = function (v: ValueName): ExprRt<Sum<Val,Val>> {
  let f:Fun<MemRt, Sum<Unit, Prod<MemRt, Sum<Val,Val>>>> = constant<MemRt, string>(v).times(id<MemRt>()).then(load_rt).times(id<MemRt>()).then(CCC.swap_prod()).then(CCC.distribute_sum_prod()).then(snd<MemRt,Unit>().map_plus(id()))
  let g_err = constant<Unit,ErrVal>(`Error: variable ${v} cannot be found.`).then(Co.error<MemRt,ErrVal,Sum<Val,Val>>())
  let g_res = swap_prod<MemRt,Sum<Val,Val>>().then(Co.value<MemRt,ErrVal,Sum<Val,Val>>()).then(Co.result<MemRt,ErrVal,Sum<Val,Val>>()).then(Co.no_error<MemRt,ErrVal,Sum<Val,Val>>())
  let g:Fun<Sum<Unit,Prod<MemRt,Sum<Val,Val>>>, Co.CoPreRes<MemRt,ErrVal,Sum<Val,Val>>> = g_err.plus(g_res)
  return mk_coroutine(f.then(g))
}

export let new_obj_rt = function (): ExprRt<Sum<Val,Val>> {
  let heap_alloc_co:Coroutine<MemRt,ErrVal,Sum<Val,Val>> = mk_coroutine(constant<MemRt,Val>(mk_obj_val(empty_scope_val)).times(id<MemRt>()).then(heap_alloc_rt).then((inl<Val,Val>()).map_times(id())).then(Co.value<MemRt, ErrVal, Sum<Val,Val>>().then(Co.result<MemRt, ErrVal, Sum<Val,Val>>().then(Co.no_error<MemRt, ErrVal, Sum<Val,Val>>()))))
  return (heap_alloc_co)
}
export let new_arr_rt = function (len:number): ExprRt<Sum<Val,Val>> {
  let heap_alloc_co:Coroutine<MemRt,ErrVal,Sum<Val,Val>> = mk_coroutine(constant<MemRt,Val>(mk_arr_val(init_array_val(len))).times(id<MemRt>()).then(heap_alloc_rt).then((inl<Val,Val>()).map_times(id())).then(Co.value<MemRt, ErrVal, Sum<Val,Val>>().then(Co.result<MemRt, ErrVal, Sum<Val,Val>>().then(Co.no_error<MemRt, ErrVal, Sum<Val,Val>>()))))
  return (heap_alloc_co)
}
export let new_arr_with_args_rt = function (args:Sum<Val,Val>[]): ExprRt<Sum<Val,Val>> {
  let heap_alloc_co:Coroutine<MemRt,ErrVal,Sum<Val,Val>> = mk_coroutine(constant<MemRt,Val>(mk_arr_val(init_array_with_args_val(args.map(arg => arg.value)))).times(id<MemRt>()).then(heap_alloc_rt).then((inl<Val,Val>()).map_times(id())).then(Co.value<MemRt, ErrVal, Sum<Val,Val>>().then(Co.result<MemRt, ErrVal, Sum<Val,Val>>().then(Co.no_error<MemRt, ErrVal, Sum<Val,Val>>()))))
  return (heap_alloc_co)
}

export let new_arr_expr_rt = function (len:ExprRt<Sum<Val,Val>>): ExprRt<Sum<Val,Val>> {
  return len.then(len_v => len_v.value.k != "i" ? runtime_error(`Cannot create array of length ${len_v.value.v} as it is not an integer.`) : new_arr_rt(len_v.value.v))
}
export let new_arr_expr_with_values_rt = function (args:Array<ExprRt<Sum<Val,Val>>>): ExprRt<Sum<Val,Val>> {
  return comm_list_coroutine(Immutable.List<ExprRt<Sum<Val,Val>>>(args)).then(args_v => new_arr_with_args_rt(args_v.toArray()))
  // len.then(len_v => len_v.value.k != "i" ? runtime_error(`Cannot create array of length ${len_v.value.v} as it is not an integer.`) : new_arr_rt(len_v.value.v))
}
export let get_arr_len_rt = function(a_ref:Val) : ExprRt<Sum<Val,Val>> {
  return a_ref.k != "ref" ? runtime_error(`Cannot lookup element on ${a_ref.v} as it is not an array reference.`) :
         get_heap_v_rt(a_ref.v).then(a_val =>
         a_val.value.k != "arr" ? runtime_error(`Cannot lookup element on ${a_val.value.v} as it is not an array.`) :
         co_unit<MemRt,ErrVal,Sum<Val,Val>>(apply(inl(), mk_int_val(a_val.value.v.length))))
}
export let get_arr_len_expr_rt = function(a:ExprRt<Sum<Val,Val>>) : ExprRt<Sum<Val,Val>> {
  return a.then(a_val => get_arr_len_rt(a_val.value))
}
export let get_arr_el_rt = function(a_ref:Val, i:number) : ExprRt<Sum<Val,Val>> {
  return a_ref.k != "ref" ? runtime_error(`Cannot lookup element on ${a_ref.v} as it is not an array reference.`) :
         get_heap_v_rt(a_ref.v).then(a_val =>
         a_val.value.k != "arr" ? runtime_error(`Cannot lookup element on ${a_val.value.v} as it is not an array.`) :
         !a_val.value.v.elements.has(i) ? runtime_error(`Cannot find element ${i} on ${a_val.value.v}.`) :
         co_unit<MemRt,ErrVal,Sum<Val,Val>>(apply(inl(), a_val.value.v.elements.get(i))))
}
export let get_arr_el_expr_rt = function(a:ExprRt<Sum<Val,Val>>, i:ExprRt<Sum<Val,Val>>) : ExprRt<Sum<Val,Val>> {
  return a.then(a_val =>
         i.then(i_val =>
         i_val.value.k != "i" ? runtime_error(`Index ${i_val} is not an integer.`) :
         get_arr_el_rt(a_val.value, i_val.value.v)))
}
export let set_arr_el_rt = function(a_ref:Val, i:number, v:Val) : StmtRt {
  return a_ref.k != "ref" ? runtime_error(`Cannot lookup element on ${a_ref.v} as it is not an array reference.`) :
         get_heap_v_rt(a_ref.v).then(a_val =>
         a_val.value.k != "arr" ? runtime_error(`Cannot lookup element on ${a_val.value.v} as it is not an array.`) :
         set_heap_v_rt(a_ref.v, {...a_val.value, v:{...a_val.value.v, length:Math.max(i+1, a_val.value.v.length), elements:a_val.value.v.elements.set(i, v)} }))
}
export let set_arr_el_expr_rt = function(a:ExprRt<Sum<Val,Val>>, i:ExprRt<Sum<Val,Val>>, e:ExprRt<Sum<Val,Val>>) : StmtRt {
  return a.then(a_val =>
         i.then(i_val =>
         {
           if(i_val.value.k != "i") return runtime_error(`Index ${i_val} is not an integer.`)
           let i = i_val.value
           return e.then(e_val => set_arr_el_rt(a_val.value, i.v, e_val.value))
          }))
}
export let set_heap_v_rt = function (v: ValueName, val: Val): StmtRt {
  let store_co = store_heap_rt.then((constant<MemRt,Val>(mk_unit_val).then(inl<Val,Val>())).times(id<MemRt>()).then(Co.value<MemRt, ErrVal, Sum<Val,Val>>().then(Co.result<MemRt, ErrVal, Sum<Val,Val>>().then(Co.no_error<MemRt, ErrVal, Sum<Val,Val>>()))))
  let f = ((constant<MemRt, string>(v).times(constant<MemRt, Val>(val))).times(id<MemRt>())).then(store_co)
  return mk_coroutine(f)
}
export let get_heap_v_rt = function (v: ValueName): ExprRt<Sum<Val,Val>> {
  let f = (constant<MemRt, string>(v).times(id<MemRt>()).then(load_heap_rt.then(id().map_plus(inl<Val,Val>())))).times(id<MemRt>()).then(swap_prod()).then(CCC.distribute_sum_prod()).then(snd<MemRt,Unit>().map_plus(swap_prod()))
  let g1 = constant<Unit,ErrVal>(`Cannot find heap entry ${v}.`).then(Co.error<MemRt,ErrVal,Sum<Val,Val>>())
  let g2 = Co.no_error<MemRt, ErrVal, Sum<Val,Val>>().after(Co.result<MemRt, ErrVal, Sum<Val,Val>>().after(Co.value<MemRt, ErrVal, Sum<Val,Val>>()))
  let g = g1.plus(g2)
  return mk_coroutine(f.then(g))
}
export let set_class_def_rt = function (v: ValueName, int: Interface): StmtRt {
  let store_co = store_class_def_rt.then((constant<MemRt,Val>(mk_unit_val).then(inl<Val,Val>())).times(id<MemRt>()).then(Co.value<MemRt, ErrVal, Sum<Val,Val>>().then(Co.result<MemRt, ErrVal, Sum<Val,Val>>().then(Co.no_error<MemRt, ErrVal, Sum<Val,Val>>()))))
  let f = ((constant<MemRt, string>(v).times(constant<MemRt, Interface>(int))).times(id<MemRt>())).then(store_co)
  let g = f
  return mk_coroutine(f)
}
export let get_class_def_rt = function (v: ValueName): ExprRt<Interface> {
  let f = (constant<MemRt, string>(v).times(id<MemRt>()).then(load_class_def_rt)).times(id<MemRt>()).then(
            swap_prod()).then(CCC.distribute_sum_prod()).then(snd<MemRt,Unit>().map_plus(swap_prod<MemRt,Interface>()))
  let g1 = constant<Unit,ErrVal>(`Cannot find class ${v}.`).then(Co.error<MemRt,ErrVal,Interface>())
  let g2 = Co.no_error<MemRt, ErrVal, Interface>().after(Co.result<MemRt, ErrVal, Interface>().after(Co.value<MemRt, ErrVal, Interface>()))
  let g:Fun<Sum<Unit,Prod<Interface,MemRt>>,Co.CoPreRes<MemRt,ErrVal,Interface>> = g1.plus(g2)
  return mk_coroutine(f.then(g))
}
export let set_fun_def_rt = function (v: ValueName, l: Lambda): StmtRt {
  let store_co = store_fun_def_rt.then((constant<MemRt,Val>(mk_unit_val).then(inl<Val,Val>())).times(id<MemRt>()).then(Co.value<MemRt, ErrVal, Sum<Val,Val>>().then(Co.result<MemRt, ErrVal, Sum<Val,Val>>().then(Co.no_error<MemRt, ErrVal, Sum<Val,Val>>()))))
  let f = ((constant<MemRt, string>(v).times(constant<MemRt, Lambda>(l))).times(id<MemRt>())).then(store_co)
  return mk_coroutine(f)
}
export let get_fun_def_rt = function (v: ValueName): ExprRt<Lambda> {
  let f = (constant<MemRt, string>(v).times(id<MemRt>()).then(load_fun_def_rt)).times(id<MemRt>()).then(swap_prod()).then(CCC.distribute_sum_prod()).then(snd<MemRt,Unit>().map_plus(swap_prod()))
  let g1 = constant<Unit,ErrVal>(`Cannot find function definition ${v}.`).then(Co.error<MemRt,ErrVal,Lambda>())
  let g2 = Co.no_error<MemRt, ErrVal, Lambda>().after(Co.result<MemRt, ErrVal, Lambda>().after(Co.value<MemRt, ErrVal, Lambda>()))
  let g = g1.plus(g2)
  return mk_coroutine(f.then(g))
}
