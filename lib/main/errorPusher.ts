import {debounce} from "lodash"
import {Diagnostic} from "typescript/lib/protocol"
import {Linter, LinterMessage} from "../typings/linter"
import {locationsToRange, systemPath} from "./atom/utils"

/** Class that collects errors from all of the clients and pushes them to the Linter service */
export class ErrorPusher {
  private linter?: Linter
  private errors: Map<string, Map<string, Diagnostic[]>> = new Map()
  private unusedAsInfo = true

  /** Set errors. Previous errors with the same prefix and filePath are going to be replaced */
  setErrors(prefix: string | undefined, filePath: string | undefined, errors: Diagnostic[]) {
    if (prefix == undefined || filePath == undefined) {
      console.warn("setErrors: prefix or filePath is undefined", prefix, filePath)
      return
    }

    let prefixed = this.errors.get(prefix)
    if (!prefixed) {
      prefixed = new Map()
      this.errors.set(prefix, prefixed)
    }

    prefixed.set(filePath, errors)

    this.pushErrors()
  }

  setUnusedAsInfo(unusedAsInfo: boolean) {
    this.unusedAsInfo = unusedAsInfo
  }

  /** Clear all errors */
  clear() {
    if (this.linter) {
      this.linter.deleteMessages()
    }
  }

  setLinter(linter: Linter) {
    this.linter = linter
    this.pushErrors()
  }

  private pushErrors = debounce(() => {
    const errors: LinterMessage[] = []

    for (const fileErrors of this.errors.values()) {
      for (const [filePath, diagnostics] of fileErrors) {
        const _filePath = systemPath(filePath)
        for (const diagnostic of diagnostics) {
          errors.push({
            type: this.unusedAsInfo && diagnostic.code === 6133 ? "Info" : "Error",
            text: diagnostic.text,
            filePath: _filePath,
            range: diagnostic.start ? locationsToRange(diagnostic.start, diagnostic.end) : undefined
          })
        }
      }
    }

    if (this.linter) {
      this.linter.setMessages(errors)
    }
  }, 100)
}
