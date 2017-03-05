"use strict";
var os_1 = require("os");
var displayPartsToString = ts.displayPartsToString, typeToDisplayParts = ts.typeToDisplayParts;
var getIdentifierUtil_1 = require("../getIdentifierUtil");
var AddImportFromStatementNoBrackets = (function () {
    function AddImportFromStatementNoBrackets() {
        this.key = AddImportFromStatementNoBrackets.name;
    }
    AddImportFromStatementNoBrackets.prototype.canProvideFix = function (info) {
        var relevantError = info.positionErrors.filter(function (x) { return x.code == 2304; })[0];
        if (!relevantError)
            return;
        if (info.positionNode.kind !== ts.SyntaxKind.Identifier)
            return;
        var matches = getIdentifierUtil_1.getIdentifierAndFileNames(relevantError, info.project);
        if (!matches)
            return;
        var identifierName = matches.identifierName, file = matches.file;
        return file ? { display: "import " + identifierName + " from \"" + file + "\"" } : undefined;
    };
    AddImportFromStatementNoBrackets.prototype.provideFix = function (info) {
        var relevantError = info.positionErrors.filter(function (x) { return x.code == 2304; })[0];
        var identifier = info.positionNode;
        var identifierName = identifier.text;
        var fileNameforFix = getIdentifierUtil_1.getIdentifierAndFileNames(relevantError, info.project);
        var refactorings = [{
                span: {
                    start: 0,
                    length: 0
                },
                newText: "import " + identifierName + " from \"" + fileNameforFix.file + "\";" + os_1.EOL,
                filePath: info.sourceFile.fileName
            }];
        return refactorings;
    };
    return AddImportFromStatementNoBrackets;
}());
exports.AddImportFromStatementNoBrackets = AddImportFromStatementNoBrackets;
