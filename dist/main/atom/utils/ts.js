"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
function locationToPoint(loc) {
    return new atom_1.Point(loc.line - 1, loc.offset - 1);
}
exports.locationToPoint = locationToPoint;
function spanToRange(span) {
    return locationsToRange(span.start, span.end);
}
exports.spanToRange = spanToRange;
function locationsToRange(start, end) {
    return new atom_1.Range(locationToPoint(start), locationToPoint(end));
}
exports.locationsToRange = locationsToRange;
function rangeToLocationRange(range) {
    return {
        line: range.start.row + 1,
        offset: range.start.column + 1,
        endLine: range.end.row + 1,
        endOffset: range.end.column + 1
    };
}
exports.rangeToLocationRange = rangeToLocationRange;
//# sourceMappingURL=ts.js.map