var programManager = require('../lang/programManager');
var ts = require('typescript');
var fuzzaldrin = require('fuzzaldrin');
function kindToColor(kind) {
    switch (kind) {
        case 'interface':
            return 'rgb(16, 255, 0)';
        case 'keyword':
            return 'rgb(0, 207, 255)';
        case 'class':
            return 'rgb(255, 0, 194)';
        default:
            return 'white';
    }
}
var provider = {
    selector: '.source.ts',
    requestHandler: function (options) {
        var filePath = options.editor.getPath();
        var program = programManager.getOrCreateProgram(filePath);
        program.languageServiceHost.updateScript(filePath, options.editor.getText());
        var position = program.languageServiceHost.getIndexFromPosition(filePath, { line: options.position.row, ch: options.position.column });
        var completions = program.languageService.getCompletionsAtPosition(filePath, position);
        var completionList = completions ? completions.entries.filter(function (x) { return !!x; }) : [];
        if (options.prefix.length && options.prefix !== '.') {
            completionList = fuzzaldrin.filter(completionList, options.prefix, { key: 'name' });
        }
        if (completionList.length > 10)
            completionList = completionList.slice(0, 10);
        function docComment(c) {
            var completionDetails = program.languageService.getCompletionEntryDetails(filePath, position, c.name);
            if (c.kind == "method" || c.kind == "function") {
                var display = ts.displayPartsToString(completionDetails.displayParts || []);
            }
            else {
                var display = c.kind;
            }
            var comment = ts.displayPartsToString(completionDetails.documentation || []);
            return { display: display, comment: comment };
        }
        console.log(completionList.map(docComment));
        var suggestions = completionList.map(function (c) {
            return {
                word: c.name,
                prefix: options.prefix == '.' ? '' : options.prefix,
                label: '<span style="color: ' + kindToColor(c.kind) + '">' + docComment(c).display + '</span>',
                renderLabelAsHtml: true,
            };
        });
        return suggestions;
    }
};
module.exports = provider;
