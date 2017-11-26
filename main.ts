import * as Immutable from "immutable"
import { Unit, Fun, Prod, Sum, unit, absurd, fst, snd, defun, fun, inl, inr, apply, apply_pair, id, constant, curry, uncurry, lazy, swap_prod, swap_sum, compose_pair } from "ts-bccc"
import * as CCC from "ts-bccc"
import * as St from "ts-bccc"
import { mk_state, State } from "ts-bccc"
import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error } from "ts-bccc"
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
  interface ArrayVal { elements:Immutable.Map<number, Val>, length:number }
  let init_array_val : (_:number) => ArrayVal = (len:number) => ({ elements: Immutable.Map<number, Val>(Immutable.Range(0,len).map(i => [i, unt])), length:len })

  type Name = string
  type Val = { v:Unit, k:"u" } | { v:string, k:"s" } | { v:number, k:"n" } | { v:Bool, k:"b" } | { v:ArrayVal, k:"arr" } | { v:Scope, k:"obj" } | { v:Lambda, k:"lambda" } | HeapRef
  interface Scope extends Immutable.Map<Name, Val> {}
  interface Interface { base:Sum<Interface, Unit>, methods:Immutable.Map<Name, Lambda> }
  let empty_scope = Immutable.Map<Name, Val>()
  let unt : Val = ({ v:apply(unit(),{}), k:"u" })
  let str : (_:string) => Val = v => ({ v:v, k:"s" })
  let int : (_:number) => Val = v => ({ v:v, k:"n" })
  let arr : (_:ArrayVal) => Val = v => ({ v:v, k:"arr" })
  let bool : (_:boolean) => Val = v => ({ v:v, k:"b" })
  let lambda : (_:Prod<Expr<Val>, Array<Name>>) => Val = l => ({ v:l, k:"lambda" })
  let obj : (_:Scope) => Val = o => ({ v:o, k:"obj" })
  let ref : (_:Name) => Val = r => ({ v:r, k:"ref" })
  let unit_expr = () => (co_unit<Mem,Err,Val>(unt))
  let str_expr = (s:string) => (co_unit<Mem,Err,Val>(str(s)))
  let int_expr = (n:number) => (co_unit<Mem,Err,Val>(int(n)))
  let arr_expr = (a:ArrayVal) => (co_unit<Mem,Err,Val>(arr(a)))
  let lambda_expr = (l:Prod<Expr<Val>, Array<Name>>) => (co_unit<Mem,Err,Val>(lambda(l)))
  let obj_expr = (o:Scope) => (co_unit<Mem,Err,Val>(obj(o)))
  let ref_expr = (r:Name) => (co_unit<Mem,Err,Val>(ref(r)))
  let val_expr = (v:Val) => (co_unit<Mem,Err,Val>(v))

  interface SourcePosition { row:number, column:number }
  interface SourceRange { start:SourcePosition, end:SourcePosition }
  let mk_range = (sr:number, sc:number, er:number, ec:number) => ({ start:{row:sr, column:sc}, end:{row:er, column:ec} })
  interface Err extends String { }
  interface Mem { highlighting:SourceRange, globals:Scope, heap:Scope, functions:Immutable.Map<Name,Lambda>, classes:Immutable.Map<Name, Interface>, stack:Immutable.Map<number, Scope> }
  let highlight : Fun<Prod<SourceRange, Mem>, Mem> = fun(x => ({...x.snd, highlighting:x.fst }))
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
  let load_fun_def: Fun<Prod<Name, Mem>, Lambda> = fun(x => x.snd.functions.get(x.fst))
  let store_fun_def: Fun<Prod<Prod<Name, Lambda>, Mem>, Mem> = fun(x => ({...x.snd, functions:x.snd.functions.set(x.fst.fst, x.fst.snd) }))
  let load_heap: Fun<Prod<Name, Mem>, Val> = fun(x => x.snd.heap.get(x.fst))
  let store_heap: Fun<Prod<Prod<Name, Val>, Mem>, Mem> = fun(x => ({...x.snd, heap:x.snd.heap.set(x.fst.fst, x.fst.snd) }))
  let heap_alloc: Fun<Prod<Val,Mem>, Prod<Val, Mem>> = fun(x => {
    let new_ref = `ref_${x.snd.heap.count()}`
    return ({ fst:ref(new_ref), snd:{...x.snd, heap:x.snd.heap.set(new_ref, x.fst) }})
  })
  let push_scope: Fun<Mem, Mem> = fun(x => ({...x, stack:x.stack.set(x.stack.count(), empty_scope)}))
  let pop_scope: Fun<Mem, Mem> = fun(x => ({...x, stack:x.stack.remove(x.stack.count()-1)}))

  interface Expr<A> extends Coroutine<Mem, Err, A> {}
  type Stmt = Expr<Unit>

  let empty_memory:Mem = { highlighting:mk_range(0,0,0,0), globals:empty_scope, heap:empty_scope, functions:Immutable.Map<Name,Lambda>(), classes:Immutable.Map<Name, Interface>(), stack:Immutable.Map<number, Scope>() }

  let done: Stmt = apply(fun<Unit, Coroutine<Mem, Err, Unit>>(co_unit), {})
  let runtime_error = function<A>(e:Err) : Expr<A> { return co_error<Mem, Err, A>(e) }

  // let dbg: Stmt = Co.suspend()
  let dbg = (range:SourceRange) => function<A> (v:A) : Expr<A> { return set_highlighting(range).then(_ => Co.suspend<Mem,Err>().then(_ => co_unit<Mem,Err,A>(v))) }
  let set_highlighting = function(r:SourceRange) : Stmt {
    return mk_coroutine(constant<Mem, SourceRange>(r).times(id<Mem>()).then(highlight).then(unit<Mem>().times(id<Mem>())).then(Co.value<Mem, Err, Unit>().then(Co.result<Mem, Err, Unit>().then(Co.no_error<Mem, Err, Unit>()))))
  }
  let set_v_expr = function (v: Name, e: Expr<Val>): Stmt {
    return e.then(e_val => set_v(v, e_val))
  }
  let set_v = function (v: Name, val: Val): Stmt {
    let store_co = store.then(unit<Mem>().times(id<Mem>()).then(Co.value<Mem, Err, Unit>().then(Co.result<Mem, Err, Unit>().then(Co.no_error<Mem, Err, Unit>()))))
    let f = ((constant<Mem, string>(v).times(constant<Mem, Val>(val))).times(id<Mem>())).then(store_co)
    return mk_coroutine(f)
  }
  let get_v = function (v: Name): Expr<Val> {
    let f = (constant<Mem, string>(v).times(id<Mem>()).then(load)).times(id<Mem>())
    return (mk_coroutine(Co.no_error<Mem, Err, Val>().after(Co.result<Mem, Err, Val>().after(Co.value<Mem, Err, Val>().after(f)))))
  }
  let lift_binary_operation = function<a,b> (a: Expr<Val>, b:Expr<Val>, check_types:(ab:Prod<Val,Val>) => Sum<Prod<a,b>, Unit>, actual_operation:(_:Prod<a,b>)=>Val, operator_name?:string): Expr<Val> {
    return a.then(a_val => b.then(b_val =>
      apply(fun(check_types).then((fun(actual_operation).then(fun<Val, Expr<Val>>(co_unit))).plus(constant<Unit,Expr<Val>>(runtime_error<Val>(`Cannot perform ${operator_name} on non-boolean values ${a_val.v} and ${b_val.v}.`)))), { fst:a_val, snd:b_val })))
  }
  let bool_times = function (a: Expr<Val>, b:Expr<Val>): Expr<Val> {
    return lift_binary_operation<boolean,boolean>(a, b,
            ab => ab.fst.k != "b" || ab.snd.k != "b" ? inr<Prod<boolean,boolean>, Unit>().f({}) : inl<Prod<boolean,boolean>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
            ab_val => bool(ab_val.fst && ab_val.snd), "(&&)")
  }
  let bool_plus = function (a: Expr<Val>, b:Expr<Val>): Expr<Val> {
    return lift_binary_operation<boolean,boolean>(a, b,
            ab => ab.fst.k != "b" || ab.snd.k != "b" ? inr<Prod<boolean,boolean>, Unit>().f({}) : inl<Prod<boolean,boolean>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
            ab_val => bool(ab_val.fst || ab_val.snd), "(||)")
  }
  let int_plus = function (a: Expr<Val>, b:Expr<Val>): Expr<Val> {
    return lift_binary_operation<number,number>(a, b,
            ab => ab.fst.k != "n" || ab.snd.k != "n" ? inr<Prod<number,number>, Unit>().f({}) : inl<Prod<number,number>, Unit>().f({ fst:ab.fst.v, snd:ab.snd.v }),
            ab_val => int(ab_val.fst || ab_val.snd), "(+)")
  }
  let new_obj = function (): Expr<Val> {
    let heap_alloc_co:Coroutine<Mem,Err,Val> = mk_coroutine(constant<Mem,Val>(obj(empty_scope)).times(id<Mem>()).then(heap_alloc).then(Co.value<Mem, Err, Val>().then(Co.result<Mem, Err, Val>().then(Co.no_error<Mem, Err, Val>()))))
    return (heap_alloc_co)
  }
  let new_arr = function (len:number): Expr<Val> {
    let heap_alloc_co:Coroutine<Mem,Err,Val> = mk_coroutine(constant<Mem,Val>(arr(init_array_val(len))).times(id<Mem>()).then(heap_alloc).then(Co.value<Mem, Err, Val>().then(Co.result<Mem, Err, Val>().then(Co.no_error<Mem, Err, Val>()))))
    return (heap_alloc_co)
  }
  let get_arr_len = function(a_ref:Val) : Expr<Val> {
    return a_ref.k != "ref" ? runtime_error<Val>(`Cannot lookup element on ${a_ref.v} as it is not an array reference.`) :
           get_heap_v(a_ref.v).then(a_val =>
           a_val.k != "arr" ? runtime_error<Val>(`Cannot lookup element on ${a_val.v} as it is not an array.`) :
           co_unit<Mem,Err,Val>(int(a_val.v.length)))
  }
  let get_arr_el = function(a_ref:Val, i:number) : Expr<Val> {
    return a_ref.k != "ref" ? runtime_error<Val>(`Cannot lookup element on ${a_ref.v} as it is not an array reference.`) :
           get_heap_v(a_ref.v).then(a_val =>
           a_val.k != "arr" ? runtime_error<Val>(`Cannot lookup element on ${a_val.v} as it is not an array.`) :
           !a_val.v.elements.has(i) ? runtime_error<Val>(`Cannot find element ${i} on ${a_val.v}.`) :
           co_unit<Mem,Err,Val>(a_val.v.elements.get(i)))
  }
  let set_arr_el = function(a_ref:Val, i:number, v:Val) : Stmt {
    return a_ref.k != "ref" ? runtime_error<Unit>(`Cannot lookup element on ${a_ref.v} as it is not an array reference.`) :
           get_heap_v(a_ref.v).then(a_val =>
           a_val.k != "arr" ? runtime_error<Unit>(`Cannot lookup element on ${a_val.v} as it is not an array.`) :
           set_heap_v(a_ref.v, {...a_val, v:{...a_val.v, length:Math.max(i+1, a_val.v.length), elements:a_val.v.elements.set(i, v)} }))
  }
  let set_arr_el_expr = function(a_ref:Val, i:number, e:Expr<Val>) : Stmt {
    return e.then(e_val => set_arr_el(a_ref, i, e_val))
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
  let set_fun_def = function (v: Name, l: Lambda): Stmt {
    let store_co = store_fun_def.then(unit<Mem>().times(id<Mem>()).then(Co.value<Mem, Err, Unit>().then(Co.result<Mem, Err, Unit>().then(Co.no_error<Mem, Err, Unit>()))))
    let f = ((constant<Mem, string>(v).times(constant<Mem, Lambda>(l))).times(id<Mem>())).then(store_co)
    return mk_coroutine(f)
  }
  let get_fun_def = function (v: Name): Expr<Lambda> {
    let f = (constant<Mem, string>(v).times(id<Mem>()).then(load_fun_def)).times(id<Mem>())
    return mk_coroutine(Co.no_error<Mem, Err, Lambda>().after(Co.result<Mem, Err, Lambda>().after(Co.value<Mem, Err, Lambda>().after(f))))
  }

  let if_then_else = function<c>(f:Fun<Unit,Expr<c>>, g:Fun<Unit,Expr<c>>) : Fun<Bool, Expr<c>> {
    return bool_to_boolcat.times(unit()).then(apply_pair()).then(g.plus(f))
  }
  let while_do = function (p: Expr<Bool>, k: Stmt): Stmt {
    let h:Fun<Bool, Expr<Unit>> = if_then_else(fun(_ => k.then(_ => while_do(p, k))), fun(_ => done))
    return p.then(defun(h))
  }

  let def_fun = function(n:Name, body:Expr<Val>, args:Array<Name>) : Stmt {
    return set_fun_def(n, apply(constant<Unit, Expr<Val>>(body).times(constant<Unit, Array<Name>>(args)), {}))
  }

  let ret = function (e: Expr<Val>): Expr<Val> {
    return e.then(e_val => set_v("return", e_val).then(_ => co_unit(e_val)))
  }

  let call_by_name = function(f_n:Name, args:Array<Expr<Val>>) : Expr<Val> {
    return get_fun_def(f_n).then(f => call_lambda(f, args))
  }

  let call_lambda = function(lambda:Lambda, arg_values:Array<Expr<Val>>) : Expr<Val> {
    let body = lambda.fst
    let arg_names = lambda.snd
    // let arg_values = args.map(a => a.snd)
    let actual_args:Array<Prod<Name,Expr<Val>>> = arg_names.map((n,i) => ({ fst:n, snd:arg_values[i] }))
    let set_args = actual_args.reduce<Stmt>((sets, arg_expr) =>
      set_v_expr(arg_expr.fst, arg_expr.snd).then(_ => sets),
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
      if (this_val.k != "obj") return runtime_error<Val>(`runtime type error: this is not a reference when looking ${F_name} up.`)
      return val_expr(this_val.v.get(F_name))
    })
  }

  let field_set = function(F_name:Name, new_val_expr:Expr<Val>, this_addr:HeapRef) : Stmt {
    return new_val_expr.then(new_val =>
      get_heap_v(this_addr.v).then(this_val => {
      if (this_val.k != "obj") return runtime_error<Unit>(`runtime type error: this is not a reference when looking ${F_name} up.`)
      let new_this_val = {...this_val, v:this_val.v.set(F_name, new_val) }
      return set_heap_v(this_addr.v, new_this_val).then(_ => done)
    }))
  }

  let resolve_method = function(M_name:Name, C_def:Interface) : Sum<Lambda, Unit> {
    return C_def.methods.has(M_name) ? apply(inl(), C_def.methods.get(M_name))
           : apply(fun((int:Interface) => resolve_method(M_name, int)).plus(inr<Lambda, Unit>()), C_def.base)
  }

  let call_method = function(M_name:Name, this_addr:Val, args:Array<Expr<Val>>) : Expr<Val> {
    return this_addr.k != "ref" ? runtime_error<Val>(`runtime type error: this is not a reference when calling ${M_name}.`) :
                                  get_heap_v(this_addr.v).then(this_val => {
      if (this_val.k != "obj") return runtime_error<Val>(`runtime type error: this is not an object when calling ${M_name}.`)
      let this_class = this_val.v.get("class")
      if (this_class.k != "s") return runtime_error<Val>(`runtime type error: this.class is not a string.`)
      return get_class_def(this_class.v).then(C_def => {
        let f = fun((m:Lambda) => call_lambda(m, args.concat([val_expr(this_addr)]))).plus(constant<Unit, Expr<Val>>(unit_expr()))
        return apply(f, resolve_method(M_name, C_def))
      }

      )
    })
  }

  let call_cons = function(C_name:Name, args:Array<Expr<Val>>) : Expr<Val> {
    return get_class_def(C_name).then(C_def =>
    new_obj().then(this_addr =>
    this_addr.k != "ref" ? runtime_error(`this is not a reference when calling ${C_name}::cons`) :
    field_set("class", str_expr(C_name), this_addr).then(_ =>
    call_lambda(C_def.methods.get("constructor"), args.concat([val_expr(this_addr)])).then(_ =>
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
        get_v("n").then(n => n.k == "n" ? set_v("n", int(n.v - 1)) : runtime_error(`${n.v} is not a number`)).then(_ =>
        get_v("s").then(s => s.k == "s" ? set_v("s", str(s.v + "*")) : runtime_error(`${s.v} is not a string`)).then(_ =>
        get_v("n").then(n => n.k == "n" && n.v % 5 == 0 ? dbg(mk_range(6,0,7,0))({}) : runtime_error(`${n.v} is not a number`))))
      )))

    let arr_test =
      new_arr(10).then(a_ref =>
      set_v("a", a_ref).then(_ =>
      set_v("i", int(0)).then(_ =>
      get_arr_len(a_ref).then(a_len => a_len.k != "n" ? runtime_error(`${a_len.v} is not a number`) :
      while_do(get_v("i").then(i_val => co_unit(i_val.v < a_len.v)),
        get_v("i").then(i_val => i_val.k != "n" ? runtime_error(`${i_val.v} is not a number`) :
        set_arr_el(a_ref, i_val.v, int(i_val.v * 2)).then(_ =>
        set_v("i", int(i_val.v + 1)).then(_ =>
        dbg(mk_range(9,0,10,0))({})
        ))))))))

    let lambda_test =
      set_v("n", int(10)).then(_ =>
      call_lambda(
        { fst: dbg(mk_range(6,0,7,0))({}).then(_ => int_expr(1)), snd:["n"] },
        [int_expr(5)]).then(res =>
          dbg(mk_range(6,0,7,0))({})
      ))

    let fun_test =
      def_fun("f", dbg(mk_range(1,0,2,0))({}).then(_ => ret(int_expr(1)).then(dbg(mk_range(2,0,3,0)))), []).then(_ =>
      def_fun("g", dbg(mk_range(3,0,4,0))({}).then(_ => ret(int_expr(2)).then(dbg(mk_range(4,0,5,0)))), []).then(_ =>
      call_by_name("g", []).then(v =>
      dbg(mk_range(6,0,7,0))({}).then(_ =>
      set_v("n", v)
      ))))

    let vector2:Interface =
      {
        base:apply(inl<Interface, Unit>(),
          {
            base:apply(inr<Interface, Unit>(), {}),
            methods:
              Immutable.Map<Name, Lambda>([
                [ "to_string",
                  { fst:get_v("this").then(this_addr =>
                        this_addr.k != "ref" ? runtime_error<Val>(`"this" is not a reference when calling to_string`) :
                        field_get("x", this_addr).then(x_val =>
                        x_val.k != "n" ? runtime_error<Val>(`${x_val.v} is not a number`) :
                        field_get("y", this_addr).then(y_val =>
                        y_val.k != "n" ? runtime_error<Val>(`${y_val.v} is not a number`) :
                        str_expr(`(${x_val.v}, ${y_val.v})`)
                        ))),
                    snd:["this"] } ]
              ])
          }
        ),
        methods:
          Immutable.Map<Name, Lambda>([
            [ "scale",
              { fst:get_v("this").then(this_addr =>
                    get_v("k").then(k_val =>
                    this_addr.k != "ref" || k_val.k != "n" ? runtime_error<Val>(`runtime type error`) :
                    field_get("x", this_addr).then(x_val =>
                    x_val.k != "n" ? runtime_error<Val>(`runtime type error`) :
                    field_get("y", this_addr).then(y_val =>
                    y_val.k != "n" ? runtime_error<Val>(`runtime type error`) :
                    dbg(mk_range(6,0,7,0))({}).then(_ =>
                    field_set("x", val_expr(int(x_val.v * k_val.v)), this_addr).then(_ =>
                    dbg(mk_range(6,0,7,0))({}).then(_ =>
                    field_set("y", val_expr(int(y_val.v * k_val.v)), this_addr).then(_ =>
                    dbg(mk_range(6,0,7,0))({}).then(_ =>
                    unit_expr()
                    ))))))))),
                snd:["k", "this"] } ],
            [ "constructor",
              { fst:get_v("this").then(this_addr =>
                    this_addr.k != "ref" ? runtime_error<Val>(`runtime type error`) :
                    get_v("x").then(x_val =>
                    x_val.k != "n" ? runtime_error<Val>(`runtime type error`) :
                    get_v("y").then(y_val =>
                    y_val.k != "n" ? runtime_error<Val>(`runtime type error`) :
                    field_set("x", val_expr(x_val), this_addr).then(_ =>
                    field_set("y", val_expr(y_val), this_addr).then(_ =>
                    unit_expr()
                    ))))),
                snd:["x", "y", "this"] }]
          ])
      }
    let class_test =
      declare_class("Vector2", vector2).then(_ =>
      call_cons("Vector2", [int_expr(10), int_expr(20)]).then(v2 =>
      set_v("v2", v2).then(_ =>
      call_method("scale", v2, [int_expr(2)]).then(_ =>
      call_method("to_string", v2, []).then(v2_s =>
      set_v("v2_s", v2_s).then(_ =>
      done
      ))))))


    let hrstart = process.hrtime()
    let p = fun_test

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
