import * as Immutable from "immutable"

export interface MultiMap<K,V> {
  isEmpty: () => boolean,
  set: (k:K, v:V) => MultiMap<K,V>
  remove: (k:K) => MultiMap<K,V>
  get: (k:K) => Immutable.List<V>
  has: (k:K) => boolean
  values: () => Immutable.List<{ k:K, v:V }>
}

let wrap_map = <K,V>(map:Immutable.Map<K, Immutable.List<V>>) : MultiMap<K,V> => ({
  isEmpty: () => map.isEmpty(),
  set: (k,v) => {
    if (!map.has(k)) return wrap_map(map.set(k, Immutable.List<V>([v])))
    else return wrap_map(map.set(k, map.get(k).push(v)))
  },
  remove: k => wrap_map(map.remove(k)),
  get: k => map.has(k) ? map.get(k) : Immutable.List<V>(),
  has: k => map.has(k) && !map.get(k).isEmpty(),
  values: () => {
    let res = Immutable.List<{ k:K, v:V }>()
    map.forEach((vs,k) => {
      if (!k || !vs) return
      vs.forEach(v => { if (v) res = res.push({k:k,v:v}) })
    })
    return res
  }
})

export let MultiMap = <K,V>(items:Array<{ k:K, v:V }>) : MultiMap<K,V> => {
  let map = wrap_map(Immutable.Map<K, Immutable.List<V>>())
  items.forEach(x => { map = map.set(x.k, x.v) })
  return map
}
