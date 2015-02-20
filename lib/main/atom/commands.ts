///ts:import=parent
import parent = require('../../worker/parent'); ///ts:import:generated
///ts:import=buildView
import buildView = require('./buildView'); ///ts:import:generated
///ts:import=atomUtils
import atomUtils = require('./atomUtils'); ///ts:import:generated
///ts:import=autoCompleteProvider
import autoCompleteProvider = require('./autoCompleteProvider'); ///ts:import:generated
import path = require('path');
import ts = require('typescript');

///ts:import=documentationView
import documentationView = require('./views/documentationView'); ///ts:import:generated
///ts:import=renameView
import renameView = require('./views/renameView'); ///ts:import:generated
var apd = require('../../../apd'); // Moved here because I customized it

// Utility functions for commands
function commandForTypeScript(e) {
    var editor = atom.workspace.getActiveTextEditor();
    if (!editor) return e.abortKeyBinding() && false;
    if (path.extname(editor.getPath()) !== '.ts') return e.abortKeyBinding() && false;

    return true;
}

export function registerCommands() {

    // Setup custom commands NOTE: these need to be added to the keymaps
    atom.commands.add('atom-text-editor', 'typescript:format-code',(e) => {
        if (!commandForTypeScript(e)) return;

        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();
        var selection = editor.getSelectedBufferRange();
        if (selection.isEmpty()) {
            var cursorPosition = editor.getCursorBufferPosition();
            var currentText = editor.getText();
            var result = parent.formatDocument({ filePath: filePath, cursor: { line: cursorPosition.row, ch: cursorPosition.column } })
                .then((result) => {
                if (result.formatted == currentText) return;

                var top = editor.getScrollTop();
                editor.setText(result.formatted);
                editor.setCursorBufferPosition([result.cursor.line, result.cursor.ch]);
                editor.setScrollTop(top);
            });
        } else {
            parent.formatDocumentRange({ filePath: filePath, start: { line: selection.start.row, ch: selection.start.column }, end: { line: selection.end.row, ch: selection.end.column } }).then((res) => {
                editor.setTextInBufferRange(selection, res.formatted);
            });

        }
    });
    atom.commands.add('atom-text-editor', 'typescript:build',(e) => {
        if (!commandForTypeScript(e)) return;

        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();

        atom.notifications.addInfo('Building');

        parent.build({ filePath: filePath }).then((resp) => {
            buildView.setBuildOutput(resp.outputs);
        });
    });

    var handleGoToDeclaration = (e) => {
        if (!commandForTypeScript(e)) return;

        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();
        var position = atomUtils.getEditorPosition(editor);
        parent.getDefinitionsAtPosition({ filePath: filePath, position: position }).then(res=> {
            var definitions = res.definitions;
            if (!definitions || !definitions.length) {
                atom.notifications.addInfo('AtomTS: No definition found.');
                return;
            }

            // Potential future ugly hack for something (atom or TS langauge service) path handling
            // definitions.forEach((def)=> def.fileName.replace('/',path.sep));

            // TODO: support multiple implementations. For now we just go to first
            var definition = definitions[0];

            atom.workspace.open(definition.filePath, {
                initialLine: definition.position.line,
                initialColumn: definition.position.ch
            });
        });
    };

    atom.commands.add('atom-text-editor', 'typescript:go-to-declaration', handleGoToDeclaration);
    // This exists by default in the right click menu https://github.com/TypeStrong/atom-typescript/issues/96
    atom.commands.add('atom-text-editor', 'symbols-view:go-to-declaration', handleGoToDeclaration);

    atom.commands.add('atom-text-editor', 'typescript:context-actions',(e) => {
        atom.notifications.addSuccess('Context options coming soon!');
    });

    atom.commands.add('atom-text-editor', 'typescript:autocomplete',(e) => {
        autoCompleteProvider.triggerAutocompletePlus();
    });

    atom.commands.add('atom-text-editor', 'typescript:here-for-development-testing',(e) => {
        documentationView.docView.hide();
        documentationView.docView.autoPosition();
        documentationView.docView.show();
    });

    atom.commands.add('atom-text-editor', 'typescript:rename-variable',(e) => {
        // TODO: get text
        atom.notifications.addInfo('coming soon. UI test only');

        /*function restoreEditor() {
            // TODO: if (activePane.isDestroyed()) return;

            var v = atom.views.getView(activeEditor);
            v.focus();
        }*/
        parent.getRenameInfo(atomUtils.getFilePathPosition()).then((res) => {
            if (!res.canRename) {
                atom.notifications.addInfo('AtomTS: Rename not available at cursor location');
                return;
            }
            console.log(res);
            // TODO: if file is open change in buffer
            // otherwise open the file and change the buffer range

            renameView.panelView.renameThis({
                text: res.displayName,
                onCancel: () => {
                    console.log('cancel');
                },
                onCommit: (newText) => {
                    console.log(newText);
                }
            });
        });


    });

    /// Register autocomplete commands to show documentations
    /*atom.packages.activatePackage('autocomplete-plus').then(() => {
        var autocompletePlus = apd.require('autocomplete-plus');
        var maxIndex = 10;
        var currentSuggestionIndex = 0;
        autocompletePlus.autocompleteManager.suggestionList.emitter.on('did-cancel',() => {
            console.log('cancel');
            documentationView.docView.hide();
            currentSuggestionIndex = 0;
        });

        autocompletePlus.autocompleteManager.suggestionList.emitter.on('did-select-next',() => {
            console.log('next');
            var length = autocompletePlus.autocompleteManager.suggestionList.items.length
            if (++currentSuggestionIndex >= maxIndex) {
                currentSuggestionIndex = 0;
            }
            documentationView.docView.show();
            documentationView.docView.autoPosition(); // TODO: only first time
        });

        autocompletePlus.autocompleteManager.suggestionList.emitter.on('did-select-previous',() => {
            console.log('previous');
            var length = autocompletePlus.autocompleteManager.suggestionList.items.length
            if (--currentSuggestionIndex < 0) {
                currentSuggestionIndex = maxIndex - 1;
            }
            documentationView.docView.show();
        });
    }).catch((err) => {
        console.error(err);
    });*/

}
