"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var os_1 = require("os");
var displayPartsToString = ts.displayPartsToString, typeToDisplayParts = ts.typeToDisplayParts;
var getIdentifierUtil_1 = require("../getIdentifierUtil");
var AddImportStatement = (function () {
    function AddImportStatement() {
        this.key = AddImportStatement.name;
    }
    AddImportStatement.prototype.canProvideFix = function (info) {
        var relevantError = info.positionErrors.filter(function (x) { return x.code == 2304; })[0];
        if (!relevantError)
            return;
        if (info.positionNode.kind !== ts.SyntaxKind.Identifier)
            return;
        var matches = getIdentifierUtil_1.getIdentifierAndFileNames(relevantError, info.project);
        if (!matches)
            return;
        var identifierName = matches.identifierName, file = matches.file;
        return file ? { display: "import " + identifierName + " = require(\"" + file + "\")" } : undefined;
    };
    AddImportStatement.prototype.provideFix = function (info) {
        var relevantError = info.positionErrors.filter(function (x) { return x.code == 2304; })[0];
        var identifier = info.positionNode;
        var identifierName = identifier.text;
        var fileNameforFix = getIdentifierUtil_1.getIdentifierAndFileNames(relevantError, info.project);
        var refactorings = [{
                span: {
                    start: 0,
                    length: 0
                },
                newText: "import " + identifierName + " = require(\"" + fileNameforFix.file + "\");" + os_1.EOL,
                filePath: info.sourceFile.fileName
            }];
        return refactorings;
    };
    return AddImportStatement;
}());
exports.AddImportStatement = AddImportStatement;
