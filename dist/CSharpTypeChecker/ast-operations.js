"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Immutable = require("immutable");
var source_range_1 = require("../source_range");
var bindings_1 = require("./bindings");
var types_1 = require("./types");
var ts_bccc_1 = require("ts-bccc");
var ast_to_csharp_type = function (s) {
    return s.ast.kind == "id" ?
        s.ast.value == "int" ? types_1.int_type
            : s.ast.value == "float" ? types_1.float_type
                : s.ast.value == "double" ? types_1.double_type
                    : s.ast.value == "bool" ? types_1.bool_type
                        : s.ast.value == "string" ? types_1.string_type
                            : s.ast.value == "void" ? types_1.unit_type
                                : s.ast.value == "RenderGrid" ? types_1.render_grid_type
                                    : s.ast.value == "RenderGridPixel" ? types_1.render_grid_pixel_type
                                        : s.ast.value == "surface" ? types_1.render_surface_type
                                            : s.ast.value == "sprite" ? types_1.sprite_type
                                                : s.ast.value == "circle" ? types_1.circle_type
                                                    : s.ast.value == "square" ? types_1.square_type
                                                        : s.ast.value == "ellipse" ? types_1.ellipse_type
                                                            : s.ast.value == "rectangle" ? types_1.rectangle_type
                                                                : s.ast.value == "var" ? types_1.var_type
                                                                    : types_1.ref_type(s.ast.value) :
        s.ast.kind == "array decl" ? types_1.arr_type(ast_to_csharp_type(s.ast.t))
            : s.ast.kind == "generic type decl" && s.ast.f.ast.kind == "id" && s.ast.f.ast.value == "Func" && s.ast.args.length >= 1 ?
                types_1.fun_type(types_1.tuple_type(Immutable.Seq(s.ast.args).take(s.ast.args.length - 1).toArray().map(function (a) { return ast_to_csharp_type(a); })), ast_to_csharp_type(s.ast.args[s.ast.args.length - 1]), s.range)
                : s.ast.kind == "tuple type decl" ?
                    types_1.tuple_type(s.ast.args.map(function (a) { return ast_to_csharp_type(a); }))
                    : s.ast.kind == "record type decl" ?
                        types_1.record_type(Immutable.Map(s.ast.args.map(function (a) { return [a.r.ast.kind == "id" ? a.r.ast.value : "", ast_to_csharp_type(a.l)]; })))
                        : (function () {
                            //console.log(`Error: unsupported ast type: ${JSON.stringify(s)}`);
                            throw new Error("Unsupported ast type: " + source_range_1.print_range(s.range));
                        })();
};
exports.global_calling_context = ({ kind: "global scope" });
var union_many = function (a) {
    var res = Immutable.Set();
    a.forEach(function (x) { res = res.union(x); });
    return res;
};
var free_variables = function (n, bound) {
    return n.ast.kind == ";" || n.ast.kind == "+" || n.ast.kind == "-" || n.ast.kind == "/" || n.ast.kind == "*"
        || n.ast.kind == "%" || n.ast.kind == "<" || n.ast.kind == ">" || n.ast.kind == "<=" || n.ast.kind == ">="
        || n.ast.kind == "==" || n.ast.kind == "!=" || n.ast.kind == "xor" || n.ast.kind == "&&" || n.ast.kind == "||"
        || n.ast.kind == "," || n.ast.kind == "as" ?
        free_variables(n.ast.l, bound).union(free_variables(n.ast.r, bound))
        : n.ast.kind == "empty surface" ?
            free_variables(n.ast.w, bound).union(free_variables(n.ast.h, bound))
                .union(free_variables(n.ast.color, bound))
            : n.ast.kind == "circle" ?
                free_variables(n.ast.cx, bound).union(free_variables(n.ast.cy, bound)).union(free_variables(n.ast.r, bound))
                    .union(free_variables(n.ast.color, bound))
                : n.ast.kind == "square" ?
                    free_variables(n.ast.cx, bound).union(free_variables(n.ast.cy, bound)).union(free_variables(n.ast.s, bound))
                        .union(free_variables(n.ast.color, bound)).union(free_variables(n.ast.rotation, bound))
                    : n.ast.kind == "rectangle" ?
                        free_variables(n.ast.cx, bound).union(free_variables(n.ast.cy, bound)).union(free_variables(n.ast.w, bound)).union(free_variables(n.ast.h, bound))
                            .union(free_variables(n.ast.color, bound)).union(free_variables(n.ast.rotation, bound))
                        : n.ast.kind == "ellipse" ?
                            free_variables(n.ast.cx, bound).union(free_variables(n.ast.cy, bound)).union(free_variables(n.ast.w, bound)).union(free_variables(n.ast.h, bound))
                                .union(free_variables(n.ast.color, bound)).union(free_variables(n.ast.rotation, bound))
                            : n.ast.kind == "sprite" ?
                                free_variables(n.ast.cx, bound).union(free_variables(n.ast.cy, bound)).union(free_variables(n.ast.w, bound)).union(free_variables(n.ast.h, bound))
                                    .union(free_variables(n.ast.sprite, bound)).union(free_variables(n.ast.rotation, bound))
                                : n.ast.kind == "line" ?
                                    free_variables(n.ast.x1, bound).union(free_variables(n.ast.y1, bound)).union(free_variables(n.ast.x2, bound)).union(free_variables(n.ast.y2, bound))
                                        .union(free_variables(n.ast.width, bound)).union(free_variables(n.ast.color, bound)).union(free_variables(n.ast.rotation, bound))
                                    : n.ast.kind == "text" ?
                                        free_variables(n.ast.x, bound).union(free_variables(n.ast.y, bound)).union(free_variables(n.ast.t, bound)).union(free_variables(n.ast.size, bound))
                                            .union(free_variables(n.ast.color, bound)).union(free_variables(n.ast.rotation, bound))
                                        : n.ast.kind == "polygon" ?
                                            free_variables(n.ast.color, bound).union(free_variables(n.ast.rotation, bound))
                                                .union(free_variables(n.ast.points, bound))
                                            : n.ast.kind == "other surface" ?
                                                free_variables(n.ast.s, bound).union(free_variables(n.ast.dx, bound)).union(free_variables(n.ast.dy, bound))
                                                    .union(free_variables(n.ast.sx, bound)).union(free_variables(n.ast.sy, bound))
                                                // export interface MkEmptyRenderGrid { kind: "mk-empty-render-grid", w:ParserRes, h:ParserRes }
                                                // export interface MkRenderGridPixel { kind: "mk-render-grid-pixel", w:ParserRes, h:ParserRes, status:ParserRes }
                                                : n.ast.kind == "not" || n.ast.kind == "bracket" ? free_variables(n.ast.e, bound)
                                                    : n.ast.kind == "return" ? free_variables(n.ast.value, bound)
                                                        : n.ast.kind == "if" ? free_variables(n.ast.c, bound).union(free_variables(n.ast.t, bound)).union(n.ast.e.kind == "left" ? free_variables(n.ast.e.value, bound) : Immutable.Set())
                                                            : n.ast.kind == "while" ? free_variables(n.ast.c, bound).union(free_variables(n.ast.b, bound))
                                                                : n.ast.kind == "ternary_if" ? free_variables(n.ast.condition, bound).union(free_variables(n.ast.then_else, bound))
                                                                    : n.ast.kind == "ternary_then_else" ? free_variables(n.ast._then, bound).union(free_variables(n.ast._else, bound))
                                                                        : n.ast.kind == "=>" && n.ast.l.ast.kind == "id" ? free_variables(n.ast.r, bound.add(n.ast.l.ast.value))
                                                                            : n.ast.kind == "id" ? (!bound.has(n.ast.value) ? Immutable.Set([n.ast.value]) : Immutable.Set())
                                                                                : n.ast.kind == "int" || n.ast.kind == "double" || n.ast.kind == "float" || n.ast.kind == "string" || n.ast.kind == "bool" || n.ast.kind == "get_array_value_at" || n.ast.kind == "array_cons_call_and_init" ? Immutable.Set()
                                                                                    : n.ast.kind == "func_call" ? free_variables(n.ast.name, bound).union(union_many(n.ast.actuals.map(function (a) { return free_variables(a, bound); })))
                                                                                        : n.ast.kind == "debugger" || n.ast.kind == "typechecker_debugger" ? Immutable.Set()
                                                                                            : (function () {
                                                                                                console.log("Error (FV): unsupported ast node: " + JSON.stringify(n));
                                                                                                throw new Error("(FV) Unsupported ast node: " + source_range_1.print_range(n.range));
                                                                                            })();
};
exports.extract_tuple_args = function (n) {
    return n.ast.kind == "," ? [n.ast.l].concat(exports.extract_tuple_args(n.ast.r)) : n.ast.kind == "bracket" ? exports.extract_tuple_args(n.ast.e)
        : [n];
};
exports.ast_to_type_checker = function (n) { return function (context) {
    return n.ast.kind == "int" ? bindings_1.int(n.range, n.ast.value)
        : n.ast.kind == "double" ? bindings_1.double(n.range, n.ast.value)
            : n.ast.kind == "float" ? bindings_1.float(n.range, n.ast.value)
                : n.ast.kind == "string" ? bindings_1.str(n.range, n.ast.value)
                    : n.ast.kind == "bracket" ? exports.ast_to_type_checker(n.ast.e)(context)
                        : n.ast.kind == "bool" ? bindings_1.bool(n.range, n.ast.value)
                            : n.ast.kind == "noop" ? bindings_1.done
                                : n.ast.kind == ";" ? bindings_1.semicolon(n.range, exports.ast_to_type_checker(n.ast.l)(context), exports.ast_to_type_checker(n.ast.r)(context))
                                    : n.ast.kind == "for" ? bindings_1.for_loop(n.range, exports.ast_to_type_checker(n.ast.i)(context), exports.ast_to_type_checker(n.ast.c)(context), exports.ast_to_type_checker(n.ast.s)(context), exports.ast_to_type_checker(n.ast.b)(context))
                                        : n.ast.kind == "while" ? bindings_1.while_do(n.range, exports.ast_to_type_checker(n.ast.c)(context), exports.ast_to_type_checker(n.ast.b)(context))
                                            : n.ast.kind == "if" ? bindings_1.if_then_else(n.range, exports.ast_to_type_checker(n.ast.c)(context), exports.ast_to_type_checker(n.ast.t)(context), n.ast.e.kind == "right" ? bindings_1.done : exports.ast_to_type_checker(n.ast.e.value)(context))
                                                : n.ast.kind == "as" ? bindings_1.coerce(n.range, exports.ast_to_type_checker(n.ast.l)(context), ast_to_csharp_type(n.ast.r))
                                                    : n.ast.kind == "+" ? bindings_1.plus(n.range, exports.ast_to_type_checker(n.ast.l)(context), exports.ast_to_type_checker(n.ast.r)(context))
                                                        : n.ast.kind == "-" ? bindings_1.minus(n.range, exports.ast_to_type_checker(n.ast.l)(context), exports.ast_to_type_checker(n.ast.r)(context))
                                                            : n.ast.kind == "*" ? bindings_1.times(n.range, exports.ast_to_type_checker(n.ast.l)(context), exports.ast_to_type_checker(n.ast.r)(context), n.range)
                                                                : n.ast.kind == "/" ? bindings_1.div(n.range, exports.ast_to_type_checker(n.ast.l)(context), exports.ast_to_type_checker(n.ast.r)(context))
                                                                    : n.ast.kind == "%" ? bindings_1.mod(n.range, exports.ast_to_type_checker(n.ast.l)(context), exports.ast_to_type_checker(n.ast.r)(context))
                                                                        : n.ast.kind == "<" ? bindings_1.lt(n.range, exports.ast_to_type_checker(n.ast.l)(context), exports.ast_to_type_checker(n.ast.r)(context))
                                                                            : n.ast.kind == ">" ? bindings_1.gt(n.range, exports.ast_to_type_checker(n.ast.l)(context), exports.ast_to_type_checker(n.ast.r)(context))
                                                                                : n.ast.kind == "<=" ? bindings_1.leq(n.range, exports.ast_to_type_checker(n.ast.l)(context), exports.ast_to_type_checker(n.ast.r)(context))
                                                                                    : n.ast.kind == ">=" ? bindings_1.geq(n.range, exports.ast_to_type_checker(n.ast.l)(context), exports.ast_to_type_checker(n.ast.r)(context))
                                                                                        : n.ast.kind == "==" ? bindings_1.eq(n.range, exports.ast_to_type_checker(n.ast.l)(context), exports.ast_to_type_checker(n.ast.r)(context))
                                                                                            : n.ast.kind == "!=" ? bindings_1.neq(n.range, exports.ast_to_type_checker(n.ast.l)(context), exports.ast_to_type_checker(n.ast.r)(context))
                                                                                                : n.ast.kind == "xor" ? bindings_1.xor(n.range, exports.ast_to_type_checker(n.ast.l)(context), exports.ast_to_type_checker(n.ast.r)(context))
                                                                                                    : n.ast.kind == "not" ? bindings_1.not(n.range, exports.ast_to_type_checker(n.ast.e)(context))
                                                                                                        : n.ast.kind == "&&" ? bindings_1.and(n.range, exports.ast_to_type_checker(n.ast.l)(context), exports.ast_to_type_checker(n.ast.r)(context))
                                                                                                            : n.ast.kind == "||" ? bindings_1.or(n.range, exports.ast_to_type_checker(n.ast.l)(context), exports.ast_to_type_checker(n.ast.r)(context))
                                                                                                                : n.ast.kind == "=>" ? bindings_1.arrow(n.range, exports.extract_tuple_args(n.ast.l).map(function (a) {
                                                                                                                    if (a.ast.kind != "id") {
                                                                                                                        //console.log(`Error: unsupported ast node: ${print_range(n.range)}`)
                                                                                                                        throw new Error("Unsupported ast node: " + source_range_1.print_range(n.range));
                                                                                                                    }
                                                                                                                    return { name: a.ast.value, type: types_1.var_type };
                                                                                                                }), 
                                                                                                                // [ { name:n.ast.l.ast.value, type:var_type } ],
                                                                                                                free_variables(n.ast.r, Immutable.Set(exports.extract_tuple_args(n.ast.l).map(function (a) {
                                                                                                                    if (a.ast.kind != "id") {
                                                                                                                        //console.log(`Error: unsupported ast node: ${JSON.stringify(n)}`)
                                                                                                                        throw new Error("Unsupported ast node: " + source_range_1.print_range(n.range));
                                                                                                                    }
                                                                                                                    return a.ast.value;
                                                                                                                }))).toArray(), exports.ast_to_type_checker(n.ast.r)(context))
                                                                                                                    : n.ast.kind == "," ? bindings_1.tuple_value(n.range, ([n.ast.l].concat(exports.extract_tuple_args(n.ast.r))).map(function (a) { return exports.ast_to_type_checker(a)(context); }))
                                                                                                                        : n.ast.kind == "id" ? bindings_1.get_v(n.range, n.ast.value)
                                                                                                                            : n.ast.kind == "return" ? bindings_1.ret(n.range, exports.ast_to_type_checker(n.ast.value)(context))
                                                                                                                                : n.ast.kind == "." && n.ast.r.ast.kind == "id" ? bindings_1.field_get(n.range, context, exports.ast_to_type_checker(n.ast.l)(context), n.ast.r.ast.value)
                                                                                                                                    : n.ast.kind == "ternary_if" && n.ast.then_else.ast.kind == "ternary_then_else" ?
                                                                                                                                        bindings_1.if_then_else(n.range, exports.ast_to_type_checker(n.ast.condition)(context), exports.ast_to_type_checker(n.ast.then_else.ast._then)(context), exports.ast_to_type_checker(n.ast.then_else.ast._else)(context))
                                                                                                                                        : n.ast.kind == "=" && n.ast.l.ast.kind == "get_array_value_at" ?
                                                                                                                                            bindings_1.set_arr_el(n.range, exports.ast_to_type_checker(n.ast.l.ast.array)(context), exports.ast_to_type_checker(n.ast.l.ast.index)(context), exports.ast_to_type_checker(n.ast.r)(context))
                                                                                                                                            : n.ast.kind == "=" && n.ast.l.ast.kind == "id" ? bindings_1.set_v(n.range, n.ast.l.ast.value, exports.ast_to_type_checker(n.ast.r)(context))
                                                                                                                                                : n.ast.kind == "=" && n.ast.l.ast.kind == "." && n.ast.l.ast.r.ast.kind == "id" ?
                                                                                                                                                    bindings_1.field_set(n.range, context, exports.ast_to_type_checker(n.ast.l.ast.l)(context), { att_name: n.ast.l.ast.r.ast.value, kind: "att" }, exports.ast_to_type_checker(n.ast.r)(context))
                                                                                                                                                    : n.ast.kind == "cons_call" ?
                                                                                                                                                        bindings_1.call_cons(n.range, context, n.ast.name, n.ast.actuals.map(function (a) { return exports.ast_to_type_checker(a)(context); }))
                                                                                                                                                        : n.ast.kind == "func_call" ?
                                                                                                                                                            bindings_1.call_lambda(n.range, exports.ast_to_type_checker(n.ast.name)(context), n.ast.actuals.map(function (a) { return exports.ast_to_type_checker(a)(context); }))
                                                                                                                                                            : n.ast.kind == "func_decl" ?
                                                                                                                                                                bindings_1.def_fun(n.range, { name: n.ast.name,
                                                                                                                                                                    return_t: ast_to_csharp_type(n.ast.return_type),
                                                                                                                                                                    parameters: n.ast.arg_decls.toArray().map(function (d) { return ({ name: d.r.ast.kind == "id" ? d.r.ast.value : "", type: ast_to_csharp_type(d.l) }); }),
                                                                                                                                                                    body: exports.ast_to_type_checker(n.ast.body)(context),
                                                                                                                                                                    range: n.range }, []
                                                                                                                                                                // free_variables(n.ast.body,
                                                                                                                                                                //   Immutable.Set<string>(n.ast.arg_decls.toArray().map(d => d.r.ast.kind == "id" ? d.r.ast.value : ""))).toArray()
                                                                                                                                                                )
                                                                                                                                                                : n.ast.kind == "class" ?
                                                                                                                                                                    bindings_1.def_class(n.range, n.ast.modifiers.toArray().map(function (m) { return m.kind; }), (n.ast.modifiers.toArray().some(function (m) { return m.kind == "abstract"; }) ? "abstract" :
                                                                                                                                                                        n.ast.modifiers.toArray().some(function (m) { return m.kind == "interface"; }) ? "interface" : "normal"), n.ast.C_name, n.ast.extends_or_implements, n.ast.methods.toArray().map(function (m) { return function (context) { return ({
                                                                                                                                                                        name: m.decl.name,
                                                                                                                                                                        return_t: ast_to_csharp_type(m.decl.return_type),
                                                                                                                                                                        params_base_call: [],
                                                                                                                                                                        parameters: m.decl.arg_decls.toArray().map(function (a) { return ({ name: a.r.ast.kind == "id" ? a.r.ast.value : "", type: ast_to_csharp_type(a.l) }); }),
                                                                                                                                                                        body: exports.ast_to_type_checker(m.decl.body)(context),
                                                                                                                                                                        range: source_range_1.join_source_ranges(m.decl.return_type.range, m.decl.body.range),
                                                                                                                                                                        modifiers: m.modifiers.toArray().map(function (mod) { return mod.ast.kind; }),
                                                                                                                                                                        is_constructor: false
                                                                                                                                                                    }); }; }).concat(n.ast.constructors.toArray().map(function (c) { return function (context) { return ({
                                                                                                                                                                        name: c.decl.name,
                                                                                                                                                                        params_base_call: c.decl.params_base_call.map(function (e) { return exports.ast_to_type_checker(e)(context); }),
                                                                                                                                                                        return_t: types_1.unit_type,
                                                                                                                                                                        parameters: c.decl.arg_decls.toArray().map(function (a) { return ({ name: a.r.ast.kind == "id" ? a.r.ast.value : "", type: ast_to_csharp_type(a.l) }); }),
                                                                                                                                                                        body: exports.ast_to_type_checker(c.decl.body)(context),
                                                                                                                                                                        range: c.decl.body.range,
                                                                                                                                                                        modifiers: c.modifiers.toArray().map(function (mod) { return mod.ast.kind; }),
                                                                                                                                                                        is_constructor: true
                                                                                                                                                                    }); }; })), n.ast.fields.toArray().map(function (f) { return function (context) { return ({
                                                                                                                                                                        name: f.decl.r.ast.kind == "id" ? f.decl.r.ast.value : "",
                                                                                                                                                                        type: ast_to_csharp_type(f.decl.l),
                                                                                                                                                                        is_used_as_base: false,
                                                                                                                                                                        modifiers: f.modifiers.toArray().map(function (mod) { return mod.ast.kind; }),
                                                                                                                                                                        initial_value: f.decl.kind == "decl" ? ts_bccc_1.inr().f({}) : ts_bccc_1.apply(ts_bccc_1.inl(), exports.ast_to_type_checker(f.decl.v)(context))
                                                                                                                                                                    }); }; }))
                                                                                                                                                                    : n.ast.kind == "decl" && n.ast.r.ast.kind == "id" ?
                                                                                                                                                                        bindings_1.decl_v(n.range, n.ast.r.ast.value, ast_to_csharp_type(n.ast.l))
                                                                                                                                                                        : n.ast.kind == "decl and init" && n.ast.r.ast.kind == "id" ?
                                                                                                                                                                            bindings_1.decl_and_init_v(n.range, n.ast.r.ast.value, ast_to_csharp_type(n.ast.l), exports.ast_to_type_checker(n.ast.v)(context))
                                                                                                                                                                            : n.ast.kind == "debugger" ?
                                                                                                                                                                                bindings_1.breakpoint(n.range)(bindings_1.done)
                                                                                                                                                                                : n.ast.kind == "typechecker_debugger" ?
                                                                                                                                                                                    bindings_1.typechecker_breakpoint(n.range)(bindings_1.done)
                                                                                                                                                                                    : n.ast.kind == "array_cons_call" ?
                                                                                                                                                                                        bindings_1.new_array(n.range, ast_to_csharp_type(n.ast.type), exports.ast_to_type_checker(n.ast.actual)(context))
                                                                                                                                                                                        : n.ast.kind == "array_cons_call_and_init" ?
                                                                                                                                                                                            bindings_1.new_array_and_init(n.range, ast_to_csharp_type(n.ast.type), n.ast.actuals.map(function (a) { return exports.ast_to_type_checker(a)(context); }))
                                                                                                                                                                                            : n.ast.kind == "get_array_value_at" ?
                                                                                                                                                                                                bindings_1.get_arr_el(n.range, exports.ast_to_type_checker(n.ast.array)(context), exports.ast_to_type_checker(n.ast.index)(context))
                                                                                                                                                                                                : n.ast.kind == "empty surface" ?
                                                                                                                                                                                                    bindings_1.mk_empty_surface(n.range, exports.ast_to_type_checker(n.ast.w)(context), exports.ast_to_type_checker(n.ast.h)(context), exports.ast_to_type_checker(n.ast.color)(context))
                                                                                                                                                                                                    : n.ast.kind == "circle" ?
                                                                                                                                                                                                        bindings_1.mk_circle(n.range, exports.ast_to_type_checker(n.ast.cx)(context), exports.ast_to_type_checker(n.ast.cy)(context), exports.ast_to_type_checker(n.ast.r)(context), exports.ast_to_type_checker(n.ast.color)(context))
                                                                                                                                                                                                        : n.ast.kind == "square" ?
                                                                                                                                                                                                            bindings_1.mk_square(n.range, exports.ast_to_type_checker(n.ast.cx)(context), exports.ast_to_type_checker(n.ast.cy)(context), exports.ast_to_type_checker(n.ast.s)(context), exports.ast_to_type_checker(n.ast.color)(context), exports.ast_to_type_checker(n.ast.rotation)(context))
                                                                                                                                                                                                            : n.ast.kind == "ellipse" ?
                                                                                                                                                                                                                bindings_1.mk_ellipse(n.range, exports.ast_to_type_checker(n.ast.cx)(context), exports.ast_to_type_checker(n.ast.cy)(context), exports.ast_to_type_checker(n.ast.w)(context), exports.ast_to_type_checker(n.ast.h)(context), exports.ast_to_type_checker(n.ast.color)(context), exports.ast_to_type_checker(n.ast.rotation)(context))
                                                                                                                                                                                                                : n.ast.kind == "rectangle" ?
                                                                                                                                                                                                                    bindings_1.mk_rectangle(n.range, exports.ast_to_type_checker(n.ast.cx)(context), exports.ast_to_type_checker(n.ast.cy)(context), exports.ast_to_type_checker(n.ast.w)(context), exports.ast_to_type_checker(n.ast.h)(context), exports.ast_to_type_checker(n.ast.color)(context), exports.ast_to_type_checker(n.ast.rotation)(context))
                                                                                                                                                                                                                    : n.ast.kind == "line" ?
                                                                                                                                                                                                                        bindings_1.mk_line(n.range, exports.ast_to_type_checker(n.ast.x1)(context), exports.ast_to_type_checker(n.ast.y1)(context), exports.ast_to_type_checker(n.ast.x2)(context), exports.ast_to_type_checker(n.ast.y2)(context), exports.ast_to_type_checker(n.ast.width)(context), exports.ast_to_type_checker(n.ast.color)(context), exports.ast_to_type_checker(n.ast.rotation)(context))
                                                                                                                                                                                                                        : n.ast.kind == "polygon" ?
                                                                                                                                                                                                                            bindings_1.mk_polygon(n.range, exports.ast_to_type_checker(n.ast.points)(context), exports.ast_to_type_checker(n.ast.color)(context), exports.ast_to_type_checker(n.ast.rotation)(context))
                                                                                                                                                                                                                            : n.ast.kind == "text" ?
                                                                                                                                                                                                                                bindings_1.mk_text(n.range, exports.ast_to_type_checker(n.ast.t)(context), exports.ast_to_type_checker(n.ast.x)(context), exports.ast_to_type_checker(n.ast.y)(context), exports.ast_to_type_checker(n.ast.size)(context), exports.ast_to_type_checker(n.ast.color)(context), exports.ast_to_type_checker(n.ast.rotation)(context))
                                                                                                                                                                                                                                : n.ast.kind == "sprite" ?
                                                                                                                                                                                                                                    bindings_1.mk_sprite(n.range, exports.ast_to_type_checker(n.ast.sprite)(context), exports.ast_to_type_checker(n.ast.cx)(context), exports.ast_to_type_checker(n.ast.cy)(context), exports.ast_to_type_checker(n.ast.w)(context), exports.ast_to_type_checker(n.ast.h)(context), exports.ast_to_type_checker(n.ast.rotation)(context))
                                                                                                                                                                                                                                    : n.ast.kind == "other surface" ?
                                                                                                                                                                                                                                        bindings_1.mk_other_surface(n.range, exports.ast_to_type_checker(n.ast.s)(context), exports.ast_to_type_checker(n.ast.dx)(context), exports.ast_to_type_checker(n.ast.dy)(context), exports.ast_to_type_checker(n.ast.sx)(context), exports.ast_to_type_checker(n.ast.sy)(context), exports.ast_to_type_checker(n.ast.rotation)(context))
                                                                                                                                                                                                                                        : (function () {
                                                                                                                                                                                                                                            //console.log(`Error: unsupported ast node: ${JSON.stringify(print_range(n.range))}`);
                                                                                                                                                                                                                                            throw new Error("Unsupported ast node: " + source_range_1.print_range(n.range));
                                                                                                                                                                                                                                        })();
}; };
