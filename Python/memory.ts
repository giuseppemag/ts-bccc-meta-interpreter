import * as Immutable from "immutable"
import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair, fun2 } from "ts-bccc"
import * as CCC from "ts-bccc"
import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
import * as Co from "ts-bccc"
import { SourceRange, mk_range } from "../source_range"

export let runtime_error = function(e:ErrVal) : ExprRt<Val> { return co_error<MemRt, ErrVal, Val>(e) }
export type Bool = boolean

export interface Lambda { body:ExprRt<Val>, parameters:Array<ValueName>, closure: Scope }
export interface HeapRef { v:string, k:"ref" }
export interface ArrayVal { elements:Immutable.Map<number, Val>, length:number }
export interface RenderGrid { pixels:Immutable.Map<number, Immutable.Set<number>>, width:number, height:number }
export interface RenderGridPixel { x:number, y:number, status:boolean }
export let init_array_val : (_:number) => ArrayVal = (len:number) => ({ elements: Immutable.Map<number, Val>(Immutable.Range(0,len).map(i => [i, mk_unit_val])), length:len })

export type ValueName = string
export type Val = { v:Unit, k:"u" } | { v:string, k:"s" } | { v:number, k:"f" } | { v:number, k:"i" } | { v:Bool, k:"b" } | { v:ArrayVal, k:"arr" } | { v:Scope, k:"obj" } | { v:Lambda, k:"lambda" } | HeapRef | { v:RenderGrid, k:"render-grid" } | { v:RenderGridPixel, k:"render-grid-pixel" }
export interface Scope extends Immutable.Map<ValueName, Val> {}
export interface Interface { base:Sum<Interface, Unit>, methods:Immutable.Map<ValueName, StmtRt> }
export let empty_scope_val = Immutable.Map<ValueName, Val>()
export let mk_unit_val : Val = ({ v:apply(unit(),{}), k:"u" })
export let mk_string_val : (_:string) => Val = v => ({ v:v, k:"s" })
export let mk_int_val : (_:number) => Val = v => ({ v:Math.floor(v), k:"i" })
export let mk_float_val : (_:number) => Val = v => ({ v:v, k:"f" })
export let mk_arr_val : (_:ArrayVal) => Val = v => ({ v:v, k:"arr" })
export let mk_bool_val : (_:boolean) => Val = v => ({ v:v, k:"b" })
export let mk_lambda_val : (_:Lambda) => Val = l => ({ v:l, k:"lambda" })
export let mk_obj_val : (_:Scope) => Val = o => ({ v:o, k:"obj" })
export let mk_ref_val : (_:ValueName) => Val = r => ({ v:r, k:"ref" })
export let mk_render_grid_val : (_:RenderGrid) => Val = r => ({ v:r, k:"render-grid" })
export let mk_render_grid_pixel_val : (_:RenderGridPixel) => Val = p => ({ v:p, k:"render-grid-pixel" })

export type ErrVal = string
export interface MemRt { highlighting:SourceRange, globals:Scope, heap:Scope, functions:Immutable.Map<ValueName,Lambda>, classes:Immutable.Map<ValueName, Interface>, stack:Immutable.Map<number, Scope> }
let highlight : Fun<Prod<SourceRange, MemRt>, MemRt> = fun(x => ({...x.snd, highlighting:x.fst }))
export let load_rt: Fun<Prod<string, MemRt>, Sum<Unit,Val>> = fun(x =>
  !x.snd.stack.isEmpty() && x.snd.stack.get(x.snd.stack.count()-1).has(x.fst) ?
    apply(inr<Unit,Val>(), x.snd.stack.get(x.snd.stack.count()-1).get(x.fst))
  : x.snd.globals.has(x.fst) ?
    apply(inr<Unit,Val>(), x.snd.globals.get(x.fst))
  : apply(inl<Unit,Val>(), {}))
export let store_rt: Fun<Prod<Prod<string, Val>, MemRt>, MemRt> = fun(x =>
  !x.snd.stack.isEmpty() ?
    ({...x.snd, stack:x.snd.stack.set(x.snd.stack.count() - 1, x.snd.stack.get(x.snd.stack.count() - 1).set(x.fst.fst, x.fst.snd)) })
  :
    ({...x.snd, globals:x.snd.globals.set(x.fst.fst, x.fst.snd) }))
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
export let store_heap_rt: Fun<Prod<Prod<ValueName, Val>, MemRt>, MemRt> = fun(x => ({...x.snd, heap:x.snd.heap.set(x.fst.fst, x.fst.snd) }))
export let heap_alloc_rt: Fun<Prod<Val,MemRt>, Prod<Val, MemRt>> = fun(x => {
  let new_ref = `ref_${x.snd.heap.count()}`
  return ({ fst:mk_ref_val(new_ref), snd:{...x.snd, heap:x.snd.heap.set(new_ref, x.fst) }})
})
export let push_scope_rt = curry(fun2<Scope,MemRt,MemRt>((s,m) => ({...m, stack:m.stack.set(m.stack.count(), s)})))
export let pop_scope_rt: Fun<MemRt, Sum<Unit,MemRt>> = fun(x =>
  !x.stack.isEmpty() ?
    apply(inr(), ({...x, stack:x.stack.remove(x.stack.count()-1)}))
  : apply(inl(), {}))

