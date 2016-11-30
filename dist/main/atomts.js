"use strict";
var atomConfig = require("./atom/atomConfig");
var makeTypeScriptGlobal_1 = require("../typescript/makeTypeScriptGlobal");
makeTypeScriptGlobal_1.makeTsGlobal(atomConfig.typescriptServices);
var path = require("path");
var fs = require("fs");
var mainPanelView_1 = require("./atom/views/mainPanelView");
var autoCompleteProvider = require("./atom/autoCompleteProvider");
var tooltipManager = require("./atom/tooltipManager");
var atomUtils = require("./atom/atomUtils");
var commands = require("./atom/commands/commands");
var debugAtomTs = require("./atom/debugAtomTs");
var _atom = require("atom");
var atom_space_pen_views_1 = require("atom-space-pen-views");
var documentationView = require("./atom/views/documentationView");
var renameView = require("./atom/views/renameView");
var mainPanelView = require("./atom/views/mainPanelView");
var semanticView = require("./atom/views/semanticView");
var fileStatusCache_1 = require("./atom/fileStatusCache");
var editorSetup = require("./atom/editorSetup");
var statusBar;
var statusBarMessage;
var editorWatch;
var autoCompleteWatch;
var parent = require("../worker/parent");
exports.config = atomConfig.schema;
var utils_1 = require("./lang/utils");
var hideIfNotActiveOnStart = utils_1.debounce(function () {
    var editor = atom.workspace.getActiveTextEditor();
    if (!atomUtils.onDiskAndTsRelated(editor)) {
        mainPanelView.hide();
    }
}, 100);
var __onlyOnce = false;
function onlyOnceStuff() {
    if (__onlyOnce)
        return;
    else
        __onlyOnce = true;
    mainPanelView.attach();
    documentationView.attach();
    renameView.attach();
    semanticView.attach();
}
function readyToActivate() {
    parent.startWorker();
    atom.workspace.onDidChangeActivePaneItem(function (editor) {
        if (atomUtils.onDiskAndTs(editor)) {
            var filePath = editor.getPath();
            onlyOnceStuff();
            updatePanelConfig(filePath);
            mainPanelView.panelView.updateFileStatus(filePath);
            mainPanelView.show();
        }
        else if (atomUtils.onDiskAndTsRelated(editor)) {
            mainPanelView.show();
        }
        else {
            mainPanelView.hide();
        }
    });
    editorWatch = atom.workspace.observeTextEditors(function (editor) {
        var filePath = editor.getPath();
        console.log("opened editor", filePath);
        var editorView = atom_space_pen_views_1.$(atom.views.getView(editor));
        tooltipManager.attach(editorView, editor);
        var unsubSyntax = parent.client.on("syntaxDiag", function (diag) {
        });
        var unsubSemantic = parent.client.on("semanticDiag", function (diag) {
            if (diag.file === filePath) {
                console.log("semantic errors", diag);
                mainPanelView_1.errorView.setErrors(filePath, diag.diagnostics.map(function (error) {
                    var preview = editor.buffer.getTextInRange(new _atom.Range([error.start.line - 1, error.start.offset - 1], [error.end.line - 1, error.end.offset - 1]));
                    return {
                        filePath: filePath,
                        startPos: { line: error.start.line - 1, col: error.start.offset - 1 },
                        endPos: { line: error.end.line - 1, col: error.end.offset - 1 },
                        message: ts.flattenDiagnosticMessageText(error.text, '\n'),
                        preview: preview
                    };
                }));
            }
        });
        var ext = path.extname(filePath);
        if (atomUtils.isAllowedExtension(ext)) {
            var isTst = ext === '.tst';
            try {
                onlyOnceStuff();
                parent.client.executeOpen({
                    file: filePath,
                    fileContent: editor.getText()
                });
                updatePanelConfig(filePath);
                var onDisk = false;
                if (fs.existsSync(filePath)) {
                    onDisk = true;
                }
                hideIfNotActiveOnStart();
                debugAtomTs.runDebugCode({ filePath: filePath, editor: editor });
                if (onDisk) {
                    parent.client.executeGetErr({ files: [filePath], delay: 100 });
                }
                editorSetup.setupEditor(editor);
                var changeObserver = editor.onDidStopChanging(function () {
                    if (editor === atom.workspace.getActiveTextEditor()) {
                        var status_1 = fileStatusCache_1.getFileStatus(filePath);
                        status_1.modified = editor.isModified();
                        mainPanelView.panelView.updateFileStatus(filePath);
                    }
                    if (!onDisk) {
                        var root = { line: 0, col: 0 };
                        mainPanelView_1.errorView.setErrors(filePath, [{ startPos: root, endPos: root, filePath: filePath, message: "Please save file for it be processed by TypeScript", preview: "" }]);
                        return;
                    }
                    parent.client.executeGetErr({ files: [filePath], delay: 100 });
                });
                var buffer = editor.buffer;
                var fasterChangeObserver = editor.buffer.onDidChange(function (diff) {
                    parent.client.executeChange({
                        endLine: diff.oldRange.end.row + 1,
                        endOffset: diff.oldRange.end.column + 1,
                        file: editor.getPath(),
                        line: diff.oldRange.start.row + 1,
                        offset: diff.oldRange.start.column + 1,
                        insertString: diff.newText,
                    });
                });
                var saveObserver = editor.onDidSave(function (event) {
                    console.log("saved", editor.getPath());
                    onDisk = true;
                    filePath = event.path;
                });
                var destroyObserver = editor.onDidDestroy(function () {
                    parent.client.executeClose({ file: editor.getPath() });
                    mainPanelView_1.errorView.setErrors(filePath, []);
                    changeObserver.dispose();
                    fasterChangeObserver.dispose();
                    saveObserver.dispose();
                    destroyObserver.dispose();
                    unsubSemantic();
                    unsubSyntax();
                });
            }
            catch (ex) {
                console.error('Solve this in atom-typescript', ex);
                throw ex;
            }
        }
    });
    commands.registerCommands();
}
function updatePanelConfig(file) {
    parent.client.executeProjectInfo({
        needFileNameList: false,
        file: file
    }).then(function (result) {
        mainPanelView.panelView.setTsconfigInUse(result.body.configFileName);
    }, function (err) {
        mainPanelView.panelView.setTsconfigInUse('');
    });
}
function activate(state) {
    require('atom-package-deps').install('atom-typescript').then(readyToActivate);
}
exports.activate = activate;
function deactivate() {
    if (statusBarMessage)
        statusBarMessage.destroy();
    if (editorWatch)
        editorWatch.dispose();
    if (autoCompleteWatch)
        autoCompleteWatch.dispose();
    parent.stopWorker();
}
exports.deactivate = deactivate;
function serialize() {
    return {};
}
exports.serialize = serialize;
function deserialize() {
}
exports.deserialize = deserialize;
function provide() {
    return [autoCompleteProvider.provider];
}
exports.provide = provide;
var linter = require("../linter");
function provideLinter() {
    return linter.provider;
}
exports.provideLinter = provideLinter;
function consumeSnippets(snippetsManager) {
    atomUtils._setSnippetsManager(snippetsManager);
}
exports.consumeSnippets = consumeSnippets;
var hyperclickProvider = require("../hyperclickProvider");
function getHyperclickProvider() {
    return hyperclickProvider;
}
exports.getHyperclickProvider = getHyperclickProvider;
