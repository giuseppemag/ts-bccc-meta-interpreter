let sample = `
// generic type composition
(infix) type . = F::(*=>*) => G::(*=>*) => a::* => F(G a)

// generic type endo-composition
(infix) type ^ = F::(*=>*) => n::int => if n = 0 then Id else F . F

// functors only have a map function
type Functor = F::(*=>*) => {
  map : a::* => b::* => (a->b) -> (F a -> F b)
}

// monads have unit (eta) and join (mu)
type Monad = M::(*=>*) => Functor M => {
  eta : a::* => (a -> M a)
  mu  : a::* => (M^2 a) => M a
}

// identity function
let id : a::* => a -> a

// function composition
(infix) let . : a::* => b::* => c::* => (f:b->c) -> (g:a->b) -> (x:a) -> c = f(g x)

// function composition (other way around)
(infix) let ; : a::* => b::* => c::* => (f:a->b) -> (g:b->c) -> (x:a) -> c = g(f x)

// identity functor: does nothing
type Id = a::* => a
let Id_Functor : Functor Id = {
  map : a::* => (x:a) -> x
}

// identity monad (also does nothing)
let Id_Monad : Monad Id Id_Functor = {
  eta : a::* => id a
  mu  : a::* => id a
}

(infix) type * = F::(*=>*) => G::(*=>*) => a::* => b::* => a -> b -> {
  x : a
  y : b
}

type Product = (infix) *::(*=>*=>*) => a::* => b::* => {
  fst       : a*b -> a
  snd       : a*b -> b
  (infix) * : c::* => (f:c->a) -> (g:c->b) -> (c->a*b)
  bi_map    : a'::* => b'::* => (f:a->a') -> (g:a->a') -> (a*b -> a'*b')
}

(infix) type * = a::* => b::* => { x:a, y:b }
let Product : a::* => b::* => Product (*) a b = {
  fst = (p:a*b) -> p.x
  snd = (p:a*b) -> p.y
  *   = c::* => (f:c->a) -> (g:c->a) -> (c->a*b)
  bi_map = a'::* => b'::* => (f:a->a') -> (g:a->a') -> (fst;f * snd;g)
}

type Sum = (infix) +::(*=>*=>*) => a::* => b::* => {
  inl       : a::* => b::* => a -> a+b
  inr       : a::* => b::* => b -> a+b
  (infix) + : c::* => (f:a->c) -> (g:b->c) -> (a+b->c)
  bi_map    : a'::* => b'::* => (f:a->a') -> (g:a->a') -> (a+b -> a'+b')
}


`


/*
TODO:
[ ] language selector in playground!!!

[ ] pairs (over functors)
[ ] sums (over functors)
[ ] exponents (over functors)
[ ] hom-functors
[ ] pro-functors
[ ] option monad
[ ] do-notation
[ ] state monad
[ ] fix on types
[ ] fix on values
[ ] coroutine
[ ] list monad
[ ] T-algebra's
[ ] runtime
[ ] typechecker
[ ] parser
[ ] integration in playground
*/
