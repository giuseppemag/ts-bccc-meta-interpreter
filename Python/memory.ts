import * as Immutable from "immutable"
import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair } from "ts-bccc"
import * as CCC from "ts-bccc"
import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
import * as Co from "ts-bccc"
import { SourceRange, mk_range } from "../source_range"

export let runtime_error = function(e:Err) : Expr<Val> { return co_error<Mem, Err, Val>(e) }
export type Bool = boolean

export interface Lambda extends Prod<Expr<Val>, Array<Name>> {}
export interface HeapRef { v:string, k:"ref" }
export interface ArrayVal { elements:Immutable.Map<number, Val>, length:number }
export let init_array_val : (_:number) => ArrayVal = (len:number) => ({ elements: Immutable.Map<number, Val>(Immutable.Range(0,len).map(i => [i, unt])), length:len })

export type Name = string
export type Val = { v:Unit, k:"u" } | { v:string, k:"s" } | { v:number, k:"f" } | { v:number, k:"i" } | { v:Bool, k:"b" } | { v:ArrayVal, k:"arr" } | { v:Scope, k:"obj" } | { v:Lambda, k:"lambda" } | HeapRef
export interface Scope extends Immutable.Map<Name, Val> {}
export interface Interface { base:Sum<Interface, Unit>, methods:Immutable.Map<Name, Lambda> }
export let empty_scope = Immutable.Map<Name, Val>()
export let unt : Val = ({ v:apply(unit(),{}), k:"u" })
export let str : (_:string) => Val = v => ({ v:v, k:"s" })
export let int : (_:number) => Val = v => ({ v:Math.floor(v), k:"i" })
export let float : (_:number) => Val = v => ({ v:v, k:"f" })
export let arr : (_:ArrayVal) => Val = v => ({ v:v, k:"arr" })
export let bool : (_:boolean) => Val = v => ({ v:v, k:"b" })
export let lambda : (_:Prod<Expr<Val>, Array<Name>>) => Val = l => ({ v:l, k:"lambda" })
export let obj : (_:Scope) => Val = o => ({ v:o, k:"obj" })
export let ref : (_:Name) => Val = r => ({ v:r, k:"ref" })

export type Err = string
export interface Mem { highlighting:SourceRange, globals:Scope, heap:Scope, functions:Immutable.Map<Name,Lambda>, classes:Immutable.Map<Name, Interface>, stack:Immutable.Map<number, Scope> }
export let highlight : Fun<Prod<SourceRange, Mem>, Mem> = fun(x => ({...x.snd, highlighting:x.fst }))
export let load: Fun<Prod<string, Mem>, Sum<Unit,Val>> = fun(x =>
  !x.snd.stack.isEmpty() && x.snd.stack.get(x.snd.stack.count()-1).has(x.fst) ?
    apply(inr<Unit,Val>(), x.snd.stack.get(x.snd.stack.count()-1).get(x.fst))
  : x.snd.globals.has(x.fst) ?
    apply(inr<Unit,Val>(), x.snd.globals.get(x.fst))
  : apply(inl<Unit,Val>(), {}))
export let store: Fun<Prod<Prod<string, Val>, Mem>, Mem> = fun(x =>
  !x.snd.stack.isEmpty() ?
    ({...x.snd, stack:x.snd.stack.set(x.snd.stack.count() - 1, x.snd.stack.get(x.snd.stack.count() - 1).set(x.fst.fst, x.fst.snd)) })
  :
    ({...x.snd, globals:x.snd.globals.set(x.fst.fst, x.fst.snd) }))
export let load_class_def: Fun<Prod<Name, Mem>, Sum<Unit,Interface>> = fun(x =>
  x.snd.classes.has(x.fst) ? apply(inr(), x.snd.classes.get(x.fst)) : apply(inl<Unit,Interface>(), {}))
export let store_class_def: Fun<Prod<Prod<Name, Interface>, Mem>, Mem> = fun(x => ({...x.snd, classes:x.snd.classes.set(x.fst.fst, x.fst.snd) }))
export let load_fun_def: Fun<Prod<Name, Mem>, Sum<Unit,Lambda>> = fun(x =>
  x.snd.functions.has(x.fst) ?
    apply(inr(), x.snd.functions.get(x.fst))
  : apply(inl(), {}))
export let store_fun_def: Fun<Prod<Prod<Name, Lambda>, Mem>, Mem> = fun(x => ({...x.snd, functions:x.snd.functions.set(x.fst.fst, x.fst.snd) }))
export let load_heap: Fun<Prod<Name, Mem>, Sum<Unit,Val>> = fun(x =>
  x.snd.heap.has(x.fst) ?
    apply(inr(), x.snd.heap.get(x.fst))
  : apply(inl(), {}))
