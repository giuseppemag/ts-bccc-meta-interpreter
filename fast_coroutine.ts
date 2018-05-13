import * as Immutable from "immutable"

export interface Unit { }
export type CoConcreteRes<s, e, a> =
  { kind: "k", s: s, k: Coroutine<s, e, a> }
  | { kind: "e", e: e }
  | { kind: "v", s: s, v: a }
export type CoRes<s, e, a> =
  { kind: "k", s: s, k: Coroutine<s, e, a> }
  | { kind: "e", e: e }
  | { kind: "v", s: s, v: a }
  | { kind: "cmp", s: s, pre: Coroutine<s, e, Unit>, p: Coroutine<s, e, a> }
export type CoComp<s, e, a> = { kind: "cmp", pre: Coroutine<s, e, Unit>, p: Coroutine<s, e, a> }
export type Co<s, e, a> =
  {
    kind: "run",
    run: (s: s) => CoRes<s, e, a>
  }
  | CoComp<s, e, a>

export let co_err = <s, e, a>(e: e): Co<s, e, a> => ({ kind: "run", run: _ => ({ kind: "e", e: e }) })
export let co_res = <s, e, a>(v: a): Co<s, e, a> => ({ kind: "run", run: s => ({ kind: "v", s: s, v: v }) })
export let co_cont = <s, e, a>(k: Coroutine<s, e, a>): Co<s, e, a> => ({ kind: "run", run: s => ({ kind: "k", s: s, k: k }) })
export type Coroutine<s, e, a> = {
  run: Co<s, e, a>,
  then: <b>(k: (_: a) => Coroutine<s, e, b>) => Coroutine<s, e, b>,
  combine: <b>(q: Coroutine<s, e, b>) => Coroutine<s, e, b>
}

export let mk_coroutine = <s, e, a>(run: Co<s, e, a>): Coroutine<s, e, a> =>
  ({
    run: run,
    then: then,
    combine: combine
  })

export let map = function <s, e, a, b>(p: Coroutine<s, e, a>, f: (_: a) => b): Coroutine<s, e, b> {
  if (p.run.kind == "run") {
    let inner_p = p.run
    return mk_coroutine<s, e, b>({
      kind: "run", run: (s0: s) => {
        let res = inner_p.run(s0)
        if (res.kind == "e") return { kind: "e", e: res.e }
        if (res.kind == "v") return { kind: "v", s: res.s, v: f(res.v) }
        if (res.kind == "k") return { kind: "k", s: res.s, k: map<s, e, a, b>(res.k, f) }
        return { kind: "cmp", s: res.s, pre: res.pre, p: map<s, e, a, b>(res.p, f) }
      }
    })
  }
  return mk_coroutine<s, e, b>({ kind: "cmp", pre: p.run.pre, p: map<s, e, a, b>(p.run.p, f) })
}
let join = function <s, e, a>(p: Coroutine<s, e, Coroutine<s, e, a>>): Coroutine<s, e, a> {
  if (p.run.kind == "run") {
    let inner_p = p.run
    return mk_coroutine<s, e, a>({
      kind: "run", run: (s0: s) => {
        let res = inner_p.run(s0)
        if (res.kind == "e") return { kind: "e", e: res.e }
        if (res.kind == "v") {
          if (res.v.run.kind == "run")
            return res.v.run.run(res.s)
          else {
            return { kind: "cmp", s: res.s, pre: res.v.run.pre, p: res.v.run.p }
          }
        }
        if (res.kind == "k")
          return { kind: "k", s: res.s, k: join(res.k) }
        return { kind: "cmp", s: res.s, pre: res.pre, p: join(res.p) }
      }
    })
  }
  return mk_coroutine<s, e, a>({ kind: "cmp", pre: p.run.pre, p: join(p.run.p) })
}

let then = function <s, e, a, b>(this: Coroutine<s, e, a>, k: (_: a) => Coroutine<s, e, b>): Coroutine<s, e, b> {
  return join(map<s, e, a, Coroutine<s, e, b>>(this, k))
}

