var path = require('path');
var apd = require('atom-package-dependencies');
var programManager = require('./lang/programManager');
var errorView = require('./atom/errorView');
var autoCompleteProvider = require('./atom/autoCompleteProvider');
var buildView = require('./atom/buildView');
var statusBar;
var statusBarMessage;
var editorWatch;
var autoCompleteWatch;
function activate(state) {
    var linter = apd.require('linter');
    var acp = apd.require('autocomplete-plus');
    if (!linter || !acp) {
        apd.install(function () {
            atom.notifications.addSuccess("Some dependent packages were required for atom-typescript. These are now installed. Best you restart atom just this once.", { dismissable: true });
        });
        return;
    }
    editorWatch = atom.workspace.observeTextEditors(function (editor) {
        var filePath = editor.getPath();
        var filename = path.basename(filePath);
        var ext = path.extname(filename);
        if (ext == '.ts') {
            try {
                var program = programManager.getOrCreateProgram(filePath);
                errorView.start();
                editor.onDidStopChanging(function () {
                    program.languageServiceHost.updateScript(filePath, editor.getText());
                    errorView.setErrors(filePath, programManager.getErrorsForFile(filePath));
                    var cursor = editor.getCursorBufferPosition();
                    var cursorPos = program.languageServiceHost.getIndexFromPosition(filePath, { line: cursor.row, ch: cursor.column });
                });
                editor.onDidSave(function (event) {
                    program.languageServiceHost.updateScript(filePath, editor.getText());
                    var output = program.emitFile(filePath);
                    errorView.showEmittedMessage(output);
                });
                editor.onDidDestroy(function () {
                    errorView.setErrors(filePath, []);
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
    function commandGetProgram() {
        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();
        return programManager.getOrCreateProgram(filePath);
    }
    atom.commands.add('atom-workspace', 'typescript:format-code', function (e) {
        if (!commandForTypeScript(e))
            return;
        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();
        var program = programManager.getOrCreateProgram(filePath);
        var selection = editor.getSelectedBufferRange();
        if (selection.isEmpty()) {
            var cursorPosition = editor.getCursorBufferPosition();
            var result = program.formatDocument(filePath, { line: cursorPosition.row, ch: cursorPosition.column });
            editor.setText(result.formatted);
            editor.setCursorBufferPosition([result.cursor.line, result.cursor.ch]);
        }
        else {
            var formatted = program.formatDocumentRange(filePath, { line: selection.start.row, ch: selection.start.column }, { line: selection.end.row, ch: selection.end.column });
            editor.setTextInBufferRange(selection, formatted);
        }
    });
    atom.commands.add('atom-workspace', 'typescript:compile', function (e) {
        if (!commandForTypeScript(e))
            return;
        atom.notifications.addInfo('Building');
        var outputs = commandGetProgram().build();
        buildView.setBuildOutput(outputs);
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
}
exports.deactivate = deactivate;
function serialize() {
    return {};
}
exports.serialize = serialize;
function deserialize() {
}
exports.deserialize = deserialize;
