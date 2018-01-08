import * as Electron from "electron"
let dialog = Electron.remote.dialog
import * as FS from "fs"
import * as Path from "path"
import * as React from "react"
import * as ReactDOM from "react-dom"
import { List, Map, Set, Range } from "immutable"
import * as Immutable from "immutable"
import * as Moment from 'moment'
import * as i18next from 'i18next'
import { DebuggerStream, get_stream, RenderGrid, Scope, mk_range, SourceRange, Bindings, TypeInformation, Type } from 'ts-bccc-meta-compiler'
import { MarkupComponent } from "./markup"
import { GraphComponent } from "./graph"

import {
  UrlTemplate, application, get_context, Route, Url, make_url, fallback_url, link_to_route,
  Option, C, Mode, unit, bind, string, number, bool, button, selector, multi_selector, label, h1, h2, div, form, image, link, file, overlay,
  custom, repeat, all, any, lift_promise, retract, delay,
  simple_menu, mk_menu_entry, mk_submenu_entry, MenuEntry, MenuEntryValue, MenuEntrySubMenu,
  rich_text, paginate, Page, list, editable_list, simple_application, some, none
} from 'monadic_react'

import * as MonadicReact from 'monadic_react'
import { } from "draft-js";

let default_graph = `{
  "Nodes": [
      {"id": 1, "x": 0, "y": 0, "content": "5", "color":"#56ff56", "highlighting":"#56bb56"},
      {"id": 2, "x": 200, "y": 100},
      {"id": 3, "x": 400, "y": 150},
      {"id": 4, "x": 200, "y": 250, "content": "4"},
      {"id": 5, "x": 0, "y": 250, "content": "5"}
  ],
  "Links": [
      {"source_id": 1, "target_id": 2, "type": "arrow", "weight": 20, "color":"#36ff36" },
      {"source_id": 1, "target_id": 5, "type": "arrow", "weight": 20, "color":"#36ff36" },
      {"source_id": 2, "target_id": 3, "type": "arrow", "weight": 60 },
      {"source_id": 4, "target_id": 3, "type": "arrow", "weight": 60 },
      {"source_id": 4, "target_id": 2, "type": "arrow", "weight": 10 },
      {"source_id": 2, "target_id": 4, "type": "arrow", "weight": 10 },
      {"source_id": 5, "target_id": 4, "type": "arrow", "weight": 10 }
  ]
}
`

let default_program = `
int fibonacci(int n) {
  if (n <= 1) {
    debugger;
    return n;
  } else {
    return fibonacci((n-1)) + fibonacci((n-2));
  }
}

int x;
x = fibonacci(5);

RenderGrid g;
int x;
int y;
typechecker_debugger;
g = empty_render_grid 16 16;
x = 0;
while (x < 16) {
  y = 0;
  while (y <= x) {
    if (((y + x) % 2) == 1) {
      g = g + pixel x y true;
      debugger;
    }
    y = y + 1;
  }
  x = x + 1;
}`


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
class CodeComponent extends React.Component<CodeComponentProps, {}> {
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
        unit<CodeEditorState>({ ...s, editing:false, stream: get_stream(s.code), step_index: 0, last_update: "code" })),
      s => !s.editing ? unit({}).never() : button<{}>("Reload", false, `button-next`, "button button--primary button--small editor__suggestion")({}).then("state-reload-button", _ =>
        unit<CodeEditorState>({ ...s, editing:false, stream: get_stream(s.code), step_index: 0, last_update: "code" })),
      s => mode == "edit" && s.editing ? unit({}).never() : retract<CodeEditorState, boolean>("source-editor-toggle-editing-retract")(s => s.editing, s => e => ({ ...s, editing: e, last_update: "config" }),
        e => button<boolean>("Edit", false, `button-edit`, "button button--primary button--small editor__suggestion")(!e))(s)
    ])
  )({ code: code, stream: get_stream(code), step_index: 0, editing: false, last_update: "code" }).filter(s => s.last_update == "code", "code-editor-filter").map(s => s.code, "code-editor-map")
}

interface DocumentBlock<k> { kind: k, renderer: (_: DocumentBlockData<k>) => C<string>, default_content: string }
interface DocumentBlockData<k> { kind: k, content: string, order_by: number }
interface Document<k> { blocks: Immutable.Map<number, DocumentBlockData<k>>, next_key: number }
let serialize_document = function <k>(d: Document<k>): string {
  return JSON.stringify({ ...d, blocks: d.blocks.map((v, k) => ({ value: v, key: k })).toArray() })
}
let deserialize_document = function <k>(d: string): Document<k> {
  let raw_data: { blocks: Array<{ value: DocumentBlockData<k>, key: number }>, next_key: number } = JSON.parse(d)
  return { ...raw_data, blocks: Immutable.Map<number, DocumentBlockData<k>>(raw_data.blocks.map(b => [b.key, b.value])) }
}