export let store_heap: Fun<Prod<Prod<Name, Val>, Mem>, Mem> = fun(x => ({...x.snd, heap:x.snd.heap.set(x.fst.fst, x.fst.snd) }))
export let heap_alloc: Fun<Prod<Val,Mem>, Prod<Val, Mem>> = fun(x => {
  let new_ref = `ref_${x.snd.heap.count()}`
  return ({ fst:ref(new_ref), snd:{...x.snd, heap:x.snd.heap.set(new_ref, x.fst) }})
})
export let push_scope: Fun<Mem, Mem> = fun(x => ({...x, stack:x.stack.set(x.stack.count(), empty_scope)}))
export let pop_scope: Fun<Mem, Sum<Unit,Mem>> = fun(x =>
  !x.stack.isEmpty() ?
    apply(inr(), ({...x, stack:x.stack.remove(x.stack.count()-1)}))
  : apply(inl(), {}))

export interface Expr<A> extends Coroutine<Mem, Err, A> {}
export type Stmt = Expr<Val>

export let empty_memory:Mem = { highlighting:mk_range(0,0,0,0), globals:empty_scope, heap:empty_scope, functions:Immutable.Map<Name,Lambda>(), classes:Immutable.Map<Name, Interface>(), stack:Immutable.Map<number, Scope>() }

export let set_highlighting = function(r:SourceRange) : Stmt {
  return mk_coroutine(constant<Mem, SourceRange>(r).times(id<Mem>()).then(highlight).then(constant<Mem,Val>(unt).times(id<Mem>())).then(Co.value<Mem, Err, Val>().then(Co.result<Mem, Err, Val>().then(Co.no_error<Mem, Err, Val>()))))
}
export let set_v_expr = function (v: Name, e: Expr<Val>): Stmt {
  return e.then(e_val => set_v(v, e_val))
}
export let set_v = function (v: Name, val: Val): Stmt {
  let store_co = store.then(constant<Mem,Val>(unt).times(id<Mem>()).then(Co.value<Mem, Err, Val>().then(Co.result<Mem, Err, Val>().then(Co.no_error<Mem, Err, Val>()))))
  let f = ((constant<Mem, string>(v).times(constant<Mem, Val>(val))).times(id<Mem>())).then(store_co)
  return mk_coroutine(f)
}
export let get_v = function (v: Name): Expr<Val> {
  let f = constant<Mem, string>(v).times(id<Mem>()).then(load).times(id<Mem>()).then(CCC.swap_prod()).then(CCC.distribute_sum_prod()).then(snd<Mem,Unit>().map_plus(id()))
  let g_err = constant<Unit,Err>(`Error: variable ${v} cannot be found.`).then(Co.error<Mem,Err,Val>())
  let g_res = swap_prod<Mem,Val>().then(Co.value<Mem,Err,Val>()).then(Co.result<Mem,Err,Val>()).then(Co.no_error<Mem,Err,Val>())
  let g:Fun<Sum<Unit,Prod<Mem,Val>>, Co.CoPreRes<Mem,Err,Val>> = g_err.plus(g_res)
  return mk_coroutine(f.then(g))
}

