var parent = require("../../../worker/parent");
var buildView = require("../buildView");
var atomUtils = require("../atomUtils");
var autoCompleteProvider = require("../autoCompleteProvider");
var path = require('path');
var renameView = require("../views/renameView");
var apd = require('atom-package-dependencies');
var contextView = require("../views/contextView");
var fileSymbolsView = require("../views/fileSymbolsView");
var projectSymbolsView = require("../views/projectSymbolsView");
var gotoHistory = require("../gotoHistory");
var utils = require("../../lang/utils");
var mainPanelView_1 = require("../views/mainPanelView");
var url = require("url");
var astView_1 = require("../views/astView");
var dependencyView_1 = require("../views/dependencyView");
var simpleSelectionView_1 = require("../views/simpleSelectionView");
var simpleOverlaySelectionView_1 = require("../views/simpleOverlaySelectionView");
var outputFileCommands = require("./outputFileCommands");
function registerCommands() {
    outputFileCommands.register();
    atom.commands.add('atom-text-editor', 'typescript:format-code', function (e) {
        if (!atomUtils.commandForTypeScript(e))
            return;
        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();
        var selection = editor.getSelectedBufferRange();
        if (selection.isEmpty()) {
            parent.formatDocument({ filePath: filePath }).then(function (result) {
                if (!result.edits.length)
                    return;
                editor.transact(function () {
                    atomUtils.formatCode(editor, result.edits);
                });
            });
        }
        else {
            parent.formatDocumentRange({ filePath: filePath, start: { line: selection.start.row, col: selection.start.column }, end: { line: selection.end.row, col: selection.end.column } }).then(function (result) {
                if (!result.edits.length)
                    return;
                editor.transact(function () {
                    atomUtils.formatCode(editor, result.edits);
                });
            });
        }
    });
    atom.commands.add('atom-workspace', 'typescript:build', function (e) {
        if (!atomUtils.commandForTypeScript(e))
            return;
        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();
        atom.notifications.addInfo('Building');
        parent.build({ filePath: filePath }).then(function (resp) {
            buildView.setBuildOutput(resp.buildOutput);
        });
    });
    var handleGoToDeclaration = function (e) {
        if (!atomUtils.commandForTypeScript(e))
            return;
        parent.getDefinitionsAtPosition(atomUtils.getFilePathPosition()).then(function (res) {
            var definitions = res.definitions;
            if (!definitions || !definitions.length) {
                atom.notifications.addInfo('AtomTS: No definition found.');
                return;
            }
            if (definitions.length > 1) {
                simpleSelectionView_1.default({
                    items: definitions,
                    viewForItem: function (item) {
                        return "\n                            <span>" + item.filePath + "</span>\n                            <div class=\"pull-right\">line: " + item.position.line + "</div>\n                        ";
                    },
                    filterKey: 'filePath',
                    confirmed: function (definition) {
                        atom.workspace.open(definition.filePath, {
                            initialLine: definition.position.line,
                            initialColumn: definition.position.col
                        });
                    }
                });
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
    atom.commands.add('atom-text-editor', 'symbols-view:go-to-declaration', handleGoToDeclaration);
    var theContextView;
    atom.commands.add('atom-text-editor', 'typescript:context-actions', function (e) {
        if (!theContextView)
            theContextView = new contextView.ContextView();
        theContextView.show();
    });
    atom.commands.add('atom-text-editor', 'typescript:autocomplete', function (e) {
        autoCompleteProvider.triggerAutocompletePlus();
    });
    atom.commands.add('atom-text-editor', 'typescript:bas-development-testing', function (e) {
        // documentationView.docView.hide();
        // documentationView.docView.autoPosition();
        // documentationView.testDocumentationView();
        // parent.debugLanguageServiceHostVersion({ filePath: atom.workspace.getActiveEditor().getPath() })
        //     .then((res) => {
        //     console.log(res.text.length);
        //     // console.log(JSON.stringify({txt:res.text}))
        // });
        atom.commands.dispatch(atom.views.getView(atom.workspace.getActiveTextEditor()), 'typescript:dependency-view');
    });
    atom.commands.add('atom-text-editor', 'typescript:rename-refactor', function (e) {
        var editor = atom.workspace.getActiveTextEditor();
        var matched = atomUtils.editorInTheseScopes([atomUtils.knownScopes.es6import, atomUtils.knownScopes.require]);
        if (matched) {
            var relativePath = editor.getTextInRange(editor.bufferRangeForScopeAtCursor(matched)).replace(/['"]+/g, '');
            if (!utils.pathIsRelative(relativePath)) {
                atom.notifications.addInfo('AtomTS: Can only rename external modules if they are relative files!');
                return;
            }
            var completePath = path.resolve(atomUtils.getCurrentPath(), relativePath) + '.ts';
            console.log(completePath);
            renameView.panelView.renameThis({
                autoSelect: false,
                title: 'Rename File',
                text: completePath,
                openFiles: [],
                closedFiles: [],
                onCancel: function () { },
                onValidate: function (newText) {
                    if (!newText.trim()) {
                        return 'If you want to abort : Press esc to exit';
                    }
                    return '';
                },
                onCommit: function (newText) {
                    newText = newText.trim();
                }
            });
            atom.notifications.addInfo('AtomTS: File rename comming soon!');
        }
        else {
            parent.getRenameInfo(atomUtils.getFilePathPosition()).then(function (res) {
                if (!res.canRename) {
                    atom.notifications.addInfo('AtomTS: Rename not available at cursor location');
                    return;
                }
                var paths = atomUtils.getOpenTypeScritEditorsConsistentPaths();
                var openPathsMap = utils.createMap(paths);
                var refactorPaths = Object.keys(res.locations);
                var openFiles = refactorPaths.filter(function (p) { return openPathsMap[p]; });
                var closedFiles = refactorPaths.filter(function (p) { return !openPathsMap[p]; });
                renameView.panelView.renameThis({
                    autoSelect: true,
                    title: 'Rename Variable',
                    text: res.displayName,
                    openFiles: openFiles,
                    closedFiles: closedFiles,
                    onCancel: function () { },
                    onValidate: function (newText) {
                        if (newText.replace(/\s/g, '') !== newText.trim()) {
                            return 'The new variable must not contain a space';
                        }
                        if (!newText.trim()) {
                            return 'If you want to abort : Press esc to exit';
                        }
                        return '';
                    },
                    onCommit: function (newText) {
                        newText = newText.trim();
                        atomUtils.getEditorsForAllPaths(Object.keys(res.locations))
                            .then(function (editorMap) {
                            Object.keys(res.locations).forEach(function (filePath) {
                                var editor = editorMap[filePath];
                                editor.transact(function () {
                                    res.locations[filePath].forEach(function (textSpan) {
                                        var range = atomUtils.getRangeForTextSpan(editor, textSpan);
                                        editor.setTextInBufferRange(range, newText);
                                    });
                                });
                            });
                        });
                    }
                });
            });
        }
    });
    atom.commands.add('atom-workspace', 'typescript:go-to-next', function (e) {
        gotoHistory.gotoNext();
    });
    atom.commands.add('atom-workspace', 'typescript:go-to-previous', function (e) {
        gotoHistory.gotoPrevious();
    });
    atom.commands.add('atom-workspace', 'typescript:find-references', function (e) {
        if (!atomUtils.commandForTypeScript(e))
            return;
        parent.getReferences(atomUtils.getFilePathPosition()).then(function (res) {
            mainPanelView_1.panelView.setReferences(res.references);
        });
    });
    var theFileSymbolsView;
    var showFileSymbols = utils.debounce(function (filePath) {
        if (!theFileSymbolsView)
            theFileSymbolsView = new fileSymbolsView.FileSymbolsView();
        parent.getNavigationBarItems({ filePath: filePath }).then(function (res) {
            theFileSymbolsView.setNavBarItems(res.items, filePath);
            theFileSymbolsView.show();
        });
    }, 400);
    atom.commands.add('.platform-linux atom-text-editor, .platform-darwin atom-text-editor,.platform-win32 atom-text-editor', 'symbols-view:toggle-file-symbols', function (e) {
        var editor = atom.workspace.getActiveTextEditor();
        if (!editor)
            return false;
        if (path.extname(editor.getPath()) !== '.ts')
            return false;
        e.abortKeyBinding();
        var filePath = editor.getPath();
        showFileSymbols(filePath);
    });
    var theProjectSymbolsView;
    var showProjectSymbols = utils.debounce(function (filePath) {
        if (!theProjectSymbolsView)
            theProjectSymbolsView = new projectSymbolsView.ProjectSymbolsView();
        parent.getNavigateToItems({ filePath: filePath }).then(function (res) {
            theProjectSymbolsView.setNavBarItems(res.items);
            theProjectSymbolsView.show();
        });
    }, 400);
    atom.commands.add('.platform-linux atom-text-editor, .platform-darwin atom-text-editor,.platform-win32 atom-text-editor', 'symbols-view:toggle-project-symbols', function (e) {
        var editor = atom.workspace.getActiveTextEditor();
        if (!editor)
            return false;
        if (path.extname(editor.getPath()) !== '.ts')
            return false;
        e.abortKeyBinding();
        var filePath = editor.getPath();
        showProjectSymbols(filePath);
    });
    atom.commands.add('atom-text-editor', 'typescript:ast', function (e) {
        if (!atomUtils.commandForTypeScript(e))
            return;
        var uri = astView_1.astUriForPath(atomUtils.getCurrentPath());
        var old_pane = atom.workspace.paneForURI(uri);
        if (old_pane) {
            old_pane.destroyItem(old_pane.itemForUri(uri));
        }
        atom.workspace.open(uri, {
            text: atom.workspace.getActiveTextEditor().getText(),
            filePath: atomUtils.getCurrentPath()
        });
    });
    atom.commands.add('atom-text-editor', 'typescript:ast-full', function (e) {
        if (!atomUtils.commandForTypeScript(e))
            return;
        var uri = astView_1.astUriFullForPath(atomUtils.getCurrentPath());
        var old_pane = atom.workspace.paneForURI(uri);
        if (old_pane) {
            old_pane.destroyItem(old_pane.itemForUri(uri));
        }
        atom.workspace.open(uri, {
            text: atom.workspace.getActiveTextEditor().getText(),
            filePath: atomUtils.getCurrentPath()
        });
    });
    atom.workspace.addOpener(function (uri, details) {
        try {
            var protocol = url.parse(uri).protocol;
        }
        catch (error) {
            return;
        }
        if (protocol !== astView_1.astURI) {
            return;
        }
        return new astView_1.AstView(details.filePath, details.text, false);
    });
    atom.workspace.addOpener(function (uri, details) {
        try {
            var protocol = url.parse(uri).protocol;
        }
        catch (error) {
            return;
        }
        if (protocol !== astView_1.astURIFull) {
            return;
        }
        return new astView_1.AstView(details.filePath, details.text, true);
    });
    atom.commands.add('atom-workspace', 'typescript:dependency-view', function (e) {
        if (!atomUtils.commandForTypeScript(e))
            return;
        var uri = dependencyView_1.dependencyUriForPath(atomUtils.getCurrentPath());
        var old_pane = atom.workspace.paneForURI(uri);
        if (old_pane) {
            old_pane.destroyItem(old_pane.itemForUri(uri));
        }
        atom.workspace.open(uri, {
            filePath: atomUtils.getCurrentPath()
        });
    });
    atom.workspace.addOpener(function (uri, details) {
        try {
            var protocol = url.parse(uri).protocol;
        }
        catch (error) {
            return;
        }
        if (protocol !== dependencyView_1.dependencyURI) {
            return;
        }
        return new dependencyView_1.DependencyView(details.filePath);
    });
    atom.commands.add('atom-text-editor', 'typescript:quick-fix', function (e) {
        if (!atomUtils.commandForTypeScript(e))
            return;
        var editor = atomUtils.getActiveEditor();
        var query = atomUtils.getFilePathPosition();
        parent.getQuickFixes(query).then(function (result) {
            if (!result.fixes.length) {
                atom.notifications.addInfo('AtomTS: No QuickFixes for current cursor position');
                return;
            }
            simpleOverlaySelectionView_1.default({
                items: result.fixes,
                viewForItem: function (item) {
                    return "<div>\n                        " + item.display + "\n                    </div>";
                },
                filterKey: 'display',
                confirmed: function (item) {
                    // NOTE: we can special case UI's here if we want.
                    parent.applyQuickFix({ key: item.key, filePath: query.filePath, position: query.position }).then(function (res) {
                        var paths = atomUtils.getOpenTypeScritEditorsConsistentPaths();
                        var openPathsMap = utils.createMap(paths);
                        var refactorPaths = Object.keys(res.refactorings);
                        var openFiles = refactorPaths.filter(function (p) { return openPathsMap[p]; });
                        var closedFiles = refactorPaths.filter(function (p) { return !openPathsMap[p]; });
                        atomUtils.getEditorsForAllPaths(refactorPaths)
                            .then(function (editorMap) {
                            refactorPaths.forEach(function (filePath) {
                                var editor = editorMap[filePath];
                                editor.transact(function () {
                                    res.refactorings[filePath].forEach(function (refactoring) {
                                        var range = atomUtils.getRangeForTextSpan(editor, refactoring.span);
                                        editor.setTextInBufferRange(range, refactoring.newText);
                                    });
                                });
                            });
                        });
                    });
                }
            }, editor);
        });
    });
    atom.commands.add('atom-workspace', 'typescript:sync', function (e) {
        if (!atomUtils.commandForTypeScript(e))
            return;
        mainPanelView_1.panelView.softReset();
    });
}
exports.registerCommands = registerCommands;
