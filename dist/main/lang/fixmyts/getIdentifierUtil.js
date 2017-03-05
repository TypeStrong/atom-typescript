"use strict";
var getPathCompletions_1 = require("../modules/getPathCompletions");
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
exports.getIdentifierAndFileNames = getIdentifierAndFileNames;