let document_editor = (mode: Mode): C<void> => {
  type BlockKind = "markdown" | "latex" | "image" | "code" | "graph"
  type ActualDocumentBlockData = DocumentBlockData<BlockKind>
  type ActualDocumentBlock = DocumentBlock<BlockKind>
  type ActualDocument = Document<BlockKind>

  let raw_blocks: Array<[BlockKind, ActualDocumentBlock]> = [
    ["graph", {
      kind: "graph", default_content: default_graph, renderer: div<ActualDocumentBlockData,string>("go-slide-graph")((block_data: ActualDocumentBlockData) =>
        custom<string>()(
          _ => k => <GraphComponent content={block_data.content} set_content={c => k(() => { })(c)} mode={mode} />)
      )
    }],
    ["code", {
      kind: "code", default_content: default_program, renderer: div<ActualDocumentBlockData,string>("go-slide-latex")((block_data: ActualDocumentBlockData) =>
        custom<string>()(
          _ => k => <CodeComponent code={block_data.content} set_content={c => k(() => { })(c)} mode={mode} />))
    }],
    ["markdown", {
      kind: "markdown", default_content: "", renderer: div<ActualDocumentBlockData,string>("go-slide-markdown")((block_data: ActualDocumentBlockData) =>
        custom<string>()(
          _ => k => <MarkupComponent content={block_data.content} set_content={c => k(() => { })(c)} mode={mode} kind="Markdown" />))
    }],
    ["latex", {
      kind: "latex", default_content: "", renderer: div<ActualDocumentBlockData,string>("go-slide-latex")((block_data: ActualDocumentBlockData) =>
        custom<string>()(
          _ => k => <MarkupComponent content={block_data.content} set_content={c => k(() => { })(c)} mode={mode} kind="LaTeX" />))
    }],
    ["image", {
      kind: "image", default_content: "", renderer: div<ActualDocumentBlockData,string>("go-slide-image")((block_data: ActualDocumentBlockData) => (
        image(mode))(block_data.content))
    }]
  ]
  let blocks = Immutable.Map<BlockKind, ActualDocumentBlock>(raw_blocks)

  interface EditorState { document: ActualDocument, current_path: Option<string> }

  let last_open_file = window.localStorage.getItem("last_open_file")
  let initial_state: EditorState = { document: { blocks: Immutable.Map<number, ActualDocumentBlockData>(), next_key: 1 }, current_path: none<string>() }
  if (last_open_file != null)
    initial_state = { document: deserialize_document(FS.readFileSync(last_open_file, "utf8")), current_path: some<string>(last_open_file) }

  return repeat<EditorState>("document-editor-repeat")(
    any<EditorState, EditorState>("document-editor-main")([
      any<EditorState, EditorState>("document-editor-save-load", "editor__suggestions cf")([
        d => button(`New`, false, `button-new`, "button button--primary button--small editor__suggestion")({}).then(`new-document`, _ => {
          window.localStorage.removeItem("last_open_file")
          return unit<EditorState>({ document: { blocks: Immutable.Map<number, ActualDocumentBlockData>(), next_key: 1 }, current_path: none<string>() })
        }),
        d => button(`Save as`, false, `button-save-as`, "button button--primary button--small editor__suggestion")({}).then(`save-document-as`, _ => {
          return lift_promise(_ => new Promise<EditorState>((resolve, reject) => {
            dialog.showSaveDialog({}, (fileName) => {
              if (fileName === undefined)
                return reject("invalid path")
              window.localStorage.setItem("last_open_file", fileName)
              FS.writeFile(fileName, serialize_document(d.document), (err) => {
                if (err) {
                  reject(err.message)
                } else {
                  resolve(d)
                }
              })
            })
          }), "never")({})
        }),
        d => button(`Load`, false, `button-load`, "button button--primary button--small editor__suggestion")({}).then(`load-document`, _ => {
          return lift_promise(_ => new Promise<EditorState>((resolve, reject) => {
            dialog.showOpenDialog({}, (fileNames) => {
              if (fileNames === undefined || fileNames.length < 1)
                return reject("invalid path")
              window.localStorage.setItem("last_open_file", fileNames[0])
              FS.readFile(fileNames[0], "utf8", (err, buffer) => {
                if (err) {
                  reject(err.message)
                } else {
                  resolve({ document: deserialize_document(buffer), current_path: some<string>(fileNames[0]) })
                }
              })
            })
          }), "never")({})
        }),
        d => button(`Save`, d.current_path.kind == "none", `button-save`, "button button--primary button--small editor__suggestion")({}).then(`save-document`, _ => {
          return lift_promise(_ => new Promise<EditorState>((resolve, reject) => {
            if (d.current_path.kind == "none")
              return reject("invalid path")
            let fileName = d.current_path.value
            FS.writeFile(fileName, serialize_document(d.document), (err) => {
              if (err) {
                reject(err.message)
              } else {
                resolve(d)
              }
            })
          }), "never")({})
        })
      ]),
      retract<EditorState, ActualDocument>("document-editor-document-retract")(e => e.document, e => d => ({ ...e, document: d }),
        d => any<ActualDocument, ActualDocument>("document-editor-blocks")(
          d.blocks.sortBy((v, k) => v && v.order_by).map((b, b_k) => {
            if (!b || !b_k) return _ => unit(null).never<ActualDocument>()
            return any<ActualDocument, ActualDocument>(`block-${b_k}`)([
              d => blocks.get(b.kind).renderer(b).then(`block-renderer`, new_content =>
                unit<ActualDocument>({ ...d, blocks: d.blocks.set(b_k, { ...d.blocks.get(b_k), content: new_content }) })),
              d => button("Del", false, `button-remove`, "button button--primary button--small")({}).then(`block-remove`, _ => unit<ActualDocument>({ ...d, blocks: d.blocks.remove(b_k) })),
              d => button("Up", false, `button-move-up`, "button button--primary button--small")({}).then(`block-move-up`, _ => {
                let predecessors = d.blocks.filter(b1 => { if (!b1) return false; else return b1.order_by < b.order_by })
                if (predecessors.isEmpty()) return unit<ActualDocument>({ ...d })
                let predecessor = predecessors.maxBy(s => s && s.order_by)
                let p_k = d.blocks.findKey(b1 => { if (!b1) return false; else return b1.order_by == predecessor.order_by })

                return unit<ActualDocument>({ ...d, blocks: d.blocks.set(b_k, { ...b, order_by: predecessor.order_by }).set(p_k, { ...predecessor, order_by: b.order_by }) })
              }),
              d => button("Down", false, `button-move-down`, "button button--primary button--small")({}).then(`block-move-down`, _ => {
                let successors = d.blocks.filter(b1 => { if (!b1) return false; else return b1.order_by > b.order_by })
                if (successors.isEmpty()) return unit<ActualDocument>({ ...d })
                let successor = successors.minBy(s => s && s.order_by)
                let s_k = d.blocks.findKey(b1 => { if (!b1) return false; else return b1.order_by == successor.order_by })

                return unit<ActualDocument>({ ...d, blocks: d.blocks.set(b_k, { ...b, order_by: successor.order_by }).set(s_k, { ...successor, order_by: b.order_by }) })
              })
            ])
          }).toArray()
        )(d)),
        retract<EditorState, ActualDocument>("document-editor-add-block-retract")(e => e.document, e => d => ({ ...e, document: d }),
          any<ActualDocument, ActualDocument>("document-editor-add-block", "editor__suggestions cf")(
            raw_blocks.map(rb => (d: ActualDocument) =>
              button(`Add ${rb[1].kind}`, false, `button-add-block-${rb[1].kind}`, "button button--primary editor__suggestion")({}).then(`new-block-${rb[1].kind}`, _ =>
                unit<ActualDocument>({ ...d, next_key: d.next_key + 1, blocks: d.blocks.set(d.next_key, { kind: rb[1].kind, order_by: 1 + d.blocks.toArray().map(b => b.order_by).reduce((a, b) => Math.max(a, b), 0), content: rb[1].default_content }) }))
            )
          ))
    ]
    )
  )(initial_state).never()
}

export function MetaPlayground(): JSX.Element {
  return <div className="go-page go-page--view go-student-player">
    <div className="go-content">
      <div className="go-content-inner go-course">
        <div className="go-chapter">
          <div className="go-lecture-player">
            <div className="go-current-activity">
              <div className="go-activity-container">
                <div className="go-activity-item">
                  <div className="go-slide">
                    {simple_application(document_editor("edit"),
                      _ => { }
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
}

export let HomePage_to = (target_element_id: string) => {
  ReactDOM.render(
    MetaPlayground(),
    document.getElementById(target_element_id)
  )
}
