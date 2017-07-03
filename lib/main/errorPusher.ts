import {debounce} from "lodash"
import {Diagnostic, Location} from "typescript/lib/protocol"
import {Linter, LinterMessage} from "../typings/linter"
import {locationsToRange, systemPath, isLocationInRange} from "./atom/utils"

/** Class that collects errors from all of the clients and pushes them to the Linter service */
export class ErrorPusher {
  private linter?: Linter
  private errors: Map<string, Map<string, Diagnostic[]>> = new Map()
  private unusedAsInfo = true

  /** Return any errors that cover the given location */
  getErrorsAt(filePath: string, loc: Location): Diagnostic[] {
    const result: Diagnostic[] = []
    for (const prefixed of this.errors.values()) {
      const errors = prefixed.get(filePath)
      if (errors) {
        result.push(...errors.filter(err => isLocationInRange(loc, err)))
      }
    }
    return result
  }

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
      this.linter.clearMessages()
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
          // Add a bit of extra validation that we have the necessary locations since linter v2
          // does not allow range-less messages anymore. This happens with configFileDiagnostics.
          let {start, end} = diagnostic
          if (!start || !end) {
            start = end = {line: 1, offset: 1}
          }

          errors.push({
            severity: this.unusedAsInfo && diagnostic.code === 6133 ? "info" : "error",
            excerpt: diagnostic.text,
            location: {
              file: _filePath,
              position: locationsToRange(start, end),
            },
          })
        }
      }
    }

    if (this.linter) {
      this.linter.setAllMessages(errors)
    }
  }, 100)
}
