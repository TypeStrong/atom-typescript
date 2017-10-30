import * as Atom from "atom"
import * as fs from "fs"
import * as path from "path"
import * as url from "url"
import {CodeEdit, consistentPath, FileLocationQuery, Location, spanToRange} from "./"

// Return line/offset position in the editor using 1-indexed coordinates
export function getEditorPosition(editor: Atom.TextEditor): Location {
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

export function isTypescriptGrammar(editor: Atom.TextEditor): boolean {
  const [scopeName] = editor.getRootScopeDescriptor().getScopesArray()
  return scopeName === "source.ts" || scopeName === "source.tsx"
}

export function isAllowedExtension(ext: string) {
  return ext === ".ts" || ext === ".tst" || ext === ".tsx"
}

export function isActiveEditorOnDiskAndTs() {
  const editor = atom.workspace.getActiveTextEditor()
  if (!editor) {
    return
  }
  return onDiskAndTs(editor)
}

export function onDiskAndTs(editor: Atom.TextEditor) {
  if (editor instanceof require("atom").TextEditor) {
    const filePath = editor.getPath()
    if (!filePath) {
      return false
    }
    const ext = path.extname(filePath)
    if (isAllowedExtension(ext)) {
      if (fs.existsSync(filePath)) {
        return true
      }
    }
  }
  return false
}

/** Either ts or tsconfig */
export function onDiskAndTsRelated(editor: Atom.TextEditor) {
  if (editor instanceof require("atom").TextEditor) {
    const filePath = editor.getPath()
    if (!filePath) {
      return false
    }
    const ext = path.extname(filePath)
    if (isAllowedExtension(ext)) {
      if (fs.existsSync(filePath)) {
        return true
      }
    }
    if (filePath.endsWith("tsconfig.json")) {
      return true
    }
  }
  return false
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

export function getFilePath(): {filePath: string | undefined} {
  const editor = atom.workspace.getActiveTextEditor()
  if (!editor) {
    return {filePath: undefined}
  }
  const filePath = editor.getPath()
  return {filePath}
}

export function getEditorsForAllPaths(
  filePaths: string[],
): Promise<{[filePath: string]: Atom.TextEditor}> {
  const map: {[key: string]: Atom.TextEditor} = {}
  const activeEditors = atom.workspace.getTextEditors().filter(editor => !!editor.getPath())

  function addConsistentlyToMap(editor: Atom.TextEditor) {
    const filePath = editor.getPath()
    if (filePath) {
      map[consistentPath(filePath)] = editor
    }
  }

  activeEditors.forEach(addConsistentlyToMap)

  /// find the editors that are not in here
  const newPaths = filePaths.filter(p => !map[p])
  if (!newPaths.length) {
    return Promise.resolve(map)
  }

  const promises = newPaths.map(p => atom.workspace.open(p, {}) as any) // Update Atom typings!

  return Promise.all(promises).then(editors => {
    editors.forEach(editor => addConsistentlyToMap(editor))

    return map
  })
}

export function getRangeForTextSpan(
  editor: Atom.TextEditor,
  ts: {start: number; length: number},
): Atom.Range {
  const start = editor.buffer.positionForCharacterIndex(ts.start)
  const end = editor.buffer.positionForCharacterIndex(ts.start + ts.length)
  const range = new Atom.Range(start, end)
  return range
}

/** only the editors that are persisted to disk. And are of type TypeScript */
export function getTypeScriptEditorsWithPaths() {
  return atom.workspace.getTextEditors().filter(editor => {
    const filePath = editor.getPath()
    return filePath && path.extname(filePath) === ".ts"
  })
}

export function getOpenTypeScritEditorsConsistentPaths() {
  return getTypeScriptEditorsWithPaths().map(e => consistentPath(e.getPath()!))
}

export function quickNotifySuccess(htmlMessage: string) {
  const notification = atom.notifications.addSuccess(htmlMessage, {
    dismissable: true,
  })
  setTimeout(() => {
    notification.dismiss()
  }, 800)
}

export function quickNotifyWarning(htmlMessage: string) {
  const notification = atom.notifications.addWarning(htmlMessage, {
    dismissable: true,
  })
  setTimeout(() => {
    notification.dismiss()
  }, 800)
}

export function formatCode(editor: Atom.TextEditor, edits: CodeEdit[]) {
  // The code edits need to be applied in reverse order
  for (let i = edits.length - 1; i >= 0; i--) {
    editor.setTextInBufferRange(spanToRange(edits[i]), edits[i].newText)
  }
}

export function kindToColor(kind: string) {
  switch (kind) {
    case "interface":
      return "rgb(16, 255, 0)"
    case "keyword":
      return "rgb(0, 207, 255)"
    case "class":
      return "rgb(255, 0, 194)"
    default:
      return "white"
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

/** Gets the consisten path for the current editor */
export function getCurrentPath(): string | undefined {
  const editor = atom.workspace.getActiveTextEditor()
  if (!editor) {
    return
  }
  const filePath = editor.getPath()
  if (!filePath) {
    return
  }
  return consistentPath(filePath)
}

export const knownScopes = {
  reference: "reference.path.string",
  require: "require.path.string",
  es6import: "es6import.path.string",
}

export function editorInTheseScopes(matches: string[]) {
  const editor = atom.workspace.getActiveTextEditor()
  if (!editor) {
    return ""
  }
  const scopes = editor.getLastCursor().getScopeDescriptor().scopes
  const lastScope = scopes[scopes.length - 1]
  if (matches.some(p => lastScope === p)) {
    return lastScope
  } else {
    return ""
  }
}

/** One less level of indirection */
export function getActiveEditor() {
  return atom.workspace.getActiveTextEditor()
}

export interface OpenerConfig<T> {
  commandSelector: string
  commandName: string
  uriProtocol: string
  getData: () => T
  onOpen: (data: T) => any
}

/**
 * Uri for filepath based on protocol
 */
export function uriForPath(uriProtocol: string, filePath: string) {
  return uriProtocol + "//" + filePath
}

export function triggerLinter() {
  // also invalidate linter
  const editor = atom.workspace.getActiveTextEditor()
  if (editor) {
    atom.commands.dispatch(atom.views.getView(editor), "linter:lint")
  }
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
  const config: any = {}
  if (position.line) {
    config.initialLine = position.line - 1
  }
  if (position.col) {
    config.initialColumn = position.col
  }
  atom.workspace.open(filePath, config)
}
