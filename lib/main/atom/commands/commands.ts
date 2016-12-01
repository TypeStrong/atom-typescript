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
import {create as createTypeOverlay} from "../views/typeOverlayView";
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

    atom.commands.add('atom-workspace', 'typescript:toggle-semantic-view', (e) => {
        if (!atomUtils.commandForTypeScript(e)) return;

        semanticView.toggle();
    });

    atom.commands.add('atom-text-editor', 'typescript:rename-refactor', (e) => {
        // Rename file
        var editor = atom.workspace.getActiveTextEditor();

        // Rename variable
        if (true) {
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

    atom.commands.add('atom-workspace', 'typescript:show-type', (e) => {
      var editor = atom.workspace.getActiveTextEditor();
      var editorView = atom.views.getView(editor);
      var cursor = editor.getLastCursor()
      var position = cursor.getBufferPosition()
      var filePath = editor.getPath();

      parent.clients.get(filePath).then(client => {
        return client.executeQuickInfo({
            file: filePath,
            line: position.row+1,
            offset: position.column+1
        }).then(({body: {displayString, documentation}}) => {
            var decoration = editor.decorateMarker(cursor.getMarker(), {
              type: 'overlay',
              item: createTypeOverlay(displayString, documentation)
            });

            var onKeydown = (e) => {
              if (e.keyCode == 27) { // esc
                destroyTypeOverlay();
              }
            };
            var destroyTypeOverlay = () => {
              decoration.destroy();
              cursorListener.dispose();
              editorView.removeEventListener('blur', destroyTypeOverlay);
              editorView.removeEventListener('keydown', onKeydown);
            };

            var cursorListener = editor.onDidChangeCursorPosition(destroyTypeOverlay);
            editorView.addEventListener('blur', destroyTypeOverlay);
            editorView.addEventListener('keydown', onKeydown);
        }).catch(() => { /* ignore errors */ })
      })
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
                        <div class="pull-right">line: ${item.position.line + 1}</div>
                        <ts-view>${escapeHtml(item.preview)}</ts-view>
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
            if (path.extname(editor.getPath()) !== '.ts' && path.extname(editor.getPath()) !== '.tsx') return false;


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
    atom.commands.add('atom-text-editor', 'symbols-view:toggle-project-symbols',
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

}
