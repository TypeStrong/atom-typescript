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

import Promise = require('bluebird');
import TypeScriptProjectManager = require('./projectManager');
import completion = require('../commons/completion');
import logger = require('../commons/logger');

var ScriptElementKind = TypeScript.Services.ScriptElementKind;

/**
 * implementation of the ICompletionService
 */
class CompletionService implements completion.ICompletionService {
    
    /**
     * @param projectManager the Project manager used by the service to retrieve project
     */
    constructor(
        private projectManager: TypeScriptProjectManager
    ) {}
    
        
    /**
     * Retrieve completion proposal at a given point in a given file
     * @param fileName the absolute path of the file 
     * @param position in the file where you want to retrieve completion proposal
     * 
     * @return a promise resolving to a list of proposals
     */
    getCompletionAtPosition(fileName: string, position: CodeMirror.Position): Promise<completion.CompletionResult> {
        return this.projectManager.getProjectForFile(fileName).then(project => {
            
            var languageService = project.getLanguageService(),
                languageServiceHost = project.getLanguageServiceHost(),
                index = languageServiceHost.getIndexFromPos(fileName, position),
                completionInfo = languageService.getCompletionsAtPosition(fileName, index, true),
                typeScriptEntries = completionInfo && completionInfo.entries;
            
            
            if (!typeScriptEntries) {
                return { entries: [], match: '' };
            }
            
             var sourceUnit = languageService.getSyntaxTree(fileName).sourceUnit(),
                 currentToken = sourceUnit.findTokenOnLeft(index),
                 match: string;
                 
            if (currentToken && this.isValidTokenKind(currentToken.token().tokenKind)) {
                match = currentToken.token().fullText();
                if (currentToken.element().leadingTrivia()) {
                    match = match.substr(currentToken.element().leadingTriviaWidth());
                }
                
                if (currentToken.element().trailingTrivia()) {
                    match = match.substr(0, match.length - currentToken.element().trailingTriviaWidth());
                }
                
                typeScriptEntries = typeScriptEntries.filter(entry => {
                    return entry.name && entry.name.toLowerCase().indexOf(match.toLowerCase()) === 0;
                });
            }
            
            typeScriptEntries.sort((entry1, entry2) => {
                var match1 = entry1 ? entry1.name.indexOf(match) : -1,
                    match2 = entry2 ? entry2.name.indexOf(match) : -1;
                if (match1 === 0 && match2 !== 0) {
                    return -1;
                } else if (match2 === 0 && match1 !== 0) {
                    return 1;
                } else {
                    var name1 = entry1 && entry1.name.toLowerCase(),
                        name2 = entry2 && entry2.name.toLowerCase();
                    
                    if (name1 < name2) {
                        return -1;
                    } else if (name1 > name2) {
                        return 1;
                    } else {
                        return 0;
                    }
                }
            });
            
            var completionEntries = typeScriptEntries.map(typeScriptEntry => {
                var entryInfo = languageService.getCompletionEntryDetails(fileName, index, typeScriptEntry.name),
                    completionEntry = {
                        name: typeScriptEntry.name,
                        kind: completion.CompletionKind.DEFAULT,
                        type: entryInfo && entryInfo.type,
                        doc: entryInfo && entryInfo.docComment
                    };


                switch (typeScriptEntry.kind) {
                    case ScriptElementKind.unknown:
                    case ScriptElementKind.primitiveType:
                    case ScriptElementKind.scriptElement:
                        break;
                    case ScriptElementKind.keyword:
                        completionEntry.kind = completion.CompletionKind.KEYWORD;
                        break;

                    case ScriptElementKind.classElement:
                        completionEntry.kind = completion.CompletionKind.CLASS;
                        break;
                    case ScriptElementKind.interfaceElement:
                        completionEntry.kind = completion.CompletionKind.INTERFACE;
                        break;
                    case ScriptElementKind.enumElement:
                        completionEntry.kind = completion.CompletionKind.ENUM;
                        break;
                    case ScriptElementKind.moduleElement:
                        completionEntry.kind = completion.CompletionKind.MODULE;
                        break;


                    case ScriptElementKind.memberVariableElement:
                    case ScriptElementKind.variableElement:
                    case ScriptElementKind.localVariableElement:
                    case ScriptElementKind.parameterElement:
                        completionEntry.kind = completion.CompletionKind.VARIABLE;
                        break;


                    case ScriptElementKind.memberFunctionElement:
                    case ScriptElementKind.functionElement:
                    case ScriptElementKind.localFunctionElement:
                        completionEntry.kind = completion.CompletionKind.FUNCTION;
                        break;


                    case ScriptElementKind.typeParameterElement:
                    case ScriptElementKind.constructorImplementationElement:
                    case ScriptElementKind.constructSignatureElement:
                    case ScriptElementKind.callSignatureElement:
                    case ScriptElementKind.indexSignatureElement:
                    case ScriptElementKind.memberGetAccessorElement:
                    case ScriptElementKind.memberSetAccessorElement:
                        if (logger.information()) {
                            logger.log('un handled ScriptElementKind in completion list: ' +  typeScriptEntry.kind);
                        }
                        break;
                }

                return completionEntry;
            });
            
            return {
                entries: completionEntries,
                match : match
            };
        }).catch(() => ({
            entries: [],
            match : ''
        }));
    }
    
    /**
     * helper method return true if the token correspond to an 'completable' token
     */
    private isValidTokenKind(tokenKind: number) {
        return tokenKind === TypeScript.SyntaxKind.IdentifierName ||
            (tokenKind >= TypeScript.SyntaxKind.BreakKeyword && tokenKind < TypeScript.SyntaxKind.OpenBraceToken); 
    }
}


export = CompletionService;
