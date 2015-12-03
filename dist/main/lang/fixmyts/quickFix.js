"use strict";
function getRefactoringsByFilePath(refactorings) {
    var loc = {};
    for (var _i = 0, refactorings_1 = refactorings; _i < refactorings_1.length; _i++) {
        var refac = refactorings_1[_i];
        if (!loc[refac.filePath])
            loc[refac.filePath] = [];
        loc[refac.filePath].push(refac);
    }
    for (var filePath in loc) {
        var refactorings_2 = loc[filePath];
        refactorings_2.sort(function (a, b) {
            return (b.span.start - a.span.start);
        });
    }
    return loc;
}
exports.getRefactoringsByFilePath = getRefactoringsByFilePath;
