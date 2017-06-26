"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const atom_1 = require("atom");
const atomts_1 = require("../../atomts");
function pointToLocation(point) {
    return { line: point.row + 1, offset: point.column + 1 };
}
exports.pointToLocation = pointToLocation;
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
        endOffset: range.end.column + 1,
    };
}
exports.rangeToLocationRange = rangeToLocationRange;
// Compare loc2 with loc1. The result is -1 if loc1 is smaller and 1 if it's larger.
function compareLocation(loc1, loc2) {
    if (loc1.line < loc2.line) {
        return -1;
    }
    else if (loc1.line > loc2.line) {
        return 1;
    }
    else {
        if (loc1.offset < loc2.offset) {
            return -1;
        }
        else if (loc1.offset > loc2.offset) {
            return 1;
        }
        else {
            return 0;
        }
    }
}
exports.compareLocation = compareLocation;
function isLocationInRange(loc, range) {
    return compareLocation(range.start, loc) != 1 && compareLocation(range.end, loc) !== -1;
}
exports.isLocationInRange = isLocationInRange;
function getProjectCodeSettings(filePath, configFile) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const config = yield atomts_1.loadProjectConfig(filePath, configFile);
        const options = config.formatCodeOptions;
        return Object.assign({ indentSize: atom.config.get("editor.tabLength"), tabSize: atom.config.get("editor.tabLength") }, options);
    });
}
exports.getProjectCodeSettings = getProjectCodeSettings;
//# sourceMappingURL=ts.js.map