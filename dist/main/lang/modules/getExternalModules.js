var typescript_1 = require("typescript");
function getExternalModuleNames(program) {
    var entries = [];
    program.getSourceFiles().forEach(function (sourceFile) {
        typescript_1.forEachChild(sourceFile, function (child) {
            if (child.kind === 205 && child.name.kind === 8) {
                entries.push(child.name.text);
            }
        });
    });
    return entries;
}
exports.getExternalModuleNames = getExternalModuleNames;
