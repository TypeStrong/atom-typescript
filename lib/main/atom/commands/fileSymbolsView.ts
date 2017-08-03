import {commands} from "./registry"
import {commandForTypeScript} from "../utils"
import {toggle} from "../views/symbolsViewMain"

commands.set("typescript:toggle-file-symbols", deps => {
  return async e => {
    if (!commandForTypeScript(e)) {
      return
    }
    console.log("typescript:toggle-file-symbols")
    toggle()
  }
})
