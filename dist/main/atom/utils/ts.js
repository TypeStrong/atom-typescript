"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Atom = require("atom");
const tsconfig = require("tsconfig");
function pointToLocation(point) {
    return { line: point.row + 1, offset: point.column + 1 };
}
exports.pointToLocation = pointToLocation;
function locationToPoint(loc) {
    return new Atom.Point(loc.line - 1, loc.offset - 1);
}
exports.locationToPoint = locationToPoint;
function spanToRange(span) {
    return locationsToRange(span.start, span.end);
}
exports.spanToRange = spanToRange;
function locationsToRange(start, end) {
    return new Atom.Range(locationToPoint(start), locationToPoint(end));
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
async function getProjectConfig(configFile) {
    const config = await loadConfig(configFile);
    const options = config.formatCodeOptions;
    return {
        formatCodeOptions: Object.assign({ indentSize: atom.config.get("editor.tabLength"), tabSize: atom.config.get("editor.tabLength") }, options),
        compileOnSave: !!config.compileOnSave,
    };
}
exports.getProjectConfig = getProjectConfig;
async function loadConfig(configFile) {
    try {
        const { config } = await tsconfig.load(configFile);
        return config;
    }
    catch (e) {
        atom.notifications.addWarning(`Failed to parse ${atom.project.relativize(configFile)}`, {
            detail: `The error was: ${e.message}`,
            dismissable: true,
        });
        return {};
    }
}
function signatureHelpItemToSignature(i) {
    return {
        label: partsToStr(i.prefixDisplayParts) +
            i.parameters.map(x => partsToStr(x.displayParts)).join(partsToStr(i.separatorDisplayParts)) +
            partsToStr(i.suffixDisplayParts),
        documentation: partsToStr(i.documentation),
        parameters: i.parameters.map(signatureHelpParameterToSignatureParameter),
    };
}
exports.signatureHelpItemToSignature = signatureHelpItemToSignature;
function signatureHelpParameterToSignatureParameter(p) {
    return {
        label: partsToStr(p.displayParts),
        documentation: partsToStr(p.documentation),
    };
}
exports.signatureHelpParameterToSignatureParameter = signatureHelpParameterToSignatureParameter;
function partsToStr(x) {
    return x.map(i => i.text).join("");
}
exports.partsToStr = partsToStr;
//# sourceMappingURL=ts.js.map