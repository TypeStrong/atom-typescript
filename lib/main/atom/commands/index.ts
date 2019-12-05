import {CompositeDisposable, DisposableLike} from "atom"
import {isTypescriptEditorWithPath, isTypescriptGrammar} from "../utils"
import {Dependencies, getCommands} from "./registry"

// Import all of the command files for their side effects
import "./build"
import "./checkAllFiles"
import "./clearErrors"
import "./findReferences"
import "./formatCode"
import "./goToDeclaration"
import "./initializeConfig"
import "./organizeImports"
import "./refactorCode"
import "./reloadProjects"
import "./renameFile"
import "./renameRefactor"
import "./restartAllServers"
import "./returnFromDeclaration"
import "./semanticView"
import "./showTooltip"
import "./sigHelp"
import "./symbolsView"

export function registerCommands(deps: Dependencies): DisposableLike {
  const disp = new CompositeDisposable()
  for (const cmd of getCommands()) {
    if (cmd.selector === "atom-text-editor") {
      const d = cmd.desc(deps)
      disp.add(
        atom.commands.add(cmd.selector, cmd.command, {
          ...d,
          async didDispatch(e) {
            try {
              const editor = e.currentTarget.getModel()
              if (isTypescriptEditorWithPath(editor)) {
                await d.didDispatch(editor, () => e.abortKeyBinding())
              } else {
                e.abortKeyBinding()
                if (isTypescriptGrammar(editor)) {
                  atom.notifications.addWarning(
                    "Atom-TypeScript cancelled last command: Current editor has no file path",
                    {
                      description:
                        "Atom-TypeScript needs to determine the file path of the " +
                        `current editor to execute \`${cmd.command}\`, which it failed to do. ` +
                        "You probably just need to save the current file somewhere.",
                      dismissable: true,
                    },
                  )
                }
              }
            } catch (error) {
              handle(error as Error)
            }
          },
        }),
      )
    } else {
      const d = cmd.desc(deps)
      disp.add(
        atom.commands.add(cmd.selector, cmd.command, {
          ...d,
          async didDispatch() {
            try {
              await d.didDispatch()
            } catch (error) {
              handle(error as Error)
            }
          },
        }),
      )
    }
  }
  return disp
}

function handle(err: Error) {
  atom.notifications.addFatalError("Something went wrong, see details below.", {
    detail: err.message,
    dismissable: true,
    stack: err.stack,
  })
}
