import * as Immutable from "immutable"
import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair } from "ts-bccc"
import * as CCC from "ts-bccc"
import * as St from "ts-bccc"
import { mk_state, State } from "ts-bccc"
import { mk_coroutine, Coroutine, suspend, co_unit, co_run } from "ts-bccc"
import * as Co from "ts-bccc"

module ImpLanguageWithSuspend {
  let mk_state_fun = function <s, a>() { return fun<Fun<s, Prod<a, s>>, State<s, a>>(mk_state) }

  type Bool = boolean
  interface BoolCat extends Fun<Unit, Sum<Unit,Unit>> {}
  let False:BoolCat = unit<Unit>().then(inl<Unit,Unit>())
  let True:BoolCat  = unit<Unit>().then(inr<Unit,Unit>())
  let bool_to_boolcat : Fun<Bool, BoolCat> = fun(b => b ? True : False)
  type Lambda = Prod<Expr<Val>, Array<Name>>
  interface HeapRef { v:string, k:"ref" }

  type Name = string
  type Val = { v:Unit, k:"u" } | { v:string, k:"s" } | { v:number, k:"n" } | { v:Bool, k:"b" } | { v:Scope, k:"obj" } | { v:Lambda, k:"lambda" } | HeapRef
  interface Scope extends Immutable.Map<Name, Val> {}
  interface Interface extends Immutable.Map<Name, Lambda> {}
  let empty_scope = Immutable.Map<Name, Val>()
  let unt : Val = ({ v:apply(unit(),{}), k:"u" })
  let str : (_:string) => Val = v => ({ v:v, k:"s" })
  let int : (_:number) => Val = v => ({ v:v, k:"n" })
  let bool : (_:boolean) => Val = v => ({ v:v, k:"b" })
  let lambda : (_:Prod<Expr<Val>, Array<Name>>) => Val = l => ({ v:l, k:"lambda" })
  let obj : (_:Scope) => Val = o => ({ v:o, k:"obj" })
  let ref : (_:Name) => Val = r => ({ v:r, k:"ref" })
  let unit_expr = () => (co_unit<Mem,Err,Val>(unt))
  let str_expr = (s:string) => (co_unit<Mem,Err,Val>(str(s)))
  let int_expr = (n:number) => (co_unit<Mem,Err,Val>(int(n)))
  let lambda_expr = (l:Prod<Expr<Val>, Array<Name>>) => (co_unit<Mem,Err,Val>(lambda(l)))
  let obj_expr = (o:Scope) => (co_unit<Mem,Err,Val>(obj(o)))
  let ref_expr = (r:Name) => (co_unit<Mem,Err,Val>(ref(r)))
  let val_expr = (v:Val) => (co_unit<Mem,Err,Val>(v))

  interface Err extends String { }
  interface Mem { globals:Scope, heap:Scope, classes:Immutable.Map<Name, Interface>, stack:Immutable.Map<number, Scope> }
  let load: Fun<Prod<string, Mem>, Val> = fun(x =>
    !x.snd.stack.isEmpty() && x.snd.stack.get(x.snd.stack.count()-1).has(x.fst) ?
      x.snd.stack.get(x.snd.stack.count()-1).get(x.fst)
    :
      x.snd.globals.get(x.fst))
  let store: Fun<Prod<Prod<string, Val>, Mem>, Mem> = fun(x =>
    !x.snd.stack.isEmpty() ?
      ({...x.snd, stack:x.snd.stack.set(x.snd.stack.count() - 1, x.snd.stack.get(x.snd.stack.count() - 1).set(x.fst.fst, x.fst.snd)) })
    :
      ({...x.snd, globals:x.snd.globals.set(x.fst.fst, x.fst.snd) }))
  let load_class_def: Fun<Prod<Name, Mem>, Interface> = fun(x => x.snd.classes.get(x.fst))
  let store_class_def: Fun<Prod<Prod<Name, Interface>, Mem>, Mem> = fun(x => ({...x.snd, classes:x.snd.classes.set(x.fst.fst, x.fst.snd) }))
  let load_heap: Fun<Prod<Name, Mem>, Val> = fun(x => x.snd.heap.get(x.fst))
  let store_heap: Fun<Prod<Prod<Name, Val>, Mem>, Mem> = fun(x => ({...x.snd, heap:x.snd.heap.set(x.fst.fst, x.fst.snd) }))
  let heap_alloc: Fun<Mem, Prod<Val, Mem>> = fun(x => {
    let new_ref = `ref_${x.heap.count()}`
    return ({ fst:ref(new_ref), snd:{...x, heap:x.heap.set(new_ref, obj(empty_scope)) }})
  })
  let push_scope: Fun<Mem, Mem> = fun(x => ({...x, stack:x.stack.set(x.stack.count(), empty_scope)}))
  let pop_scope: Fun<Mem, Mem> = fun(x => ({...x, stack:x.stack.remove(x.stack.count()-1)}))

