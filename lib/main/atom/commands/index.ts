import {commands, Dependencies} from "./registry"
import {CompositeDisposable} from "atom"

// Import all of the command files for their side effects
import "./build"
import "./checkAllFiles"
import "./clearErrors"
import "./formatCode"
import "./findReferences"
import "./goToDeclaration"
import "./renameRefactor"
import "./showTooltip"
import "./initializeConfig"
import {CommandRegistryListener} from "atom"

export function registerCommands(deps: Dependencies) {
  const disp = new CompositeDisposable()
  for (const [selector, cmds] of Object.entries(commands)) {
    for (const [command, desc] of Object.entries(cmds)) {
      disp.add(
        atom.commands.add(selector, command, desc(deps) as CommandRegistryListener<EventTarget>),
      )
    }
  }
  return disp
}
