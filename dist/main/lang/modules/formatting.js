function formatDocument(proj, filePath) {
    var textChanges = proj.languageService.getFormattingEditsForDocument(filePath, proj.projectFile.project.formatCodeOptions);
    var edits = textChanges.map(function (change) {
        return {
            start: proj.languageServiceHost.getPositionFromIndex(filePath, change.span.start),
            end: proj.languageServiceHost.getPositionFromIndex(filePath, change.span.start + change.span.length),
            newText: change.newText
        };
    });
    return edits;
}
exports.formatDocument = formatDocument;
function formatDocumentRange(proj, filePath, start, end) {
    var st = proj.languageServiceHost.getIndexFromPosition(filePath, start);
    var ed = proj.languageServiceHost.getIndexFromPosition(filePath, end);
    var textChanges = proj.languageService.getFormattingEditsForRange(filePath, st, ed, proj.projectFile.project.formatCodeOptions);
    var edits = textChanges.map(function (change) {
        return {
            start: proj.languageServiceHost.getPositionFromIndex(filePath, change.span.start),
            end: proj.languageServiceHost.getPositionFromIndex(filePath, change.span.start + change.span.length),
            newText: change.newText
        };
    });
    return edits;
}
exports.formatDocumentRange = formatDocumentRange;
