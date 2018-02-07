import {commands} from "./registry"
import {commandForTypeScript} from "../utils"
import {toggleProjectSymbols} from "../views/symbols/symbolsViewMain"

commands.set("typescript:toggle-project-symbols", () => {
  return async e => {
    if (!commandForTypeScript(e)) {
      return
    }
    toggleProjectSymbols()
  }
})
