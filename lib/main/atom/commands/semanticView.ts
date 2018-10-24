import {handlePromise} from "../../../utils"
import {addCommand} from "./registry"

addCommand("atom-text-editor", "typescript:toggle-semantic-view", deps => ({
  description: "Toggle semantic view outline",
  didDispatch() {
    handlePromise(deps.getSemanticViewController().toggle())
  },
}))
