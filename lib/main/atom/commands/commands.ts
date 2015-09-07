import parent = require("../../../worker/parent");
import buildView = require("../buildView");
import atomUtils = require("../atomUtils");
import autoCompleteProvider = require("../autoCompleteProvider");
import path = require('path');
import documentationView = require("../views/documentationView");
import renameView = require("../views/renameView");
import contextView = require("../views/contextView");
import fileSymbolsView = require("../views/fileSymbolsView");
import projectSymbolsView = require("../views/projectSymbolsView");
import gotoHistory = require("../gotoHistory");
import utils = require("../../lang/utils");
import {panelView} from "../views/mainPanelView";
import * as url from "url";
import {AstView, astURI, astURIFull} from "../views/astView";
import {DependencyView, dependencyURI} from "../views/dependencyView";
import {simpleSelectionView} from "../views/simpleSelectionView";
import overlaySelectionView from "../views/simpleOverlaySelectionView";
import * as outputFileCommands from "./outputFileCommands";
import {registerRenameHandling} from "./moveFilesHandling";
import {RefactoringsByFilePath} from "../../lang/fixmyts/quickFix";
import escapeHtml = require('escape-html');
import * as rView from "../views/rView";
import {$} from "atom-space-pen-views";
import {registerReactCommands} from "./reactCommands";
import {getFileStatus} from "../fileStatusCache";
import {registerJson2dtsCommands} from "./json2dtsCommands";
import * as semanticView from "../views/semanticView";

// Load all the web components
export * from "../components/componentRegistry";