export interface ExprRt<A> extends Coroutine<MemRt, ErrVal, A> {}
export type StmtRt = ExprRt<Val>

export let empty_memory_rt:MemRt = { highlighting:mk_range(0,0,0,0), globals:empty_scope_val, heap:empty_scope_val, functions:Immutable.Map<ValueName,Lambda>(), classes:Immutable.Map<ValueName, Interface>(), stack:Immutable.Map<number, Scope>() }

export let set_highlighting_rt = function(r:SourceRange) : StmtRt {
  return mk_coroutine(constant<MemRt, SourceRange>(r).times(id<MemRt>()).then(highlight).then(constant<MemRt,Val>(mk_unit_val).times(id<MemRt>())).then(Co.value<MemRt, ErrVal, Val>().then(Co.result<MemRt, ErrVal, Val>().then(Co.no_error<MemRt, ErrVal, Val>()))))
}
export let set_v_expr_rt = function (v: ValueName, e: ExprRt<Val>): StmtRt {
  return e.then(e_val =>
    // console.log(`Setting ${v} to ${JSON.stringify(e_val)}`) ||
    set_v_rt(v, e_val))
}
export let set_v_rt = function (v: ValueName, val: Val): StmtRt {
  let store_co = store_rt.then(constant<MemRt,Val>(mk_unit_val).times(id<MemRt>()).then(Co.value<MemRt, ErrVal, Val>().then(Co.result<MemRt, ErrVal, Val>().then(Co.no_error<MemRt, ErrVal, Val>()))))
  let f = ((constant<MemRt, string>(v).times(constant<MemRt, Val>(val))).times(id<MemRt>())).then(store_co)
  return mk_coroutine(f)
}
export let get_v_rt = function (v: ValueName): ExprRt<Val> {
  let f = constant<MemRt, string>(v).times(id<MemRt>()).then(load_rt).times(id<MemRt>()).then(CCC.swap_prod()).then(CCC.distribute_sum_prod()).then(snd<MemRt,Unit>().map_plus(id()))
  let g_err = constant<Unit,ErrVal>(`Error: variable ${v} cannot be found.`).then(Co.error<MemRt,ErrVal,Val>())
  let g_res = swap_prod<MemRt,Val>().then(Co.value<MemRt,ErrVal,Val>()).then(Co.result<MemRt,ErrVal,Val>()).then(Co.no_error<MemRt,ErrVal,Val>())
  let g:Fun<Sum<Unit,Prod<MemRt,Val>>, Co.CoPreRes<MemRt,ErrVal,Val>> = g_err.plus(g_res)
  return mk_coroutine(f.then(g))
}

