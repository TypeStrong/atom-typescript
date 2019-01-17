"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Atom = require("atom");
const path = require("path");
const ts = require("typescript");
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
function getProjectConfig(configFile) {
    const config = loadConfig(configFile);
    const options = config.formatCodeOptions;
    return {
        formatCodeOptions: Object.assign({ indentSize: atom.config.get("editor.tabLength"), tabSize: atom.config.get("editor.tabLength") }, options),
        compileOnSave: !!config.compileOnSave,
    };
}
exports.getProjectConfig = getProjectConfig;
function loadConfig(configFile) {
    if (path.extname(configFile) !== ".json") {
        configFile = `${configFile}.json`;
    }
    let { config, } = ts.readConfigFile(configFile, file => ts.sys.readFile(file));
    if (config === undefined)
        return {};
    if (typeof config.extends === "string") {
        const extendsPath = path.join(path.dirname(configFile), config.extends);
        const extendsConfig = loadConfig(extendsPath);
        config = Object.assign({}, extendsConfig, config);
    }
    return config;
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