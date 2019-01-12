import {Point, Range} from "atom"
import {IndieDelegate, Message} from "atom/linter"
import {debounce} from "lodash"
import * as path from "path"
import {Diagnostic} from "typescript/lib/protocol"
import {DiagnosticTypes} from "../client/clientResolver"
import {locationsToRange, spanToRange} from "./atom/utils"

/** Class that collects errors from all of the clients and pushes them to the Linter service */
export class ErrorPusher {
  private linter?: IndieDelegate
  private errors: Map<string, Map<string, Diagnostic[]>> = new Map()

  constructor() {
    this.pushErrors = debounce(this.pushErrors.bind(this), 100)
  }

  public *getErrorsInRange(filePath: string, range: Range): IterableIterator<Diagnostic> {
    for (const prefixed of this.errors.values()) {
      const errors = prefixed.get(path.normalize(filePath))
      if (errors) yield* errors.filter(err => spanToRange(err).intersectsWith(range))
    }
  }

  /** Return any errors that cover the given location */
  public *getErrorsAt(filePath: string, loc: Point): IterableIterator<Diagnostic> {
    for (const prefixed of this.errors.values()) {
      const errors = prefixed.get(path.normalize(filePath))
      if (errors) yield* errors.filter(err => spanToRange(err).containsPoint(loc))
    }
  }

  /** Set errors. Previous errors with the same prefix and filePath are going to be replaced */
  public setErrors(prefix: DiagnosticTypes, filePath: string, errors: Diagnostic[]) {
    let prefixed = this.errors.get(prefix)
    if (!prefixed) {
      prefixed = new Map()
      this.errors.set(prefix, prefixed)
    }

    prefixed.set(path.normalize(filePath), errors)

    this.pushErrors()
  }

  public clearFileErrors(filePath: string) {
    for (const map of this.errors.values()) {
      map.delete(filePath)
    }
    this.pushErrors()
  }

  public clear() {
    if (!this.linter) return
    this.linter.clearMessages()
  }

  public setLinter(linter: IndieDelegate) {
    this.linter = linter
    this.pushErrors()
  }

  public dispose() {
    this.clear()
    if (this.linter) this.linter.dispose()
    this.linter = undefined
  }

  private pushErrors() {
    if (this.linter) this.linter.setAllMessages(Array.from(this.getLinterErrors()))
  }

  private *getLinterErrors(): IterableIterator<Message> {
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

            yield {
              severity: this.getSeverity(config.unusedAsInfo, diagnostic),
              excerpt: diagnostic.text,
              location: {
                file: filePath,
                position: locationsToRange(start, end),
              },
            }
          }
        }
      }
    }
  }

  private getSeverity(unusedAsInfo: boolean, diagnostic: Diagnostic) {
    if (unusedAsInfo && diagnostic.code === 6133) return "info"
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
