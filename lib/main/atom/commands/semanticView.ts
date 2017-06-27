import {commands} from "./registry"
import {commandForTypeScript} from "../utils"
import {toggle} from "../views/semanticView"

commands.set("typescript:toggle-semantic-view", deps => {
  return async e => {
    if (!commandForTypeScript(e)) {
      return
    }

    toggle()
  }
})
