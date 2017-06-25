import {TextSpan, CodeEdit, Diagnostic, FormatCodeSettings, Location} from "typescript/lib/protocol"
import {Point, Range} from "atom"
import {loadProjectConfig} from "../../atomts"

export {TextSpan, CodeEdit, FormatCodeSettings, Location}

export interface LocationRangeQuery extends Location {
  endLine: number
  endOffset: number
}

export interface FileLocationQuery extends Location {
  file: string
}

export function pointToLocation(point: TextBuffer.IPoint): Location {
  return {line: point.row + 1, offset: point.column + 1}
}

export function locationToPoint(loc: Location): TextBuffer.IPoint {
  return new Point(loc.line - 1, loc.offset - 1)
}

export function spanToRange(span: TextSpan): TextBuffer.IRange {
  return locationsToRange(span.start, span.end)
}

export function locationsToRange(start: Location, end: Location): TextBuffer.IRange {
  return new Range(locationToPoint(start), locationToPoint(end))
}

export function rangeToLocationRange(range: TextBuffer.IRange): LocationRangeQuery {
  return {
    line: range.start.row + 1,
    offset: range.start.column + 1,
    endLine: range.end.row + 1,
    endOffset: range.end.column + 1,
  }
}

// Compare loc2 with loc1. The result is -1 if loc1 is smaller and 1 if it's larger.
export function compareLocation(loc1: Location, loc2: Location) {
  if (loc1.line < loc2.line) {
    return -1
  } else if (loc1.line > loc2.line) {
    return 1
  } else {
    if (loc1.offset < loc2.offset) {
      return -1
    } else if (loc1.offset > loc2.offset) {
      return 1
    } else {
      return 0
    }
  }
}

export function isLocationInRange(loc: Location, range: {start: Location; end: Location}) {
  return compareLocation(range.start, loc) != 1 && compareLocation(range.end, loc) !== -1
}

export async function getProjectCodeSettings(
  filePath: string,
  configFile?: string,
): Promise<FormatCodeSettings> {
  const config = await loadProjectConfig(filePath, configFile)
  const options = config.formatCodeOptions

  return {
    indentSize: atom.config.get("editor.tabLength"),
    tabSize: atom.config.get("editor.tabLength"),
    ...options,
  }
}
