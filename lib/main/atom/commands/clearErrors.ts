import {addCommand} from "./registry"

addCommand("atom-workspace", "typescript:clear-errors", (deps) => ({
  description: "Clear error messages",
  didDispatch() {
    deps.clearErrors()
  },
}))
