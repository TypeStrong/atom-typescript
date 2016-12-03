"use strict";
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
