var atomConfig = require('./atom/atomConfig');
var makeTypeScriptGlobal_1 = require("../typescript/makeTypeScriptGlobal");
makeTypeScriptGlobal_1.makeTsGlobal(atomConfig.typescriptServices);
var path = require('path');
var fs = require('fs');
var mainPanelView_1 = require("./atom/views/mainPanelView");
var autoCompleteProvider = require('./atom/autoCompleteProvider');
var tooltipManager = require('./atom/tooltipManager');
var atomUtils = require('./atom/atomUtils');
var commands = require("./atom/commands/commands");
var onSaveHandler = require('./atom/onSaveHandler');
var debugAtomTs = require('./atom/debugAtomTs');
var atom_space_pen_views_1 = require("atom-space-pen-views");
var documentationView = require('./atom/views/documentationView');
var renameView = require('./atom/views/renameView');
var mainPanelView = require("./atom/views/mainPanelView");
var semanticView = require("./atom/views/semanticView");
var fileStatusCache_1 = require("./atom/fileStatusCache");
var editorSetup = require("./atom/editorSetup");
var statusBar;
var statusBarMessage;
var editorWatch;
var autoCompleteWatch;
var parent = require('../worker/parent');
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
            parent.getProjectFileDetails({ filePath: filePath }).then(function (res) {
                mainPanelView.panelView.setTsconfigInUse(res.projectFilePath);
            }).catch(function (err) {
                mainPanelView.panelView.setTsconfigInUse('');
            });
            parent.errorsForFile({ filePath: filePath })
                .then(function (resp) {
                mainPanelView_1.errorView.setErrors(filePath, resp.errors);
                atomUtils.triggerLinter();
            });
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
        var editorView = atom_space_pen_views_1.$(atom.views.getView(editor));
        tooltipManager.attach(editorView, editor);
        var filePath = editor.getPath();
        var ext = path.extname(filePath);
        if (atomUtils.isAllowedExtension(ext)) {
            var isTst = ext === '.tst';
            try {
                onlyOnceStuff();
                parent.getProjectFileDetails({ filePath: filePath }).then(function (res) {
                    mainPanelView.panelView.setTsconfigInUse(res.projectFilePath);
                }).catch(function (err) {
                    mainPanelView.panelView.setTsconfigInUse('');
                });
                var onDisk = false;
                if (fs.existsSync(filePath)) {
                    onDisk = true;
                }
                hideIfNotActiveOnStart();
                debugAtomTs.runDebugCode({ filePath: filePath, editor: editor });
                if (onDisk) {
                    parent.updateText({ filePath: filePath, text: editor.getText() })
                        .then(function () { return parent.errorsForFile({ filePath: filePath }); })
                        .then(function (resp) { return mainPanelView_1.errorView.setErrors(filePath, resp.errors); });
                    parent.getOutputJsStatus({ filePath: filePath }).then(function (res) {
                        var status = fileStatusCache_1.getFileStatus(filePath);
                        status.emitDiffers = res.emitDiffers;
                        var ed = atom.workspace.getActiveTextEditor();
                        if (ed && ed.getPath() === filePath) {
                            mainPanelView.panelView.updateFileStatus(filePath);
                        }
                    });
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
                    parent.errorsForFile({ filePath: filePath })
                        .then(function (resp) { return mainPanelView_1.errorView.setErrors(filePath, resp.errors); });
                });
                var buffer = editor.buffer;
                var fasterChangeObserver = editor.buffer.onDidChange(function (diff) {
                    var newText = diff.newText;
                    var oldText = diff.oldText;
                    var start = { line: diff.oldRange.start.row, col: diff.oldRange.start.column };
                    var end = { line: diff.oldRange.end.row, col: diff.oldRange.end.column };
                    var promise = parent.editText({ filePath: filePath, start: start, end: end, newText: newText });
                });
                var saveObserver = editor.onDidSave(function (event) {
                    onDisk = true;
                    filePath = event.path;
                    onSaveHandler.handle({ filePath: filePath, editor: editor });
                });
                var destroyObserver = editor.onDidDestroy(function () {
                    mainPanelView_1.errorView.setErrors(filePath, []);
                    changeObserver.dispose();
                    fasterChangeObserver.dispose();
                    saveObserver.dispose();
                    destroyObserver.dispose();
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
function activate(state) {
    require('atom-package-deps').install('atom-typescript').then(waitForGrammarActivation).then(readyToActivate);
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
function waitForGrammarActivation() {
    var activated = false;
    var deferred = Promise.defer();
    var editorWatch = atom.workspace.observeTextEditors(function (editor) {
        if (activated)
            return;
        editor.observeGrammar(function (grammar) {
            if (grammar.packageName === 'atom-typescript') {
                activated = true;
                deferred.resolve({});
            }
        });
    });
    return deferred.promise.then(function () { return editorWatch.dispose(); });
}
