import {TypescriptServiceClient} from "../../../client/client"
import {RenameView} from "../views/renameView"
import {StatusPanel} from "../../atom/components/statusPanel"

export interface Dependencies {
  clearErrors()
  getBuffer(filePath: string): Promise<{buffer: TextBuffer.ITextBuffer, isOpen: boolean}>
  getClient(filePath: string): Promise<TypescriptServiceClient>
  renameView: RenameView
  statusPanel: StatusPanel
}

export interface CommandConstructor {
  (deps: Dependencies): (e) => any
}

// To allow using dependency injection, but avoid having to type a lot of boilerplate, we have the
// individual command files register themselves in the below map. When the package is initializing,
// the constructors are passed the deps and return the actual commands handlers.
export const commands: Map<string, CommandConstructor> = new Map()