let combine = function <s, e, a, b>(this: Coroutine<s, e, a>, q: Coroutine<s, e, b>): Coroutine<s, e, b> {
  return mk_coroutine<s, e, b>({ kind: "cmp", pre: this, p: q })
}

export let co_error = <s, e, a>(e: e): Coroutine<s, e, a> => mk_coroutine<s, e, a>(co_err(e))
export let co_unit = <s, e, a>(v: a): Coroutine<s, e, a> => mk_coroutine<s, e, a>(co_res(v))
export let co_suspend = <s,e>() : Coroutine<s,e,Unit> => mk_coroutine<s,e,Unit>(co_cont(co_unit({})))

type Pair<a, b> = { a: a, b: b }
let mk_pair = <a, b>(a: a, b: b) => ({ a: a, b: b })
type Either<a, b> = { kind: "l", v: a } | { kind: "r", v: b }
let inl = <a, b>(v: a): Either<a, b> => ({ kind: "l", v: v })
let inr = <a, b>(v: b): Either<a, b> => ({ kind: "r", v: v })
let run_step = <s, e, a>(p: Coroutine<s, e, a>, s: s): Either<s, Pair<s, Coroutine<s, e, a>>> => {
  if (p.run.kind == "cmp") {
    let pre = run_step(p.run.pre, s)
    let p_in = p.run.p
    if (pre.kind == "l") return inr(mk_pair(pre.v, p_in))
    return inr(mk_pair(pre.v.a, mk_coroutine<s, e, a>({ kind: "cmp", pre: pre.v.b, p: p_in })))
  }
  let q = p.run.run(s)
  if (q.kind == "e") return inl(s)
  if (q.kind == "v") return inl(q.s)
  if (q.kind == "k") return inr(mk_pair(q.s, q.k))
  return inr(mk_pair(q.s, mk_coroutine<s, e, a>({ kind: "cmp", pre: q.pre, p: q.p })))
}


export let co_change_state = <s,e>(f:(_:s) => s) =>
  mk_coroutine<s,e,Unit>({ kind: "run",
    run: (s:s) => ({ kind: "v", s: f(s),
      v:{} }) })

export let co_from_state = <s,e,a>(f:(_:s) => a) =>
  mk_coroutine<s,e,a>({ kind: "run",
    run: (s:s) => ({ kind: "v", s: s,
      v:f(s) }) })

export let co_from_and_change_state = <s,e,a>(f:(_:s) => [a,s]) =>
  mk_coroutine<s,e,a>({ kind: "run",
    run: (s:s) => {
      let x = f(s)
      return ({ kind: "v", s: x[1],
      v:x[0] })
   } })

export let co_get_state = <s,e>() =>
  mk_coroutine<s,e,s>({ kind: "run",
    run: (s:s) => ({ kind: "v", s: s,
      v:s }) })

export let co_set_state = <s,e>(s:s) =>
  mk_coroutine<s,e,Unit>({ kind: "run",
    run: (_:s) => ({ kind: "v", s: s,
      v:{} }) })

export let comm_list_coroutine = function<S,E,A>(ps:Immutable.List<Coroutine<S,E,A>>) : Coroutine<S,E,Immutable.List<A>> {
  if (ps.isEmpty()) return co_unit<S,E,Immutable.List<A>>(Immutable.List<A>())
  let h = ps.first()
  let t = ps.rest().toList()
  return h.then(h_res =>
         comm_list_coroutine(t).then(t_res =>
         co_unit<S,E,Immutable.List<A>>(t_res.unshift(h_res))
         ))
}

export let co_lookup = <S, E, A>(p: Coroutine<S, E, A>): Coroutine<S, E, A> =>
  co_get_state<S, E>().then(s => p.then(p_res => co_set_state<S, E>(s).then(_ => co_unit(p_res))))
