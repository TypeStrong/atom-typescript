import {commands} from "./registry"

commands.set("typescript:clear-errors", deps => {
  return () => {
    deps.clearErrors()
  }
})
