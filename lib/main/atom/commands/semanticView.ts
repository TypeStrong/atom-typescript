import {commands} from "./registry"
import {commandForTypeScript} from "../utils"
import {toggle} from "../views/semanticViewPane"

commands.set("typescript:toggle-semantic-view", () => {
  return async e => {
    if (!commandForTypeScript(e)) {
      return
    }

    toggle()
  }
})
