///ts:import=parent
import parent = require('../../worker/parent'); ///ts:import:generated
///ts:import=buildView
import buildView = require('./buildView'); ///ts:import:generated
///ts:import=atomUtils
import atomUtils = require('./atomUtils'); ///ts:import:generated
///ts:import=autoCompleteProvider
import autoCompleteProvider = require('./autoCompleteProvider'); ///ts:import:generated
import path = require('path');
import ts = require('typescript');
import TokenClass = ts.TokenClass;

// Utility functions for commands
function commandForTypeScript(e) {
    var editor = atom.workspace.getActiveTextEditor();
    if (!editor) return e.abortKeyBinding() && false;
    if (path.extname(editor.getPath()) !== '.ts') return e.abortKeyBinding() && false;

    return true;
}

export function registerCommands() {

    // Setup custom commands NOTE: these need to be added to the keymaps
    atom.commands.add('atom-text-editor', 'typescript:format-code',(e) => {
        if (!commandForTypeScript(e)) return;

        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();
        var selection = editor.getSelectedBufferRange();
        if (selection.isEmpty()) {
            var cursorPosition = editor.getCursorBufferPosition();
            var result = parent.formatDocument({ filePath: filePath, cursor: { line: cursorPosition.row, ch: cursorPosition.column } })
                .then((result) => {
                var top = editor.getScrollTop();
                editor.setText(result.formatted);
                editor.setCursorBufferPosition([result.cursor.line, result.cursor.ch]);
                editor.setScrollTop(top);
            });
        } else {
            parent.formatDocumentRange({ filePath: filePath, start: { line: selection.start.row, ch: selection.start.column }, end: { line: selection.end.row, ch: selection.end.column } }).then((res) => {
                editor.setTextInBufferRange(selection, res.formatted);
            });

        }
    });
    atom.commands.add('atom-text-editor', 'typescript:build',(e) => {
        if (!commandForTypeScript(e)) return;

        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();

        atom.notifications.addInfo('Building');

        parent.build({ filePath: filePath }).then((resp) => {
            buildView.setBuildOutput(resp.outputs);
        });
    });
    atom.commands.add('atom-text-editor', 'typescript:go-to-declaration',(e) => {
        if (!commandForTypeScript(e)) return;

        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();
        parent.getDefinitionsAtPosition({ filePath: filePath, position: atomUtils.getEditorPosition(editor) }).then(res=> {
            var definitions = res.definitions;
            if (!definitions || !definitions.length) return;

            // Potential future ugly hack for something (atom or TS langauge service) path handling
            // definitions.forEach((def)=> def.fileName.replace('/',path.sep));

            // TODO: support multiple implementations. For now we just go to first
            var definition = definitions[0];

            atom.open({
                // The file open command line is 1 indexed
                pathsToOpen: [definition.filePath + ":" + (definition.position.line + 1).toString()],
                newWindow: false
            });
        });
    });

    function getStyleForToken(token: ts.ClassificationInfo): string {
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
            /*case TokenClass.Keyword:
                switch (token.string) {
                    case 'string':
                    case 'number':
                    case 'void':
                    case 'bool':
                    case 'boolean':
                        return 'variable-2';
                    case 'static':
                    case 'public':
                    case 'private':
                    case 'export':
                    case 'get':
                    case 'set':
                        return 'qualifier';
                    case 'class':
                    case 'function':
                    case 'module':
                    case 'var':
                        return 'def';
                    default:
                        return 'keyword';
                }

            case TokenClass.Identifier:
                // Show types (indentifiers in PascalCase) as variable-2, other types (camelCase) as variable
                if (token.string.charAt(0).toLowerCase() !== token.string.charAt(0)) {
                    return 'variable-2';
                } else {
                    return 'variable';
                }*/
            case TokenClass.Punctuation:
                return 'bracket';
            case TokenClass.Whitespace:
            default:
                return null;
        }
    }

    atom.commands.add('atom-text-editor', 'typescript:context-actions',(e) => {
        atom.notifications.addSuccess('Context options coming soon!');

        var textForTest = 'var foo = 123;';

        //////////// Code for the built in grammar
        var grammar = (<any>atom).grammars.grammarForScopeName('source.ts'); // https://atom.io/docs/api/v0.177.0/Grammar
        var official = grammar.tokenizeLines(textForTest);
        console.log(official);


        var classifier: ts.Classifier = ts.createClassifier({ log: () => undefined });

        var classificationResult = classifier.getClassificationsForLine(textForTest, ts.EndOfLineState.Start).entries;

        classificationResult.map((info)=>{
            console.log(info.classification, getStyleForToken(info));
        });


    });

    atom.commands.add('atom-text-editor', 'typescript:autocomplete',(e) => {
        autoCompleteProvider.triggerAutocompletePlus();
    });
}