  interface Expr<A> extends Coroutine<Mem, Err, A> {}
  type Stmt = Expr<Unit>

  let empty_memory:Mem = { globals:empty_scope, heap:empty_scope, classes:Immutable.Map<Name, Interface>(), stack:Immutable.Map<number, Scope>() }

  let done: Stmt = apply(fun<Unit, Coroutine<Mem, Err, Unit>>(co_unit), {})
  let dbg: Stmt = Co.suspend()
  let set_v = function (v: Name, val: Val): Stmt {
    let store_co = store.then(unit<Mem>().times(id<Mem>()).then(Co.value<Mem, Err, Unit>().then(Co.result<Mem, Err, Unit>().then(Co.no_error<Mem, Err, Unit>()))))
    let f = ((constant<Mem, string>(v).times(constant<Mem, Val>(val))).times(id<Mem>())).then(store_co)
    return mk_coroutine(f)
  }
  let get_v = function (v: Name): Expr<Val> {
    let f = (constant<Mem, string>(v).times(id<Mem>()).then(load)).times(id<Mem>())
    return (mk_coroutine(Co.no_error<Mem, Err, Val>().after(Co.result<Mem, Err, Val>().after(Co.value<Mem, Err, Val>().after(f)))))
  }
  let new_v = function (): Expr<Val> {
    let heap_alloc_co:Coroutine<Mem,Err,Val> = mk_coroutine(heap_alloc.then(Co.value<Mem, Err, Val>().then(Co.result<Mem, Err, Val>().then(Co.no_error<Mem, Err, Val>()))))
    return (heap_alloc_co)
  }
  let set_heap_v = function (v: Name, val: Val): Stmt {
    let store_co = store_heap.then(unit<Mem>().times(id<Mem>()).then(Co.value<Mem, Err, Unit>().then(Co.result<Mem, Err, Unit>().then(Co.no_error<Mem, Err, Unit>()))))
    let f = ((constant<Mem, string>(v).times(constant<Mem, Val>(val))).times(id<Mem>())).then(store_co)
    return mk_coroutine(f)
  }
  let get_heap_v = function (v: Name): Expr<Val> {
    let f = (constant<Mem, string>(v).times(id<Mem>()).then(load_heap)).times(id<Mem>())
    return (mk_coroutine(Co.no_error<Mem, Err, Val>().after(Co.result<Mem, Err, Val>().after(Co.value<Mem, Err, Val>().after(f)))))
  }
  let set_class_def = function (v: Name, int: Interface): Stmt {
    let store_co = store_class_def.then(unit<Mem>().times(id<Mem>()).then(Co.value<Mem, Err, Unit>().then(Co.result<Mem, Err, Unit>().then(Co.no_error<Mem, Err, Unit>()))))
    let f = ((constant<Mem, string>(v).times(constant<Mem, Interface>(int))).times(id<Mem>())).then(store_co)
    return mk_coroutine(f)
  }
  let get_class_def = function (v: Name): Expr<Interface> {
    let f = (constant<Mem, string>(v).times(id<Mem>()).then(load_class_def)).times(id<Mem>())
    return mk_coroutine(Co.no_error<Mem, Err, Interface>().after(Co.result<Mem, Err, Interface>().after(Co.value<Mem, Err, Interface>().after(f))))
  }

