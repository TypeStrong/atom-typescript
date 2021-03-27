import {TextBuffer} from "atom"
import type {LanguageMode} from "./highlighter-types"

function eventLoopYielder(delayMs: number, maxTimeMs: number) {
  const started = performance.now()
  let lastYield = started
  // tslint:disable-next-line: only-arrow-functions
  return async function (): Promise<boolean> {
    const now = performance.now()
    if (now - lastYield > delayMs) {
      await new Promise(setImmediate)
      lastYield = now
    }
    return now - started <= maxTimeMs
  }
}

/** Throws maximum time reached error */
function maxTimeError(name: string, timeS: number) {
  const err = new Error("Max time reached")
  atom.notifications.addError(`${name} took more than ${timeS} seconds to complete`, {
    dismissable: true,
    description: `${name} took too long to complete and was terminated.`,
    stack: err.stack,
  })
  return err
}

export async function highlight(sourceCode: string, scopeName: string) {
  const yielder = eventLoopYielder(100, 5000)
  const buf = new TextBuffer()
  try {
    const grammar = atom.grammars.grammarForId(scopeName)
    const lm = atom.grammars.languageModeForGrammarAndBuffer(grammar, buf)
    buf.setLanguageMode(lm)
    buf.setText(sourceCode)
    const end = buf.getEndPosition()
    if (lm.startTokenizing) lm.startTokenizing()
    await tokenized(lm)
    const iter = lm.buildHighlightIterator()
    if (iter.getOpenScopeIds && iter.getCloseScopeIds) {
      let pos = {row: 0, column: 0}
      iter.seek(pos)
      const res = []
      while (pos.row < end.row || (pos.row === end.row && pos.column <= end.column)) {
        res.push(
          ...iter.getCloseScopeIds().map(() => "</span>"),
          ...iter.getOpenScopeIds().map((x) => `<span class="${lm.classNameForScopeId(x)}">`),
        )
        iter.moveToSuccessor()
        const nextPos = iter.getPosition()
        res.push(escapeHTML(buf.getTextInRange([pos, nextPos])))

        if (!(await yielder())) {
          console.error(maxTimeError("Atom-TypeScript: Highlighter", 5))
          break
        }
        pos = nextPos
      }
      return res.join("")
    } else {
      return sourceCode
    }
  } finally {
    buf.destroy()
  }
}

async function tokenized(lm: LanguageMode) {
  return new Promise((resolve) => {
    if (lm.fullyTokenized || lm.tree) {
      resolve(undefined)
    } else if (lm.onDidTokenize) {
      const disp = lm.onDidTokenize(() => {
        disp.dispose()
        resolve(undefined)
      })
    } else {
      resolve(undefined) // null language mode
    }
  })
}

function escapeHTML(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
