function getRefactoringsByFilePath(refactorings) {
    var loc = {};
    for (var _i = 0; _i < refactorings.length; _i++) {
        var refac = refactorings[_i];
        if (!loc[refac.filePath])
            loc[refac.filePath] = [];
        loc[refac.filePath].push(refac);
    }
    return loc;
}
exports.getRefactoringsByFilePath = getRefactoringsByFilePath;