  let if_then_else = function<c>(f:Fun<Unit,Expr<c>>, g:Fun<Unit,Expr<c>>) : Fun<Bool, Expr<c>> {
    return bool_to_boolcat.times(unit()).then(apply_pair()).then(g.plus(f))
  }
  let while_do = function (p: Expr<Bool>, k: Stmt): Stmt {
    let h:Fun<Bool, Expr<Unit>> = if_then_else(fun(_ => k.then(_ => while_do(p, k))), fun(_ => done))
    return p.then(defun(h))
  }

  let def_fun = function(n:Name, body:Expr<Val>, args:Array<Name>) : Stmt {
    return set_v(n, apply(constant<Unit, Expr<Val>>(body).times(constant<Unit, Array<Name>>(args)).then(fun(lambda)), {}))
  }

  let call_by_name = function(f_n:Name, args:Array<Expr<Val>>) : Expr<Val> {
    return get_v(f_n).then(f => f.k == "lambda" ? call_lambda(f.v, args) : unit_expr())
  }

  let call_lambda = function(lambda:Lambda, arg_values:Array<Expr<Val>>) : Expr<Val> {
    let body = lambda.fst
    let arg_names = lambda.snd
    // let arg_values = args.map(a => a.snd)
    let actual_args:Array<Prod<Name,Expr<Val>>> = arg_names.map((n,i) => ({ fst:n, snd:arg_values[i] }))
    let set_args = actual_args.reduce<Stmt>((sets, arg_expr) =>
      arg_expr.snd.then(arg_v => set_v(arg_expr.fst, arg_v).then(_ => sets)),
      done)
    let init = mk_coroutine(push_scope.then(unit<Mem>().times(id<Mem>())).then(Co.value<Mem, Err, Unit>().then(Co.result<Mem, Err, Unit>().then(Co.no_error<Mem, Err, Unit>()))))
    let cleanup = mk_coroutine(pop_scope.then(unit<Mem>().times(id<Mem>())).then(Co.value<Mem, Err, Unit>().then(Co.result<Mem, Err, Unit>().then(Co.no_error<Mem, Err, Unit>()))))
    return init.then(_ =>
           set_args.then(_ =>
           body.then(res =>
           cleanup.then(_ =>
           co_unit(res)))))
  }

  let declare_class = function(C_name:Name, int:Interface) : Stmt {
    return set_class_def(C_name, int)
  }

  let field_get = function(F_name:Name, this_addr:HeapRef) : Expr<Val> {
    return get_heap_v(this_addr.v).then(this_val => {
      if (this_val.k != "obj") return unit_expr()
      return val_expr(this_val.v.get(F_name))
    })
  }

  let field_set = function(F_name:Name, new_val_expr:Expr<Val>, this_addr:HeapRef) : Stmt {
    return new_val_expr.then(new_val =>
      get_heap_v(this_addr.v).then(this_val => {
      if (this_val.k != "obj") return done
      let new_this_val = {...this_val, v:this_val.v.set(F_name, new_val) }
      return set_heap_v(this_addr.v, new_this_val).then(_ => done)
    }))
  }

  let call_method = function(M_name:Name, this_addr:Val, args:Array<Expr<Val>>) : Expr<Val> {
    return this_addr.k != "ref" ? unit_expr() : get_heap_v(this_addr.v).then(this_val => {
      if (this_val.k != "obj") return unit_expr()
      let this_class = this_val.v.get("class")
      if (this_class.k != "s") return unit_expr()
      return get_class_def(this_class.v).then(C_def =>
      call_lambda(C_def.get(M_name), args.concat([val_expr(this_addr)])))
    })
  }

  let call_cons = function(C_name:Name, args:Array<Expr<Val>>) : Expr<Val> {
    return get_class_def(C_name).then(C_def =>
    new_v().then(this_addr =>
    this_addr.k != "ref" ? unit_expr() :
    field_set("class", str_expr(C_name), this_addr).then(_ =>
    call_lambda(C_def.get("constructor"), args.concat([val_expr(this_addr)])).then(_ =>
    co_unit<Mem,Err,Val>(this_addr)
    ))))
  }


