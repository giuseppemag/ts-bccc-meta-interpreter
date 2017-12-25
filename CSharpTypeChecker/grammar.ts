import * as Immutable from "immutable"
import { fun, Prod, apply, curry, id, inl, inr, unit, Option, Sum, Unit, Fun, distribute_sum_prod, swap_prod, snd, fst, defun } from "ts-bccc"
import { SourceRange } from "../source_range";
import * as Lexer from "../lexer";
import { some, none, option_plus } from "../ccc_aux"

export type Token = { kind:"Newline"} | { kind:"Indent"} | { kind:"Deindent"}
  | { kind:"int", v:number } | { kind:"float", v:number }
  | { kind:"if" } | { kind:"then" } | { kind:"else" }
  | { kind:"identifier", v:string }
  | { kind:"=" }

let newline:Token = ({ kind:"Newline" })
let indent:Token = ({ kind:"Indent" })
let deindent:Token = ({ kind:"Deindent" })
let int : (_:string) => Option<Token>
        = s => !/^[0-9]+$/.test(s) ? none<Token>().f({}) : some<Token>().f({ kind:"int", v:parseInt(s) })
let float : (_:string) => Option<Token>
        = s => !/^[0-9]+.[0-9]+$/.test(s) ? none<Token>().f({}) : some<Token>().f({ kind:"float", v:parseFloat(s) })
let _if : (_:string) => Option<Token>
        = s => !/^if$/.test(s) ? none<Token>().f({}) : some<Token>().f({ kind:"if" })
let _eq : (_:string) => Option<Token>
        = s => !/^=$/.test(s) ? none<Token>().f({}) : some<Token>().f({ kind:"=" })
let _then : (_:string) => Option<Token>
        = s => !/^then$/.test(s) ? none<Token>().f({}) : some<Token>().f({ kind:"then" })
let _else : (_:string) => Option<Token>
        = s => !/^else$/.test(s) ? none<Token>().f({}) : some<Token>().f({ kind:"else" })
let identifier : (_:string) => Option<Token>
        = s => !/^[a-zA-Z][a-zA-Z0-9]*$/.test(s) ? none<Token>().f({}) : some<Token>().f({ kind:"identifier", v:s })

export let tokenize = (source:string) => Lexer.tokenize<Token>(Lexer.pre_process_indentation(source),
  _ => newline, _ => indent, _ => deindent,
  defun(
    option_plus<string, Token>(fun(int),
    option_plus<string, Token>(fun(float),
    option_plus<string, Token>(fun(_if),
    option_plus<string, Token>(fun(_eq),
    option_plus<string, Token>(fun(_then),
    option_plus<string, Token>(fun(_else),
  fun(identifier)))))))))


// type _int = { kind: "_int", value: number }
// type AST = _int |
//   { kind: "_plus", left: AST, right: AST }
