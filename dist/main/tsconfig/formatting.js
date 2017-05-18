"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Maintainance:
 * When a new option is added add it to:
 * - the FormatCodeOptions interface
 * - the defaultFormatCodeOptions function
 * - the makeFormatCodeOptions function
 */
const os_1 = require("os");
function defaultFormatCodeOptions() {
    return {
        baseIndentSize: 4,
        indentSize: 4,
        tabSize: 4,
        newLineCharacter: os_1.EOL,
        convertTabsToSpaces: true,
        indentStyle: "Smart",
        insertSpaceAfterCommaDelimiter: true,
        insertSpaceAfterSemicolonInForStatements: true,
        insertSpaceBeforeAndAfterBinaryOperators: true,
        insertSpaceAfterKeywordsInControlFlowStatements: true,
        insertSpaceAfterFunctionKeywordForAnonymousFunctions: false,
        insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: false,
        insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: false,
        insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: false,
        insertSpaceAfterOpeningAndBeforeClosingJsxExpressionBraces: false,
        placeOpenBraceOnNewLineForFunctions: false,
        placeOpenBraceOnNewLineForControlBlocks: false,
    };
}
exports.defaultFormatCodeOptions = defaultFormatCodeOptions;
//# sourceMappingURL=formatting.js.map