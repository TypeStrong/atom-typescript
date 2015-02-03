var path = require('path');
var fs = require('fs');
var apd = require('../../apd');
var programManager = require('./lang/programManager');
var errorView = require('./atom/errorView');
var autoCompleteProvider = require('./atom/autoCompleteProvider');
var buildView = require('./atom/buildView');
var tooltipManager = require('./atom/tooltipManager');
var signatureProvider = require('./atom/signatureProvider');
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
                var program;
                if (fs.existsSync(filePath)) {
                    program = programManager.getOrCreateProgram(filePath);
                }
                errorView.start();
                var changeObserver = editor.onDidStopChanging(function () {
                    if (!program) {
                        var root = { line: 0, ch: 0 };
                        errorView.setErrors(filePath, [{ startPos: root, endPos: root, filePath: filePath, message: "Please save file for it be processed by TypeScript", preview: "" }]);
                        return;
                    }
                    program.languageServiceHost.updateScript(filePath, editor.getText());
                    errorView.setErrors(filePath, programManager.getErrorsForFile(filePath));
                    var position = atomUtils.getEditorPosition(editor);
                    signatureProvider.requestHandler({
                        program: program,
                        editor: editor,
                        filePath: filePath,
                        position: position
                    });
                });
                var saveObserver = editor.onDidSave(function (event) {
                    if (!program) {
                        program = programManager.getOrCreateProgram(filePath);
                    }
                    ;
                    program.languageServiceHost.updateScript(filePath, editor.getText());
                    var output = program.emitFile(filePath);
                    errorView.showEmittedMessage(output);
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
    function commandGetProgram() {
        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();
        return programManager.getOrCreateProgram(filePath);
    }
    atom.commands.add('atom-text-editor', 'typescript:format-code', function (e) {
        if (!commandForTypeScript(e))
            return;
        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();
        var program = programManager.getOrCreateProgram(filePath);
        var selection = editor.getSelectedBufferRange();
        if (selection.isEmpty()) {
            var cursorPosition = editor.getCursorBufferPosition();
            var result = program.formatDocument(filePath, { line: cursorPosition.row, ch: cursorPosition.column });
            var top = editor.getScrollTop();
            editor.setText(result.formatted);
            editor.setCursorBufferPosition([result.cursor.line, result.cursor.ch]);
            editor.setScrollTop(top);
        }
        else {
            var formatted = program.formatDocumentRange(filePath, { line: selection.start.row, ch: selection.start.column }, { line: selection.end.row, ch: selection.end.column });
            editor.setTextInBufferRange(selection, formatted);
        }
    });
    atom.commands.add('atom-text-editor', 'typescript:build', function (e) {
        if (!commandForTypeScript(e))
            return;
        atom.notifications.addInfo('Building');
        setTimeout(function () {
            var outputs = commandGetProgram().build();
            buildView.setBuildOutput(outputs);
        }, 100);
    });
    atom.commands.add('atom-text-editor', 'typescript:go-to-declaration', function (e) {
        if (!commandForTypeScript(e))
            return;
        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();
        var program = programManager.getOrCreateProgram(filePath);
        var range = editor.getSelectedBufferRange();
        var position = program.languageServiceHost.getIndexFromPosition(filePath, { line: range.start.row, ch: range.start.column });
        var definitions = program.languageService.getDefinitionAtPosition(filePath, position);
        if (!definitions || !definitions.length)
            return;
        var definition = definitions[0];
        var newFilePath = definition.fileName;
        var newFileProgram = program;
        var newFilePosition = newFileProgram.languageServiceHost.getPositionFromIndex(newFilePath, definition.textSpan.start());
        atom.open({
            pathsToOpen: [definition.fileName + ":" + (newFilePosition.line + 1).toString()],
            newWindow: false
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
