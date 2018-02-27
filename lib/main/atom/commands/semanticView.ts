import {addCommand} from "./registry"
import {commandForTypeScript} from "../utils"

addCommand("atom-text-editor", "typescript:toggle-semantic-view", deps => ({
  description: "Toggle semantic view outline",
  async didDispatch(e) {
    if (!commandForTypeScript(e)) {
      return
    }

    deps.getSemanticViewController().toggle()
  },
}))
