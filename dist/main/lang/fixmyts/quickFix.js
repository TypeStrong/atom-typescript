function getRefactoringsByFilePath(refactorings) {
    var loc = {};
    for (var _i = 0; _i < refactorings.length; _i++) {
        var refac = refactorings[_i];
        if (!loc[refac.filePath])
            loc[refac.filePath] = [];
        loc[refac.filePath].push(refac);
    }
    for (var filePath in loc) {
        var refactorings_1 = loc[filePath];
        refactorings_1.sort(function (a, b) {
            return (b.span.start - a.span.start);
        });
    }
    return loc;
}
exports.getRefactoringsByFilePath = getRefactoringsByFilePath;
