import {addCommand} from "./registry"

addCommand("atom-text-editor", "typescript:toggle-semantic-view", deps => ({
  description: "Toggle semantic view outline",
  didDispatch() {
    deps.getSemanticViewController().toggle()
  },
}))
