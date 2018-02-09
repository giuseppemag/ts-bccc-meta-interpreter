import * as Immutable from "immutable";
import { Option, Sum, Coroutine } from "ts-bccc";
import { SourceRange } from "../source_range";
import * as CSharp from "./csharp";
import { CallingContext } from "./bindings";
export declare type BinOpKind = "+" | "*" | "/" | "-" | "%" | ">" | "<" | "<=" | ">=" | "==" | "!=" | "&&" | "||" | "xor" | "=>";
export declare type UnaryOpKind = "not";
export declare type Token = ({
    kind: "string";
    v: string;
} | {
    kind: "int";
    v: number;
} | {
    kind: "float";
    v: number;
} | {
    kind: "bool";
    v: boolean;
} | {
    kind: "while";
} | {
    kind: "if";
} | {
    kind: "then";
} | {
    kind: "else";
} | {
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
} | {
    kind: "class";
} | {
    kind: "new";
} | {
    kind: "id";
    v: string;
} | {
    kind: "=";
} | {
    kind: BinOpKind;
} | {
    kind: UnaryOpKind;
} | {
    kind: ";";
} | {
    kind: ".";
} | {
    kind: "dbg";
} | {
    kind: "tc-dbg";
} | {
    kind: "(";
} | {
    kind: ")";
} | {
    kind: "{";
} | {
    kind: "}";
} | {
    kind: "[";
} | {
    kind: "]";
} | {
    kind: "eof";
} | {
    kind: "nl";
} | {
    kind: " ";
} | {
    kind: ",";
} | {
    kind: "RenderGrid";
    v: number;
} | {
    kind: "mk_empty_render_grid";
} | {
    kind: "pixel";
} | {
    kind: "return";
}) & {
    range: SourceRange;
};
export declare module GrammarBasics {
    let tokenize: (source: string) => Sum<string, Token[]>;
}
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
    kind: "dbg";
}
export interface TCDebuggerAST {
    kind: "tc-dbg";
}
export interface UnitAST {
    kind: "unit";
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
export interface IdAST {
    kind: "id";
    value: string;
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
export interface MkEmptyRenderGrid {
    kind: "mk-empty-render-grid";
    w: ParserRes;
    h: ParserRes;
}
export interface MkRenderGridPixel {
    kind: "mk-render-grid-pixel";
    w: ParserRes;
    h: ParserRes;
    status: ParserRes;
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
export interface MethodCallAST {
    kind: "method_call";
    object: ParserRes;
    name: ParserRes;
    actuals: Array<ParserRes>;
}
export interface GenericTypeDeclAST {
    kind: "generic type decl";
    f: ParserRes;
    args: Array<ParserRes>;
}
export declare type AST = UnitAST | StringAST | IntAST | BoolAST | IdAST | FieldRefAST | GenericTypeDeclAST | AssignAST | DeclAST | DeclAndInitAST | IfAST | WhileAST | SemicolonAST | ReturnAST | ArgsAST | BinOpAST | UnaryOpAST | FunctionDeclarationAST | FunctionCallAST | ClassAST | ConstructorCallAST | MethodCallAST | DebuggerAST | TCDebuggerAST | NoopAST | MkEmptyRenderGrid | MkRenderGridPixel | ModifierAST;
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
export declare let program_prs: () => Parser;
export declare let global_calling_context: CallingContext;
export declare let ast_to_type_checker: (_: ParserRes) => (_: CallingContext) => CSharp.Stmt;
