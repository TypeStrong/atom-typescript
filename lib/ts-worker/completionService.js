'use strict';
var completion = require('../commons/completion');
var logger = require('../commons/logger');
var ScriptElementKind = TypeScript.Services.ScriptElementKind;
var CompletionService = (function () {
    function CompletionService(projectManager) {
        this.projectManager = projectManager;
    }
    CompletionService.prototype.getCompletionAtPosition = function (fileName, position) {
        var _this = this;
        return this.projectManager.getProjectForFile(fileName).then(function (project) {
            var languageService = project.getLanguageService(), languageServiceHost = project.getLanguageServiceHost(), index = languageServiceHost.getIndexFromPos(fileName, position), completionInfo = languageService.getCompletionsAtPosition(fileName, index, true), typeScriptEntries = completionInfo && completionInfo.entries;
            if (!typeScriptEntries) {
                return { entries: [], match: '' };
            }
            var sourceUnit = languageService.getSyntaxTree(fileName).sourceUnit(), currentToken = sourceUnit.findTokenOnLeft(index), match;
            if (currentToken && _this.isValidTokenKind(currentToken.token().tokenKind)) {
                match = currentToken.token().fullText();
                if (currentToken.element().leadingTrivia()) {
                    match = match.substr(currentToken.element().leadingTriviaWidth());
                }
                if (currentToken.element().trailingTrivia()) {
                    match = match.substr(0, match.length - currentToken.element().trailingTriviaWidth());
                }
                typeScriptEntries = typeScriptEntries.filter(function (entry) {
                    return entry.name && entry.name.toLowerCase().indexOf(match.toLowerCase()) === 0;
                });
            }
            typeScriptEntries.sort(function (entry1, entry2) {
                var match1 = entry1 ? entry1.name.indexOf(match) : -1, match2 = entry2 ? entry2.name.indexOf(match) : -1;
                if (match1 === 0 && match2 !== 0) {
                    return -1;
                }
                else if (match2 === 0 && match1 !== 0) {
                    return 1;
                }
                else {
                    var name1 = entry1 && entry1.name.toLowerCase(), name2 = entry2 && entry2.name.toLowerCase();
                    if (name1 < name2) {
                        return -1;
                    }
                    else if (name1 > name2) {
                        return 1;
                    }
                    else {
                        return 0;
                    }
                }
            });
            var completionEntries = typeScriptEntries.map(function (typeScriptEntry) {
                var entryInfo = languageService.getCompletionEntryDetails(fileName, index, typeScriptEntry.name), completionEntry = {
                    name: typeScriptEntry.name,
                    kind: 8 /* DEFAULT */,
                    type: entryInfo && entryInfo.type,
                    doc: entryInfo && entryInfo.docComment
                };
                switch (typeScriptEntry.kind) {
                    case ScriptElementKind.unknown:
                    case ScriptElementKind.primitiveType:
                    case ScriptElementKind.scriptElement:
                        break;
                    case ScriptElementKind.keyword:
                        completionEntry.kind = 7 /* KEYWORD */;
                        break;
                    case ScriptElementKind.classElement:
                        completionEntry.kind = 0 /* CLASS */;
                        break;
                    case ScriptElementKind.interfaceElement:
                        completionEntry.kind = 1 /* INTERFACE */;
                        break;
                    case ScriptElementKind.enumElement:
                        completionEntry.kind = 2 /* ENUM */;
                        break;
                    case ScriptElementKind.moduleElement:
                        completionEntry.kind = 3 /* MODULE */;
                        break;
                    case ScriptElementKind.memberVariableElement:
                    case ScriptElementKind.variableElement:
                    case ScriptElementKind.localVariableElement:
                    case ScriptElementKind.parameterElement:
                        completionEntry.kind = 4 /* VARIABLE */;
                        break;
                    case ScriptElementKind.memberFunctionElement:
                    case ScriptElementKind.functionElement:
                    case ScriptElementKind.localFunctionElement:
                        completionEntry.kind = 6 /* FUNCTION */;
                        break;
                    case ScriptElementKind.typeParameterElement:
                    case ScriptElementKind.constructorImplementationElement:
                    case ScriptElementKind.constructSignatureElement:
                    case ScriptElementKind.callSignatureElement:
                    case ScriptElementKind.indexSignatureElement:
                    case ScriptElementKind.memberGetAccessorElement:
                    case ScriptElementKind.memberSetAccessorElement:
                        if (logger.information()) {
                            logger.log('un handled ScriptElementKind in completion list: ' + typeScriptEntry.kind);
                        }
                        break;
                }
                return completionEntry;
            });
            return {
                entries: completionEntries,
                match: match
            };
        }).catch(function () { return ({
            entries: [],
            match: ''
        }); });
    };
    CompletionService.prototype.isValidTokenKind = function (tokenKind) {
        return tokenKind === 11 /* IdentifierName */ || (tokenKind >= 15 /* BreakKeyword */ && tokenKind < 70 /* OpenBraceToken */);
    };
    return CompletionService;
})();
module.exports = CompletionService;
