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


import TypeScriptProjectManager = require('./projectManager');
import Promise = require('bluebird');
import definition = require('../commons/definition');


/**
 * implementation of the IDefinitionService
 */
class DefinitionService implements definition.IDefinitionService {
    
    /**
     * @param projectManager the Project manager used by the service to retrieve project
     */
    constructor(
        private projectManager: TypeScriptProjectManager
    ) {}
    
    
    /**
     * retrieve definition info of a symbol at a given position in a given file
     * @param fileName the absolute path of the file 
     * @param position in the file where you want to retrieve definition info
     * 
     * @return a promise resolving to a list of definition info
     */
    getDefinitionForFile(fileName: string, position: CodeMirror.Position): Promise<definition.DefinitionInfo[]> {
        return this.projectManager.getProjectForFile(fileName).then(project => {
            var languageService = project.getLanguageService(),
                languageServiceHost = project.getLanguageServiceHost(),
                index = languageServiceHost.getIndexFromPos(fileName, position);
            if (index < 0) {
                return [];
            }
            return languageService.getDefinitionAtPosition(fileName, index).map(definition => {
                var startPos = languageServiceHost.indexToPosition(definition.fileName, definition.minChar),
                    endPos = languageServiceHost.indexToPosition(definition.fileName, definition.limChar);
                return {
                    name: (definition.containerName ? (definition.containerName + '.') : '') + definition.name,
                    lineStart : startPos.line,
                    charStart : startPos.ch,
                    lineEnd : endPos.line,
                    charEnd : endPos.ch,
                    fileName: definition.fileName
                };
            });
        }).catch(() => []);
    }
}


export = DefinitionService;
