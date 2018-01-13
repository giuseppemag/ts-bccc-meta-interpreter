let sample = `
// generic type composition
(infix 0) type . = F::(*=>*) => G::(*=>*) => a::* => F(G a)

// generic type endo-composition
(infix 5) type ^ = F::(*=>*) => n::int => if n = 0 then Id else F . F

// functors only have a map function
type Functor = F::(*=>*) => {
  map : a::* => b::* => (a->b) -> (F a -> F b)
}

// identity functor: does nothing
type Id = a::* => a
let Id_Functor : Functor Id = {
  map : a::* => a -> a = x -> x
}

// monads have unit (eta) and join (mu)
type Monad = M::(*=>*) => Functor M => {
  eta : a::* => (Id a -> M a)
  mu  : a::* => (M^2 a) => M a
}

// identity function
let id : a::* => a -> a = x -> x

// function composition
(infix) let . : a::* => b::* => c::* => (b->c) -> (a->b) -> a -> c = f -> g -> x -> f(g x)

// function composition (other way around)
(infix) let ; : a::* => b::* => c::* => (a->b) -> (b->c) -> a -> c = f -> g -> x -> g(f x)

// identity monad (also does nothing)
let Id_Monad : Monad Id Id_Functor = {
  eta : a::* => Id a -> a = x -> x
  mu  : a::* => Id^2 a -> Id a = x -> x
}

(infix) type * = F::(*=>*) => G::(*=>*) => a::* => b::* => a -> b -> {
  x : a
  y : b
}

let fst : a:* => b:* => a*b -> a = p -> p.x
let snd : a:* => b:* => a*b -> b = p -> p.y

(infix) let <*> : a::* => b::* => c::* => (c->a) -> (c->b) -> (c->a*b) = f -> g -> x -> { x:f x, y:g y }

type BiFunctor = F::(*=>*=>*) => {
  map : a::* => b::* => a'::* => b'::* => (a->a') -> (b->b') -> (F a b -> F a' b')
}

let PairFunctor : BiFunctor * => {
  map : a::* => b::* => a'::* => b'::* => (a->a') -> (b->b') -> (a*b -> a'*b') = f -> g -> (fst;f) <*> (snd;g)
}

(infix) type + = F::(*=>*) => G::(*=>*) => a::* => b::* => a -> b -> { k:"l", v:a } | { k:"r", v:b }

let inl : a:* => b:* => a -> a+b = x -> { k:"l", v:x }
let inr : a:* => b:* => b -> a+b = x -> { k:"r", v:x }

(infix) let <+> : a::* => b::* => c::* => (a->c) -> (b->c) -> (a+b->c) = f -> g -> x -> if x.k == "l" then f x.v else g x.v

let SumFunctor : BiFunctor + => {
  map : a::* => b::* => a'::* => b'::* => (a->a') -> (b->b') -> (a+b -> a'+b') = f -> g -> (f;inl) <+> (g;inr)
}

type One = {}
let unit : a::* => a -> 1 = x -> {}

type Zero = error
let absurd : a::* => 0 -> a = x -> error

(infix) type ^ : b::* => a::* => a->b

type LeftFunctor = F::(*=>*=>*) => Bi_F::BiFunctor F => c::* => {
  map
} : Functor (a::* => F a c)

`


/*
TODO:
[ ] language selector in playground!!!

[ ] pairs
  [x] basic
  [ ] bifunctor
  [ ] left/right functors
[ ] sums
  [x] basic
  [ ] bifunctor
  [ ] left/right functors
[ ] exponents (over functors)
  [x] basic
  [ ] profunctor
  [ ] left/right functor/cofunctor
[ ] identities
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
