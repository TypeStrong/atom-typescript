import {getCommands, Dependencies} from "./registry"
import {CompositeDisposable} from "atom"
import {isTypescriptEditorWithPath, isTypescriptGrammar} from "../utils"

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
import "./organizeImports"

export function registerCommands(deps: Dependencies) {
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
      atom.commands.add(cmd.selector, cmd.command, {
        ...d,
        async didDispatch() {
          try {
            await d.didDispatch()
          } catch (error) {
            handle(error as Error)
          }
        },
      })
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
