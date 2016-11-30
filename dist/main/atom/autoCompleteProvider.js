"use strict";
var parent = require("../../worker/parent");
var fs = require("fs");
var atomUtils = require("./atomUtils");
var fuzzaldrin = require('fuzzaldrin');
var CSON = require("season");
var explicitlyTriggered = false;
function triggerAutocompletePlus() {
    atom.commands.dispatch(atom.views.getView(atom.workspace.getActiveTextEditor()), 'autocomplete-plus:activate');
    explicitlyTriggered = true;
}
exports.triggerAutocompletePlus = triggerAutocompletePlus;
function getModuleAutocompleteType(scopes) {
    function has(match) {
        return scopes.some(function (scope) { return scope.indexOf(match) !== -1; });
    }
    var isString = has('string.quoted');
    return {
        isReference: has('reference.path.string.quoted') || has('amd.path.string.quoted'),
        isRequire: has('meta.import-equals.external') && isString,
        isImport: has('meta.import') && isString
    };
}
exports.provider = {
    selector: '.source.ts, .source.tsx',
    inclusionPriority: 3,
    suggestionPriority: 3,
    excludeLowerPriority: false,
    getSuggestions: function (options) {
        var filePath = options.editor.getPath();
        if (!filePath)
            return Promise.resolve([]);
        if (!fs.existsSync(filePath))
            return Promise.resolve([]);
        var _a = getModuleAutocompleteType(options.scopeDescriptor.scopes), isReference = _a.isReference, isRequire = _a.isRequire, isImport = _a.isImport;
        if (isReference || isRequire || isImport) {
            return parent.getRelativePathsInProject({ filePath: filePath, prefix: options.prefix, includeExternalModules: isReference })
                .then(function (resp) {
                var range = options.editor.bufferRangeForScopeAtCursor(".string.quoted");
                var cursor = options.editor.getCursorBufferPosition();
                if (!range || cursor.column !== range.end.column - 1) {
                    return [];
                }
                var content = options.editor.getTextInBufferRange(range).replace(/^['"]|['"]$/g, "");
                return resp.files.map(function (file) {
                    var relativePath = file.relativePath;
                    var suggestionText = relativePath;
                    var suggestion = {
                        text: suggestionText,
                        replacementPrefix: content,
                        rightLabelHTML: '<span>' + file.name + '</span>',
                        type: 'import'
                    };
                    return suggestion;
                });
            });
        }
        else {
            if (explicitlyTriggered) {
                explicitlyTriggered = false;
            }
            else {
                var prefix = options.prefix.trim();
                if (prefix === '' || prefix === ';' || prefix === '{') {
                    return Promise.resolve([]);
                }
            }
            var promisedSuggestions = parent.client.executeCompletions({
                file: filePath,
                prefix: options.prefix,
                line: options.bufferPosition.row + 1,
                offset: options.bufferPosition.column + 1
            }).then(function (resp) {
                console.log("prefix", options.prefix);
                var completionList = resp.body;
                var suggestions = completionList.map(function (c) {
                    var prefix = options.prefix;
                    if (c.name && c.name.startsWith('$')) {
                        prefix = "$" + prefix;
                    }
                    return {
                        text: c.name,
                        replacementPrefix: prefix.trim(),
                        rightLabel: c.name,
                        leftLabel: c.kind,
                        type: atomUtils.kindToType(c.kind),
                        description: null,
                    };
                });
                return suggestions;
            });
            return promisedSuggestions;
        }
    },
};
