import {commands} from "./registry"
import {commandForTypeScript, getFilePathPosition} from "../atomUtils"

commands.set("typescript:check-all-files", deps => {
  return async e => {
    if (!commandForTypeScript(e)) {
      return
    }

    const location = getFilePathPosition()
    const client = await deps.getClient(location.file)

    client.executeGetErrForProject({file: location.file, delay: 0})
  }
})
