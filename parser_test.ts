import * as Immutable from 'immutable'
import { mk_coroutine, Coroutine, suspend, co_unit, co_run, co_error, co_get_state, co_set_state, Unit, Sum } from "ts-bccc"
import { Token, int } from './language_spec'

type _int = { kind: "_int", value: number }
type AST = _int |
  { kind: "_plus", left: AST, right: AST }

type error = string
type state = Immutable.List<Token>
type parser = Coroutine<state, error, AST>

let _int: Coroutine<state, error, _int> = co_get_state<state, error>().then(s => {
  if (s.isEmpty())
    return co_error("found empty state, expected number")
  let i = s.first()
  if (i.kind == "int") {
    let res: _int = { kind: "_int", value: i.v }
    return co_set_state<state, error>(s.skip(1).toList()).then(_ => co_unit(res))
  }
  else return co_error("error, int")
})

let lookup = <S, A>(p: Coroutine<S, error, A>): Coroutine<S, error, A> =>
  co_get_state<S, error>().then(s => p.then(p_res => co_set_state<S, error>(s).then(_ => co_unit(p_res))))


let not = <S, A>(p: Coroutine<S, error, A>): Coroutine<S, error, A> =>
  co_get_state<S, error>().then(s => p.then(p_res => co_set_state<S, error>(s).then(_ => co_error<S, error, A>("error:not"))))

let expr: Coroutine<state, error, AST> =

  _int.then(i => lookup(not(_int)).then(_ => {
    let res: AST = { kind: "_int", value: i.value }
    return co_unit(res)
  }))