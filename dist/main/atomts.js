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
            parent.errorsForFile({ filePath: filePath }).then(function (resp) { return errorView.setErrors(filePath, resp.errors); });
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
                debugAtomTs.runDebugCode({ filePath: filePath, editor: editor });
                var changeObserver = editor.onDidStopChanging(function () {
                    if (!onDisk) {
                        var root = { line: 0, ch: 0 };
                        errorView.setErrors(filePath, [{ startPos: root, endPos: root, filePath: filePath, message: "Please save file for it be processed by TypeScript", preview: "" }]);
                        return;
                    }
                    var text = editor.getText();
                    parent.errorsForFile({ filePath: filePath }).then(function (resp) { return errorView.setErrors(filePath, resp.errors); });
                });
                var buffer = editor.buffer;
                var fasterChangeObserver = editor.buffer.onDidChange(function (diff) {
                    var minChar = buffer.characterIndexForPosition(diff.oldRange.start);
                    var limChar = minChar + diff.oldText.length;
                    var newText = diff.newText;
                    parent.editText({ filePath: filePath, minChar: minChar, limChar: limChar, newText: newText });
                });
                var saveObserver = editor.onDidSave(function (event) {
                    onDisk = true;
                    filePath = event.path;
                    onSaveHandler.handle({ filePath: filePath, editor: editor });
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
    if (!linter || !acp) {
        var notification = atom.notifications.addInfo('AtomTS: Some dependencies not found. Running "apm install" on these for you. Please wait for a success confirmation!', { dismissable: true });
        apd.install(function () {
            atom.notifications.addSuccess("AtomTS: Dependencies installed correctly. Enjoy TypeScript \u2665", { dismissable: true });
            notification.dismiss();
            if (!apd.require('linter'))
                atom.packages.loadPackage('linter');
            if (!apd.require('autocomplete-plus'))
                atom.packages.loadPackage('autocomplete-plus');
            atom.packages.activatePackage('linter').then(function () { return atom.packages.activatePackage('autocomplete-plus'); }).then(function () { return readyToActivate(); });
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
function provide() {
    return [autoCompleteProvider.provider];
}
exports.provide = provide;
//# sourceMappingURL=atomts.js.map