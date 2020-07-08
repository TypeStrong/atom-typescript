import {addCommand} from "./registry"

addCommand("atom-workspace", "typescript:restart-all-servers", (deps) => ({
  description: "Kill all tsserver instances. They will be auto-restarted",
  async didDispatch() {
    deps.killAllServers()
  },
}))
