var parent = require('../../worker/parent');
var buildView = require('./buildView');
var atomUtils = require('./atomUtils');
var autoCompleteProvider = require('./autoCompleteProvider');
var path = require('path');
var ts = require('typescript');
var TokenClass = ts.TokenClass;
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
    function getStyleForToken(token) {
        switch (token.classification) {
            case ts.TokenClass.NumberLiteral:
                return 'number';
            case TokenClass.StringLiteral:
                return 'string';
            case TokenClass.RegExpLiteral:
                return 'string-2';
            case TokenClass.Operator:
                return 'operator';
            case TokenClass.Comment:
                return 'comment';
            case TokenClass.Punctuation:
                return 'bracket';
            case TokenClass.Whitespace:
            default:
                return null;
        }
    }
    atom.commands.add('atom-text-editor', 'typescript:context-actions', function (e) {
        atom.notifications.addSuccess('Context options coming soon!');
        var textForTest = 'var foo = 123;';
        var grammar = atom.grammars.grammarForScopeName('source.ts');
        var official = grammar.tokenizeLines(textForTest);
        console.log(official);
        var classifier = ts.createClassifier({ log: function () { return undefined; } });
        var classificationResult = classifier.getClassificationsForLine(textForTest, ts.EndOfLineState.Start).entries;
        classificationResult.map(function (info) {
            console.log(info.classification, getStyleForToken(info));
        });
    });
    atom.commands.add('atom-text-editor', 'typescript:autocomplete', function (e) {
        autoCompleteProvider.triggerAutocompletePlus();
    });
}
exports.registerCommands = registerCommands;
