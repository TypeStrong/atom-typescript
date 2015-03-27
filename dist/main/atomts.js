///ts:ref=globals
/// <reference path="../globals.ts"/> ///ts:ref:generated
var path = require('path');
var fs = require('fs');
var apd = require('atom-package-dependencies');
var errorView = require('./atom/errorView');
var autoCompleteProvider = require('./atom/autoCompleteProvider');
var tooltipManager = require('./atom/tooltipManager');
var atomUtils = require('./atom/atomUtils');
var commands = require('./atom/commands');
var onSaveHandler = require('./atom/onSaveHandler');
var debugAtomTs = require('./atom/debugAtomTs');
var typescriptGrammar = require('./atom/typescriptGrammar');
var _atom = require('atom');
var documentationView = require('./atom/views/documentationView');
var renameView = require('./atom/views/renameView');
var statusBar;
var statusBarMessage;
var editorWatch;
var autoCompleteWatch;
var parent = require('../worker/parent');
var atomConfig = require('./atom/atomConfig');
exports.config = atomConfig.schema;
function readyToActivate() {
    documentationView.attach();
    renameView.attach();
    parent.startWorker();
    atom.grammars.addGrammar(new typescriptGrammar.TypeScriptSemanticGrammar(atom.grammars));
    atom.workspace.onDidChangeActivePaneItem(function (editor) {
        if (atomUtils.onDiskAndTs(editor)) {
            var filePath = editor.getPath();
            parent.errorsForFile({
                filePath: filePath
            }).then(function (resp) {
                return errorView.setErrors(filePath, resp.errors);
            });
        }
    });
    editorWatch = atom.workspace.observeTextEditors(function (editor) {
        var editorView = _atom.$(atom.views.getView(editor));
        tooltipManager.attach(editorView, editor);
        var filePath = editor.getPath();
        var ext = path.extname(filePath);
        if (ext == '.ts') {
            try {
                var onDisk = false;
                if (fs.existsSync(filePath)) {
                    onDisk = true;
                }
                errorView.start();
                debugAtomTs.runDebugCode({
                    filePath: filePath,
                    editor: editor
                });
                if (onDisk) {
                    parent.updateText({
                        filePath: filePath,
                        text: editor.getText()
                    }).then(function () {
                        return parent.errorsForFile({
                            filePath: filePath
                        });
                    }).then(function (resp) {
                        return errorView.setErrors(filePath, resp.errors);
                    });
                }
                var changeObserver = editor.onDidStopChanging(function () {
                    if (!onDisk) {
                        var root = {
                            line: 0,
                            col: 0
                        };
                        errorView.setErrors(filePath, [
                            {
                                startPos: root,
                                endPos: root,
                                filePath: filePath,
                                message: "Please save file for it be processed by TypeScript",
                                preview: ""
                            }
                        ]);
                        return;
                    }
                    parent.errorsForFile({
                        filePath: filePath
                    }).then(function (resp) {
                        return errorView.setErrors(filePath, resp.errors);
                    });
                });
                var buffer = editor.buffer;
                var fasterChangeObserver = editor.buffer.onDidChange(function (diff) {
                    //// For debugging
                    // console.log(buffer.characterIndexForPosition(diff.oldRange.start), buffer.characterIndexForPosition(diff.oldRange.end), diff.oldText,
                    //     buffer.characterIndexForPosition(diff.newRange.start), buffer.characterIndexForPosition(diff.newRange.end), diff.newText);
                    //// Examples
                    //// 20 20 "aaaa" 20 20 ""
                    //// 23 23 "" 23 24 "a"
                    //// 20 20 "" 20 24 "aaaa"
                    var newText = diff.newText;
                    newText = editor.buffer.getTextInRange(diff.newRange);
                    var minChar = buffer.characterIndexForPosition(diff.oldRange.start);
                    var limChar = minChar + diff.oldText.length;
                    var promise = parent.editText({
                        filePath: filePath,
                        minChar: minChar,
                        limChar: limChar,
                        newText: newText
                    });
                });
                var saveObserver = editor.onDidSave(function (event) {
                    onDisk = true;
                    filePath = event.path;
                    onSaveHandler.handle({
                        filePath: filePath,
                        editor: editor
                    });
                });
                var destroyObserver = editor.onDidDestroy(function () {
                    errorView.setErrors(filePath, []);
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
    var linter = apd.require('linter');
    var acp = apd.require('autocomplete-plus');
    var formatter = apd.require('formatter');
    if (!linter || !acp || !formatter) {
        var notification = atom.notifications.addInfo('AtomTS: Some dependencies not found. Running "apm install" on these for you. Please wait for a success confirmation!', {
            dismissable: true
        });
        apd.install(function () {
            atom.notifications.addSuccess("AtomTS: Dependencies installed correctly. Enjoy TypeScript \u2665", {
                dismissable: true
            });
            notification.dismiss();
            if (!apd.require('linter'))
                atom.packages.loadPackage('linter');
            if (!apd.require('autocomplete-plus'))
                atom.packages.loadPackage('autocomplete-plus');
            if (!apd.require('formatter'))
                atom.packages.loadPackage('formatter');
            Promise.all([
                atom.packages.activatePackage('linter'),
                atom.packages.activatePackage('autocomplete-plus'),
                atom.packages.activatePackage('formatter'),
            ]).then(function () {
                return readyToActivate();
            });
        });
        return;
    }
    readyToActivate();
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
function autoCompleteProvide() {
    return autoCompleteProvider.provider;
}
exports.autoCompleteProvide = autoCompleteProvide;
function provideFormatter() {
    var formatter;
    formatter = {
        selector: '.source.ts',
        getCodeEdits: function (options) {
            var filePath = options.editor.getPath();
            if (!options.selection) {
                return parent.formatDocument({
                    filePath: filePath
                }).then(function (result) {
                    return result.edits;
                });
            }
            else {
                return parent.formatDocumentRange({
                    filePath: filePath,
                    start: options.selection.start,
                    end: options.selection.end
                }).then(function (result) {
                    return result.edits;
                });
            }
        }
    };
    return formatter;
}
exports.provideFormatter = provideFormatter;
//# sourceMappingURL=atomts.js.map