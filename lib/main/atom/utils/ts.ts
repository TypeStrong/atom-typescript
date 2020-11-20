import * as Atom from "atom"
import {Signature, SignatureParameter} from "atom-ide-base"
import * as path from "path"
import ts from "typescript"
import type {
  CodeEdit,
  FormatCodeSettings,
  Location,
  SignatureHelpItem,
  SignatureHelpParameter,
  TextSpan,
  UserPreferences,
} from "typescript/lib/protocol"

// NOTE: using TypeScript internals here. May be brittle!
declare module "typescript" {
  // tslint:disable-next-line: variable-name
  export const Diagnostics: {
    [key: string]: DiagnosticMessage
  }
}

export {TextSpan, CodeEdit, FormatCodeSettings, Location}
export const DiagnosticCategory = ts.DiagnosticCategory

export interface LocationRangeQuery extends Location {
  endLine: number
  endOffset: number
}

export interface FileLocationQuery extends Location {
  file: string
}

export function pointToLocation(point: Atom.PointLike): Location {
  return {line: point.row + 1, offset: point.column + 1}
}

export function locationToPoint(loc: Location): Atom.Point {
  return new Atom.Point(loc.line - 1, loc.offset - 1)
}

export function spanToRange(span: TextSpan): Atom.Range {
  return locationsToRange(span.start, span.end)
}

export function locationsToRange(start: Location, end: Location): Atom.Range {
  return new Atom.Range(locationToPoint(start), locationToPoint(end))
}

export function rangeToLocationRange(range: Atom.Range): LocationRangeQuery {
  return {
    line: range.start.row + 1,
    offset: range.start.column + 1,
    endLine: range.end.row + 1,
    endOffset: range.end.column + 1,
  }
}

export interface ProjectConfig {
  formatCodeOptions: FormatCodeSettings
  compileOnSave: boolean
  preferences: UserPreferences
}

export function getProjectConfig(configFile: string): ProjectConfig {
  const config = loadConfig(configFile)
  const options = (config as {formatCodeOptions?: FormatCodeSettings}).formatCodeOptions

  return {
    formatCodeOptions: {
      indentSize: atom.config.get("editor.tabLength"),
      tabSize: atom.config.get("editor.tabLength"),
      ...options,
    },
    compileOnSave: !!config.compileOnSave,
    preferences: config.preferences ? config.preferences : {},
  }
}

function loadConfig(configFile: string): Partial<ProjectConfig> {
  if (path.extname(configFile) !== ".json") {
    configFile = `${configFile}.json`
  }
  let {
    config,
  }: {
    config?: {[key: string]: unknown}
  } = ts.readConfigFile(configFile, (file) => ts.sys.readFile(file))
  if (config === undefined) return {}
  if (typeof config.extends === "string") {
    const extendsPath = path.join(path.dirname(configFile), config.extends)
    const extendsConfig = loadConfig(extendsPath)
    config = Object.assign({}, extendsConfig, config)
  }
  return config as ReturnType<typeof loadConfig>
}

export function signatureHelpItemToSignature(i: SignatureHelpItem): Signature {
  return {
    label:
      partsToStr(i.prefixDisplayParts) +
      i.parameters
        .map((x) => partsToStr(x.displayParts))
        .join(partsToStr(i.separatorDisplayParts)) +
      partsToStr(i.suffixDisplayParts),
    documentation: partsToStr(i.documentation),
    parameters: i.parameters.map(signatureHelpParameterToSignatureParameter),
  }
}

export function signatureHelpParameterToSignatureParameter(
  p: SignatureHelpParameter,
): SignatureParameter {
  return {
    label: partsToStr(p.displayParts),
    documentation: partsToStr(p.documentation),
  }
}

export function partsToStr(x: Array<{text: string}>): string {
  return x.map((i) => i.text).join("")
}

// tslint:disable-next-line: only-arrow-functions
export const checkDiagnosticCategory = (function () {
  let codeToCategory: Map<number, ts.DiagnosticCategory> | undefined
  // tslint:disable-next-line: only-arrow-functions
  return function (code: number | undefined, category: ts.DiagnosticCategory) {
    if (code === undefined) return true
    if (codeToCategory === undefined) {
      codeToCategory = new Map(Object.values(ts.Diagnostics).map((x) => [x.code, x.category]))
    }
    const cat = codeToCategory.get(code)
    if (cat === undefined) return true
    return cat === category
  }
})()
