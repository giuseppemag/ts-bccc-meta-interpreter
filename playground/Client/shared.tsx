import * as MR from 'monadic_react'

export type Mode = MR.Mode | "presentation"

export let RichText = (can_edit: boolean, mode: MR.Mode, get_item: () => string, set_item: (src: string) => void) => {
  let item = get_item()
  return MR.simple_application<string>(MR.rich_text(mode)(item), (out) => set_item(out))
}
