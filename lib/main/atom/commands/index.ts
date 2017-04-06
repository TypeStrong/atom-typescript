import {commands, Dependencies} from "./registry"

// Import all of the command files for their side effects
import "./build"
import "./checkAllFiles"
import "./clearErrors"
import "./formatCode"
import "./findReferences"
import "./goToDeclaration"
import "./renameRefactor"

export function registerCommands(deps: Dependencies) {

  for (const [name, command] of commands) {
    atom.commands.add("atom-workspace", name, command(deps))
  }
}
