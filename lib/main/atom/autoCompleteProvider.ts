/// <reference path='../../globals'/>

// more: https://github.com/atom-community/autocomplete-plus/wiki/Provider-API

///ts:import=parent
import parent = require('../../worker/parent'); ///ts:import:generated
///ts:import=atomConfig
import atomConfig = require('./atomConfig'); ///ts:import:generated
import ts = require('typescript');
import fs = require('fs');

///ts:import=atomUtils
import atomUtils = require('./atomUtils'); ///ts:import:generated

var fuzzaldrin = require('fuzzaldrin');

declare module autocompleteplus {
    export interface RequestOptions {
        editor: AtomCore.IEditor;
        position: TextBuffer.IPoint; // the position of the cursor
        prefix: string;
        scope: { scopes: string[] };
        scopeChain: string[];
    }

    export interface Suggestion {
        word: string;
        prefix: string;
        label?: string; // '<span style="color: red">world</span>',
        renderLabelAsHtml?: boolean;
        className?: string; //'globe'
        onWillConfirm?: Function;// Do something here before the word has replaced the prefix (if you need, you usually don't need to),
        onDidConfirm?: Function;// Do something here after the word has replaced the prefix (if you need, you usually don't need to)
        isSnippet?: boolean;
        snippet?: string;
    }
}

function kindToColor(kind: string) {
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

export function triggerAutocompletePlus() {
    atom.commands.dispatch(
        atom.views.getView(atom.workspace.getActiveTextEditor()),
        'autocomplete-plus:activate');
}

interface SnippetDescriptor {
    prefix: string;
    body: string;
}
interface SnippetsContainer {
    [Key: string]: SnippetDescriptor;
}

var tsSnippets: SnippetsContainer;
(() => {
    var CSON = require("season");
    var confPath = atom.getConfigDirPath();
    CSON.readFile(confPath + "/packages/atom-typescript/snippets/typescript-snippets.cson",
        (err, objRead) => {
            if (!err) {
                if (typeof objRead === "object" && objRead['.source.ts'] != undefined) {
                    tsSnippets = objRead;
                }
            }
        });
})();

export var provider = {
    selector: '.source.ts',
    requestHandler: (options: autocompleteplus.RequestOptions): Promise<autocompleteplus.Suggestion[]>=> {
        var filePath = options.editor.getPath();

        // We refuse to work on files that are not on disk.
        if (!filePath) return Promise.resolve([]);
        if (!fs.existsSync(filePath)) return Promise.resolve([]);

        // If we are looking at reference or require path support file system completions
        var pathMatchers = ['reference.path.string', 'require.path.string'];
        var lastScope = options.scope.scopes[options.scope.scopes.length - 1];

        if (pathMatchers.some(p=> lastScope === p)) {
            return parent.getRelativePathsInProject({ filePath, prefix: options.prefix })
                .then((resp) => {
                return resp.files.map(file => {
                    return {
                        word: file.relativePath,
                        prefix: resp.endsInPunctuation ? '' : options.prefix,
                        label: '<span>' + file.relativePath + '</span>',
                        renderLabelAsHtml: true,
                        onDidConfirm: function() {
                            options.editor.moveToBeginningOfLine();
                            options.editor.selectToEndOfLine();
                            if (lastScope == 'reference.path.string') {
                                options.editor.replaceSelectedText(null, function() { return "/// <reference path='" + file.relativePath + "'/>"; });
                            }
                            if (lastScope == 'require.path.string') {
                                var alias = options.editor.getSelectedText().match(/^import\s*(\w*)\s*=/)[1];
                                options.editor.replaceSelectedText(null, function() { return "import " + alias + " = require('" + file.relativePath + "');"; });
                            }
                            options.editor.moveToEndOfLine();
                        }

                    };
                });
            });
        }
        else {

            var position = atomUtils.getEditorPositionForBufferPosition(options.editor, options.position);

            var promisedSuggestions: Promise<autocompleteplus.Suggestion[]>
            // TODO: remove updateText once we have edit on change in place
                = parent.updateText({ filePath: filePath, text: options.editor.getText() })
                    .then(() => parent.getCompletionsAtPosition({
                    filePath: filePath,
                    position: position,
                    prefix: options.prefix,
                    maxSuggestions: atomConfig.maxSuggestions
                }))
                    .then((resp) => {
                    var completionList = resp.completions;
                    var suggestions = completionList.map(c => {
                        return {
                            word: c.name,
                            prefix: resp.endsInPunctuation ? '' : options.prefix,
                            label: '<span style="color: ' + kindToColor(c.kind) + '">' + c.display + '</span>',
                            renderLabelAsHtml: true,
                        };
                    });


                    if (tsSnippets) {
                        var tsSnipSection = tsSnippets['.source.ts'];
                        for (var key in tsSnipSection) {
                            if (tsSnipSection.hasOwnProperty(key)) {
                                if (tsSnipSection[key].prefix != undefined) {
                                    if (options.prefix === tsSnipSection[key].prefix
                                    //&&suggestions[0].word !== tsSnipSection [key].prefix
                                    // you only get the snippet suggested after you have typed the full trigger word
                                    // and then it replaces a keyword/other match that might also be present, e.G. "class"
                                        ) {
                                        suggestions.unshift({
                                            word: options.prefix,
                                            prefix: options.prefix,
                                            label: "snippet: " + key,
                                            renderLabelAsHtml: false,
                                            isSnippet: true,
                                            snippet: tsSnipSection[key].body
                                        });
                                        break;// take only the first match
                                    }
                                }
                            }
                        }
                    }
                    return suggestions;
                });

            return promisedSuggestions;
        }
    }
}
