var os_1 = require("os");
var displayPartsToString = ts.displayPartsToString, typeToDisplayParts = ts.typeToDisplayParts;
function getIdentifierAndFileNames(error, getRelativePathsInProject) {
    var errorText = error.messageText;
    if (typeof errorText !== 'string') {
        return undefined;
    }
    ;
    var match = errorText.match(/Cannot find name \'(\w+)\'./);
    if (!match)
        return;
    var identifierName = match[1];
    var files = getRelativePathsInProject({ filePath: error.file.fileName, prefix: identifierName, includeExternalModules: false }).files;
    var file = files.length > 0 ? files[0].relativePath : undefined;
    var basename = files.length > 0 ? files[0].name : undefined;
    return { identifierName: identifierName, file: file, basename: basename };
}
var AddImportStatement = (function () {
    function AddImportStatement(getRelativePathsInProject) {
        this.getRelativePathsInProject = getRelativePathsInProject;
        this.key = AddImportStatement.name;
    }
    AddImportStatement.prototype.canProvideFix = function (info) {
        var relevantError = info.positionErrors.filter(function (x) { return x.code == 2304; })[0];
        if (!relevantError)
            return;
        if (info.positionNode.kind !== 65)
            return;
        var _a = getIdentifierAndFileNames(relevantError, this.getRelativePathsInProject), identifierName = _a.identifierName, file = _a.file;
        return file ? "import " + identifierName + "= require(\"" + file + "\")" : undefined;
    };
    AddImportStatement.prototype.provideFix = function (info) {
        var relevantError = info.positionErrors.filter(function (x) { return x.code == 2304; })[0];
        var identifier = info.positionNode;
        var identifierName = identifier.text;
        var fileNameforFix = getIdentifierAndFileNames(relevantError, this.getRelativePathsInProject);
        var refactorings = [{
                span: {
                    start: 0,
                    length: 0
                },
                newText: "import " + fileNameforFix.basename + " = require(\"" + fileNameforFix.file + "\");" + os_1.EOL,
                filePath: info.srcFile.fileName
            }];
        return refactorings;
    };
    return AddImportStatement;
})();
exports.default = AddImportStatement;
