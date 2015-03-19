import project = require('../core/project');

export function formatDocument(proj: project.Project, filePath: string): CodeEdit[] {
    var textChanges = proj.languageService.getFormattingEditsForDocument(filePath, proj.projectFile.project.formatCodeOptions);

    var edits: CodeEdit[] = textChanges.map(change=> {
        return {
            start: proj.languageServiceHost.getPositionFromIndex(filePath, change.span.start),
            end: proj.languageServiceHost.getPositionFromIndex(filePath, change.span.start + change.span.length),
            newText: change.newText
        };
    });

    return edits;
}
export function formatDocumentRange(proj: project.Project, filePath: string, start: EditorPosition, end: EditorPosition): CodeEdit[] {
    var st = proj.languageServiceHost.getIndexFromPosition(filePath, start);
    var ed = proj.languageServiceHost.getIndexFromPosition(filePath, end);
    var textChanges = proj.languageService.getFormattingEditsForRange(filePath, st, ed, proj.projectFile.project.formatCodeOptions);

    var edits: CodeEdit[] = textChanges.map(change=> {
        return {
            start: proj.languageServiceHost.getPositionFromIndex(filePath, change.span.start),
            end: proj.languageServiceHost.getPositionFromIndex(filePath, change.span.start + change.span.length),
            newText: change.newText
        };
    });
    return edits;
}
