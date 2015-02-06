var path = require('path');
var fs = require('fs');
var apd = require('../../apd');
var errorView = require('./atom/errorView');
var autoCompleteProvider = require('./atom/autoCompleteProvider');
var buildView = require('./atom/buildView');
var tooltipManager = require('./atom/tooltipManager');
var atomUtils = require('./atom/atomUtils');
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
                    parent.updateText({ filePath: filePath, text: text }).then(function () { return parent.getErrorsForFile({ filePath: filePath }); }).then(function (resp) { return errorView.setErrors(filePath, resp.errors); });
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
    function commandForTypeScript(e) {
        var editor = atom.workspace.getActiveTextEditor();
        if (!editor)
            return e.abortKeyBinding() && false;
        if (path.extname(editor.getPath()) !== '.ts')
            return e.abortKeyBinding() && false;
        return true;
    }
    atom.commands.add('atom-text-editor', 'typescript:format-code', function (e) {
        if (!commandForTypeScript(e))
            return;
        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();
        var selection = editor.getSelectedBufferRange();
        if (selection.isEmpty()) {
            var cursorPosition = editor.getCursorBufferPosition();
            var result = parent.formatDocument({ filePath: filePath, cursor: { line: cursorPosition.row, ch: cursorPosition.column } }).then(function (result) {
                var top = editor.getScrollTop();
                editor.setText(result.formatted);
                editor.setCursorBufferPosition([result.cursor.line, result.cursor.ch]);
                editor.setScrollTop(top);
            });
        }
        else {
            parent.formatDocumentRange({ filePath: filePath, start: { line: selection.start.row, ch: selection.start.column }, end: { line: selection.end.row, ch: selection.end.column } }).then(function (res) {
                editor.setTextInBufferRange(selection, res.formatted);
            });
        }
    });
    atom.commands.add('atom-text-editor', 'typescript:build', function (e) {
        if (!commandForTypeScript(e))
            return;
        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();
        atom.notifications.addInfo('Building');
        parent.build({ filePath: filePath }).then(function (resp) {
            buildView.setBuildOutput(resp.outputs);
        });
    });
    atom.commands.add('atom-text-editor', 'typescript:go-to-declaration', function (e) {
        if (!commandForTypeScript(e))
            return;
        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();
        parent.getDefinitionsAtPosition({ filePath: filePath, position: atomUtils.getEditorPosition(editor) }).then(function (res) {
            var definitions = res.definitions;
            if (!definitions || !definitions.length)
                return;
            var definition = definitions[0];
            atom.open({
                pathsToOpen: [definition.filePath + ":" + (definition.position.line + 1).toString()],
                newWindow: false
            });
        });
    });
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
