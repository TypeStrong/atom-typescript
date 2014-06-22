'use strict';
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var ServiceConsumer = require('./serviceConsumer');

var EditorManager = brackets.getModule('editor/EditorManager'), Editor = brackets.getModule('editor/Editor').Editor;

var FormattingManager = (function (_super) {
    __extends(FormattingManager, _super);
    function FormattingManager() {
        _super.apply(this, arguments);
        var _this = this;
        this.format = function () {
            var editor = EditorManager.getCurrentFullEditor();
            if (!editor) {
                return;
            }
            var useTabs = Editor.getUseTabChar();

            var options = {
                IndentSize: Editor.getSpaceUnits(),
                TabSize: Editor.getTabSize(),
                NewLineCharacter: '\n',
                ConvertTabsToSpaces: !useTabs,
                InsertSpaceAfterSemicolonInForStatements: true,
                InsertSpaceAfterCommaDelimiter: true,
                InsertSpaceBeforeAndAfterBinaryOperators: true,
                InsertSpaceAfterKeywordsInControlFlowStatements: true,
                InsertSpaceAfterFunctionKeywordForAnonymousFunctions: true,
                InsertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: false,
                PlaceOpenBraceOnNewLineForFunctions: false,
                PlaceOpenBraceOnNewLineForControlBlocks: false
            };
            var currentRange = editor.getSelection(true), startPos = currentRange ? currentRange.start : undefined, endPos = currentRange ? currentRange.end : undefined;

            if (startPos && endPos && startPos.line === endPos.line && startPos.ch === endPos.ch) {
                startPos = endPos = undefined;
            }

            _this.getService().then(function (service) {
                service.getFormatingForFile(editor.document.file.fullPath, options, startPos, endPos).then(function (textEdits) {
                    if (EditorManager.getCurrentFullEditor() !== editor) {
                        return;
                    }
                    editor.document.setText(textEdits.reduce(function (text, edit) {
                        return text.substr(0, edit.minChar) + edit.text + text.substr(edit.limChar);
                    }, editor.document.getText()));
                });
            });
        };
    }
    FormattingManager.FORMAT_COMMAND_ID = 'fdecampred.brackets-typescript.format';

    FormattingManager.FORMAT_LABEL = 'Format';
    return FormattingManager;
})(ServiceConsumer);

module.exports = FormattingManager;
