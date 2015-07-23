var os_1 = require("os");
var displayPartsToString = ts.displayPartsToString, typeToDisplayParts = ts.typeToDisplayParts;
var getPathCompletions_1 = require("../../modules/getPathCompletions");
function getIdentifierAndFileNames(error, project) {
    var errorText = error.messageText;
    if (typeof errorText !== 'string') {
        return undefined;
    }
    ;
    var match = errorText.match(/Cannot find name \'(\w+)\'./);
    if (!match)
        return;
    var identifierName = match[1];
    var files = getPathCompletions_1.getPathCompletions({
        project: project,
        filePath: error.file.fileName,
        prefix: identifierName,
        includeExternalModules: false
    }).files;
    var file = files.length > 0 ? files[0].relativePath : undefined;
    var basename = files.length > 0 ? files[0].name : undefined;
    return { identifierName: identifierName, file: file, basename: basename };
}
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
        var matches = getIdentifierAndFileNames(relevantError, info.project);
        if (!matches)
            return;
        var identifierName = matches.identifierName, file = matches.file;
        return file ? { display: "import " + identifierName + " = require(\"" + file + "\")" } : undefined;
    };
    AddImportStatement.prototype.provideFix = function (info) {
        var relevantError = info.positionErrors.filter(function (x) { return x.code == 2304; })[0];
        var identifier = info.positionNode;
        var identifierName = identifier.text;
        var fileNameforFix = getIdentifierAndFileNames(relevantError, info.project);
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
})();
exports.AddImportStatement = AddImportStatement;
