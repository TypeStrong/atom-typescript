var parent = require('../../worker/parent');
var buildView = require('./buildView');
var atomUtils = require('./atomUtils');
var autoCompleteProvider = require('./autoCompleteProvider');
var path = require('path');
var renameView = require('./views/renameView');
var apd = require('atom-package-dependencies');
var contextView = require('./views/contextView');
function commandForTypeScript(e) {
    var editor = atom.workspace.getActiveTextEditor();
    if (!editor)
        return e.abortKeyBinding() && false;
    if (path.extname(editor.getPath()) !== '.ts')
        return e.abortKeyBinding() && false;
    return true;
}
function registerCommands() {
    atom.commands.add('atom-text-editor', 'typescript:format-code', function (e) {
        if (!commandForTypeScript(e))
            return;
        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();
        var selection = editor.getSelectedBufferRange();
        if (selection.isEmpty()) {
            var cursorPosition = editor.getCursorBufferPosition();
            var currentText = editor.getText();
            var result = parent.formatDocument({ filePath: filePath, cursor: { line: cursorPosition.row, ch: cursorPosition.column } }).then(function (result) {
                if (result.formatted == currentText)
                    return;
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
    atom.commands.add('atom-workspace', 'typescript:build', function (e) {
        if (!commandForTypeScript(e))
            return;
        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();
        atom.notifications.addInfo('Building');
        parent.build({ filePath: filePath }).then(function (resp) {
            buildView.setBuildOutput(resp.outputs);
        });
    });
    var handleGoToDeclaration = function (e) {
        if (!commandForTypeScript(e))
            return;
        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();
        var position = atomUtils.getEditorPosition(editor);
        parent.getDefinitionsAtPosition({ filePath: filePath, position: position }).then(function (res) {
            var definitions = res.definitions;
            if (!definitions || !definitions.length) {
                atom.notifications.addInfo('AtomTS: No definition found.');
                return;
            }
            var definition = definitions[0];
            atom.workspace.open(definition.filePath, {
                initialLine: definition.position.line,
                initialColumn: definition.position.ch
            });
        });
    };
    atom.commands.add('atom-workspace', 'typescript:go-to-declaration', handleGoToDeclaration);
    atom.commands.add('atom-text-editor', 'symbols-view:go-to-declaration', handleGoToDeclaration);
    var theContextView;
    atom.commands.add('atom-text-editor', 'typescript:context-actions', function (e) {
        if (!theContextView)
            theContextView = new contextView.ContextView();
        theContextView.show();
        atom.notifications.addSuccess('Context options coming soon!');
    });
    atom.commands.add('atom-text-editor', 'typescript:autocomplete', function (e) {
        autoCompleteProvider.triggerAutocompletePlus();
    });
    atom.commands.add('atom-text-editor', 'typescript:here-for-development-testing', function (e) {
        parent.debugLanguageServiceHostVersion({ filePath: atom.workspace.getActiveEditor().getPath() }).then(function (res) { return console.log(res.text); });
    });
    atom.commands.add('atom-text-editor', 'typescript:rename-variable', function (e) {
        parent.getRenameInfo(atomUtils.getFilePathPosition()).then(function (res) {
            if (!res.canRename) {
                atom.notifications.addInfo('AtomTS: Rename not available at cursor location');
                return;
            }
            renameView.panelView.renameThis({
                text: res.displayName,
                onCancel: function () { },
                onCommit: function (newText) {
                    atomUtils.getEditorsForAllPaths(res.locations.map(function (l) { return l.filePath; })).then(function (editorMap) {
                        res.locations.reverse().forEach(function (location) {
                            var editor = editorMap[location.filePath];
                            var range = atomUtils.getRangeForTextSpan(editor, location.textSpan);
                            editor.setTextInBufferRange(range, newText);
                        });
                    });
                }
            });
        });
    });
}
exports.registerCommands = registerCommands;
//# sourceMappingURL=commands.js.map