  let run_to_end = <S,E,A>() : CCC.Fun<Prod<Coroutine<S,E,A>, S>, CCC.Sum<E,CCC.Prod<A,S>>> => {
      let f : CCC.Fun<Prod<Coroutine<S,E,A>, S>, CCC.Sum<E,CCC.Prod<A,S>>> =
          CCC.fun(p => run_to_end<S,E,A>().f(p))
      return (co_run<S,E,A>().map_times(fun<S,S>(s => console.log("Intermediate step:", JSON.stringify(s)) ||
                s))).then(CCC.apply_pair<S, Co.CoPreRes<S,E,A>>()).then(
                CCC.inl<E,CCC.Prod<A,S>>().plus(
                  f.plus(CCC.inr<E,CCC.Prod<A,S>>())))
  }

export let test_imp = function () {
    let loop_test =
      set_v("s", str("")).then(_ =>
      set_v("n", int(1000)).then(_ =>
      while_do(get_v("n").then(n => co_unit(n.v > 0)),
        get_v("n").then(n => n.k == "n" ? set_v("n", int(n.v - 1)) : done).then(_ =>
        get_v("s").then(s => s.k == "s" ? set_v("s", str(s.v + "*")) : done).then(_ =>
        get_v("n").then(n => n.k == "n" && n.v % 5 == 0 ? dbg : done)))
      )))

    let lambda_test =
      set_v("n", int(10)).then(_ =>
      call_lambda(
        { fst: dbg.then(_ => int_expr(1)), snd:["n"] },
        [int_expr(5)]).then(res =>
      dbg
      ))

    let fun_test =
      def_fun("f", dbg.then(_ => int_expr(1)), []).then(_ =>
      def_fun("g", dbg.then(_ => int_expr(2)), []).then(_ =>
      call_by_name("g", []).then(v =>
      dbg.then(_ =>
      set_v("n", v)
      ))))

    let vector2:Interface =
      Immutable.Map<Name, Lambda>([
        [ "scale",
          { fst:get_v("this").then(this_addr =>
                get_v("k").then(k_val =>
                this_addr.k != "ref" || k_val.k != "n" ? unit_expr() :
                field_get("x", this_addr).then(x_val =>
                x_val.k != "n" ? unit_expr() :
                field_get("y", this_addr).then(y_val =>
                y_val.k != "n" ? unit_expr() :
                dbg.then(_ =>
                field_set("x", val_expr(int(x_val.v * k_val.v)), this_addr).then(_ =>
                dbg.then(_ =>
                field_set("y", val_expr(int(y_val.v * k_val.v)), this_addr).then(_ =>
                dbg.then(_ =>
                unit_expr()
                ))))))))),
            snd:["k", "this"] } ],
         [ "constructor",
          { fst:get_v("this").then(this_addr =>
                this_addr.k != "ref" ? unit_expr() :
                get_v("x").then(x_val =>
                x_val.k != "n" ? unit_expr() :
                get_v("y").then(y_val =>
                y_val.k != "n" ? unit_expr() :
                field_set("x", val_expr(x_val), this_addr).then(_ =>
                field_set("y", val_expr(y_val), this_addr).then(_ =>
                unit_expr()
                ))))),
            snd:["x", "y", "this"] }]
      ])
    let class_test =
      declare_class("Vector2", vector2).then(_ =>
      call_cons("Vector2", [int_expr(10), int_expr(20)]).then(v2 =>
      set_v("v2", v2).then(_ =>
      call_method("scale", v2, [int_expr(2)]).then(_ =>
      done
      ))))


    let hrstart = process.hrtime()
    let p = class_test

    let res = apply((constant<Unit,Stmt>(p).times(constant<Unit,Mem>(empty_memory))).then(run_to_end()), {})
    let hrdiff = process.hrtime(hrstart)
    let time_in_ns = hrdiff[0] * 1e9 + hrdiff[1]
    console.log(`Timer: ${time_in_ns / 1000000}ms\n Result: `, JSON.stringify(res))
  }
}

ImpLanguageWithSuspend.test_imp()

// let incr = CCC.fun<number,number>(x => x + 1)
// let double = CCC.fun<number,number>(x => x * 2)
// console.log(CCC.apply(incr.then(double), 5))
// console.log(CCC.apply(incr.map_times(double), CCC.mk_pair<number,number>(5)(2)))
// console.log(CCC.apply(incr.map_plus(double), CCC.inl<number,number>().f(5)))
// console.log(CCC.apply(incr.plus(double), CCC.inr<number,number>().f(4)))
