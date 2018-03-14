import * as Immutable from 'immutable';
import { Coroutine, Option } from 'ts-bccc';
import { SourceRange } from '../source_range';
import { BinOpKind, Token, UnaryOpKind } from './lexer';
export declare type ModifierAST = {
    kind: "private";
} | {
    kind: "public";
} | {
    kind: "static";
} | {
    kind: "protected";
} | {
    kind: "virtual";
} | {
    kind: "override";
};
export interface DebuggerAST {
    kind: "debugger";
}
export interface TCDebuggerAST {
    kind: "typechecker_debugger";
}
export interface StringAST {
    kind: "string";
    value: string;
}
export interface BoolAST {
    kind: "bool";
    value: boolean;
}
export interface IntAST {
    kind: "int";
    value: number;
}
export interface FloatAST {
    kind: "float";
    value: number;
}
export interface DoubleAST {
    kind: "double";
    value: number;
}
export interface IdAST {
    kind: "id";
    value: string;
}
export interface ForAST {
    kind: "for";
    i: ParserRes;
    c: ParserRes;
    s: ParserRes;
    b: ParserRes;
}
export interface WhileAST {
    kind: "while";
    c: ParserRes;
    b: ParserRes;
}
export interface IfAST {
    kind: "if";
    c: ParserRes;
    t: ParserRes;
    e: Option<ParserRes>;
}
export interface DeclAST {
    kind: "decl";
    l: ParserRes;
    r: {
        value: string;
        range: SourceRange;
    };
}
export interface DeclAndInitAST {
    kind: "decl and init";
    l: ParserRes;
    r: {
        value: string;
        range: SourceRange;
    };
    v: ParserRes;
}
export interface AssignAST {
    kind: "=";
    l: ParserRes;
    r: ParserRes;
}
export interface FieldRefAST {
    kind: ".";
    l: ParserRes;
    r: ParserRes;
}
export interface SemicolonAST {
    kind: ";";
    l: ParserRes;
    r: ParserRes;
}
export interface ReturnAST {
    kind: "return";
    value: ParserRes;
}
export interface NoopAST {
    kind: "noop";
}
export interface ArgsAST {
    kind: "args";
    value: Immutable.List<DeclAST>;
}
export interface BracketAST {
    kind: "bracket";
    e: ParserRes;
}
export interface UnitAST {
    kind: "unit";
}
export interface FieldAST {
    decl: DeclAST;
    modifiers: Immutable.List<{
        range: SourceRange;
        ast: ModifierAST;
    }>;
}
export interface MethodAST {
    decl: FunctionDeclarationAST;
    modifiers: Immutable.List<{
        range: SourceRange;
        ast: ModifierAST;
    }>;
}
export interface ConstructorAST {
    decl: ConstructorDeclarationAST;
    modifiers: Immutable.List<{
        range: SourceRange;
        ast: ModifierAST;
    }>;
}
export interface ClassAST {
    kind: "class";
    C_name: string;
    fields: Immutable.List<FieldAST>;
    methods: Immutable.List<MethodAST>;
    constructors: Immutable.List<ConstructorAST>;
}
export interface BinOpAST {
    kind: BinOpKind;
    l: ParserRes;
    r: ParserRes;
}
export interface UnaryOpAST {
    kind: UnaryOpKind;
    e: ParserRes;
}
export interface ConstructorDeclarationAST {
    kind: "cons_decl";
    name: string;
    arg_decls: Immutable.List<DeclAST>;
    body: ParserRes;
}
export interface FunctionDeclarationAST {
    kind: "func_decl";
    name: string;
    return_type: ParserRes;
    arg_decls: Immutable.List<DeclAST>;
    body: ParserRes;
}
export interface FunctionCallAST {
    kind: "func_call";
    name: ParserRes;
    actuals: Array<ParserRes>;
}
export interface ConstructorCallAST {
    kind: "cons_call";
    name: string;
    actuals: Array<ParserRes>;
}
export interface ArrayConstructorCallAST {
    kind: "array_cons_call";
    type: ParserRes;
    actual: ParserRes;
}
export interface GetArrayValueAtAST {
    kind: "get_array_value_at";
    array: ParserRes;
    index: ParserRes;
}
export interface EmptySurface {
    kind: "empty surface";
    w: ParserRes;
    h: ParserRes;
    color: ParserRes;
}
export interface Sprite {
    kind: "sprite";
    cx: ParserRes;
    cy: ParserRes;
    w: ParserRes;
    h: ParserRes;
    sprite: ParserRes;
    rotation: ParserRes;
}
export interface Circle {
    kind: "circle";
    cx: ParserRes;
    cy: ParserRes;
    r: ParserRes;
    color: ParserRes;
}
export interface Square {
    kind: "square";
    cx: ParserRes;
    cy: ParserRes;
    s: ParserRes;
    color: ParserRes;
    rotation: ParserRes;
}
export interface Ellipse {
    kind: "ellipse";
    cx: ParserRes;
    cy: ParserRes;
    w: ParserRes;
    h: ParserRes;
    color: ParserRes;
    rotation: ParserRes;
}
export interface Rectangle {
    kind: "rectangle";
    cx: ParserRes;
    cy: ParserRes;
    w: ParserRes;
    h: ParserRes;
    color: ParserRes;
    rotation: ParserRes;
}
export interface Line {
    kind: "line";
    x1: ParserRes;
    y1: ParserRes;
    x2: ParserRes;
    y2: ParserRes;
    width: ParserRes;
    color: ParserRes;
    rotation: ParserRes;
}
export interface Polygon {
    kind: "polygon";
    points: ParserRes;
    color: ParserRes;
    rotation: ParserRes;
}
export interface Text {
    kind: "text";
    t: ParserRes;
    x: ParserRes;
    y: ParserRes;
    size: ParserRes;
    color: ParserRes;
    rotation: ParserRes;
}
export interface OtherSurface {
    kind: "other surface";
    s: ParserRes;
    dx: ParserRes;
    dy: ParserRes;
    sx: ParserRes;
    sy: ParserRes;
    rotation: ParserRes;
}
export declare type RenderSurfaceAST = EmptySurface | Circle | Square | Ellipse | Rectangle | Line | Polygon | Text | Sprite | OtherSurface;
export interface GenericTypeDeclAST {
    kind: "generic type decl";
    f: ParserRes;
    args: Array<ParserRes>;
}
export interface ArrayTypeDeclAST {
    kind: "array decl";
    t: ParserRes;
}
export interface TupleTypeDeclAST {
    kind: "tuple type decl";
    args: Array<ParserRes>;
}
export interface RecordTypeDeclAST {
    kind: "record type decl";
    args: Array<DeclAST>;
}
export declare type AST = UnitAST | StringAST | IntAST | FloatAST | DoubleAST | BoolAST | IdAST | FieldRefAST | GenericTypeDeclAST | TupleTypeDeclAST | RecordTypeDeclAST | AssignAST | DeclAST | DeclAndInitAST | IfAST | ForAST | WhileAST | SemicolonAST | ReturnAST | ArgsAST | BinOpAST | UnaryOpAST | FunctionDeclarationAST | FunctionCallAST | ClassAST | ConstructorCallAST | ArrayConstructorCallAST | DebuggerAST | TCDebuggerAST | NoopAST | RenderSurfaceAST | ArrayTypeDeclAST | ModifierAST | GetArrayValueAtAST | BracketAST;
export interface ParserRes {
    range: SourceRange;
    ast: AST;
}
export interface ParserError {
    priority: number;
    message: string;
    range: SourceRange;
}
export interface ParserState {
    tokens: Immutable.List<Token>;
    branch_priority: number;
}
export declare type Parser = Coroutine<ParserState, ParserError, ParserRes>;
export declare let mk_parser_state: (tokens: Immutable.List<Token>) => {
    tokens: Immutable.List<Token>;
    branch_priority: number;
};
export declare let par: Coroutine<ParserState, ParserError, {
    val: ParserRes[];
    range: SourceRange;
}>;
export declare let expr: () => Coroutine<ParserState, ParserError, ParserRes>;
export declare let program_prs: () => Parser;
