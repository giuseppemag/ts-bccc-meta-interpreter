import * as Immutable from "immutable";
export interface Unit {
}
export declare type CoConcreteRes<s, e, a> = {
    kind: "k";
    s: s;
    k: Coroutine<s, e, a>;
} | {
    kind: "e";
    e: e;
} | {
    kind: "v";
    s: s;
    v: a;
};
export declare type CoRes<s, e, a> = {
    kind: "k";
    s: s;
    k: Coroutine<s, e, a>;
} | {
    kind: "e";
    e: e;
} | {
    kind: "v";
    s: s;
    v: a;
} | {
    kind: "cmp";
    s: s;
    pre: Coroutine<s, e, Unit>;
    p: Coroutine<s, e, a>;
};
export declare type CoComp<s, e, a> = {
    kind: "cmp";
    pre: Coroutine<s, e, Unit>;
    p: Coroutine<s, e, a>;
};
export declare type Co<s, e, a> = {
    kind: "run";
    run: (s: s) => CoRes<s, e, a>;
} | CoComp<s, e, a>;
export declare let co_err: <s, e, a>(e: e) => Co<s, e, a>;
export declare let co_res: <s, e, a>(v: a) => Co<s, e, a>;
export declare let co_cont: <s, e, a>(k: Coroutine<s, e, a>) => Co<s, e, a>;
export declare type Coroutine<s, e, a> = {
    run: Co<s, e, a>;
    then: <b>(k: (_: a) => Coroutine<s, e, b>) => Coroutine<s, e, b>;
    combine: <b>(q: Coroutine<s, e, b>) => Coroutine<s, e, b>;
};
export declare let mk_coroutine: <s, e, a>(run: Co<s, e, a>) => Coroutine<s, e, a>;
export declare let map: <s, e, a, b>(p: Coroutine<s, e, a>, f: (_: a) => b) => Coroutine<s, e, b>;
export declare let co_error: <s, e, a>(e: e) => Coroutine<s, e, a>;
export declare let co_unit: <s, e, a>(v: a) => Coroutine<s, e, a>;
export declare let co_suspend: <s, e>() => Coroutine<s, e, Unit>;
export declare let co_change_state: <s, e>(f: (_: s) => s) => Coroutine<s, e, Unit>;
export declare let co_from_state: <s, e, a>(f: (_: s) => a) => Coroutine<s, e, a>;
export declare let co_from_and_change_state: <s, e, a>(f: (_: s) => [a, s]) => Coroutine<s, e, a>;
export declare let co_get_state: <s, e>() => Coroutine<s, e, s>;
export declare let co_set_state: <s, e>(s: s) => Coroutine<s, e, Unit>;
export declare let comm_list_coroutine: <S, E, A>(ps: Immutable.List<Coroutine<S, E, A>>) => Coroutine<S, E, Immutable.List<A>>;
export declare let co_lookup: <S, E, A>(p: Coroutine<S, E, A>) => Coroutine<S, E, A>;
