let sample = `
(infix 0) type . = F::(*=>*) => G::(*=>*) => a::* => F(G a)

(infix 5) type ^ = F::(*=>*) => n::int => if n = 0 then Id else F . F

type Functor = F::(*=>*) => {
  map : a::* => b::* => (a->b) -> (F a -> F b)
}

type Id = a::* => a
let Id_Functor : Functor Id = {
  map : a::* => b::* => (a->b) -> (Id a -> Id b) = f -> x -> f x
}

type Monad = M::(*=>*) => F::Functor M => {
  eta : a::* => (Id a -> M a)
  mu  : a::* => (M^2 a) => M a
  bind: a::* => b::* => M a -> (a -> M b) -> M b = p k -> F.map k p . mu
}

let id : a::* => a -> a = x -> x

(infix) let . : a::* => b::* => c::* => (b->c) -> (a->b) -> a -> c = f -> g -> x -> f(g x)

(infix) let ; : a::* => b::* => c::* => (a->b) -> (b->c) -> a -> c = f -> g -> x -> g(f x)

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

let PairBiFunctor : BiFunctor * => {
  map : a::* => b::* => a'::* => b'::* => (a->a') -> (b->b') -> (a*b -> a'*b') = f -> g -> (fst;f) <*> (snd;g)
}

(infix) type + = F::(*=>*) => G::(*=>*) => a::* => b::* => a -> b -> { k:"l", v:a } | { k:"r", v:b }

let inl : a:* => b:* => a -> a+b = x -> { k:"l", v:x }
let inr : a:* => b:* => b -> a+b = x -> { k:"r", v:x }

(infix) let <+> : a::* => b::* => c::* => (a->c) -> (b->c) -> (a+b->c) = f -> g -> x -> if x.k == "l" then f x.v else g x.v

let SumBiFunctor : BiFunctor + => {
  map : a::* => b::* => a'::* => b'::* => (a->a') -> (b->b') -> (a+b -> a'+b') = f -> g -> (f;inl) <+> (g;inr)
}

type Unit = {}
let unit : a::* => a -> Unit = x -> {}

type Zero = error
let absurd : a::* => 0 -> a = x -> error

(infix) type ^ : b::* => a::* => a->b

type LeftFunctor = F::(*=>*=>*) => c::* => Functor (a::* => F a c)
type RightFunctor = F::(*=>*=>*) => c::* => Functor (a::* => F c a)
type DiagonalFunctor = F::(*=>*=>*) => Functor (a::* => F a a)

let PairLeftFunctor : c::* => LeftFunctor * c => {
  map : a::* => b::* => (a->b) -> (a*c -> b*c) = f -> p -> { x:f p.x, y:p.y }
}
let PairRightFunctor : c::* => RigthFunctor * c => {
  map : a::* => b::* => (a->b) -> (c*a -> c*b) = f -> p -> { x:p.x, y:f p.y }
}
let PairDiagFunctor : DiagonalFunctor * => {
  map : a::* => b::* => (a->b) -> (a*a -> b*b) = f -> p -> { x:f p.x, y:f p.y }
}

let SumLeftFunctor : c::* => LeftFunctor + c => {
  map : a::* => b::* => (a->b) -> (a+c -> b+c) = f -> p -> SumBiFunctor.map f id
}
let SumRightFunctor : c::* => RigthFunctor * c => {
  map : a::* => b::* => (a->b) -> (c*a -> c*b) = f -> p -> SumBiFunctor.map id f
}
let SumDiagFunctor : DiagonalFunctor * => {
  map : a::* => b::* => (a->b) -> (a*a -> b*b) = f -> p -> SumBiFunctor.map f f
}

type Option = a::* => Unit + a
let none = a::* => Unit -> Option a = inl
let some = a::* => a -> Option a = inr

let Option_Functor : Functor Option = {
  map : a::* => b::* => (a->b) -> (Option a -> Option b) = f -> SumBiFunctor.map id f
}

let Option_Monad : Monad Option Option_Functor = {
  eta : a::* => Option a -> a = some a
  mu  : a::* => Option^2 a -> Option a = (none a) <+> (id (Option a))
}

`


/*
TODO:
[ ] language selector in playground!!!

[ ] exponents (over functors)
  [x] basic
  [ ] profunctor
  [ ] left/right functor/cofunctor
[ ] identities
[ ] pro-functors
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
