import * as Immutable from "immutable"
import {Option, fun, Prod, apply, curry, id, inl, inr, unit, Unit} from "ts-bccc"
import * as CCC from "ts-bccc"
import { option_to_array, some, none } from "./ccc_aux";

export type LineIndentationStep = { kind:"indent" } | { kind:"line", v:string } | { kind:"deindent" }
export let line = (l:string) : LineIndentationStep => ({ kind:"line", v:l })
export let INDENT : LineIndentationStep = { kind:"indent" }
export let DEINDENT : LineIndentationStep = { kind:"deindent" }

export let pre_process_indentation = (s:string) : Array<LineIndentationStep> => {
  let split_lines = fun<string, string[]>(s => s.split("\n"))
  let remove_empty_lines = fun<string[], string[]>(ls => ls.filter(l => !/^\s*$/.test(l)))
  let add_blank_prefix_size = fun<string[], Prod<string, number>[]>(ls => ls.map<Prod<string, number>>(
    id<string>().times(fun(l => {
      let res = /^\s*/.exec(l)
      return res != null && res.length > 0 ? res[0].length : 0
    })).f
  ))

  let preprocess_lines = split_lines.then(remove_empty_lines.then(add_blank_prefix_size))
  let lines_with_prefix = apply(preprocess_lines, s)
  let output : Array<LineIndentationStep> = []
  let indentation_depth = Immutable.Stack<[string,number]>()
  for (let i = 0; i < lines_with_prefix.length - 1; i++) {
    let l = lines_with_prefix[i].fst
    let l_ind = lines_with_prefix[i].snd
    if (l_ind < lines_with_prefix[i+1].snd) {
      indentation_depth = indentation_depth.push([l,lines_with_prefix[i+1].snd])
      output.push(line(l))
      output.push(INDENT)
    } else if (l_ind > lines_with_prefix[i+1].snd) {
      output.push(line(l))
      let target_depth = lines_with_prefix[i+1].snd
      // should keep popping * deindenting until <= lines_with_prefix[i+1][1]
      while (!indentation_depth.isEmpty() && indentation_depth.peek()[1] > target_depth) {
        indentation_depth = indentation_depth.pop()
        output.push(DEINDENT)
      }
    } else {
      output.push(line(l))
    }
  }
  output.push(line(lines_with_prefix[lines_with_prefix.length-1].fst))
  output = output.concat(Immutable.Repeat(DEINDENT, indentation_depth.count()).toArray())
  return output
}

export let tokenize = <Token>(lines:Array<LineIndentationStep>, newline:(_:CCC.Unit) => Token, indent:(_:CCC.Unit) => Token, deindent:(_:CCC.Unit) => Token, parse_token:(_:string) => Option<Token>) : Option<Array<Token>> => {
  try {
    let line_words = lines.map<Array<Token>>(l =>
      (l.kind == "indent" ? [indent(CCC.unit().f({}))]
      : l.kind == "deindent" ? [deindent(CCC.unit().f({}))]
      : Array<Token>().concat(...l.v.split(/\s+/g).filter(s => /^\s*$/g.test(s) == false).map(w =>
        {
          let t = parse_token(w)
          console.log(`Parsed token ${w} to ${JSON.stringify(t.value)}`)
          if (t.kind == "right") {
            console.log(`Cannot parse token ${w}`)
            throw `Cannot parse token ${w}`
          }
          return t
        }
      ).map(mt => option_to_array(mt)))).concat([newline({})])
    )
    return apply(some<Array<Token>>(),(Array<Token>().concat(...line_words)))
  } catch (error) {
    return apply(none<Array<Token>>(), {})
  }
}
