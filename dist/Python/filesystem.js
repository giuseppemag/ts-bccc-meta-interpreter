"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var Immutable = require("immutable");
var ts_bccc_1 = require("ts-bccc");
var ccc_aux_1 = require("../ccc_aux");
var main_1 = require("../main");
exports.get_fs = ts_bccc_1.co_get_state().then(function (st) { return ts_bccc_1.co_unit(st.fs); });
exports.set_fs = function (fs) {
    return ts_bccc_1.co_get_state().then(function (st) {
        return ts_bccc_1.co_set_state(__assign({}, st, { fs: fs }));
    });
};
exports.attr_map = function (attr0) {
    return ccc_aux_1.comm_list_coroutine(attr0).then(function (attr1) {
        var attr2 = attr1.toArray().map(function (a) {
            var t = a.value.v;
            var kv = [t[0].v, t[1].v];
            return kv;
        });
        return ts_bccc_1.co_unit(Immutable.Map(attr2));
    });
};
exports.set_file = function (r, path, content) {
    return exports.get_fs.then(function (fs) {
        return path.then(function (p_v) {
            return content.then(function (c_v) {
                return p_v.value.k !== "s"
                    ? main_1.runtime_error(r, "Path is not of type 'string'") :
                    c_v.value.k !== "s"
                        ? main_1.runtime_error(r, "Content is not of type 'string'") :
                        exports.set_fs(fs.set(p_v.value.v, { content: c_v.value.v })).then(function (_) {
                            return ts_bccc_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), main_1.mk_unit_val));
                        });
            });
        });
    });
};
exports.set_file_from_block = function (r, path, attr) {
    return exports.attr_map(attr).then(function (attr_v) {
        return attr_v.has("content")
            ? exports.set_file(r, path, ts_bccc_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), main_1.mk_string_val(attr_v.get("content")))))
            : ts_bccc_1.co_error({ range: r, message: "Every file must specify a property 'content'" });
    });
};
exports.get_file = function (r, path) {
    return exports.get_fs.then(function (fs) {
        return path.then(function (p_v) {
            return fs.has(p_v.value.v)
                ? ts_bccc_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), main_1.mk_string_val(fs.get(p_v.value.v).content)))
                : main_1.runtime_error(r, "There is no file at path: '" + p_v.value.v + "'");
        });
    });
};
exports.exists = function (path) {
    return path.then(function (p_v) {
        return exports.get_fs.then(function (fs) {
            return ts_bccc_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), main_1.mk_bool_val(fs.has(p_v.value.v))));
        });
    });
};
exports.copy_file = function (r, path_from, path_to) {
    return path_from.then(function (pf_v) { return path_to.then(function (pt_v) {
        return exports.get_file(r, ts_bccc_1.co_unit(pf_v)).then(function (f_v) {
            return exports.set_file(r, ts_bccc_1.co_unit(pt_v), ts_bccc_1.co_unit(f_v));
        });
    }); });
};
exports.move_file = function (r, path_from, path_to) {
    return exports.copy_file(r, path_from, path_to).then(function (_) { return exports.delete_file(r, path_from); });
};
exports.init_fs = function (files) {
    return ccc_aux_1.comm_list_coroutine(files).then(function (_) {
        return ts_bccc_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), main_1.mk_unit_val));
    });
};
exports.delete_file = function (r, path) {
    return path.then(function (p_v) {
        return exports.get_fs.then(function (fs) {
            return exports.set_fs(fs.delete(p_v.value.v)).then(function (_) {
                return ts_bccc_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), main_1.mk_unit_val));
            });
        });
    });
};
exports.fs_and_prg = function (fs, prg) {
    return fs.then(function (_) {
        return prg.then(function (_) {
            return ts_bccc_1.co_unit(ts_bccc_1.apply(ts_bccc_1.inl(), main_1.mk_unit_val));
        });
    });
};
