"use strict";
var sample = "\n(infix 0) type . = F::(*=>*) => G::(*=>*) => a::* => F(G a)\n\n(infix 5) type ^ = F::(*=>*) => n::int => if n = 0 then Id else F . F\n\ntype Functor = F::(*=>*) => {\n  map : a::* => b::* => (a->b) -> (F a -> F b)\n}\n\ntype Id = a::* => a\nlet Id_Functor : Functor Id = {\n  map : a::* => b::* => (a->b) -> (Id a -> Id b) = f -> x -> f x\n}\n\ntype Monad = M::(*=>*) => F::Functor M => {\n  eta : a::* => (Id a -> M a)\n  mu  : a::* => (M^2 a) => M a\n  bind: a::* => b::* => M a -> (a -> M b) -> M b = p k -> F.map k p . mu\n}\n\nlet id : a::* => a -> a = x -> x\n\n(infix) let . : a::* => b::* => c::* => (b->c) -> (a->b) -> a -> c = f -> g -> x -> f(g x)\n\n(infix) let ; : a::* => b::* => c::* => (a->b) -> (b->c) -> a -> c = f -> g -> x -> g(f x)\n\nlet Id_Monad : Monad Id Id_Functor = {\n  eta : a::* => Id a -> a = x -> x\n  mu  : a::* => Id^2 a -> Id a = x -> x\n}\n\n(infix) type * = F::(*=>*) => G::(*=>*) => a::* => b::* => a -> b -> {\n  x : a\n  y : b\n}\n\nlet fst : a:* => b:* => a*b -> a = p -> p.x\nlet snd : a:* => b:* => a*b -> b = p -> p.y\n\n(infix) let <*> : a::* => b::* => c::* => (c->a) -> (c->b) -> (c->a*b) = f -> g -> x -> { x:f x, y:g y }\n\ntype BiFunctor = F::(*=>*=>*) => {\n  map : a::* => b::* => a'::* => b'::* => (a->a') -> (b->b') -> (F a b -> F a' b')\n}\n\nlet PairBiFunctor : BiFunctor * => {\n  map : a::* => b::* => a'::* => b'::* => (a->a') -> (b->b') -> (a*b -> a'*b') = f -> g -> (fst;f) <*> (snd;g)\n}\n\n(infix) type + = F::(*=>*) => G::(*=>*) => a::* => b::* => a -> b -> { k:\"l\", v:a } | { k:\"r\", v:b }\n\nlet inl : a:* => b:* => a -> a+b = x -> { k:\"l\", v:x }\nlet inr : a:* => b:* => b -> a+b = x -> { k:\"r\", v:x }\n\n(infix) let <+> : a::* => b::* => c::* => (a->c) -> (b->c) -> (a+b->c) = f -> g -> x -> if x.k == \"l\" then f x.v else g x.v\n\nlet SumBiFunctor : BiFunctor + => {\n  map : a::* => b::* => a'::* => b'::* => (a->a') -> (b->b') -> (a+b -> a'+b') = f -> g -> (f;inl) <+> (g;inr)\n}\n\ntype Unit = {}\nlet unit : a::* => a -> Unit = x -> {}\n\ntype Zero = error\nlet absurd : a::* => 0 -> a = x -> error\n\n(infix) type ^ : b::* => a::* => a->b\n\ntype LeftFunctor = F::(*=>*=>*) => c::* => Functor (a::* => F a c)\ntype RightFunctor = F::(*=>*=>*) => c::* => Functor (a::* => F c a)\ntype DiagonalFunctor = F::(*=>*=>*) => Functor (a::* => F a a)\n\nlet PairLeftFunctor : c::* => LeftFunctor * c => {\n  map : a::* => b::* => (a->b) -> (a*c -> b*c) = f -> p -> { x:f p.x, y:p.y }\n}\nlet PairRightFunctor : c::* => RigthFunctor * c => {\n  map : a::* => b::* => (a->b) -> (c*a -> c*b) = f -> p -> { x:p.x, y:f p.y }\n}\nlet PairDiagFunctor : DiagonalFunctor * => {\n  map : a::* => b::* => (a->b) -> (a*a -> b*b) = f -> p -> { x:f p.x, y:f p.y }\n}\n\nlet SumLeftFunctor : c::* => LeftFunctor + c => {\n  map : a::* => b::* => (a->b) -> (a+c -> b+c) = f -> p -> SumBiFunctor.map f id\n}\nlet SumRightFunctor : c::* => RigthFunctor * c => {\n  map : a::* => b::* => (a->b) -> (c*a -> c*b) = f -> p -> SumBiFunctor.map id f\n}\nlet SumDiagFunctor : DiagonalFunctor * => {\n  map : a::* => b::* => (a->b) -> (a*a -> b*b) = f -> p -> SumBiFunctor.map f f\n}\n\ntype Option = a::* => Unit + a\nlet none = a::* => Unit -> Option a = inl\nlet some = a::* => a -> Option a = inr\n\nlet Option_Functor : Functor Option = {\n  map : a::* => b::* => (a->b) -> (Option a -> Option b) = f -> SumBiFunctor.map id f\n}\n\nlet Option_Monad : Monad Option Option_Functor = {\n  eta : a::* => Option a -> a = some a\n  mu  : a::* => Option^2 a -> Option a = (none a) <+> (id (Option a))\n}\n\n";
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
