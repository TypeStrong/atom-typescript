import {commands} from "./registry"
import {commandForTypeScript} from "../utils"
import {toggle} from "../views/outline/semanticViewPane"

commands.set("typescript:toggle-semantic-view", () => {
  return e => {
    if (!commandForTypeScript(e)) {
      return
    }

    toggle()
  }
})
