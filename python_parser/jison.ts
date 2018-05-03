import * as Jison from 'jison'
import * as fs from 'fs'
import * as path from 'path'
import { List } from 'immutable'

type Result<T, E> =
  | { kind: 'succeed', value: T }
  | { kind: 'fail'   , value: E }

const succeed = <T, E> (x: T): Result<T, E> => ({ kind: 'succeed', value: x })
const fail    = <T, E> (x: E): Result<T, E> => ({ kind: 'fail',    value: x })

const INDENT_TOKEN = 'TOKEN_INDENT'
const DEDENT_TOKEN = 'TOKEN_DEDENT'

const make_pre_processor = (force_indent: "no" | number) => (source: string): Result<string, string> => {
  const only_whitespace = (str: string) => ! /\S/.test(str) 
  const lines = source.split(/\r\n|\r|\n/)
  let output: string[] = []
  let previous_indentation_level = 0
  let unclosed_indents = 0
  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    const current_indentation = line.search(/\S|$/)
    if (only_whitespace(line)) { 
      output.push(line); 
      continue 
    }
    if (force_indent !== "no" && current_indentation % force_indent !== 0) { 
      return fail(`Malformed indent at line index: ${l}`) 
    }
    if (current_indentation > previous_indentation_level) {
      output.push(INDENT_TOKEN + " " + line)
      unclosed_indents += 1
    } else if (current_indentation < previous_indentation_level) {
      output.push(DEDENT_TOKEN + " " + line)
      unclosed_indents -= 1
    } else {
      output.push(line)
    }
    previous_indentation_level = current_indentation
  }
  while (unclosed_indents > 0) {
    output.push(DEDENT_TOKEN)
    unclosed_indents -= 1
  }
  return succeed(output.join("\n"))
}

const filename = path.join(__dirname, "..", "..", "python_parser", "python.bison")
const grammar = fs.readFileSync(filename)
const parser = new Jison.Parser(grammar.toString())
const pre_processor = make_pre_processor(2)
console.log(
  JSON.stringify(
    parser.parse(
      pre_processor(`x = 10+1*1+5`).value)));