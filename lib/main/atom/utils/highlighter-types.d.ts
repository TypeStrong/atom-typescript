import {Disposable, TextBuffer} from "atom"
import type {} from "../../../typings/atom" // pull in types
export {LanguageMode}

interface LanguageMode {
  readonly fullyTokenized?: boolean
  readonly tree?: boolean
  onDidTokenize?(cb: () => void): Disposable
  buildHighlightIterator(): HighlightIterator
  classNameForScopeId(id: ScopeId): string
  startTokenizing?(): void
}

interface HighlightIterator {
  seek(pos: {row: number; column: number}): void
  getPosition(): {row: number; column: number}
  getOpenScopeIds?(): ScopeId[]
  getCloseScopeIds?(): ScopeId[]
  moveToSuccessor(): void
}

interface ScopeId {}

declare module "atom/dependencies/text-buffer/src/text-buffer" {
  interface TextBuffer {
    setLanguageMode(lm: LanguageMode): void
  }
}

declare module "atom" {
  interface GrammarRegistry {
    grammarForId(id: string): Grammar
    languageModeForGrammarAndBuffer(g: Grammar, b: TextBuffer): LanguageMode
  }
}
