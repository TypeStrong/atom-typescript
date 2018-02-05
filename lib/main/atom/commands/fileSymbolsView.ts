import {commands} from "./registry"
import {commandForTypeScript} from "../utils"
import {toggle} from "../views/symbols/symbolsViewMain"

commands.set("typescript:toggle-file-symbols", () => {
  return async e => {
    if (!commandForTypeScript(e)) {
      return
    }
    console.log("typescript:toggle-file-symbols")
    toggle()
  }
})
