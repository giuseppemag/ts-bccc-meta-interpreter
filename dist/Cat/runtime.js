"use strict";
var sample = "\n// generic type composition\n(infix) type . = F::(*=>*) => G::(*=>*) => a::* => F(G a)\n\n// generic type endo-composition\n(infix) type ^ = F::(*=>*) => n::int => if n = 0 then Id else F . F\n\n// functors only have a map function\ntype Functor = F::(*=>*) => {\n  map : a::* => b::* => (a->b) -> (F a -> F b)\n}\n\n// monads have unit (eta) and join (mu)\ntype Monad = M::(*=>*) => Functor M => {\n  eta : a::* => (a -> M a)\n  mu  : a::* => (M^2 a) => M a\n}\n\n// identity function\nlet id : a::* => a -> a\n\n// function composition\n(infix) let . : a::* => b::* => c::* => (f:b->c) -> (g:a->b) -> (x:a) -> c = f(g x)\n\n// function composition (other way around)\n(infix) let ; : a::* => b::* => c::* => (f:a->b) -> (g:b->c) -> (x:a) -> c = g(f x)\n\n// identity functor: does nothing\ntype Id = a::* => a\nlet Id_Functor : Functor Id = {\n  map : a::* => (x:a) -> x\n}\n\n// identity monad (also does nothing)\nlet Id_Monad : Monad Id Id_Functor = {\n  eta : a::* => id a\n  mu  : a::* => id a\n}\n\n(infix) type * = F::(*=>*) => G::(*=>*) => a::* => b::* => a -> b -> {\n  x : a\n  y : b\n}\n\ntype Product = (infix) *::(*=>*=>*) => a::* => b::* => {\n  fst       : a*b -> a\n  snd       : a*b -> b\n  (infix) * : c::* => (f:c->a) -> (g:c->b) -> (c->a*b)\n  bi_map    : a'::* => b'::* => (f:a->a') -> (g:a->a') -> (a*b -> a'*b')\n}\n\n(infix) type * = a::* => b::* => { x:a, y:b }\nlet Product : a::* => b::* => Product (*) a b = {\n  fst = (p:a*b) -> p.x\n  snd = (p:a*b) -> p.y\n  *   = c::* => (f:c->a) -> (g:c->a) -> (c->a*b)\n  bi_map = a'::* => b'::* => (f:a->a') -> (g:a->a') -> (fst;f * snd;g)\n}\n\ntype Sum = (infix) +::(*=>*=>*) => a::* => b::* => {\n  inl       : a::* => b::* => a -> a+b\n  inr       : a::* => b::* => b -> a+b\n  (infix) + : c::* => (f:a->c) -> (g:b->c) -> (a+b->c)\n  bi_map    : a'::* => b'::* => (f:a->a') -> (g:a->a') -> (a+b -> a'+b')\n}\n\n\n";
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
