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
import { DebuggerStream, get_stream, RenderGrid, Scope, mk_range, SourceRange, Bindings, TypeInformation, Type, plus } from 'ts-bccc-meta-compiler'
import { MarkupComponent } from "./markup"
import { GraphComponent } from "./graph"
import { CodeComponent } from './code'
import { TextComponent } from './text'
import { TitleComponent } from './title'

import {
  UrlTemplate, application, get_context, Route, Url, make_url, fallback_url, link_to_route,
  C, Mode, unit, bind, string, number, bool, button, selector, multi_selector, label, h1, h2, div, form, image, link, file, overlay,
  custom, repeat, all, any, lift_promise, retract, delay,
  simple_menu, mk_menu_entry, mk_submenu_entry, MenuEntry, MenuEntryValue, MenuEntrySubMenu,
  rich_text, paginate, Page, list, editable_list, simple_application
} from 'monadic_react'

import { isNullOrUndefined } from "util";
import { Fun, Option, Sum, inr, Unit, inl, fun } from "ts-bccc";

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
    }pecially if you live anywhere near Rotterdam (and if you do not, come take a look at the coolest city ever!), drop us a line and let’s have a chat. Moreover, all we discussed in this article is used in practice: at Hoppinger we build all sorts of cool applications with these techniques, and more.


    y = y + 1;
  }
  x = x + 1;
}`

module Option {
  export let some = function <a> (): Fun<a, Sum<a, Unit>> { return fun(x => inl<a, Unit>().f(x)) }
  export let none = function <a> ():     Fun<Unit, Sum<a, Unit>> { return fun(x => inr<a, Unit>().f(x)) }
  export let visit = function <a, b> (onSome: Fun<a, b>, onNone: Fun<Unit, b>): Fun<Sum<a, Unit>, b> { 
    return fun(x => x.kind == "left" ? onSome.f(x.value) : onNone.f(x.value)) 
  }
} 

type Tuple<T1, T2> = [T1, T2]

interface AbstractDocumentBlock<k> { kind: k, renderer: (_: AbstractDocumentBlockData<k>) => C<string>, default_content: string }
interface AbstractDocumentBlockData<k> { kind: k, content: string, order_by: number }
interface AbstractDocument<k> { blocks: Immutable.Map<number, AbstractDocumentBlockData<k>> }
interface AbstractDocumentCollection<l, k> { documents: Immutable.Map<l, AbstractDocument<k>> }

let serialize_document = <l, k>(d: AbstractDocumentCollection<l, k>): string => { 
  let s: Array<Tuple<l, Array<Tuple<number, AbstractDocumentBlockData<k>>>>> = d.documents.map((ovu, oku) => {
    let ok = oku as l
    let ov = ovu as AbstractDocument<k>
    return [ok, ov.blocks.map((ivu, iku) => {
      let ik = iku as number
      let iv = ivu as AbstractDocumentBlockData<k>
      return [ik, iv]
    }).toArray()]
  }).toArray()
  return JSON.stringify(s)
}

let deserialize_document = function <l, k>(d: string): AbstractDocumentCollection<l, k> { }

let document_editor = (mode: Mode): C<void> => {
  type BlockKind = "markdown" | "latex" | "image" | "code" | "graph" | "text" | "title"
  type DocumentBlockData = AbstractDocumentBlockData<BlockKind>
  type DocumentBlock = AbstractDocumentBlock<BlockKind>
  type Document = AbstractDocument<BlockKind>
  type DocumentLanguage = "en" | "nl"
  type DocumentCollection = AbstractDocumentCollection<DocumentLanguage, BlockKind>
  let DocumentCollectionNew = (): DocumentCollection => ({ documents: Immutable.Map([{ document: { blocks: Immutable.Map<number, DocumentBlockData>() } }]) })

  let raw_blocks: Array<[BlockKind, DocumentBlock]> = [
    ["graph", {
      kind: "graph", default_content: default_graph, renderer: div<DocumentBlockData, string>("go-slide-graph")((block_data: DocumentBlockData) =>
        custom<string>()(
          _ => k => <GraphComponent content={block_data.content} set_content={c => k(() => { })(c)} mode={mode} />)
      )
    }],
    ["code", {
      kind: "code", default_content: default_program, renderer: div<DocumentBlockData, string>("go-slide-latex")((block_data: DocumentBlockData) =>
        custom<string>()(
          _ => k => <CodeComponent code={block_data.content} set_content={c => k(() => { })(c)} mode={mode} />))
    }],
    ["markdown", {
      kind: "markdown", default_content: "", renderer: div<DocumentBlockData, string>("go-slide-markdown")((block_data: DocumentBlockData) =>
        custom<string>()(
          _ => k => <MarkupComponent content={block_data.content} set_content={c => k(() => { })(c)} mode={mode} kind="Markdown" />))
    }],
    ["latex", {
      kind: "latex", default_content: "", renderer: div<DocumentBlockData, string>("go-slide-latex")((block_data: DocumentBlockData) =>
        custom<string>()(
          _ => k => <MarkupComponent content={block_data.content} set_content={c => k(() => { })(c)} mode={mode} kind="LaTeX" />))
    }],
    ["image", {
      kind: "image", default_content: "", renderer: div<DocumentBlockData, string>("go-slide-image")((block_data: DocumentBlockData) => (
        image(mode))(block_data.content))
    }],
    ["text", {
      kind: "text", default_content: "", renderer: div<DocumentBlockData, string>("go-slide-text")((block_data: DocumentBlockData) =>
        custom<string>()(
          _ => k => <TextComponent content={block_data.content} set_content={c => k(() => { })(c)} mode={mode} />))
    }],
    ["title", {
      kind: "title", default_content: "", renderer: div<DocumentBlockData, string>("go-slide-text")((block_data: DocumentBlockData) =>
        custom<string>()(
          _ => k => <TitleComponent content={block_data.content} set_content={c => k(() => { })(c)} mode={mode} />))
    }],
  ]
  let blocks = Immutable.Map<BlockKind, DocumentBlock>(raw_blocks)

  interface EditorState { collection: DocumentCollection, language: Option<DocumentLanguage>, current_path: Option<string> }

  let last_open_file = window.localStorage.getItem("last_open_file")
  
  let initial_state: EditorState = { 
    collection: DocumentCollectionNew(), 
    language: Option.none<DocumentLanguage>().f({}), 
    current_path: Option.none<string>().f({}) }

  if (last_open_file != null)
    initial_state = { 
      collection: deserialize_document(FS.readFileSync(last_open_file, "utf8")), 
      language: Option.none<DocumentLanguage>().f({}), 
      current_path: Option.some<string>().f(last_open_file) }

  return repeat<EditorState>("document-editor-repeat")(
    any<EditorState, EditorState>("document-editor-main")([
      any<EditorState, EditorState>("document-editor-save-load", "editor__suggestions cf")([
        d => button(`New`, false, `button-new`, "button button--primary button--small editor__suggestion")({}).then(`new-document`, _ => {
          window.localStorage.removeItem("last_open_file")
          return unit<EditorState>({ collection: { documents: Immutable.Map() }, language: inr<DocumentLanguage, Unit>().f({}), current_path: inr<string, Unit>().f({}) })
        }),
        d => button(`Save as`, false, `button-save-as`, "button button--primary button--small editor__suggestion")({}).then(`save-document-as`, _ => {
          return lift_promise(_ => new Promise<EditorState>((resolve, reject) => {
            dialog.showSaveDialog({}, (fileName) => {
              if (fileName === undefined)
                return reject("invalid path")
              window.localStorage.setItem("last_open_file", fileName)
              FS.writeFile(fileName, serialize_document(d.collection), (err) => {
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
                  resolve({ collection: deserialize_document(buffer), language: Option.none<DocumentLanguage>().f({}), current_path: Option.some<string>().f(fileNames[0]) })
                }
              })
            })
          }), "never")({})
        }),
        d => button(`Save`, d.current_path.kind == "right", `button-save`, "button button--primary button--small editor__suggestion")({}).then(`save-document`, _ => {
          return lift_promise(_ => new Promise<EditorState>((resolve, reject) => {
            if (d.current_path.kind == "right")
              return reject("invalid path")
            let fileName = d.current_path.value
            FS.writeFile(fileName, serialize_document(d.collection), (err) => {
              if (err) {
                reject(err.message)
              } else {
                resolve(d)
              }
            })
          }), "never")({})
        })
      ]),
      es => Option.visit<DocumentLanguage, (_: EditorState) => C<EditorState>>(
        fun(language => retract<EditorState, Document>("document-editor-document-retract")(
          e => e.collection.documents.get(language), 
          e => d => ({ ...e, collection: { documents: e.collection.documents.set(language, d) } }),
          d => any<Document, Document>("document-editor-blocks")(
            d.blocks.sortBy((v, k) => v && v.order_by).map((b, b_k) => {
              if (!b || !b_k) return _ => unit(null).never<Document>()
              return any<Document, Document>(`block-${b_k}`)([
                d => blocks.get(b.kind).renderer(b).then(`block-renderer`, new_content =>
                  unit<Document>({ ...d, blocks: d.blocks.set(b_k, { ...d.blocks.get(b_k), content: new_content }) })),
                d => button("Del", false, `button-remove`, "button button--primary button--small")({}).then(`block-remove`, _ => unit<Document>({ ...d, blocks: d.blocks.remove(b_k) })),
                d => button("Up", false, `button-move-up`, "button button--primary button--small")({}).then(`block-move-up`, _ => {
                  let predecessors = d.blocks.filter(b1 => { if (!b1) return false; else return b1.order_by < b.order_by })
                  if (predecessors.isEmpty()) return unit<Document>({ ...d })
                  let predecessor = predecessors.maxBy(s => s && s.order_by)
                  let p_k = d.blocks.findKey(b1 => { if (!b1) return false; else return b1.order_by == predecessor.order_by })
  
                  return unit<Document>({ ...d, blocks: d.blocks.set(b_k, { ...b, order_by: predecessor.order_by }).set(p_k, { ...predecessor, order_by: b.order_by }) })
                }),
                d => button("Down", false, `button-move-down`, "button button--primary button--small")({}).then(`block-move-down`, _ => {
                  let successors = d.blocks.filter(b1 => { if (!b1) return false; else return b1.order_by > b.order_by })
                  if (successors.isEmpty()) return unit<Document>({ ...d })
                  let successor = successors.minBy(s => s && s.order_by)
                  let s_k = d.blocks.findKey(b1 => { if (!b1) return false; else return b1.order_by == successor.order_by })
  
                  return unit<Document>({ ...d, blocks: d.blocks.set(b_k, { ...b, order_by: successor.order_by }).set(s_k, { ...successor, order_by: b.order_by }) })
                })
              ])
            }).toArray()
          )(d))),
        fun(_ => div<EditorState, EditorState>()( m => string("view")("hello").ignore_with(m)))
      ).f(es.language)(es),
      es => Option.visit<DocumentLanguage, (_: EditorState) => C<EditorState>>(
        fun(language => retract<EditorState, Document>("document-editor-add-block-retract")(
          e => e.collection.documents.get(language), 
          e => d => ({ ...e, collection: { documents: e.collection.documents.set(language, d) } }),
          any<Document, Document>("document-editor-add-block", "editor__suggestions cf")(
            raw_blocks.map(rb => (d: Document) =>
              button(`Add ${rb[1].kind}`, false, `button-add-block-${rb[1].kind}`, "button button--primary editor__suggestion")({}).then(`new-block-${rb[1].kind}`, _ =>
                unit<Document>({ ...d, blocks: d.blocks.set(d.blocks.keySeq().count() > 0 ? d.blocks.keySeq().max() + 1 : 0, { kind: rb[1].kind, order_by: 1 + d.blocks.toArray().map(b => b.order_by).reduce((a, b) => Math.max(a, b), 0), content: rb[1].default_content }) }))
            )
          ))),
        fun(_ =>  div<EditorState, EditorState>()( m => string("view")("hello").ignore_with(m)))
      ).f(es.language)(es)
      
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
