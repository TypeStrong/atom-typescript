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
  if (!filePath) return false

  const ext = path.extname(filePath)
  return ext === ".ts" || ext === ".tsx"
}

export function isTypescriptGrammar(grammar: Atom.Grammar): boolean {
  return grammar.scopeName === "source.ts" || grammar.scopeName === "source.tsx"
}

export function isAllowedExtension(ext: string) {
  return ext == ".ts" || ext == ".tst" || ext == ".tsx"
}

export function isActiveEditorOnDiskAndTs() {
  var editor = atom.workspace.getActiveTextEditor()
  if (!editor) return
  return onDiskAndTs(editor)
}

export function onDiskAndTs(editor: Atom.TextEditor) {
  if (editor instanceof require("atom").TextEditor) {
    var filePath = editor.getPath()
    if (!filePath) {
      return false
    }
    var ext = path.extname(filePath)
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
    var filePath = editor.getPath()
    if (!filePath) {
      return false
    }
    var ext = path.extname(filePath)
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
  var editor = atom.workspace.getActiveTextEditor()
  if (!editor) return {filePath: undefined}
  var filePath = editor.getPath()
  return {filePath}
}

export function getEditorsForAllPaths(
  filePaths: string[],
): Promise<{[filePath: string]: Atom.TextEditor}> {
  var map = <any>{}
  var activeEditors = atom.workspace.getTextEditors().filter(editor => !!editor.getPath())

  function addConsistentlyToMap(editor: Atom.TextEditor) {
    const path = editor.getPath()
    if (path) map[consistentPath(path)] = editor
  }

  activeEditors.forEach(addConsistentlyToMap)

  /// find the editors that are not in here
  var newPaths = filePaths.filter(p => !map[p])
  if (!newPaths.length) return Promise.resolve(map)

  var promises = newPaths.map(p => atom.workspace.open(p, {}) as any) // Update Atom typings!

  return Promise.all(promises).then(editors => {
    editors.forEach(editor => addConsistentlyToMap(editor))

    return map
  })
}

export function getRangeForTextSpan(
  editor: Atom.TextEditor,
  ts: {start: number; length: number},
): Atom.Range {
  var start = editor.buffer.positionForCharacterIndex(ts.start)
  var end = editor.buffer.positionForCharacterIndex(ts.start + ts.length)
  var range = new Atom.Range(start, end)
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
  var notification = atom.notifications.addSuccess(htmlMessage, {
    dismissable: true,
  })
  setTimeout(() => {
    notification.dismiss()
  }, 800)
}

export function quickNotifyWarning(htmlMessage: string) {
  var notification = atom.notifications.addWarning(htmlMessage, {
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
  var editor = atom.workspace.getActiveTextEditor()
  if (!editor) return e.abortKeyBinding() && false
  const filePath = editor.getPath()
  if (!filePath) return e.abortKeyBinding() && false
  var ext = path.extname(filePath)
  if (!isAllowedExtension(ext)) return e.abortKeyBinding() && false

  return true
}

/** Gets the consisten path for the current editor */
export function getCurrentPath(): string | undefined {
  var editor = atom.workspace.getActiveTextEditor()
  if (!editor) return
  const path = editor.getPath()
  if (!path) return
  return consistentPath(path)
}

export var knownScopes = {
  reference: "reference.path.string",
  require: "require.path.string",
  es6import: "es6import.path.string",
}

export function editorInTheseScopes(matches: string[]) {
  var editor = atom.workspace.getActiveTextEditor()
  if (!editor) return ""
  var scopes = editor.getLastCursor().getScopeDescriptor().scopes
  var lastScope = scopes[scopes.length - 1]
  if (matches.some(p => lastScope === p)) return lastScope
  else return ""
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

/**
 * Registers an opener with atom
 */
export function registerOpener<T>(config: OpenerConfig<T>) {
  atom.commands.add(config.commandSelector, config.commandName, e => {
    if (!commandForTypeScript(e)) return
    const path = getCurrentPath()
    if (!path) {
      e.abortKeyBinding()
      return
    }
    var uri = uriForPath(config.uriProtocol, path)
    var old_pane = atom.workspace.paneForURI(uri)
    if (old_pane) {
      const item = old_pane.itemForURI(uri)
      if (item) old_pane.destroyItem(item)
    }

    atom.workspace.open(uri, config.getData())
  })

  atom.workspace.addOpener(function(uri: string, data: T) {
    try {
      var {protocol} = url.parse(uri)
    } catch (error) {
      return
    }

    if (protocol !== config.uriProtocol) {
      return
    }

    return config.onOpen(data)
  })
}

export function triggerLinter() {
  // also invalidate linter
  const editor = atom.workspace.getActiveTextEditor()
  if (editor) atom.commands.dispatch(atom.views.getView(editor), "linter:lint")
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
  var config: any = {}
  if (position.line) {
    config.initialLine = position.line - 1
  }
  if (position.col) {
    config.initialColumn = position.col
  }
  atom.workspace.open(filePath, config)
}
