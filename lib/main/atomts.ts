import {PluginManager} from "./plugin-manager"
import {IndieDelegate} from "atom/linter"
import {StatusBar} from "atom/status-bar"

let pluginManager: PluginManager | undefined

export async function activate() {
  const pns = atom.packages.getAvailablePackageNames()
  if (!(pns.includes("atom-ide-ui") || pns.includes("linter"))) {
    await require("atom-package-deps").install("atom-typescript", true)
  }

  require("etch").setScheduler(atom.views)

  // tslint:disable-next-line:no-shadowed-variable
  const {PluginManager} = require("./plugin-manager")
  pluginManager = new PluginManager()
}

export function deactivate() {
  if (pluginManager) pluginManager.destroy()
  pluginManager = undefined
}

////////////////////////////////// Consumers ///////////////////////////////////
export function consumeLinter(register: (opts: {name: string}) => IndieDelegate) {
  if (pluginManager) return pluginManager.consumeLinter(register)
}

export function consumeStatusBar(statusBar: StatusBar) {
  if (pluginManager) return pluginManager.consumeStatusBar(statusBar)
}

////////////////////////////////// Providers ///////////////////////////////////
export function provideAutocomplete() {
  if (pluginManager) return pluginManager.provideAutocomplete()
}

export function provideIntentions() {
  if (pluginManager) return pluginManager.provideIntentions()
}

export function provideCodeActions() {
  if (pluginManager) return pluginManager.provideCodeActions()
}

export function provideHyperclick() {
  if (pluginManager) return pluginManager.provideHyperclick()
}
