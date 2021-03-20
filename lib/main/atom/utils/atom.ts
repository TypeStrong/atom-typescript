import * as Atom from "atom"
import * as path from "path"
import {FileLocationQuery, Location, pointToLocation} from "./ts"

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
  const tsScopes = atom.config.get("atom-typescript").tsSyntaxScopes
  if (atom.config.get("atom-typescript").allowJS) {
    tsScopes.push(...atom.config.get("atom-typescript").jsSyntaxScopes)
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

function isAllowedExtension(ext: string) {
  const tsExts = atom.config.get("atom-typescript").tsFileExtensions
  if (atom.config.get("atom-typescript").allowJS) {
    tsExts.push(...atom.config.get("atom-typescript").jsFileExtensions)
  }
  return tsExts.includes(ext)
}

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

export async function highlight(code: string, scopeName: string) {
  const ed = new Atom.TextEditor({
    readonly: true,
    keyboardInputEnabled: false,
    showInvisibles: false,
    tabLength: atom.config.get("editor.tabLength"),
  })
  const el = atom.views.getView(ed)
  try {
    el.setUpdatedSynchronously(true)
    el.style.pointerEvents = "none"
    el.style.position = "absolute"
    el.style.top = "100vh"
    el.style.width = "100vw"
    atom.grammars.assignLanguageMode(ed.getBuffer(), scopeName)
    ed.setText(code)
    ed.scrollToBufferPosition(ed.getBuffer().getEndPosition())
    atom.views.getView(atom.workspace).appendChild(el)
    await editorTokenized(ed)
    return Array.from(el.querySelectorAll(".line:not(.dummy)")).map((x) => x.innerHTML)
  } finally {
    el.remove()
  }
}

async function editorTokenized(editor: Atom.TextEditor) {
  return new Promise((resolve) => {
    const languageMode = editor.getBuffer().getLanguageMode()
    const nextUpdatePromise = editor.component.getNextUpdatePromise()
    if (languageMode.fullyTokenized || languageMode.tree) {
      resolve(nextUpdatePromise)
    } else {
      const disp = editor.onDidTokenize(() => {
        disp.dispose()
        resolve(nextUpdatePromise)
      })
    }
  })
}
