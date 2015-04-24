/// <reference path='../../globals'/>

// more: https://github.com/atom-community/autocomplete-plus/wiki/Provider-API

///ts:import=parent
import parent = require('../../worker/parent'); ///ts:import:generated
///ts:import=atomConfig
import atomConfig = require('./atomConfig'); ///ts:import:generated
import fs = require('fs');
///ts:import=atomUtils
import atomUtils = require('./atomUtils'); ///ts:import:generated
import escape = require('escape-html');

var fuzzaldrin = require('fuzzaldrin');
var CSON = require("season");

declare module autocompleteplus {
    /** What gets passed into the handler */
    export interface RequestOptions {
        editor: AtomCore.IEditor;
        bufferPosition: TextBuffer.IPoint; // the position of the cursor
        prefix: string;
        scopeDescriptor: { scopes: string[] };
    }

    /** The suggestion */
    export interface Suggestion {
        //Either text or snippet is required

        text?: string;
        snippet?: string;

        replacementPrefix?: string;

        rightLabel?: string;
        rightLabelHTML?: string;
        type: string;
        description?: string;

        atomTS_IsReference?: {
            relativePath: string
        };
        atomTS_IsImport?: {
            relativePath: string
        };
        atomTS_IsES6Import?: {
            relativePath: string
        };
    }

    /** What the provider needs to implement */
    export interface Provider {
        inclusionPriority?: number;
        excludeLowerPriority?: boolean;
        selector: string;
        getSuggestions: (options: RequestOptions) => Promise<Suggestion[]>;
        onDidInsertSuggestion?: (args: { editor: AtomCore.IEditor; triggerPosition: TextBuffer.IPoint; suggestion: Suggestion }) => any;
    }
}

export function triggerAutocompletePlus() {
    atom.commands.dispatch(
        atom.views.getView(atom.workspace.getActiveTextEditor()),
        'autocomplete-plus:activate');
}

// the structure stored in the CSON snippet file
interface SnippetDescriptor {
    prefix: string;
    body: string;
}
interface SnippetsContianer {
    [name: string]: SnippetDescriptor;
}


// this is the structure we use to speed up the lookup by avoiding having to
// iterate over the object properties during the requestHandler
// this will take a little longer during load but I guess that is better than
// taking longer at each key stroke
interface SnippetDetail {
    body: string;
    name: string;
}

var tsSnipPrefixLookup: { [prefix: string]: SnippetDetail; } = Object.create(null);
function loadSnippets() {
    var confPath = atom.getConfigDirPath();
    CSON.readFile(confPath + "/packages/atom-typescript/snippets/typescript-snippets.cson",
        (err, snippetsRoot) => {
            if (err) return;
            if (!snippetsRoot || !snippetsRoot['.source.ts']) return;

            // rearrange/invert the way this can be looked up: we want to lookup by prefix
            // this way the lookup gets faster because we dont have to iterate over the
            // properties of the object
            var tsSnippets: SnippetsContianer = snippetsRoot['.source.ts'];
            for (var snippetName in tsSnippets) {
                if (tsSnippets.hasOwnProperty(snippetName)) {
                    // if the file contains a prefix multiple times only
                    // the last will be active because the previous ones will be overwritten
                    tsSnipPrefixLookup[tsSnippets[snippetName].prefix] = {
                        body: tsSnippets[snippetName].body,
                        name: snippetName
                    }
                }
            }
        });
}
loadSnippets();

