"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Immutable = require("immutable");
var wrap_map = function (map) { return ({
    isEmpty: function () { return map.isEmpty(); },
    set: function (k, v) {
        if (!map.has(k))
            return wrap_map(map.set(k, Immutable.List([v])));
        else
            return wrap_map(map.set(k, map.get(k).push(v)));
    },
    remove: function (k) { return wrap_map(map.remove(k)); },
    get: function (k) { return map.has(k) ? map.get(k) : Immutable.List(); },
    has: function (k) { return map.has(k) && !map.get(k).isEmpty(); },
    values: function () {
        var res = Immutable.List();
        map.forEach(function (vs, k) {
            if (!k || !vs)
                return;
            vs.forEach(function (v) { if (v)
                res = res.push({ k: k, v: v }); });
        });
        return res;
    }
}); };
exports.MultiMap = function (items) {
    var map = wrap_map(Immutable.Map());
    items.forEach(function (x) { map = map.set(x.k, x.v); });
    return map;
};
