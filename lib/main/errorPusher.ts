import {debounce} from "lodash"
import {Diagnostic, Location} from "typescript/lib/protocol"
import {IndieDelegate, Message} from "atom/linter"
import {locationsToRange, isLocationInRange} from "./atom/utils"
import {CompositeDisposable} from "atom"
import * as path from "path"

/** Class that collects errors from all of the clients and pushes them to the Linter service */
export class ErrorPusher {
  private linter?: IndieDelegate
  private errors: Map<string, Map<string, Diagnostic[]>> = new Map()
  private unusedAsInfo = true
  private subscriptions = new CompositeDisposable()

  constructor() {
    this.subscriptions.add(
      atom.config.observe("atom-typescript.unusedAsInfo", (unusedAsInfo: boolean) => {
        this.unusedAsInfo = unusedAsInfo
      }),
    )
    this.pushErrors = debounce(this.pushErrors.bind(this), 100)
  }

  /** Return any errors that cover the given location */
  public getErrorsAt(filePath: string, loc: Location): Diagnostic[] {
    const result: Diagnostic[] = []
    for (const prefixed of this.errors.values()) {
      const errors = prefixed.get(path.normalize(filePath))
      if (errors) {
        result.push(...errors.filter(err => isLocationInRange(loc, err)))
      }
    }
    return result
  }

  /** Set errors. Previous errors with the same prefix and filePath are going to be replaced */
  public setErrors(prefix: string, filePath: string, errors: Diagnostic[]) {
    let prefixed = this.errors.get(prefix)
    if (!prefixed) {
      prefixed = new Map()
      this.errors.set(prefix, prefixed)
    }

    prefixed.set(path.normalize(filePath), errors)

    this.pushErrors()
  }

  /** Clear all errors */
  public clear() {
    if (this.linter) {
      this.linter.clearMessages()
    }
  }

  public setLinter(linter: IndieDelegate) {
    this.linter = linter
    this.pushErrors()
  }

  public dispose() {
    this.subscriptions.dispose()
    this.clear()
  }

  private pushErrors() {
    const errors: Message[] = []
    const config = atom.config.get("atom-typescript")

    if (!config.suppressAllDiagnostics) {
      for (const fileErrors of this.errors.values()) {
        for (const [filePath, diagnostics] of fileErrors) {
          for (const diagnostic of diagnostics) {
            if (config.ignoredDiagnosticCodes.includes(`${diagnostic.code}`)) continue
            if (config.ignoreUnusedSuggestionDiagnostics && diagnostic.reportsUnnecessary) continue
            // Add a bit of extra validation that we have the necessary locations since linter v2
            // does not allow range-less messages anymore. This happens with configFileDiagnostics.
            let {start, end} = diagnostic as Partial<Diagnostic>
            if (!start || !end) {
              start = end = {line: 1, offset: 1}
            }

            errors.push({
              severity: this.getSeverity(diagnostic),
              excerpt: diagnostic.text,
              location: {
                file: filePath,
                position: locationsToRange(start, end),
              },
            })
          }
        }
      }
    }

    if (this.linter) {
      this.linter.setAllMessages(errors)
    }
  }

  private getSeverity(diagnostic: Diagnostic) {
    if (this.unusedAsInfo && diagnostic.code === 6133) return "info"
    switch (diagnostic.category) {
      case "error":
        return "error"
      case "warning":
        return "warning"
      default:
        return "info"
    }
  }
}
