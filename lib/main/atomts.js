var path = require('path');
var fs = require('fs');
var apd = require('../../apd');
var errorView = require('./atom/errorView');
var autoCompleteProvider = require('./atom/autoCompleteProvider');
var tooltipManager = require('./atom/tooltipManager');
var commands = require('./atom/commands');
var statusBar;
var statusBarMessage;
var editorWatch;
var autoCompleteWatch;
var parent = require('../worker/parent');
function activate(state) {
    var linter = apd.require('linter');
    var acp = apd.require('autocomplete-plus');
    if (!linter || !acp) {
        apd.install(function () {
            atom.notifications.addSuccess("Some dependent packages were required for atom-typescript. These are now installed. Best you restart atom just this once.", { dismissable: true });
        });
        return;
    }
    parent.startWorker();
    atom.workspaceView.eachEditorView(function (editorView) {
        tooltipManager.attach(editorView);
    });
    editorWatch = atom.workspace.observeTextEditors(function (editor) {
        var filePath = editor.getPath();
        var filename = path.basename(filePath);
        var ext = path.extname(filename);
        if (ext == '.ts') {
            try {
                var onDisk = false;
                if (fs.existsSync(filePath)) {
                    onDisk = true;
                }
                errorView.start();
                var changeObserver = editor.onDidStopChanging(function () {
                    if (!onDisk) {
                        var root = { line: 0, ch: 0 };
                        errorView.setErrors(filePath, [{ startPos: root, endPos: root, filePath: filePath, message: "Please save file for it be processed by TypeScript", preview: "" }]);
                        return;
                    }
                    var text = editor.getText();
                    parent.updateText({ filePath: filePath, text: text }).then(function () { return parent.errorsForFile({ filePath: filePath }); }).then(function (resp) { return errorView.setErrors(filePath, resp.errors); });
                });
                var saveObserver = editor.onDidSave(function (event) {
                    onDisk = true;
                    parent.updateText({ filePath: filePath, text: editor.getText() }).then(function () { return parent.emitFile({ filePath: filePath }); }).then(function (res) { return errorView.showEmittedMessage(res); });
                });
                var destroyObserver = editor.onDidDestroy(function () {
                    errorView.setErrors(filePath, []);
                    changeObserver.dispose();
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
    autoCompleteWatch = atom.services.provide('autocomplete.provider', '1.0.0', { provider: autoCompleteProvider });
    commands.registerCommands();
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
