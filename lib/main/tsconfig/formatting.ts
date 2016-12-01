/**
 * Maintainance:
 * When a new option is added add it to:
 * - the FormatCodeOptions interface
 * - the defaultFormatCodeOptions function
 * - the makeFormatCodeOptions function
 */
import {EOL} from "os"
import * as protocol from "typescript/lib/protocol"

export function defaultFormatCodeOptions(): protocol.FormatCodeSettings {
    return {
        baseIndentSize: 4,
        indentSize: 4,
        tabSize: 4,
        newLineCharacter: EOL,
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