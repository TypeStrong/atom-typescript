import {commands} from "./registry"

commands.set("typescript:clear-errors", deps => {
  return e => {
    deps.clearErrors()
  }
})
