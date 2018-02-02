import * as Atom from "atom"
import * as path from "path"
import {consistentPath} from "./fs"
import {CodeEdit, FileLocationQuery, Location, spanToRange} from "./ts"

// Return line/offset position in the editor using 1-indexed coordinates
function getEditorPosition(editor: Atom.TextEditor): Location {
  const pos = editor.getCursorBufferPosition()
  return {
    line: pos.row + 1,
    offset: pos.column + 1,
  }
}

export function isTypescriptFile(filePath: string): boolean {
  if (!filePath) {
    return false
  }

  const ext = path.extname(filePath)
  return ext === ".ts" || ext === ".tsx"
}

export function onDiskAndTs(editor: Atom.TextEditor) {
  if (editor instanceof require("atom").TextEditor) {
    const filePath = editor.getPath()
    if (!filePath) {
      return false
    }
    const ext = path.extname(filePath)
    if (isAllowedExtension(ext)) {
      // if (fs.existsSync(filePath)) {
      return true
      // }
    }
  }
  return false
}

export function isTypescriptGrammar(editor: Atom.TextEditor): boolean {
  const [scopeName] = editor.getRootScopeDescriptor().getScopesArray()
  return scopeName === "source.ts" || scopeName === "source.tsx"
}

export function isAllowedExtension(ext: string) {
  return ext === ".ts" || ext === ".tst" || ext === ".tsx"
}

export function getFilePathPosition(): FileLocationQuery | undefined {
  const editor = atom.workspace.getActiveTextEditor()
  if (editor) {
    const file = editor.getPath()
    if (file) {
      return {file, ...getEditorPosition(editor)}
    }
  }
}

export function formatCode(editor: Atom.TextEditor, edits: CodeEdit[]) {
  // The code edits need to be applied in reverse order
  for (let i = edits.length - 1; i >= 0; i--) {
    editor.setTextInBufferRange(spanToRange(edits[i]), edits[i].newText)
  }
}

/** See types :
 * https://github.com/atom-community/autocomplete-plus/pull/334#issuecomment-85697409
 */
export function kindToType(kind: string) {
  // variable, constant, property, value, method, function, class, type, keyword, tag, snippet, import, require
  switch (kind) {
    case "const":
      return "constant"
    case "interface":
      return "type"
    case "identifier":
      return "variable"
    case "local function":
      return "function"
    case "local var":
      return "variable"
    case "let":
    case "var":
    case "parameter":
      return "variable"
    case "alias":
      return "import"
    case "type parameter":
      return "type"
    default:
      return kind.split(" ")[0]
  }
}

/** Utility functions for commands */
export function commandForTypeScript(e: Atom.CommandEvent) {
  const editor = atom.workspace.getActiveTextEditor()
  if (!editor) {
    return e.abortKeyBinding() && false
  }
  const filePath = editor.getPath()
  if (!filePath) {
    return e.abortKeyBinding() && false
  }
  const ext = path.extname(filePath)
  if (!isAllowedExtension(ext)) {
    return e.abortKeyBinding() && false
  }

  return true
}

/**
 * converts "c:\dev\somethin\bar.ts" to "~something\bar".
 */
export function getFilePathRelativeToAtomProject(filePath: string) {
  filePath = consistentPath(filePath)
  // Sample:
  // atom.project.relativize(`D:/REPOS/atom-typescript/lib/main/atom/atomUtils.ts`)
  return "~" + atom.project.relativize(filePath)
}

/**
 * Opens the given file in the same project
 */
export function openFile(filePath: string, position: {line?: number; col?: number} = {}) {
  const config: Atom.WorkspaceOpenOptions = {}
  if (position.line) {
    config.initialLine = position.line - 1
  }
  if (position.col) {
    config.initialColumn = position.col
  }
  atom.workspace.open(filePath, config)
}
