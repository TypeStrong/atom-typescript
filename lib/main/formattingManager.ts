//   Copyright 2013-2014 François de Campredon
//
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//       http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.


'use strict';

import ServiceConsumer = require('./serviceConsumer');
import IFormatingService = require('../commons/formattingService');

var EditorManager = brackets.getModule('editor/EditorManager'),
    Editor = brackets.getModule('editor/Editor').Editor;


class FormattingManager extends ServiceConsumer<IFormatingService> {
    format = () => {
        var editor = EditorManager.getCurrentFullEditor();
        if (!editor) {
            return;
        }
        var useTabs = Editor.getUseTabChar();

        var options: TypeScript.Services.FormatCodeOptions = {
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
        var currentRange = editor.getSelection(true),
            startPos = currentRange ? currentRange.start : undefined,
            endPos = currentRange ? currentRange.end : undefined;

        if (startPos && endPos && startPos.line === endPos.line && startPos.ch === endPos.ch) {
            startPos = endPos = undefined;
        }


        this.getService().then(service => {
            service.getFormatingForFile(editor.document.file.fullPath, options, startPos, endPos).then(textEdits => {
                if (EditorManager.getCurrentFullEditor() !== editor) {
                    return;
                }
                editor.document.setText(
                    textEdits.reduce((text: string, edit: TypeScript.Services.TextEdit) => {
                        return text.substr(0, edit.minChar) + edit.text + text.substr(edit.limChar);
                    }, editor.document.getText())
                );
            });
        });
    };

    static FORMAT_COMMAND_ID = 'fdecampred.brackets-typescript.format';

    static FORMAT_LABEL = 'Format';
}

export = FormattingManager;

