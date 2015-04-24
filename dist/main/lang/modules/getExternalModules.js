// From https://github.com/Microsoft/TypeScript/pull/2173/files
function getExternalModuleNames(program) {
    var entries = [];
    program.getSourceFiles().forEach(function (sourceFile) {
        ts.forEachChild(sourceFile, function (child) {
            if (child.kind === 205 && child.name.kind === 8) {
                entries.push(child.name.text);
            }
        });
    });
    return entries;
}
exports.getExternalModuleNames = getExternalModuleNames;
