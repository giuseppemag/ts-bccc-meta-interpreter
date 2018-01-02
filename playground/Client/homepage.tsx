import * as React from "react"
import * as ReactDOM from "react-dom"
import {List, Map, Set, Range} from "immutable"
import * as Immutable from "immutable"
import * as Moment from 'moment'
import * as i18next from 'i18next'
import { DebuggerStream, get_stream } from 'ts-bccc-meta-interpreter'

import {UrlTemplate, application, get_context, Route, Url, make_url, fallback_url, link_to_route,
Option, C, Mode, unit, bind, string, number, bool, button, selector, multi_selector, label, h1, h2, div, form, image, link, file, overlay,
custom, repeat, all, any, lift_promise, retract, delay,
simple_menu, mk_menu_entry, mk_submenu_entry, MenuEntry, MenuEntryValue, MenuEntrySubMenu,
rich_text, paginate, Page, list, editable_list, simple_application} from 'monadic_react'

import * as MonadicReact from 'monadic_react'
import { Scope, RenderGrid } from "ts-bccc-meta-interpreter/dist/Python/python";
import { mk_range } from "ts-bccc-meta-interpreter/dist/source_range";
import { highlight } from "ts-bccc-meta-interpreter/dist/CSharpTypeChecker/csharp";

let default_program = `int fibonacci(int n) {
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


let render_render_grid = (grid:RenderGrid) : JSX.Element => {
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
    pixels.forEach((col,x) => {
      if (col == undefined || x == undefined) return
      col.forEach(y => {
        if (y == undefined) return
        ctx.fillRect(x*cell_w,y*cell_h, cell_w,cell_h)
      })
    })
  }} />
}

let render_scope = (scope:Scope) : JSX.Element[] => {
  return scope.map((v,k) => {
          if (v == undefined || k == undefined) return <tr/>
          return <tr key={k}>
            <td>{k}</td>
            <td>{v.k == "u" ? "()" :
                 v.k == "i" ? v.v :
                 v.k == "render-grid" ? render_render_grid(v.v) :
                 JSON.stringify(v.v) }</td>
          </tr>
         }).toArray()
}

let render_debugger_stream = (stream:DebuggerStream) : JSX.Element => {
  let state = stream.show()
  let style={width:"50%", height:"610px", float:"right"}
  if (state.kind == "message") {
    return <div style={style}>{state.message}</div>
  } else if (state.kind == "bindings") {
    return <div style={style}>{JSON.stringify(state.state)}</div>
  }
  return <div style={style}>
          <table>
            <tbody>
              { render_scope(state.memory.globals) }
              {
                state.memory.stack.toArray().map((stack_frame, i) =>
                  <tr key={i}>
                    <td>Stack frame {i}</td>
                    <td>
                      <table>
                        <tbody>
                          { render_scope(stack_frame) }
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )
              }
            </tbody>
         </table>
        </div>
}

let render_code = (code:string, stream:DebuggerStream) : JSX.Element => {
  let state = stream.show()
  let highlighting = state.kind == "memory" ? state.memory.highlighting
                   : state.kind == "bindings" ? state.state.highlighting
                   : mk_range(-10,0,0,0)
  return <div style={{ fontFamily: "monospace", width:"45%", height:"600px", overflowY:"scroll", float:"left" }}>
           <canvas ref={canvas => {
              if (!canvas) return
              let raw_ctx = canvas.getContext("2d")
              if (!raw_ctx) return
              let ctx = raw_ctx

              canvas.width = window.innerWidth * 40 / 100
              canvas.height = 2000
              ctx.translate(0.5, 0.5)
              ctx.imageSmoothingEnabled = false

              let font_size = 18
              ctx.font = `${font_size}px monospace`

              let offset_x = 15
              let offset_y = 15
              let lines = code.split("\n")
              let char_width = ctx.measureText(" ").width

              lines.forEach((line, line_index) => {
                ctx.fillText(line, offset_x, (font_size * 110 / 100) * line_index + offset_y)
              })

              ctx.fillStyle = 'rgba(205, 205, 255, 0.5)'
              console.log("???", lines[highlighting.start.row], (font_size * 110 / 100) * highlighting.start.row + offset_y, highlighting.start.row, offset_y)
              ctx.fillRect(offset_x, (font_size * 110 / 100) * (highlighting.start.row - 1) + offset_y + (font_size * 25) / 100,
                  ctx.measureText(lines[highlighting.start.row]).width, font_size * 110 / 100)
           } } />
         </div>
}

export function HomePage() : JSX.Element {
  type AppState = { code:string, stream:DebuggerStream, step_index:number, editing:boolean }
  return <div>
    <h1>Giuseppe's little meta-playground</h1>

    {simple_application(
      repeat<AppState>("main-repeat")(
        any<AppState, AppState>("main-any")([
          s => s.editing ? retract<AppState,string>("source-editor-retract")(s => s.code, s => c => ({...s, code:c}),
                  c => custom<string>("source-editor-textarea")(
                  _ => k =>
                    <textarea value={c}
                              onChange={e => k(() => {})(e.currentTarget.value)}
                              style={{ fontFamily: "monospace", width:"45%", height:"600px", overflowY:"scroll", float:"left" }} />
                ))(s)
              : custom<{}>("source-editor-textarea")(_ => _ => render_code(s.code, s.stream)).never("source-editor-textarea-never"),
          s => custom<AppState>(`source-editor-state-step-${s.step_index}`)(
            _ => k => render_debugger_stream(s.stream)
          ).never("source-editor-state-step-never"),
          s => button<{}>("Next", s.stream.kind != "step")({}).then("state-next-button", _ =>
               unit({...s, stream:s.stream.kind == "step" ? s.stream.next() : s.stream, step_index:s.step_index+1})),
          s => button<{}>("Reload")({}).then("state-reset-button", _ =>
               unit({...s, stream:get_stream(s.code), step_index:0})),
          retract<AppState,boolean>("source-editor-toggle-editing-retract")(s => s.editing, s => e => ({...s, editing:e}),
               e => button<boolean>("Toggle editing")(!e))
        ])
      )({ code:default_program, stream:get_stream(default_program), step_index:0, editing:false }),
      _ => {}
    )}
  </div>
}

export let HomePage_to = (target_element_id:string) => {
  ReactDOM.render(
    HomePage(),
    document.getElementById(target_element_id)
  )
}
