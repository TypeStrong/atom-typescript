import {addCommand} from "./registry"
import {handlePromise} from "../../../utils"

addCommand("atom-text-editor", "typescript:toggle-semantic-view", deps => ({
  description: "Toggle semantic view outline",
  didDispatch() {
    handlePromise(deps.getSemanticViewController().toggle())
  },
}))
