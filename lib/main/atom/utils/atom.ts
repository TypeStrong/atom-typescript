import * as Atom from "atom"
import {memoize, throttle} from "lodash"
import * as path from "path"
import {FileLocationQuery, Location, pointToLocation} from "./ts"

export {highlight} from "./highlighter"

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
  const config = atom.config.get("atom-typescript")
  const tsScopes = config.tsSyntaxScopes
  if (config.allowJS) {
    tsScopes.push(...config.jsSyntaxScopes)
  }
  return tsScopes
}

export function isTypescriptEditorWithPath(editor: Atom.TextEditor) {
  return isTypescriptFile(editor.getPath()) && isTypescriptGrammar(editor)
}

export function isTypescriptGrammar(editor: Atom.TextEditor): boolean {
  const [scopeName] = editor.getRootScopeDescriptor().getScopesArray()
  return typeScriptScopes().includes(scopeName)
}

function notNullary<T>(x: T | undefined | null): x is T {
  return x != null
}

function memoizeThrottle<T, U>(func: (arg: T) => U, wait: number): (arg: T) => U {
  const mem = memoize((_param: T) => throttle(func, wait, {leading: true}))
  return (param: T) => mem(param)(param)! // NOTE: leading MUST be true for this ! to hold
}

const isAllowedExtension = memoizeThrottle((ext: string) => {
  const config = atom.config.get("atom-typescript")
  const tsExts = config.tsFileExtensions
  if (config.allowJS) {
    tsExts.push(...config.jsFileExtensions)
  }
  if (config.extensionsFromGrammars) {
    const custom = atom.config.get("core.customFileTypes") ?? {}
    const scopes = typeScriptScopes()
    tsExts.push(
      ...([] as Array<string | undefined>)
        .concat(
          ...scopes.map((scope) => atom.grammars.grammarForScopeName(scope)?.fileTypes),
          ...scopes.map((scope) => custom[scope]),
        )
        .filter(notNullary)
        .map((s) => `.${s}`),
    )
  }
  return tsExts.includes(ext)
}, 5000)

export function getFilePathPosition(
  editor: Atom.TextEditor,
  position?: Atom.Point,
): FileLocationQuery | undefined {
  const file = editor.getPath()
  if (file !== undefined) {
    const location = position ? pointToLocation(position) : getEditorPosition(editor)
    return {file, ...location}
  }
}

export function* getOpenEditorsPaths() {
  for (const ed of atom.workspace.getTextEditors()) {
    if (isTypescriptEditorWithPath(ed)) yield ed.getPath()!
  }
}
