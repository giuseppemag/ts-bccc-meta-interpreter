"use strict";
// import * as Jison from 'jison'
// import * as fs from 'fs'
// import * as path from 'path'
// import { List } from 'immutable'
// import { AST, ParserRes, AssignAST } from '../CSharpTypeChecker/csharp';
// import * as Sem from "../Python/python"
// import { Sum, apply, inl, co_error, co_unit } from 'ts-bccc';
// import { zero_range, mk_ref_val, mk_float_val, empty_memory_rt, Val } from '../main';
// import { decl_v_rt } from '../Python/memory'
// type Result<T, E> =
//   | { kind: 'succeed', value: T }
//   | { kind: 'fail'   , value: E }
// const succeed = <T, E> (x: T): Result<T, E> => ({ kind: 'succeed', value: x })
// const fail    = <T, E> (x: E): Result<T, E> => ({ kind: 'fail',    value: x })
// const INDENT_TOKEN = 'TOKEN_INDENT'
// const DEDENT_TOKEN = 'TOKEN_DEDENT'
// const make_pre_processor = (force_indent: "no" | number) => (source: string): Result<string, string> => {
//   const only_whitespace = (str: string) => ! /\S/.test(str)
//   const lines = source.split(/\r\n|\r|\n/)
//   let output: string[] = []
//   let previous_indentation_level = 0
//   let unclosed_indents = 0
//   for (let l = 0; l < lines.length; l++) {
//     const line = lines[l];
//     const current_indentation = line.search(/\S|$/)
//     if (only_whitespace(line)) {
//       output.push(line);
//       continue
//     }
//     if (force_indent !== "no" && current_indentation % force_indent !== 0) {
//       return fail(`Malformed indent at line index: ${l}`)
//     }
//     if (current_indentation > previous_indentation_level) {
//       output.push(INDENT_TOKEN + " " + line)
//       unclosed_indents += 1
//     } else if (current_indentation < previous_indentation_level) {
//       output.push(DEDENT_TOKEN + " " + line)
//       unclosed_indents -= 1
//     } else {
//       output.push(line)
//     }
//     previous_indentation_level = current_indentation
//   }
//   while (unclosed_indents > 0) {
//     output.push(DEDENT_TOKEN)
//     unclosed_indents -= 1
//   }
//   return succeed(output.join("\n"))
// }
// const assignment = (ast: AssignAST) =>
//   ast_to_sem(ast.r).then(val =>
//     (ast.l.ast.kind == "id")
//       ? decl_v_rt(ast.l.ast.value, val)
//       : Sem.done_rt )
// const bin_op = (op: "+" | "-" | "*" | "/") => (a: Sem.StmtRt, b: Sem.StmtRt): Sem.StmtRt =>
//   a.then(a_v =>
//   b.then(b_v =>{
//     if (a_v.value.k === "f" || b_v.value.k === "f") {
//       let a_f = a_v.value.v as number
//       let b_f = b_v.value.v as number
//       switch (op) {
//         case "+": return co_unit(apply(inl(), mk_float_val(a_f + b_f)))
//         case "-": return co_unit(apply(inl(), mk_float_val(a_f - b_f)))
//         case "/": return co_unit(apply(inl(), mk_float_val(a_f / b_f)))
//         case "*": return co_unit(apply(inl(), mk_float_val(a_f * b_f)))
//       }
//     }
//     return co_error({message: `Cannot add ${a_v.value.k} and ${b_v.value.k}`, range: zero_range})
//   }))
// const ast_to_sem = (res: ParserRes): Sem.StmtRt =>
//   res.ast.kind == "+" ?
//     bin_op('+')(ast_to_sem(res.ast.l), ast_to_sem(res.ast.r))
//   : res.ast.kind == "-" ?
//     bin_op('-')(ast_to_sem(res.ast.l), ast_to_sem(res.ast.r))
//   : res.ast.kind == "*" ?
//     bin_op('*')(ast_to_sem(res.ast.l), ast_to_sem(res.ast.r))
//   : res.ast.kind == "/" ?
//     bin_op('/')(ast_to_sem(res.ast.l), ast_to_sem(res.ast.r))
//   : res.ast.kind == "=" ?
//     assignment(res.ast)
//   : res.ast.kind == "id" ?
//     Sem.get_v_rt(res.range, res.ast.value)
//   : res.ast.kind == "float" ?
//     Sem.float_expr(res.ast.value)
//   : co_error({message: `Unsupported AST Node: ${res.ast.kind}`, range: zero_range})
// const filename = path.join(__dirname, "..", "..", "python_parser", "python.bison")
// const grammar = fs.readFileSync(filename)
// const parser = new Jison.Parser(grammar.toString())
// const pre_processor = make_pre_processor(2)
// const result = pre_processor(`x = 10+1*1+5`)
// if (result.kind == "fail") {
//   console.log(`Preprocessing failed with: ${result.value}`)
// } else {
//   const pre_processed_source = result.value
//   const parse_res = parser.parse(pre_processed_source) as ParserRes
//   const ast = ast_to_sem(parse_res)
//   const memrt = ast.run.f(empty_memory_rt(_ => true))
//   console.log(JSON.stringify(memrt, undefined, 2))
// }