export let new_obj = function (): Expr<Val> {
  let heap_alloc_co:Coroutine<Mem,Err,Val> = mk_coroutine(constant<Mem,Val>(obj(empty_scope)).times(id<Mem>()).then(heap_alloc).then(Co.value<Mem, Err, Val>().then(Co.result<Mem, Err, Val>().then(Co.no_error<Mem, Err, Val>()))))
  return (heap_alloc_co)
}
export let new_arr = function (len:number): Expr<Val> {
  let heap_alloc_co:Coroutine<Mem,Err,Val> = mk_coroutine(constant<Mem,Val>(arr(init_array_val(len))).times(id<Mem>()).then(heap_alloc).then(Co.value<Mem, Err, Val>().then(Co.result<Mem, Err, Val>().then(Co.no_error<Mem, Err, Val>()))))
  return (heap_alloc_co)
}
export let get_arr_len = function(a_ref:Val) : Expr<Val> {
  return a_ref.k != "ref" ? runtime_error(`Cannot lookup element on ${a_ref.v} as it is not an array reference.`) :
         get_heap_v(a_ref.v).then(a_val =>
         a_val.k != "arr" ? runtime_error(`Cannot lookup element on ${a_val.v} as it is not an array.`) :
         co_unit<Mem,Err,Val>(int(a_val.v.length)))
}
export let get_arr_el = function(a_ref:Val, i:number) : Expr<Val> {
  return a_ref.k != "ref" ? runtime_error(`Cannot lookup element on ${a_ref.v} as it is not an array reference.`) :
         get_heap_v(a_ref.v).then(a_val =>
         a_val.k != "arr" ? runtime_error(`Cannot lookup element on ${a_val.v} as it is not an array.`) :
         !a_val.v.elements.has(i) ? runtime_error(`Cannot find element ${i} on ${a_val.v}.`) :
         co_unit<Mem,Err,Val>(a_val.v.elements.get(i)))
}
export let set_arr_el = function(a_ref:Val, i:number, v:Val) : Stmt {
  return a_ref.k != "ref" ? runtime_error(`Cannot lookup element on ${a_ref.v} as it is not an array reference.`) :
         get_heap_v(a_ref.v).then(a_val =>
         a_val.k != "arr" ? runtime_error(`Cannot lookup element on ${a_val.v} as it is not an array.`) :
         set_heap_v(a_ref.v, {...a_val, v:{...a_val.v, length:Math.max(i+1, a_val.v.length), elements:a_val.v.elements.set(i, v)} }))
}
export let set_arr_el_expr = function(a_ref:Val, i:number, e:Expr<Val>) : Stmt {
  return e.then(e_val => set_arr_el(a_ref, i, e_val))
}
export let set_heap_v = function (v: Name, val: Val): Stmt {
  let store_co = store_heap.then(constant<Mem,Val>(unt).times(id<Mem>()).then(Co.value<Mem, Err, Val>().then(Co.result<Mem, Err, Val>().then(Co.no_error<Mem, Err, Val>()))))
  let f = ((constant<Mem, string>(v).times(constant<Mem, Val>(val))).times(id<Mem>())).then(store_co)
  return mk_coroutine(f)
}
export let get_heap_v = function (v: Name): Expr<Val> {
  let f = (constant<Mem, string>(v).times(id<Mem>()).then(load_heap)).times(id<Mem>()).then(swap_prod()).then(CCC.distribute_sum_prod()).then(snd<Mem,Unit>().map_plus(swap_prod()))
  let g1 = constant<Unit,Err>(`Cannot find heap entry ${v}.`).then(Co.error<Mem,Err,Val>())
  let g2 = Co.no_error<Mem, Err, Val>().after(Co.result<Mem, Err, Val>().after(Co.value<Mem, Err, Val>()))
  let g = g1.plus(g2)
  return mk_coroutine(f.then(g))
}
export let set_class_def = function (v: Name, int: Interface): Stmt {
  let store_co = store_class_def.then(constant<Mem,Val>(unt).times(id<Mem>()).then(Co.value<Mem, Err, Val>().then(Co.result<Mem, Err, Val>().then(Co.no_error<Mem, Err, Val>()))))
  let f = ((constant<Mem, string>(v).times(constant<Mem, Interface>(int))).times(id<Mem>())).then(store_co)
  return mk_coroutine(f)
}
export let get_class_def = function (v: Name): Expr<Interface> {
  let f = (constant<Mem, string>(v).times(id<Mem>()).then(load_class_def)).times(id<Mem>()).then(
            swap_prod()).then(CCC.distribute_sum_prod()).then(snd<Mem,Unit>().map_plus(swap_prod<Mem,Interface>()))
  let g1 = constant<Unit,Err>(`Cannot find class ${v}.`).then(Co.error<Mem,Err,Interface>())
  let g2 = Co.no_error<Mem, Err, Interface>().after(Co.result<Mem, Err, Interface>().after(Co.value<Mem, Err, Interface>()))
  let g:Fun<Sum<Unit,Prod<Interface,Mem>>,Co.CoPreRes<Mem,Err,Interface>> = g1.plus(g2)
  return mk_coroutine(f.then(g))
}
export let set_fun_def = function (v: Name, l: Lambda): Stmt {
  let store_co = store_fun_def.then(constant<Mem,Val>(unt).times(id<Mem>()).then(Co.value<Mem, Err, Val>().then(Co.result<Mem, Err, Val>().then(Co.no_error<Mem, Err, Val>()))))
  let f = ((constant<Mem, string>(v).times(constant<Mem, Lambda>(l))).times(id<Mem>())).then(store_co)
  return mk_coroutine(f)
}
export let get_fun_def = function (v: Name): Expr<Lambda> {
  let f = (constant<Mem, string>(v).times(id<Mem>()).then(load_fun_def)).times(id<Mem>()).then(swap_prod()).then(CCC.distribute_sum_prod()).then(snd<Mem,Unit>().map_plus(swap_prod()))
  let g1 = constant<Unit,Err>(`Cannot find function definition ${v}.`).then(Co.error<Mem,Err,Lambda>())
  let g2 = Co.no_error<Mem, Err, Lambda>().after(Co.result<Mem, Err, Lambda>().after(Co.value<Mem, Err, Lambda>()))
  let g = g1.plus(g2)
  return mk_coroutine(f.then(g))
}
