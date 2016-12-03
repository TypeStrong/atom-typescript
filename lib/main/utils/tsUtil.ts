import {Location, TextSpan} from "typescript/lib/protocol"
import {Point, Range} from "atom"

export function locationToPoint(loc: Location): TextBuffer.IPoint {
  return new Point(loc.line-1, loc.offset-1)
}

export function spanToRange(span: TextSpan): TextBuffer.IRange {
  return locationsToRange(span.start, span.end)
}

export function locationsToRange(start, end): TextBuffer.IRange {
  return new Range(locationToPoint(start), locationToPoint(end))
}
