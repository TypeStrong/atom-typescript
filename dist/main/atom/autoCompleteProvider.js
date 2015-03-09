var parent = require('../../worker/parent');
var atomConfig = require('./atomConfig');
var fs = require('fs');
var atomUtils = require('./atomUtils');
var fuzzaldrin = require('fuzzaldrin');
var CSON = require("season");
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
var tsSnipPrefixLookup = {};
function loadSnippets() {
    var confPath = atom.getConfigDirPath();
    CSON.readFile(confPath + "/packages/atom-typescript/snippets/typescript-snippets.cson", function (err, snippetsRoot) {
        if (err)
            return;
        if (!snippetsRoot || !snippetsRoot['.source.ts'])
            return;
        var tsSnippets = snippetsRoot['.source.ts'];
        for (var snippetName in tsSnippets) {
            if (tsSnippets.hasOwnProperty(snippetName)) {
                tsSnipPrefixLookup[tsSnippets[snippetName].prefix] = {
                    body: tsSnippets[snippetName].body,
                    name: snippetName
                };
            }
        }
    });
}
loadSnippets();
exports.provider = {
    selector: '.source.ts',
    getSuggestions: function (options) {
        var filePath = options.editor.getPath();
        if (!filePath)
            return Promise.resolve([]);
        if (!fs.existsSync(filePath))
            return Promise.resolve([]);
        var pathMatchers = ['reference.path.string', 'require.path.string'];
        var lastScope = options.scopeDescriptor.scopes[options.scopeDescriptor.scopes.length - 1];
        if (pathMatchers.some(function (p) { return lastScope === p; })) {
            return parent.getRelativePathsInProject({ filePath: filePath, prefix: options.prefix }).then(function (resp) {
                return resp.files.map(function (file) {
                    return {
                        text: file.relativePath,
                        replacementPrefix: resp.endsInPunctuation ? '' : options.prefix,
                        rightLabelHTML: '<span>' + file.relativePath + '</span>',
                    };
                });
            });
        }
        else {
            var position = atomUtils.getEditorPositionForBufferPosition(options.editor, options.bufferPosition);
            var promisedSuggestions = parent.updateText({ filePath: filePath, text: options.editor.getText() }).then(function () { return parent.getCompletionsAtPosition({
                filePath: filePath,
                position: position,
                prefix: options.prefix,
                maxSuggestions: atomConfig.maxSuggestions
            }); }).then(function (resp) {
                var completionList = resp.completions;
                var suggestions = completionList.map(function (c) {
                    return {
                        text: c.name,
                        replacementPrefix: resp.endsInPunctuation ? '' : options.prefix,
                        rightLabelHTML: '<span style="color: ' + kindToColor(c.kind) + '">' + c.display + '</span>',
                    };
                });
                if (tsSnipPrefixLookup[options.prefix]) {
                    suggestions.unshift({
                        text: null,
                        snippet: tsSnipPrefixLookup[options.prefix].body,
                        replacementPrefix: options.prefix,
                        rightLabelHTML: "snippet: " + options.prefix,
                    });
                }
                return suggestions;
            });
            return promisedSuggestions;
        }
    },
    onDidInsertSuggestion: function (options) {
        var scopes = options.editor.getCursorScopes();
        var lastScope = scopes[scopes.length - 1];
    }
};
//# sourceMappingURL=autoCompleteProvider.js.map