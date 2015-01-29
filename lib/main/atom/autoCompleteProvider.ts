///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

// more: https://github.com/atom-community/autocomplete-plus/wiki/Provider-API

///ts:import=programManager
import programManager = require('../lang/programManager'); ///ts:import:generated
import ts = require('typescript');

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


var provider = {
    selector: '.source.ts',
    requestHandler: (options: autocompleteplus.RequestOptions): autocompleteplus.Suggestion[]=> {
        var filePath = options.editor.getPath();
        var program = programManager.getOrCreateProgram(filePath);
        // Update the file
        program.languageServiceHost.updateScript(filePath, options.editor.getText());

        var position = program.languageServiceHost.getIndexFromPosition(filePath, { line: options.position.row, ch: options.position.column });

        var completions: ts.CompletionInfo = program.languageService.getCompletionsAtPosition(
            filePath, position);

        var completionList = completions ? completions.entries.filter(x=> !!x) : [];

        if (options.prefix.length && options.prefix !== '.') {
            completionList = fuzzaldrin.filter(completionList, options.prefix, { key: 'name' });
        }

        // limit to 10
        if (completionList.length > 10) completionList = completionList.slice(0, 10);

        var suggestions = completionList.map(c => {
            return {
                word: c.name,
                prefix: options.prefix == '.' ? '' : options.prefix
            };
        });

        return suggestions;
    }
}

export = provider;
