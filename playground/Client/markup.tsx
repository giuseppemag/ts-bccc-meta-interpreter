import * as React from 'react'
import * as markdownit from 'markdown-it'
import markdownItLatex from './markdown-it-latex'
import * as latex from 'katex'
import * as Immutable from 'immutable'
import * as i18next from "i18next"
import { Mode } from 'monadic_react';


export type MarkupRenderer = (content: string) => MarkupRendererResponse
export type MarkupRendererResponse = { errors: Array<string>, element: JSX.Element }

export type MarkupViewer = (_: MarkupViewerProps) => JSX.Element
export type MarkupViewerProps = { content: MarkupContent, save: (_: MarkupContent) => void, mode: "edit" | "view" | "presentation" }

export type MarkupKind = "LaTeX" | "Markdown"
export type MarkupContent = { kind: MarkupKind, text: string }

let newMarkUpContent = (kind: MarkupKind): MarkupContent => ({ kind: kind, text: "" })
let serialise = (content: MarkupContent) => JSON.stringify(content)
let deserialise = (json: string): MarkupContent => {
  try {
    let content = JSON.parse(json) as MarkupContent
    if (content == null) throw new Error("Content is not of type MarkupContent")
    return content
  } catch (e) {
    console.log(e)
    return newMarkUpContent("LaTeX")
  }
}

let katexRenderer: MarkupRenderer = (content: string) => {
  try {
    let html = latex.renderToString(content, { displayMode: false })
    let element = <div dangerouslySetInnerHTML={{ __html: html }} />
    return { errors: [], element: element }
  } catch (e) {
    return { errors: [e.message], element: <div /> }
  }
}

let markdownRenderer: MarkupRenderer = (content: string) => {
  let mdi = new markdownit()
  mdi.use(markdownItLatex)
  console.log("done")

  let html = mdi.render(content)

  let element = <div dangerouslySetInnerHTML={{ __html: html }} />
  return { errors: [], element: element }
}

let kindToRenderer = (kind: MarkupKind) => {
  switch (kind) {
    case "LaTeX":
      return katexRenderer
    case "Markdown":
      return markdownRenderer
  }
}

let capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

let markupViewer: MarkupViewer = (props: MarkupViewerProps) => {

  let renderer = kindToRenderer(props.content.kind)
  let rendererResponse = renderer(props.content.text)

  let editArea = (content: MarkupContent, setContent: (_: MarkupContent) => void, hasError: boolean) =>
    <textarea value={content.text} onChange={(e) => setContent({ ...content, text: e.currentTarget.value })} className={hasError ? 'has-error' : ''} />

  // let markUpLanguageSelect = (languages: MarkupKind[]) =>
  //   <select
  //     defaultValue={props.content.kind}
  //     onChange={e => { props.save({...props.content, kind: e.currentTarget.value as MarkupKind})}}>
  //     { languages.map( kind => <option key={`markup-option-${kind}`} value={kind}>{kind}</option> ) }
  //   </select>

  let className = props.content.kind.toLowerCase()

  if (props.mode == "view" || props.mode == "edit") {
    return (
    <div className="model__attribute markdown">
      {/* <label className={`attribute-label attribute-label-${className}`}>
        {i18next.t(capitalize(className))}
      </label> */}
      {
        props.mode == "edit"

        ? <div className="model__attribute-content">
            {editArea(props.content, props.save, rendererResponse.errors.length > 0)}
            {rendererResponse.element}
            {rendererResponse.errors.map(e => <span>{e}</span>)}
          </div>

        : <div className="model__attribute-content">
            {rendererResponse.element}
          </div>
      }
    </div>
    )
  }
  else /* props.mode == "presentation" */ {
    return <div className={`go-slide-${className}`}>
      {rendererResponse.element}
    </div>
  }

}

interface MarkupProps { kind: MarkupKind, mode:Mode, content:string, set_content:(_:string) => void }
export class MarkupComponent extends React.Component<MarkupProps, {}> {
  shouldComponentUpdate(new_props:MarkupProps) {
    return new_props.content != this.props.content
  }

  render() {
    let content = (this.props.content == "" || this.props.content == "{}")
      ? newMarkUpContent(this.props.kind)
      : deserialise(this.props.content)
    return (
      <div>
        {markupViewer({
          content: content,
          save: (content: MarkupContent) => this.props.set_content(serialise(content)),
          mode: this.props.mode
        })}
      </div>
    )
  }
}