export function registerCommands() {

    // Stuff I've split out as we have a *lot* of commands
    outputFileCommands.register();
    registerRenameHandling();
    registerReactCommands();
    registerJson2dtsCommands();

    function applyRefactorings(refactorings: RefactoringsByFilePath) {
        var paths = atomUtils.getOpenTypeScritEditorsConsistentPaths();
        var openPathsMap = utils.createMap(paths);

        let refactorPaths = Object.keys(refactorings);
        let openFiles = refactorPaths.filter(p=> openPathsMap[p]);
        let closedFiles = refactorPaths.filter(p=> !openPathsMap[p]);

        // if file is open change in buffer
        // otherwise open the file and change the buffer range
        atomUtils.getEditorsForAllPaths(refactorPaths)
            .then((editorMap) => {
                refactorPaths.forEach((filePath) => {
                    var editor = editorMap[filePath];
                    editor.transact(() => {
                        refactorings[filePath].forEach((refactoring) => {
                            var range = atomUtils.getRangeForTextSpan(editor, refactoring.span);
                            if (!refactoring.isNewTextSnippet) {
                                editor.setTextInBufferRange(range, refactoring.newText);
                            } else {
                                let cursor = editor.getCursors()[0];
                                (<any>cursor).selection.setBufferRange(range);
                                atomUtils.insertSnippet(refactoring.newText, editor, cursor);
                            }
                        });
                    })
                });
            });
    }

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

            resp.tsFilesWithValidEmit.forEach((tsFile) => {
                let status = getFileStatus(tsFile);
                status.emitDiffers = false;
            });

            // Emit never fails with an emit error, so it's probably always gonna be an empty array
            // It's here just in case something changes in TypeScript compiler
            resp.tsFilesWithInvalidEmit.forEach((tsFile) => {
                let status = getFileStatus(tsFile);
                status.emitDiffers = true;
            });

            // Update the status of the file in the current editor
            panelView.updateFileStatus(filePath);
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

    atom.commands.add('atom-workspace', 'typescript:create-tsconfig.json-project-file', (e) => {
        if (!atomUtils.commandForTypeScript(e)) return;

        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();

        parent.createProject({ filePath }).then((res) => {
            if (res.createdFilePath) {
                atom.notifications.addSuccess(`tsconfig.json file created: <br/> ${res.createdFilePath}`);
            }
        });
    });

    var theContextView: contextView.ContextView;
    atom.commands.add('atom-text-editor', 'typescript:context-actions', (e) => {
        if (!theContextView) theContextView = new contextView.ContextView();
        theContextView.show();
    });

    atom.commands.add('atom-text-editor', 'typescript:autocomplete', (e) => {
        autoCompleteProvider.triggerAutocompletePlus();
    });

    atom.commands.add('atom-workspace', 'typescript:bas-development-testing', (e) => {
        // documentationView.docView.hide();
        // documentationView.docView.autoPosition();
        // documentationView.testDocumentationView();
        // parent.debugLanguageServiceHostVersion({ filePath: atom.workspace.getActiveEditor().getPath() })
        //     .then((res) => {
        //     console.log(res.text.length);
        //     // console.log(JSON.stringify({txt:res.text}))
        // });

        // atom.commands.dispatch
        //     atom.views.getView(atom.workspace.getActiveTextEditor()),
        //     'typescript:dependency-view');
        //
        /*atom.commands.dispatch(
            atom.views.getView(atom.workspace.getActiveTextEditor()),
            'typescript:testing-r-view');*/
        
        // atom.commands.dispatch(
        //     atom.views.getView(atom.workspace.getActiveTextEditor()),
        //     'typescript:toggle-semantic-view');
             
        atom.commands.dispatch(
            atom.views.getView(atom.workspace.getActiveTextEditor()),
            'typescript:dependency-view');

        // parent.getAST({ filePath: atom.workspace.getActiveEditor().getPath() }).then((res) => {
        //     console.log(res.root);
        // });
    });

    atom.commands.add('atom-workspace', 'typescript:toggle-semantic-view', (e) => {
        if (!atomUtils.commandForTypeScript(e)) return;

        semanticView.toggle();
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

            let completePath = path.resolve(path.dirname(atomUtils.getCurrentPath()), relativePath) + '.ts';

            // TODO: Actually rename the file

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

                    parent.getRenameFilesRefactorings({ oldPath: completePath, newPath: newText })
                        .then((res) => {
                            applyRefactorings(res.refactorings);
                        });
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

            simpleSelectionView({
                items: res.references,
                viewForItem: (item) => {
                    return `<div>
                        <span>${atom.project.relativize(item.filePath) }</span>
                        <div class="pull-right">line: ${item.position.line}</div>
                        <ts-view>${item.preview}</ts-view>
                    <div>`;
                },
                filterKey: utils.getName(() => res.references[0].filePath),
                confirmed: (definition) => {
                    atom.workspace.open(definition.filePath, {
                        initialLine: definition.position.line,
                        initialColumn: definition.position.col
                    });
                }
            })
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


    atomUtils.registerOpener({
        commandSelector: 'atom-text-editor',
        commandName: 'typescript:ast',
        uriProtocol: astURI,
        getData: () => {
            return {
                text: atom.workspace.getActiveTextEditor().getText(),
                filePath: atomUtils.getCurrentPath()
            };
        },
        onOpen: (data) => {
            return new AstView(data.filePath, data.text, false);
        }
    });

    atomUtils.registerOpener({
        commandSelector: 'atom-text-editor',
        commandName: 'typescript:ast-full',
        uriProtocol: astURIFull,
        getData: () => {
            return {
                text: atom.workspace.getActiveTextEditor().getText(),
                filePath: atomUtils.getCurrentPath()
            };
        },
        onOpen: (data) => {
            return new AstView(data.filePath, data.text, true);
        }
    });

    atomUtils.registerOpener({
        commandSelector: 'atom-workspace',
        commandName: 'typescript:dependency-view',
        uriProtocol: dependencyURI,
        getData: () => {
            return {
                filePath: atomUtils.getCurrentPath()
            };
        },
        onOpen: (data) => {
            return new DependencyView(data.filePath);
        }
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
                        ${item.isNewTextSnippet ? '<span class="icon-move-right"></span>' : ''}
                        ${escapeHtml(item.display) }
                    </div>`;
                },
                filterKey: 'display',
                confirmed: (item) => {
                    // NOTE: we can special case UI's here if we want.

                    parent.applyQuickFix({ key: item.key, filePath: query.filePath, position: query.position }).then((res) => {
                        applyRefactorings(res.refactorings);
                    });
                }
            }, editor);
        });
    });

    atomUtils.registerOpener({
        commandSelector: 'atom-workspace',
        commandName: 'typescript:testing-r-view',
        uriProtocol: rView.RView.protocol,
        getData: () => { return atomUtils.getFilePath() },
        onOpen: (data) => new rView.RView({
            icon: 'repo-forked',
            title: 'React View',
            filePath: data.filePath,
        }),
    })

    atom.commands.add('atom-workspace', 'typescript:sync', (e) => {
        if (!atomUtils.commandForTypeScript(e)) return;

        panelView.softReset();
    });

    atom.commands.add('atom-text-editor', 'typescript:toggle-breakpoint', (e) => {
        if (!atomUtils.commandForTypeScript(e)) return;

        parent.toggleBreakpoint(atomUtils.getFilePathPosition()).then((res) => {
            applyRefactorings(res.refactorings);
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
            };
            documentationView.docView.show();
        });
    }).catch((err) => {
        console.error(err);
    });*/

}
