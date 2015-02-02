///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

// more: https://github.com/atom-community/autocomplete-plus/wiki/Provider-API

///ts:import=programManager
import programManager = require('../lang/programManager'); ///ts:import:generated
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

var provider = {
    selector: '.source.ts',
    requestHandler: (options: autocompleteplus.RequestOptions): autocompleteplus.Suggestion[]=> {
        var filePath = options.editor.getPath();

        // We refuse to work on files that are not on disk.
        if (!filePath) return [];
        if (!fs.existsSync(filePath)) return;

        var program = programManager.getOrCreateProgram(filePath);
        // Update the file
        program.languageServiceHost.updateScript(filePath, options.editor.getText());

        var position = atomUtils.getEditorPositionForBufferPosition(options.editor, options.position);

        var completions: ts.CompletionInfo = program.languageService.getCompletionsAtPosition(
            filePath, position);

        var completionList = completions ? completions.entries.filter(x=> !!x) : [];

        if (options.prefix.length && options.prefix !== '.') {
            completionList = fuzzaldrin.filter(completionList, options.prefix, { key: 'name' });
        }

        // limit to 10
        if (completionList.length > 10) completionList = completionList.slice(0, 10);

        // Potentially use it at some point
        function docComment(c: ts.CompletionEntry): { display: string; comment: string; } {
            var completionDetails = program.languageService.getCompletionEntryDetails(filePath, position, c.name);

            // Show the signatures for methods / functions
            if (c.kind == "method" || c.kind == "function") {
                var display = ts.displayPartsToString(completionDetails.displayParts || []);
            } else {
                var display = c.kind;
            }
            var comment = ts.displayPartsToString(completionDetails.documentation || []);

            return { display: display, comment: comment };
        }

        // console.log(completionList.map(docComment));

        var suggestions = completionList.map(c => {
            return {
                word: c.name,
                prefix: options.prefix == '.' ? '' : options.prefix,
                label: '<span style="color: ' + kindToColor(c.kind) + '">' + docComment(c).display + '</span>',
                renderLabelAsHtml: true,
            };
        });

        return suggestions;
    }
}

export = provider;
