var programManager = require('../lang/programManager');
var fuzzaldrin = require('fuzzaldrin');
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
        var suggestions = completionList.map(function (c) {
            return {
                word: c.name,
                prefix: options.prefix == '.' ? '' : options.prefix
            };
        });
        return suggestions;
    }
};
module.exports = provider;
