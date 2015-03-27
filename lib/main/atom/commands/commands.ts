import parent = require("../../../worker/parent");
import buildView = require("../buildView");
import atomUtils = require("../atomUtils");
import autoCompleteProvider = require("../autoCompleteProvider");
import path = require('path');
import ts = require('typescript');
import documentationView = require("../views/documentationView");
import renameView = require("../views/renameView");
var apd = require('atom-package-dependencies');
import contextView = require("../views/contextView");
import fileSymbolsView = require("../views/fileSymbolsView");
import projectSymbolsView = require("../views/projectSymbolsView");
import gotoHistory = require("../gotoHistory");
import utils = require("../../lang/utils");

export function registerCommands() {

    // Setup custom commands NOTE: these need to be added to the keymaps
    atom.commands.add('atom-text-editor', 'typescript:format-code', (e) => {
        if (!atomUtils.commandForTypeScript(e)) return;

        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();
        var selection = editor.getSelectedBufferRange();
        if (selection.isEmpty()) {
            parent.formatDocument({ filePath: filePath }).then((result) => {
                if (!result.edits.length) return;
                editor.transact(() => {
                    atomUtils.formatCode(editor, result.edits);
                });
            });
        } else {
            parent.formatDocumentRange({ filePath: filePath, start: { line: selection.start.row, col: selection.start.column }, end: { line: selection.end.row, col: selection.end.column } }).then((result) => {
                if (!result.edits.length) return;
                editor.transact(() => {
                    atomUtils.formatCode(editor, result.edits);
                });
            });

        }
    });
    atom.commands.add('atom-workspace', 'typescript:build', (e) => {
        if (!atomUtils.commandForTypeScript(e)) return;

        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();

        atom.notifications.addInfo('Building');

        parent.build({ filePath: filePath }).then((resp) => {
            buildView.setBuildOutput(resp.buildOutput);
        });
    });

    var handleGoToDeclaration = (e) => {
        if (!atomUtils.commandForTypeScript(e)) return;

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
                initialColumn: definition.position.col
            });
        });
    };

    atom.commands.add('atom-workspace', 'typescript:go-to-declaration', handleGoToDeclaration);
    // This exists by default in the right click menu https://github.com/TypeStrong/atom-typescript/issues/96
    atom.commands.add('atom-text-editor', 'symbols-view:go-to-declaration', handleGoToDeclaration);

    var theContextView: contextView.ContextView;
    atom.commands.add('atom-text-editor', 'typescript:context-actions', (e) => {
        if (!theContextView) theContextView = new contextView.ContextView();
        theContextView.show();
    });

    atom.commands.add('atom-text-editor', 'typescript:autocomplete', (e) => {
        autoCompleteProvider.triggerAutocompletePlus();
    });

    atom.commands.add('atom-text-editor', 'typescript:bas-development-testing', (e) => {
        // documentationView.docView.hide();
        // documentationView.docView.autoPosition();
        // documentationView.testDocumentationView();
        parent.debugLanguageServiceHostVersion({ filePath: atom.workspace.getActiveEditor().getPath() })
            .then((res) => {
            console.log(res.text.length);
            // console.log(JSON.stringify({txt:res.text}))
        });
    });

    atom.commands.add('atom-text-editor', 'typescript:rename-variable', (e) => {
        parent.getRenameInfo(atomUtils.getFilePathPosition()).then((res) => {
            if (!res.canRename) {
                atom.notifications.addInfo('AtomTS: Rename not available at cursor location');
                return;
            }

            renameView.panelView.renameThis({
                text: res.displayName,
                onCancel: () => { },
                onValidate: (newText): string => {
                    if (newText.replace(/\s/g, '') !== newText.trim()) {
                        return 'The new variable must not contain a space';
                    }
                    if (!newText.trim()) {
                        return 'If you want to abort : Press esc to exit'
                    }
                    return '';
                },
                onCommit: (newText) => {
                    newText = newText.trim();
                    // if file is open change in buffer
                    // otherwise open the file and change the buffer range
                    atomUtils.getEditorsForAllPaths(Object.keys(res.locations))
                        .then((editorMap) => {
                        Object.keys(res.locations).forEach((filePath) => {
                            var editor = editorMap[filePath];
                            editor.transact(() => {
                                res.locations[filePath].forEach((textSpan) => {
                                    var range = atomUtils.getRangeForTextSpan(editor, textSpan);
                                    editor.setTextInBufferRange(range, newText);
                                });
                            })
                        });
                    });
                }
            });
        });
    });

    atom.commands.add('atom-workspace', 'typescript:go-to-next', (e) => {
        gotoHistory.gotoNext();
    });
    atom.commands.add('atom-workspace', 'typescript:go-to-previous', (e) => {
        gotoHistory.gotoPrevious();
    });

    // I've needed to debounce this as it gets called multiple times for some reason
    // Has to do with how we override toggle-file-symbols
    var theFileSymbolsView: fileSymbolsView.FileSymbolsView;
    var showFileSymbols = utils.debounce((filePath: string) => {
        if (!theFileSymbolsView) theFileSymbolsView = new fileSymbolsView.FileSymbolsView();

        parent.getNavigationBarItems({ filePath }).then((res) => {
            theFileSymbolsView.setNavBarItems(res.items, filePath);
            theFileSymbolsView.show();
        });

    }, 400);

    // We support symbols view as well
    atom.commands.add('.platform-linux atom-text-editor, .platform-darwin atom-text-editor,.platform-win32 atom-text-editor', 'symbols-view:toggle-file-symbols',
        (e) => {
            var editor = atom.workspace.getActiveTextEditor();
            if (!editor) return false;
            if (path.extname(editor.getPath()) !== '.ts') return false;


            // Abort it for others
            e.abortKeyBinding();
            var filePath = editor.getPath();
            showFileSymbols(filePath);
        });



    // We support project level symbols
    var theProjectSymbolsView: projectSymbolsView.ProjectSymbolsView;
    var showProjectSymbols = utils.debounce((filePath: string) => {
        if (!theProjectSymbolsView) theProjectSymbolsView = new projectSymbolsView.ProjectSymbolsView();

        parent.getNavigateToItems({filePath}).then((res) => {
            theProjectSymbolsView.setNavBarItems(res.items);
            theProjectSymbolsView.show();
        })
    }, 400);
    atom.commands.add('.platform-linux atom-text-editor, .platform-darwin atom-text-editor,.platform-win32 atom-text-editor', 'symbols-view:toggle-project-symbols',
        (e) => {
            var editor = atom.workspace.getActiveTextEditor();
            if (!editor) return false;
            if (path.extname(editor.getPath()) !== '.ts') return false;


            // Abort it for others
            e.abortKeyBinding();
            var filePath = editor.getPath();
            showProjectSymbols(filePath);
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
