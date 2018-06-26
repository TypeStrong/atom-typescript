import * as Atom from "atom"
import * as path from "path"
import {FileLocationQuery, Location} from "./ts"

// Return line/offset position in the editor using 1-indexed coordinates
function getEditorPosition(editor: Atom.TextEditor): Location {
  const pos = editor.getCursorBufferPosition()
  return {
    line: pos.row + 1,
    offset: pos.column + 1,
  }
}

export function isTypescriptFile(filePath: string | undefined): boolean {
  if (filePath === undefined) return false
  return isAllowedExtension(path.extname(filePath))
}

export function typeScriptScopes(): ReadonlyArray<string> {
  return ["source.ts", "source.tsx", "typescript"]
}

export function isTypescriptEditorWithPath(editor: Atom.TextEditor) {
  return isTypescriptFile(editor.getPath()) && isTypescriptGrammar(editor)
}

export function isTypescriptGrammar(editor: Atom.TextEditor): boolean {
  const [scopeName] = editor.getRootScopeDescriptor().getScopesArray()
  return typeScriptScopes().includes(scopeName)
}

function isAllowedExtension(ext: string) {
  return [".ts", ".tst", ".tsx"].includes(ext)
}

export function getFilePathPosition(editor: Atom.TextEditor): FileLocationQuery | undefined {
  const file = editor.getPath()
  if (file !== undefined) {
    return {file, ...getEditorPosition(editor)}
  }
}
