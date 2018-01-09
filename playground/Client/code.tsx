import * as React from "react"
import { DebuggerStream, get_stream, RenderGrid, Scope, mk_range, SourceRange, Bindings, TypeInformation, Type } from 'ts-bccc-meta-compiler'

import {
  UrlTemplate, application, get_context, Route, Url, make_url, fallback_url, link_to_route,
  Option, C, Mode, unit, bind, string, number, bool, button, selector, multi_selector, label, h1, h2, div, form, image, link, file, overlay,
  custom, repeat, all, any, lift_promise, retract, delay,
  simple_menu, mk_menu_entry, mk_submenu_entry, MenuEntry, MenuEntryValue, MenuEntrySubMenu,
  rich_text, paginate, Page, list, editable_list, simple_application, some, none
} from 'monadic_react'

import * as MonadicReact from 'monadic_react'

let render_render_grid = (grid: RenderGrid): JSX.Element => {
  return <canvas width={128} height={128} ref={canvas => {
    if (canvas == null) return
    let maybe_ctx = canvas.getContext("2d")
    if (maybe_ctx == null) return
    let ctx = maybe_ctx
    let w = grid.width
    let h = grid.height
    let cell_w = canvas.width / w
    let cell_h = canvas.height / h
    let pixels = grid.pixels
    pixels.forEach((col, x) => {
      if (col == undefined || x == undefined) return
      col.forEach(y => {
        if (y == undefined) return
        ctx.fillRect(x * cell_w, y * cell_h, cell_w, cell_h)
      })
    })
  }} />
}

let find_start_line_from_range = (source: string, range: SourceRange): string => {
  let rows = source.split("\n")
  if (range.start.row >= rows.length) {
    return "Range out of bound. [" + JSON.stringify(range) + "]"
  }
  return rows[range.start.row];
}

let render_scope = (scope: Scope, source: string): JSX.Element[] => {
  return scope.map((v, k) => {
    if (v == undefined || k == undefined) return <tr />
    return <tr className="debugger__row" key={`scope-${k}`}>
      <td className="debugger__cell debugger__cell--variable">{k}</td>
      <td className="debugger__cell debugger__cell--value">{v.k == "u" ? "()" :
        v.k == "i" ? v.v :
          v.k == "render-grid" ? render_render_grid(v.v) :
            v.k == "lambda" ? find_start_line_from_range(source, v.v.range).trim().replace("{", "") + "{ ... }" :

              JSON.stringify(v.v)}</td>
    </tr>
  }).toArray()
}

let binding_to_string = (binding_type: Type): string => {
  switch (binding_type.kind) {
    case "render-grid-pixel":
    case "render-grid":
    case "unit":
    case "bool":
    case "int":
    case "float":
    case "string":
      return binding_type.kind
    case "obj":
      return binding_type.kind
    case "fun":
      return binding_to_string(binding_type.in) + " => " +
        binding_to_string(binding_type.out)
    case "ref":
      return binding_type.kind + "(" + binding_type.C_name + ")"
    case "arr":
      return binding_to_string(binding_type.arg) + "[]"
    case "tuple":
      return "(" + binding_type.args.map(binding_to_string).join(",") + ")"
    default:
      return JSON.stringify(binding_type)
  }
}

let render_bindings = (bindings: Bindings, select_code: (_: SourceRange) => void): JSX.Element[] => {
  return bindings.map((b, name) => b == undefined || name == undefined ? <div /> :
    <div onMouseOver={() => {
      //todo push the range of the declaration for text highliting
    }}> {name} : {binding_to_string(b)} </div>).toArray()
}

