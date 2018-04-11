import * as Immutable from "immutable";
export interface MultiMap<K, V> {
    isEmpty: () => boolean;
    set: (k: K, v: V) => MultiMap<K, V>;
    remove: (k: K) => MultiMap<K, V>;
    get: (k: K) => Immutable.List<V>;
    has: (k: K) => boolean;
    values: () => Immutable.List<{
        k: K;
        v: V;
    }>;
}
export declare let MultiMap: <K, V>(items: {
    k: K;
    v: V;
}[]) => MultiMap<K, V>;
