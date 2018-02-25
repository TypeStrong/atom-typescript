import {commands} from "./registry"
import {commandForTypeScript} from "../utils"
import {SemanticViewController} from "../views/outline/semanticViewController"

commands["atom-text-editor"]["typescript:toggle-semantic-view"] = () => ({
  description: "Toggle semantic view outline",
  async didDispatch(e) {
    if (!commandForTypeScript(e)) {
      return
    }

    SemanticViewController.toggle()
  },
})
