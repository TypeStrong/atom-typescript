import parent = require("../../../worker/parent");
import buildView = require("../buildView");
import atomUtils = require("../atomUtils");
import autoCompleteProvider = require("../autoCompleteProvider");
import path = require('path');
import documentationView = require("../views/documentationView");
import renameView = require("../views/renameView");
var apd = require('atom-package-dependencies');
import contextView = require("../views/contextView");
import fileSymbolsView = require("../views/fileSymbolsView");
import projectSymbolsView = require("../views/projectSymbolsView");
import gotoHistory = require("../gotoHistory");
import utils = require("../../lang/utils");
import {panelView} from "../views/mainPanelView";
import * as url from "url";
import {AstView, astURI, astUriForPath, astURIFull, astUriFullForPath} from "../views/astView";
import {DependencyView, dependencyURI, dependencyUriForPath} from "../views/dependencyView";
import simpleSelectionView from "../views/simpleSelectionView";
import overlaySelectionView from "../views/simpleOverlaySelectionView";
import * as outputFileCommands from "./outputFileCommands";

export function registerCommands() {

    // Stuff I've split out as we have a *lot* of commands
    outputFileCommands.register();

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

        parent.getDefinitionsAtPosition(atomUtils.getFilePathPosition()).then(res=> {
            var definitions = res.definitions;
            if (!definitions || !definitions.length) {
                atom.notifications.addInfo('AtomTS: No definition found.');
                return;
            }

            // Potential future ugly hack for something (atom or TS langauge service) path handling
            // definitions.forEach((def)=> def.fileName.replace('/',path.sep));

            // support multiple implementations. Else just go to first
            if (definitions.length > 1) {
                simpleSelectionView({
                    items: definitions,
                    viewForItem: (item) => {
                        return `
                            <span>${item.filePath}</span>
                            <div class="pull-right">line: ${item.position.line}</div>
                        `;
                    },
                    filterKey: 'filePath',
                    confirmed: (definition) => {
                        atom.workspace.open(definition.filePath, {
                            initialLine: definition.position.line,
                            initialColumn: definition.position.col
                        });
                    }
                })
            }
            else {
                var definition = definitions[0];

                atom.workspace.open(definition.filePath, {
                    initialLine: definition.position.line,
                    initialColumn: definition.position.col
                });
            }
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
        // parent.debugLanguageServiceHostVersion({ filePath: atom.workspace.getActiveEditor().getPath() })
        //     .then((res) => {
        //     console.log(res.text.length);
        //     // console.log(JSON.stringify({txt:res.text}))
        // });

        atom.commands.dispatch(
            atom.views.getView(atom.workspace.getActiveTextEditor()),
            'typescript:dependency-view');

        // parent.getAST({ filePath: atom.workspace.getActiveEditor().getPath() }).then((res) => {
        //     console.log(res.root);
        // });
    });

    atom.commands.add('atom-text-editor', 'typescript:rename-refactor', (e) => {
        // Rename file
        var editor = atom.workspace.getActiveTextEditor();
        var matched = atomUtils.editorInTheseScopes([atomUtils.knownScopes.es6import, atomUtils.knownScopes.require]);
        if (matched) {
            let relativePath = editor.getTextInRange(editor.bufferRangeForScopeAtCursor(matched)).replace(/['"]+/g, '');
            if (!utils.pathIsRelative(relativePath)) {
                atom.notifications.addInfo('AtomTS: Can only rename external modules if they are relative files!');
                return;
            }

            let completePath = path.resolve(atomUtils.getCurrentPath(), relativePath) + '.ts';
            console.log(completePath);

            // TODO: query the projectService

            renameView.panelView.renameThis({
                autoSelect: false,
                title: 'Rename File',
                text: completePath,
                openFiles: [],
                closedFiles: [],
                onCancel: () => { },
                onValidate: (newText): string => {
                    if (!newText.trim()) {
                        return 'If you want to abort : Press esc to exit'
                    }
                    return '';
                },
                onCommit: (newText) => {
                    newText = newText.trim();

                    // TODO: use the query from projectService
                }
            });
            atom.notifications.addInfo('AtomTS: File rename comming soon!');
        }

        // Rename variable
        else {
            parent.getRenameInfo(atomUtils.getFilePathPosition()).then((res) => {
                if (!res.canRename) {
                    atom.notifications.addInfo('AtomTS: Rename not available at cursor location');
                    return;
                }

                var paths = atomUtils.getOpenTypeScritEditorsConsistentPaths();
                var openPathsMap = utils.createMap(paths);

                let refactorPaths = Object.keys(res.locations);
                let openFiles = refactorPaths.filter(p=> openPathsMap[p]);
                let closedFiles = refactorPaths.filter(p=> !openPathsMap[p]);

                renameView.panelView.renameThis({
                    autoSelect: true,
                    title: 'Rename Variable',
                    text: res.displayName,
                    openFiles: openFiles,
                    closedFiles: closedFiles,
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
        }
    });

    atom.commands.add('atom-workspace', 'typescript:go-to-next', (e) => {
        gotoHistory.gotoNext();
    });
    atom.commands.add('atom-workspace', 'typescript:go-to-previous', (e) => {
        gotoHistory.gotoPrevious();
    });

    atom.commands.add('atom-workspace', 'typescript:find-references', (e) => {
        if (!atomUtils.commandForTypeScript(e)) return;

        parent.getReferences(atomUtils.getFilePathPosition()).then(res=> {
            panelView.setReferences(res.references);
        });
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

        parent.getNavigateToItems({ filePath }).then((res) => {
            theProjectSymbolsView.setNavBarItems(res.items);
            theProjectSymbolsView.show();
        });
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

    atom.commands.add('atom-text-editor', 'typescript:ast', (e) => {
        if (!atomUtils.commandForTypeScript(e)) return;

        var uri = astUriForPath(atomUtils.getCurrentPath());
        var old_pane = atom.workspace.paneForURI(uri);
        if (old_pane) {
            old_pane.destroyItem(old_pane.itemForUri(uri));
        }
        atom.workspace.open(uri, {
            text: atom.workspace.getActiveTextEditor().getText(),
            filePath: atomUtils.getCurrentPath()
        });
    });

    atom.commands.add('atom-text-editor', 'typescript:ast-full', (e) => {
        if (!atomUtils.commandForTypeScript(e)) return;

        var uri = astUriFullForPath(atomUtils.getCurrentPath());
        var old_pane = atom.workspace.paneForURI(uri);
        if (old_pane) {
            old_pane.destroyItem(old_pane.itemForUri(uri));
        }
        atom.workspace.open(uri, {
            text: atom.workspace.getActiveTextEditor().getText(),
            filePath: atomUtils.getCurrentPath()
        });
    });

    atom.workspace.addOpener(function(uri, details: { text: string, filePath: string }) {
        try {
            var {protocol} = url.parse(uri);
        }
        catch (error) {
            return;
        }

        if (protocol !== astURI) {
            return;
        }

        return new AstView(details.filePath, details.text, false);
    });

    atom.workspace.addOpener(function(uri, details: { text: string, filePath: string }) {
        try {
            var {protocol} = url.parse(uri);
        }
        catch (error) {
            return;
        }

        if (protocol !== astURIFull) {
            return;
        }

        return new AstView(details.filePath, details.text, true);
    });

    atom.commands.add('atom-workspace', 'typescript:dependency-view', (e) => {
        if (!atomUtils.commandForTypeScript(e)) return;

        var uri = dependencyUriForPath(atomUtils.getCurrentPath());
        var old_pane = atom.workspace.paneForURI(uri);
        if (old_pane) {
            old_pane.destroyItem(old_pane.itemForUri(uri));
        }
        atom.workspace.open(uri, {
            filePath: atomUtils.getCurrentPath()
        });
    });

    atom.workspace.addOpener(function(uri, details: { filePath: string }) {
        try {
            var {protocol} = url.parse(uri);
        }
        catch (error) {
            return;
        }

        if (protocol !== dependencyURI) {
            return;
        }

        return new DependencyView(details.filePath);
    });

    atom.commands.add('atom-text-editor', 'typescript:quick-fix', (e) => {
        if (!atomUtils.commandForTypeScript(e)) return;

        var editor = atomUtils.getActiveEditor();
        var query = atomUtils.getFilePathPosition();

        parent.getQuickFixes(query).then((result) => {
            if (!result.fixes.length) {
                atom.notifications.addInfo('AtomTS: No QuickFixes for current cursor position');
                return;
            }

            overlaySelectionView({
                items: result.fixes,
                viewForItem: (item) => {
                    return `<div>
                        ${item.display}
                    </div>`;
                },
                filterKey: 'display',
                confirmed: (item) => {
                    // NOTE: we can special case UI's here if we want.

                    parent.applyQuickFix({ key: item.key, filePath: query.filePath, position: query.position }).then((res) => {

                        var paths = atomUtils.getOpenTypeScritEditorsConsistentPaths();
                        var openPathsMap = utils.createMap(paths);

                        let refactorPaths = Object.keys(res.refactorings);
                        let openFiles = refactorPaths.filter(p=> openPathsMap[p]);
                        let closedFiles = refactorPaths.filter(p=> !openPathsMap[p]);

                        // if file is open change in buffer
                        // otherwise open the file and change the buffer range
                        atomUtils.getEditorsForAllPaths(refactorPaths)
                            .then((editorMap) => {
                            refactorPaths.forEach((filePath) => {
                                var editor = editorMap[filePath];
                                editor.transact(() => {
                                    res.refactorings[filePath].forEach((refactoring) => {
                                        var range = atomUtils.getRangeForTextSpan(editor, refactoring.span);
                                        editor.setTextInBufferRange(range, refactoring.newText);
                                    });
                                })
                            });
                        });

                    });
                }
            }, editor);
        });
    });

    atom.commands.add('atom-workspace', 'typescript:sync', (e) => {
        if (!atomUtils.commandForTypeScript(e)) return;

        panelView.softReset();
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
            };
            documentationView.docView.show();
        });
    }).catch((err) => {
        console.error(err);
    });*/

}