export let new_obj_rt = function (): ExprRt<Val> {
  let heap_alloc_co:Coroutine<MemRt,ErrVal,Val> = mk_coroutine(constant<MemRt,Val>(mk_obj_val(empty_scope_val)).times(id<MemRt>()).then(heap_alloc_rt).then(Co.value<MemRt, ErrVal, Val>().then(Co.result<MemRt, ErrVal, Val>().then(Co.no_error<MemRt, ErrVal, Val>()))))
  return (heap_alloc_co)
}
export let new_arr_rt = function (len:number): ExprRt<Val> {
  let heap_alloc_co:Coroutine<MemRt,ErrVal,Val> = mk_coroutine(constant<MemRt,Val>(mk_arr_val(init_array_val(len))).times(id<MemRt>()).then(heap_alloc_rt).then(Co.value<MemRt, ErrVal, Val>().then(Co.result<MemRt, ErrVal, Val>().then(Co.no_error<MemRt, ErrVal, Val>()))))
  return (heap_alloc_co)
}
export let new_arr_expr_rt = function (len:ExprRt<Val>): ExprRt<Val> {
  return len.then(len_v => len_v.k != "i" ? runtime_error(`Cannot create array of length ${len_v.v} as it is not an integer.`) : new_arr_rt(len_v.v))
}
export let get_arr_len_rt = function(a_ref:Val) : ExprRt<Val> {
  return a_ref.k != "ref" ? runtime_error(`Cannot lookup element on ${a_ref.v} as it is not an array reference.`) :
         get_heap_v_rt(a_ref.v).then(a_val =>
         a_val.k != "arr" ? runtime_error(`Cannot lookup element on ${a_val.v} as it is not an array.`) :
         co_unit<MemRt,ErrVal,Val>(mk_int_val(a_val.v.length)))
}
export let get_arr_len_expr_rt = function(a:ExprRt<Val>) : ExprRt<Val> {
  return a.then(a_val => get_arr_len_rt(a_val))
}
export let get_arr_el_rt = function(a_ref:Val, i:number) : ExprRt<Val> {
  return a_ref.k != "ref" ? runtime_error(`Cannot lookup element on ${a_ref.v} as it is not an array reference.`) :
         get_heap_v_rt(a_ref.v).then(a_val =>
         a_val.k != "arr" ? runtime_error(`Cannot lookup element on ${a_val.v} as it is not an array.`) :
         !a_val.v.elements.has(i) ? runtime_error(`Cannot find element ${i} on ${a_val.v}.`) :
         co_unit<MemRt,ErrVal,Val>(a_val.v.elements.get(i)))
}
export let get_arr_el_expr_rt = function(a:ExprRt<Val>, i:ExprRt<Val>) : ExprRt<Val> {
  return a.then(a_val =>
         i.then(i_val =>
         i_val.k != "i" ? runtime_error(`Index ${i_val} is not an integer.`) :
         get_arr_el_rt(a_val, i_val.v)))
}
export let set_arr_el_rt = function(a_ref:Val, i:number, v:Val) : StmtRt {
  return a_ref.k != "ref" ? runtime_error(`Cannot lookup element on ${a_ref.v} as it is not an array reference.`) :
         get_heap_v_rt(a_ref.v).then(a_val =>
         a_val.k != "arr" ? runtime_error(`Cannot lookup element on ${a_val.v} as it is not an array.`) :
         set_heap_v_rt(a_ref.v, {...a_val, v:{...a_val.v, length:Math.max(i+1, a_val.v.length), elements:a_val.v.elements.set(i, v)} }))
}
export let set_arr_el_expr_rt = function(a:ExprRt<Val>, i:ExprRt<Val>, e:ExprRt<Val>) : StmtRt {
  return a.then(a_val =>
         i.then(i_val =>
         i_val.k != "i" ? runtime_error(`Index ${i_val} is not an integer.`) :
         e.then(e_val => set_arr_el_rt(a_val, i_val.v, e_val))))
}
export let set_heap_v_rt = function (v: ValueName, val: Val): StmtRt {
  let store_co = store_heap_rt.then(constant<MemRt,Val>(mk_unit_val).times(id<MemRt>()).then(Co.value<MemRt, ErrVal, Val>().then(Co.result<MemRt, ErrVal, Val>().then(Co.no_error<MemRt, ErrVal, Val>()))))
  let f = ((constant<MemRt, string>(v).times(constant<MemRt, Val>(val))).times(id<MemRt>())).then(store_co)
  return mk_coroutine(f)
}
export let get_heap_v_rt = function (v: ValueName): ExprRt<Val> {
  let f = (constant<MemRt, string>(v).times(id<MemRt>()).then(load_heap_rt)).times(id<MemRt>()).then(swap_prod()).then(CCC.distribute_sum_prod()).then(snd<MemRt,Unit>().map_plus(swap_prod()))
  let g1 = constant<Unit,ErrVal>(`Cannot find heap entry ${v}.`).then(Co.error<MemRt,ErrVal,Val>())
  let g2 = Co.no_error<MemRt, ErrVal, Val>().after(Co.result<MemRt, ErrVal, Val>().after(Co.value<MemRt, ErrVal, Val>()))
  let g = g1.plus(g2)
  return mk_coroutine(f.then(g))
}
export let set_class_def_rt = function (v: ValueName, int: Interface): StmtRt {
  let store_co = store_class_def_rt.then(constant<MemRt,Val>(mk_unit_val).times(id<MemRt>()).then(Co.value<MemRt, ErrVal, Val>().then(Co.result<MemRt, ErrVal, Val>().then(Co.no_error<MemRt, ErrVal, Val>()))))
  let f = ((constant<MemRt, string>(v).times(constant<MemRt, Interface>(int))).times(id<MemRt>())).then(store_co)
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
  let store_co = store_fun_def_rt.then(constant<MemRt,Val>(mk_unit_val).times(id<MemRt>()).then(Co.value<MemRt, ErrVal, Val>().then(Co.result<MemRt, ErrVal, Val>().then(Co.no_error<MemRt, ErrVal, Val>()))))
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
