import * as Electron from "electron"
import * as MonadicReact from 'monadic_react'
import * as FS from "fs"
import * as Path from "path"
import * as React from "react"
import * as ReactDOM from "react-dom"
import * as Moment from 'moment'
import * as i18next from 'i18next'
import * as Immutable from "immutable"
import { List, Map, Set, Range } from "immutable"
import { DebuggerStream, get_stream, RenderGrid, Scope, mk_range, SourceRange, Bindings, TypeInformation, Type } from 'ts-bccc-meta-compiler'
import { MarkupComponent } from "./markup"
import { GraphComponent } from "./graph"
import { CodeComponent } from './code'
import { TextComponent } from './text'
import { TitleComponent } from './title'

import {
  UrlTemplate, application, get_context, Route, Url, make_url, fallback_url, link_to_route,
  Option, C, Mode, unit, bind, string, number, bool, button, selector, multi_selector, label, h1, h2, div, form, image, link, file, overlay,
  custom, repeat, all, any, lift_promise, retract, delay,
  simple_menu, mk_menu_entry, mk_submenu_entry, MenuEntry, MenuEntryValue, MenuEntrySubMenu,
  rich_text, paginate, Page, list, editable_list, simple_application, some, none
} from 'monadic_react'

let dialog = Electron.remote.dialog
 
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
  type BlockKind = "markdown" | "latex" | "image" | "code" | "graph" | "text" | "title"
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
    }],
    ["text", {
      kind: "text", default_content: "", renderer: div<ActualDocumentBlockData,string>("go-slide-text")((block_data: ActualDocumentBlockData) => 
      custom<string>()(
        _ => k => <TextComponent content={block_data.content} set_content={c => k(() => { })(c)} mode={mode} />))
    }],
    ["title", {
      kind: "title", default_content: "", renderer: div<ActualDocumentBlockData,string>("go-slide-text")((block_data: ActualDocumentBlockData) => 
      custom<string>()(
        _ => k => <TitleComponent content={block_data.content} set_content={c => k(() => { })(c)} mode={mode} />))
    }],
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
