var parent = require('../../worker/parent');
var atomConfig = require('./atomConfig');
var fs = require('fs');
var atomUtils = require('./atomUtils');
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
function triggerAutocompletePlus() {
    atom.commands.dispatch(atom.views.getView(atom.workspace.getActiveTextEditor()), 'autocomplete-plus:activate');
}
exports.triggerAutocompletePlus = triggerAutocompletePlus;
exports.provider = {
    selector: '.source.ts',
    requestHandler: function (options) {
        var filePath = options.editor.getPath();
        if (!filePath)
            return Promise.resolve([]);
        if (!fs.existsSync(filePath))
            return Promise.resolve([]);
        var pathMatchers = ['reference.path.string', 'require.path.string'];
        var lastScope = options.scope.scopes[options.scope.scopes.length - 1];
        if (pathMatchers.some(function (p) { return lastScope === p; })) {
            return parent.getRelativePathsInProject({ filePath: filePath, prefix: options.prefix }).then(function (resp) {
                return resp.files.map(function (file) {
                    return {
                        word: file.relativePath,
                        prefix: resp.endsInPunctuation ? '' : options.prefix,
                        label: '<span>' + file.relativePath + '</span>',
                        renderLabelAsHtml: true,
                        onDidConfirm: function () {
                            options.editor.moveToBeginningOfLine();
                            options.editor.selectToEndOfLine();
                            if (lastScope == 'reference.path.string') {
                                options.editor.replaceSelectedText(null, function () {
                                    return "/// <reference path='" + file.relativePath + "'/>";
                                });
                            }
                            if (lastScope == 'require.path.string') {
                                var alias = options.editor.getSelectedText().match(/^import\s*(\w*)\s*=/)[1];
                                options.editor.replaceSelectedText(null, function () {
                                    return "import " + alias + " = require('" + file.relativePath + "');";
                                });
                            }
                            options.editor.moveToEndOfLine();
                        }
                    };
                });
            });
        }
        else {
            var position = atomUtils.getEditorPositionForBufferPosition(options.editor, options.position);
            var promisedSuggestions = parent.updateText({ filePath: filePath, text: options.editor.getText() }).then(function () { return parent.getCompletionsAtPosition({
                filePath: filePath,
                position: position,
                prefix: options.prefix,
                maxSuggestions: atomConfig.maxSuggestions
            }); }).then(function (resp) {
                var completionList = resp.completions;
                var suggestions = completionList.map(function (c) {
                    return {
                        word: c.name,
                        prefix: resp.endsInPunctuation ? '' : options.prefix,
                        label: '<span style="color: ' + kindToColor(c.kind) + '">' + c.display + '</span>',
                        renderLabelAsHtml: true,
                    };
                });
                if (options.prefix == 'ref' && suggestions[0].word !== 'ref') {
                    suggestions.unshift({
                        word: 'ref',
                        prefix: 'ref',
                        label: 'add a reference tag',
                        renderLabelAsHtml: false,
                        isSnippet: true,
                        snippet: "/// <reference path='$1'/>"
                    });
                }
                return suggestions;
            });
            return promisedSuggestions;
        }
    }
};
//# sourceMappingURL=autoCompleteProvider.js.map