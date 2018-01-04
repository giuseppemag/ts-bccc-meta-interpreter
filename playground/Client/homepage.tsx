import * as React from "react"
import * as ReactDOM from "react-dom"
import {List, Map, Set, Range} from "immutable"
import * as Immutable from "immutable"
import * as Moment from 'moment'
import * as i18next from 'i18next'
import { DebuggerStream, get_stream, RenderGrid, Scope, mk_range, SourceRange, Bindings, TypeInformation, Type } from 'ts-bccc-meta-interpreter'

import {UrlTemplate, application, get_context, Route, Url, make_url, fallback_url, link_to_route,
Option, C, Mode, unit, bind, string, number, bool, button, selector, multi_selector, label, h1, h2, div, form, image, link, file, overlay,
custom, repeat, all, any, lift_promise, retract, delay,
simple_menu, mk_menu_entry, mk_submenu_entry, MenuEntry, MenuEntryValue, MenuEntrySubMenu,
rich_text, paginate, Page, list, editable_list, simple_application} from 'monadic_react'

import * as MonadicReact from 'monadic_react'

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

let find_start_line_from_range = (source:string, range:SourceRange) : string => {
  let rows = source.split("\n")
  if(range.start.row >= rows.length ){
    return "Range out of bound. [" + JSON.stringify(range) + "]"
  }
  return rows[range.start.row];
}


let render_scope = (scope:Scope, source:string) : JSX.Element[] => {
  return scope.map((v,k) => {
          if (v == undefined || k == undefined) return <tr/>
          return <tr className="debugger__row" key={k}>
            <td className="debugger__cell debugger__cell--variable">{k}</td>
            <td className="debugger__cell debugger__cell--value">{v.k == "u" ? "()" :
                 v.k == "i" ? v.v :
                 v.k == "render-grid" ? render_render_grid(v.v) :
                 v.k == "lambda" ? find_start_line_from_range(source, v.v.range).trim().replace("{", "") + "{ ... }" :
                 
                 JSON.stringify(v.v) }</td>
          </tr>
         }).toArray()
}


let binding_to_string = (binding_type: Type):string => {
  switch(binding_type.kind){
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
      case  "ref":
        return binding_type.kind + "(" + binding_type.C_name +")"
      case "arr":
        return binding_to_string(binding_type.arg) + "[]"
      case "tuple":        
        return "(" + binding_type.args.map(binding_to_string).join(",") + ")"
      default:
        return JSON.stringify(binding_type)
  }
}


let render_bindings = (bindings:Bindings, select_code:(_:SourceRange)=>void) : JSX.Element[] => {
  return bindings.map((b, name) => b == undefined || name == undefined ? <div/> : 
                                   <div onMouseOver={() => {
                                     //todo push the range of the declaration for text highliting
                                   }}> {name} : {binding_to_string(b)} </div>).toArray()
}


let render_debugger_stream = (stream:DebuggerStream, source:string, select_code:(_:SourceRange)=>void) : JSX.Element => {
  let state = stream.show()
  let style={width:"50%", height:"610px", float:"right", color:"white"}
  if (state.kind == "message") {
    console.log("render_debugger_stream-message", state.message)
    return <div style={style}>{state.message}</div>
  } else if (state.kind == "bindings") {
    console.log("render_debugger_stream-bindings", state.state)
    return <div style={style}>{render_bindings(state.state.bindings, select_code)}</div>
  }

  console.log("render_debugger_stream-memory..", state.memory)  
  return <div style={style}>
          <table>
            <tbody>
              { render_scope(state.memory.globals, source) }
              <tr className="debugger__row">
              <td className="debugger__cell debugger__cell--variable">Stack </td>
                <td className="debugger__cell debugger__cell--value">
                  {state.memory.stack.toArray().map((stack_frame, i) =>
                        <table key={i} className="debugger__table debugger__table--inception">
                          <tbody>
                            { render_scope(stack_frame, source) }
                          </tbody>
                        </table>
                  )}
              </td>
              </tr>
            </tbody>
         </table>
        </div>
}
let render_code = (code:string, stream:DebuggerStream) : JSX.Element => {
  let state = stream.show()
  let highlighting = state.kind == "memory" ? state.memory.highlighting
                   : state.kind == "bindings" ? state.state.highlighting
                   : mk_range(-10,0,0,0)
  let lines = code.split("\n")
  return <div style={{fontFamily: "monospace",width:"48%", float:"left", whiteSpace: "pre-wrap"}}>
        {

          lines.map((line, line_index) => <div style={{color:highlighting.start.row == line_index ? "black" : "white", 
                                                       background:highlighting.start.row == line_index ? 'rgb(255,255,153)' : 'none'}} >{line}</div>)
        }
      </div>
}
export function HomePage() : JSX.Element {
  type AppState = { code:string, stream:DebuggerStream, step_index:number, editing:boolean }
  return <div style={{background:"linear-gradient(rgb(33, 22, 110), rgb(59, 54, 181))"}}>
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
            _ => k => render_debugger_stream(s.stream, s.code, (range:SourceRange) => {})
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
