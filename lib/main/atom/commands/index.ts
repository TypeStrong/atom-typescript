import {getCommands, Dependencies} from "./registry"
import {CompositeDisposable} from "atom"

// Import all of the command files for their side effects
import "./build"
import "./checkAllFiles"
import "./clearErrors"
import "./formatCode"
import "./findReferences"
import "./goToDeclaration"
import "./returnFromDeclaration"
import "./renameRefactor"
import "./showTooltip"
import "./initializeConfig"
import "./semanticView"
import "./symbolsView"
import "./refactorCode"

export function registerCommands(deps: Dependencies) {
  const disp = new CompositeDisposable()
  for (const {selector, command, desc} of getCommands()) {
    disp.add(atom.commands.add(selector, command, desc(deps)))
  }
  return disp
}
