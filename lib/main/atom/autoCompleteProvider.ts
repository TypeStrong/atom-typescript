///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

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

export var provider = {
    selector: '.source.ts',
    requestHandler: (options: autocompleteplus.RequestOptions): Promise<autocompleteplus.Suggestion[]>=> {
        var filePath = options.editor.getPath();

        // We refuse to work on files that are not on disk.
        if (!filePath) return Promise.resolve([]);
        if (!fs.existsSync(filePath)) return Promise.resolve([]);

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
                return suggestions;
            });

        return promisedSuggestions;
    }
}
