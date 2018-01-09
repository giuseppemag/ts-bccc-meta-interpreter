import * as React from "react"
import * as ReactDOM from "react-dom"
import * as i18next from "i18next"
import { Mode, RichText } from './shared'

interface Props { content: string, set_content: (_: string) => void, mode: Mode }

export let TextComponent = (props: Props) => {

  let richText = RichText(true, props.mode == "edit" ? "edit" : "view", () => props.content, (new_content) => new_content != "" ? props.set_content(new_content) : null);

  return props.mode === "presentation" ?
    <div className="go-slide-text">
      {richText}
    </div>
    :
    <div>
      <div className="model__attribute text">
        <label className="attribute-label attribute-label-text">{i18next.t('Text')}</label>
        <div className="model__attribute-content">
          {richText}
        </div>
      </div>
    </div>
}