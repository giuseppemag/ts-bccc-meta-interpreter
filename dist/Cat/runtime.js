"use strict";
var sample = "\n// generic type composition\n(infix 0) type . = F::(*=>*) => G::(*=>*) => a::* => F(G a)\n\n// generic type endo-composition\n(infix 5) type ^ = F::(*=>*) => n::int => if n = 0 then Id else F . F\n\n// functors only have a map function\ntype Functor = F::(*=>*) => {\n  map : a::* => b::* => (a->b) -> (F a -> F b)\n}\n\n// identity functor: does nothing\ntype Id = a::* => a\nlet Id_Functor : Functor Id = {\n  map : a::* => a -> a = x -> x\n}\n\n// monads have unit (eta) and join (mu)\ntype Monad = M::(*=>*) => Functor M => {\n  eta : a::* => (Id a -> M a)\n  mu  : a::* => (M^2 a) => M a\n}\n\n// identity function\nlet id : a::* => a -> a = x -> x\n\n// function composition\n(infix) let . : a::* => b::* => c::* => (b->c) -> (a->b) -> a -> c = f -> g -> x -> f(g x)\n\n// function composition (other way around)\n(infix) let ; : a::* => b::* => c::* => (a->b) -> (b->c) -> a -> c = f -> g -> x -> g(f x)\n\n// identity monad (also does nothing)\nlet Id_Monad : Monad Id Id_Functor = {\n  eta : a::* => Id a -> a = x -> x\n  mu  : a::* => Id^2 a -> Id a = x -> x\n}\n\n(infix) type * = F::(*=>*) => G::(*=>*) => a::* => b::* => a -> b -> {\n  x : a\n  y : b\n}\n\nlet fst : a:* => b:* => a*b -> a = p -> p.x\nlet snd : a:* => b:* => a*b -> b = p -> p.y\n\n(infix) let <*> : a::* => b::* => c::* => (c->a) -> (c->b) -> (c->a*b) = f -> g -> x -> { x:f x, y:g y }\n\ntype BiFunctor = F::(*=>*=>*) => {\n  map : a::* => b::* => a'::* => b'::* => (a->a') -> (b->b') -> (F a b -> F a' b')\n}\n\nlet PairFunctor : BiFunctor * => {\n  map : a::* => b::* => a'::* => b'::* => (a->a') -> (b->b') -> (a*b -> a'*b') = f -> g -> (fst;f) <*> (snd;g)\n}\n\n(infix) type + = F::(*=>*) => G::(*=>*) => a::* => b::* => a -> b -> { k:\"l\", v:a } | { k:\"r\", v:b }\n\nlet inl : a:* => b:* => a -> a+b = x -> { k:\"l\", v:x }\nlet inr : a:* => b:* => b -> a+b = x -> { k:\"r\", v:x }\n\n(infix) let <+> : a::* => b::* => c::* => (a->c) -> (b->c) -> (a+b->c) = f -> g -> x -> if x.k == \"l\" then f x.v else g x.v\n\nlet SumFunctor : BiFunctor + => {\n  map : a::* => b::* => a'::* => b'::* => (a->a') -> (b->b') -> (a+b -> a'+b') = f -> g -> (f;inl) <+> (g;inr)\n}\n\ntype One = {}\nlet unit : a::* => a -> 1 = x -> {}\n\ntype Zero = error\nlet absurd : a::* => 0 -> a = x -> error\n\n(infix) type ^ : b::* => a::* => a->b\n\ntype LeftFunctor = F::(*=>*=>*) => Bi_F::BiFunctor F => c::* => {\n  map\n} : Functor (a::* => F a c)\n\n";
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
