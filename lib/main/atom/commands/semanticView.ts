import {commands} from "./registry"
import {commandForTypeScript} from "../utils"
import {SemanticViewController} from "../views/outline/semanticViewController"

commands.set("typescript:toggle-semantic-view", () => {
  return e => {
    if (!commandForTypeScript(e)) {
      return
    }

    SemanticViewController.toggle()
  }
})
