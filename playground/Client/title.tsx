import * as React from "react"
import * as ReactDOM from "react-dom"
import * as i18next from "i18next"
import { Mode, RichText } from './shared'

type Props = { content: string, set_content: (_: string) => void, mode: Mode }

export let TitleComponent = (props: Props) => {

  let title = RichText(true, props.mode == "edit" ? "edit" : "view", () => props.content, (new_content) => new_content != "" ? props.set_content(new_content) : null);

  return props.mode === "presentation" ?
    <div className="go-slide-title">
      {title}
    </div>
    :
    <div>
      <div className="model__attribute title">
        <label className="attribute-label attribute-label-title">{i18next.t('Title')}</label>
        <div className="model__attribute-content">
          {title}
        </div>
      </div>
    </div>
}