let render_debugger_stream = (stream: DebuggerStream, source: string, select_code: (_: SourceRange) => void): JSX.Element => {
  let state = stream.show()
  let style = { width: "50%", height: "610px", float: "right", color: "white" }
  if (state.kind == "message") {
    // console.log("render_debugger_stream-message", state.message)
    return <div style={style}>{state.message}</div>
  } else if (state.kind == "bindings") {
    // console.log("render_debugger_stream-bindings", state.state)
    return <div style={style}>{render_bindings(state.state.bindings, select_code)}</div>
  }

  // console.log("render_debugger_stream-memory..", state.memory)
  return <div style={style} key="debugger-stream">
    <table>
      <tbody>
        {render_scope(state.memory.globals, source)}
        <tr className="debugger__row" key="stack">
          <td className="debugger__cell debugger__cell--variable">Stack </td>
          <td className="debugger__cell debugger__cell--value">
            {state.memory.stack.toArray().map((stack_frame, i) =>
              <table key={`stack-frame-${i}`} className="debugger__table debugger__table--inception">
                <tbody>
                  {render_scope(stack_frame, source)}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
}
let render_code = (code: string, stream: DebuggerStream): JSX.Element => {
  let state = stream.show()
  let highlighting = state.kind == "memory" ? state.memory.highlighting
    : state.kind == "bindings" ? state.state.highlighting
      : mk_range(-10, 0, 0, 0)
  let lines = code.split("\n")
  return <div style={{ fontFamily: "monospace", width: "48%", float: "left", whiteSpace: "pre-wrap" }}>
    {

      lines.map((line, line_index) => <div style={{
        color: highlighting.start.row == line_index ? "black" : "white",
        background: highlighting.start.row == line_index ? 'rgb(255,255,153)' : 'none'
      }} >{line}</div>)
    }
  </div>
}

interface CodeComponentProps { code: string, set_content: (_: string) => void, mode: Mode }
// content={content} set_content={c => k(() => {})(c)} mode={mode}
export class CodeComponent extends React.Component<CodeComponentProps, {}> {
  constructor(props: CodeComponentProps, context: any) {
    super(props, context)
    this.state = {}
  }

  shouldComponentUpdate(new_props: CodeComponentProps) {
    return new_props.code != this.props.code
  }

  render() {
    return simple_application<string>(code_editor(this.props.mode)(this.props.code), new_content => this.props.set_content(new_content))
  }
}

let code_editor = (mode: Mode): (code: string) => C<string> => {
  type CodeEditorState = { code: string, stream: DebuggerStream, step_index: number, editing: boolean, last_update: "internal" | "code" | "step" | "config" }
  return code => repeat<CodeEditorState>("main-repeat")(
    any<CodeEditorState, CodeEditorState>("main-any")([
      s => s.editing ? retract<CodeEditorState, string>("source-editor-retract")(s => s.code, s => c => ({ ...s, code: c, last_update: "internal" }),
        c => custom<string>("source-editor-textarea")(
          _ => k =>
            <textarea value={c}
              onChange={e => k(() => { })(e.currentTarget.value)}
              style={{ fontFamily: "monospace", width: !s.editing ? "45%" : "100%", height: "600px", overflowY: "scroll", float: "left" }} />
        ))(s)
        : custom<{}>("source-editor-textarea")(_ => _ => render_code(s.code, s.stream)).never("source-editor-textarea-never"),
      s => s.editing ? unit({}).never() : custom<CodeEditorState>(`source-editor-state-step-${s.step_index}`)(
        _ => k => render_debugger_stream(s.stream, s.code, (range: SourceRange) => { })
      ).never("source-editor-state-step-never"),
      s => s.editing ? unit({}).never() : button<{}>("Next", s.stream.kind != "step", `button-next`, "button button--primary button--small editor__suggestion")({}).then("state-next-button", _ =>
        unit<CodeEditorState>({ ...s, stream: s.stream.kind == "step" ? s.stream.next() : s.stream, step_index: s.step_index + 1, last_update: "step" })),
      s => s.editing ? unit({}).never() : button<{}>("Reset", false, `button-next`, "button button--primary button--small editor__suggestion")({}).then("state-reset-button", _ =>
        unit<CodeEditorState>({ ...s, editing: false, stream: get_stream(s.code), step_index: 0, last_update: "code" })),
      s => !s.editing ? unit({}).never() : button<{}>("Reload", false, `button-next`, "button button--primary button--small editor__suggestion")({}).then("state-reload-button", _ =>
        unit<CodeEditorState>({ ...s, editing: false, stream: get_stream(s.code), step_index: 0, last_update: "code" })),
      s => mode == "edit" && s.editing ? unit({}).never() : retract<CodeEditorState, boolean>("source-editor-toggle-editing-retract")(s => s.editing, s => e => ({ ...s, editing: e, last_update: "config" }),
        e => button<boolean>("Edit", false, `button-edit`, "button button--primary button--small editor__suggestion")(!e))(s)
    ])
  )({ code: code, stream: get_stream(code), step_index: 0, editing: false, last_update: "code" }).filter(s => s.last_update == "code", "code-editor-filter").map(s => s.code, "code-editor-map")
}