var parent = require('../../worker/parent');
var atomConfig = require('./atomConfig');
var fs = require('fs');
var atomUtils = require('./atomUtils');
var fuzzaldrin = require('fuzzaldrin');
var CSON = require("season");
var explicitlyTriggered = false;
function triggerAutocompletePlus() {
    atom.commands.dispatch(atom.views.getView(atom.workspace.getActiveTextEditor()), 'autocomplete-plus:activate');
    explicitlyTriggered = true;
}
exports.triggerAutocompletePlus = triggerAutocompletePlus;
var tsSnipPrefixLookup = Object.create(null);
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
    inclusionPriority: 3,
    excludeLowerPriority: false,
    getSuggestions: function (options) {
        var filePath = options.editor.getPath();
        if (!filePath)
            return Promise.resolve([]);
        if (!fs.existsSync(filePath))
            return Promise.resolve([]);
        var pathMatchers = ['reference.path.string', 'require.path.string', 'es6import.path.string'];
        var lastScope = options.scopeDescriptor.scopes[options.scopeDescriptor.scopes.length - 1];
        if (pathMatchers.some(function (p) { return lastScope === p; })) {
            return parent.getRelativePathsInProject({ filePath: filePath, prefix: options.prefix, includeExternalModules: lastScope !== 'reference.path.string' })
                .then(function (resp) {
                return resp.files.map(function (file) {
                    var relativePath = file.relativePath;
                    var suggestionText = relativePath;
                    var suggestion = {
                        text: suggestionText,
                        replacementPrefix: resp.endsInPunctuation ? '' : options.prefix.trim(),
                        rightLabelHTML: '<span>' + file.name + '</span>',
                        type: 'path'
                    };
                    if (lastScope == 'reference.path.string') {
                        suggestion.atomTS_IsReference = {
                            relativePath: relativePath
                        };
                    }
                    if (lastScope == 'require.path.string') {
                        suggestion.atomTS_IsImport = {
                            relativePath: relativePath
                        };
                    }
                    if (lastScope == 'es6import.path.string') {
                        suggestion.atomTS_IsES6Import = {
                            relativePath: relativePath
                        };
                    }
                    return suggestion;
                });
            });
        }
        else {
            if (explicitlyTriggered) {
                explicitlyTriggered = false;
            }
            else {
                if (options.prefix && options.prefix.trim() == ';') {
                    return Promise.resolve([]);
                }
            }
            var position = atomUtils.getEditorPositionForBufferPosition(options.editor, options.bufferPosition);
            var promisedSuggestions = parent.getCompletionsAtPosition({
                filePath: filePath,
                position: position,
                prefix: options.prefix,
            })
                .then(function (resp) {
                var completionList = resp.completions;
                var suggestions = completionList.map(function (c) {
                    if (c.snippet) {
                        return {
                            snippet: c.snippet,
                            replacementPrefix: '',
                            rightLabel: 'signature',
                            type: 'snippet',
                        };
                    }
                    else {
                        var prefix = options.prefix;
                        if (c.name && c.name.startsWith('$')) {
                            prefix = "$" + prefix;
                        }
                        return {
                            text: c.name,
                            replacementPrefix: resp.endsInPunctuation ? '' : prefix.trim(),
                            rightLabel: c.display,
                            leftLabel: c.kind,
                            type: atomUtils.kindToType(c.kind),
                            description: c.comment,
                        };
                    }
                });
                if (tsSnipPrefixLookup[options.prefix]) {
                    var suggestion = {
                        snippet: tsSnipPrefixLookup[options.prefix].body,
                        replacementPrefix: options.prefix,
                        rightLabelHTML: "snippet: " + options.prefix,
                        type: 'snippet'
                    };
                    suggestions.unshift(suggestion);
                }
                return suggestions;
            });
            return promisedSuggestions;
        }
    },
    onDidInsertSuggestion: function (options) {
        if (options.suggestion.atomTS_IsReference
            || options.suggestion.atomTS_IsImport
            || options.suggestion.atomTS_IsES6Import) {
            var quote = (/["']/.exec(atomConfig.preferredQuoteCharacter) || [''])[0];
            if (options.suggestion.atomTS_IsReference) {
                options.editor.moveToBeginningOfLine();
                options.editor.selectToEndOfLine();
                options.editor.replaceSelectedText(null, function () { return '/// <reference path="' + options.suggestion.atomTS_IsReference.relativePath + '.ts"/>'; });
            }
            if (options.suggestion.atomTS_IsImport) {
                options.editor.moveToBeginningOfLine();
                options.editor.selectToEndOfLine();
                var groups = /^\s*import\s*(\w*)\s*=\s*require\s*\(\s*(["'])/.exec(options.editor.getSelectedText());
                var alias = groups[1];
                quote = quote || groups[2];
                options.editor.replaceSelectedText(null, function () { return "import " + alias + " = require(" + quote + options.suggestion.atomTS_IsImport.relativePath + quote + ");"; });
            }
            if (options.suggestion.atomTS_IsES6Import) {
                var row = options.editor.getCursorBufferPosition().row;
                var originalText = options.editor.lineTextForBufferRow(row);
                var groups = /(.*)from\s*(["'])/.exec(originalText);
                var beforeFrom = groups[1];
                quote = quote || groups[2];
                var newTextAfterFrom = "from " + quote + options.suggestion.atomTS_IsES6Import.relativePath + quote + ";";
                options.editor.setTextInBufferRange([[row, beforeFrom.length], [row, originalText.length]], newTextAfterFrom);
            }
            options.editor.moveToEndOfLine();
        }
    }
};