export var provider: autocompleteplus.Provider = {
    selector: '.source.ts',
    inclusionPriority: 1,
    getSuggestions: (options: autocompleteplus.RequestOptions): Promise<autocompleteplus.Suggestion[]>=> {
        var filePath = options.editor.getPath();

        // We refuse to work on files that are not on disk.
        if (!filePath) return Promise.resolve([]);
        if (!fs.existsSync(filePath)) return Promise.resolve([]);

        // If we are looking at reference or require path support file system completions
        var pathMatchers = ['reference.path.string', 'require.path.string', 'es6import.path.string'];
        var lastScope = options.scopeDescriptor.scopes[options.scopeDescriptor.scopes.length - 1];

        // For file path completions
        if (pathMatchers.some(p=> lastScope === p)) {
            return parent.getRelativePathsInProject({ filePath, prefix: options.prefix, includeExternalModules: lastScope !== 'reference.path.string' })
                .then((resp) => {
                return resp.files.map(file => {
                    var relativePath = file.relativePath;
                    var suggestionText = !atomConfig.modulePathToProjectRoot || /^(?!\.\.\/)/.test(relativePath) ?
                        relativePath : '~/' + atom.project.relativize(file.fullPath).replace(/\\/g, '/');

                    var suggestion: autocompleteplus.Suggestion = {
                        text: suggestionText,
                        replacementPrefix: resp.endsInPunctuation ? '' : options.prefix,
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

            var position = atomUtils.getEditorPositionForBufferPosition(options.editor, options.bufferPosition);

            var promisedSuggestions: Promise<autocompleteplus.Suggestion[]>
                = parent.getCompletionsAtPosition({
                    filePath: filePath,
                    position: position,
                    prefix: options.prefix,
                })
                    .then((resp) => {

                    var completionList = resp.completions;
                    var suggestions = completionList.map((c): autocompleteplus.Suggestion => {

                        if (c.snippet) // currently only function completions are snippet
                        {
                            return {
                                snippet: c.snippet,
                                replacementPrefix: '',
                                rightLabel: 'signature',
                                type: 'snippet',
                            };
                        }
                        else {
                            return {
                                text: c.name,
                                replacementPrefix: resp.endsInPunctuation ? '' : options.prefix,
                                rightLabelHTML: '<span class="badge" style="background-color: black; color: ' + atomUtils.kindToColor(c.kind) + '">' + c.display + '</span>',
                                leftLabel: c.kind,
                                type: atomUtils.kindToType(c.kind),
                                description: c.comment,
                            };
                        }
                    });


                    // see if we have a snippet for this prefix
                    if (tsSnipPrefixLookup[options.prefix]) {
                        // you only get the snippet suggested after you have typed
                        // the full trigger word/ prefex
                        // and then it replaces a keyword/match that might also be present, e.g. "class"
                        let suggestion: autocompleteplus.Suggestion = {
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
    onDidInsertSuggestion: (options) => {
        if (options.suggestion.atomTS_IsReference
            || options.suggestion.atomTS_IsImport
            || options.suggestion.atomTS_IsES6Import) {
            var quote = (/["']/.exec(atomConfig.preferredQuoteCharacter) || [''])[0];

            if (options.suggestion.atomTS_IsReference) {
                options.editor.moveToBeginningOfLine();
                options.editor.selectToEndOfLine();
                options.editor.replaceSelectedText(null, function() { return '/// <reference path="' + options.suggestion.atomTS_IsReference.relativePath + '"/>'; });
            }
            if (options.suggestion.atomTS_IsImport) {
                options.editor.moveToBeginningOfLine();
                options.editor.selectToEndOfLine();
                var groups = /^\s*import\s*(\w*)\s*=\s*require\s*\(\s*(["'])/.exec(options.editor.getSelectedText());
                var alias = groups[1];
                quote = quote || groups[2];
                options.editor.replaceSelectedText(null, function() { return `import ${alias} = require(${quote}${options.suggestion.atomTS_IsImport.relativePath}${quote});`; });
            }
            if (options.suggestion.atomTS_IsES6Import) {
                var {row} = options.editor.getCursorBufferPosition();
                var originalText = (<any>options.editor).lineTextForBufferRow(row);
                var groups = /(.*)from\s*(["'])/.exec(originalText);
                var beforeFrom = groups[1];
                quote = quote || groups[2];
                var newTextAfterFrom = `from ${quote}${options.suggestion.atomTS_IsES6Import.relativePath}${quote};`;
                options.editor.setTextInBufferRange([[row, beforeFrom.length], [row, originalText.length]], newTextAfterFrom)

            }
            options.editor.moveToEndOfLine();
        }
    }
}
