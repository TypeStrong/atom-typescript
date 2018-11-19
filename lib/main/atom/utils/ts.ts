import * as Atom from "atom"
import {Signature, SignatureParameter} from "atom/ide"
import * as tsconfig from "tsconfig"
import {
  CodeEdit,
  FormatCodeSettings,
  Location,
  SignatureHelpItem,
  SignatureHelpParameter,
  TextSpan,
} from "typescript/lib/protocol"

export {TextSpan, CodeEdit, FormatCodeSettings, Location}

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

export async function getProjectConfig(
  configFile: string,
): Promise<{
  formatCodeOptions: FormatCodeSettings
  compileOnSave: boolean
}> {
  const config = await loadConfig(configFile)
  const options = config.formatCodeOptions

  return {
    formatCodeOptions: {
      indentSize: atom.config.get("editor.tabLength"),
      tabSize: atom.config.get("editor.tabLength"),
      ...options,
    },
    compileOnSave: !!config.compileOnSave,
  }
}

async function loadConfig(
  configFile: string,
): Promise<{
  formatCodeOptions?: FormatCodeSettings
  compileOnSave?: boolean
}> {
  try {
    const {config} = await tsconfig.load(configFile)
    return config as ReturnType<typeof loadConfig>
  } catch (e) {
    atom.notifications.addWarning(`Failed to parse ${atom.project.relativize(configFile)}`, {
      detail: `The error was: ${(e as Error).message}`,
      dismissable: true,
    })
    return {}
  }
}

export function signatureHelpItemToSignature(i: SignatureHelpItem): Signature {
  return {
    label:
      partsToStr(i.prefixDisplayParts) +
      i.parameters.map(x => partsToStr(x.displayParts)).join(partsToStr(i.separatorDisplayParts)) +
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
  return x.map(i => i.text).join("")
}
