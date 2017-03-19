import {TextSpan, CodeEdit, FormatCodeSettings} from "typescript/lib/protocol"
import {Point, Range} from "atom"

export {TextSpan, CodeEdit, FormatCodeSettings}

export interface LocationQuery {
  line: number
  offset: number
}

export interface LocationRangeQuery extends LocationQuery {
  endLine: number
  endOffset: number
}

export interface FileLocationQuery extends LocationQuery {
  file: string
}

export function locationToPoint(loc: LocationQuery): TextBuffer.IPoint {
  return new Point(loc.line-1, loc.offset-1)
}

export function spanToRange(span: TextSpan): TextBuffer.IRange {
  return locationsToRange(span.start, span.end)
}

export function locationsToRange(start: LocationQuery, end: LocationQuery): TextBuffer.IRange {
  return new Range(locationToPoint(start), locationToPoint(end))
}

export function rangeToLocationRange(range: TextBuffer.IRange): LocationRangeQuery {
  return {
    line: range.start.row + 1,
    offset: range.start.column + 1,
    endLine: range.end.row + 1,
    endOffset: range.end.column + 1
  }
}
