import {commands} from "./registry"

commands["atom-workspace"]["typescript:clear-errors"] = deps => ({
  description: "Clear error messages",
  didDispatch() {
    deps.clearErrors()
  },
})
