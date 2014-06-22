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
import ls = require('../commons/lexicalStructure');

/**
 * ILexical structure implementation
 */
class LexicalStructureService implements ls.ILexicalStructureService {
    
    /**
     * @param projectManager the Project manager used by the service to retrieve project
     */
    constructor(
        private projectManager: TypeScriptProjectManager
    ) {}
    
    /**
     * retrieve Lexical structure for a given file
     * 
     * @param fileName absolute path of the file 
     * 
     * @return a Promise that resolve to a list of LexicalStructureItem
     */
    getLexicalStructureForFile(fileName: string): Promise<ls.LexicalStructureItem[]> {
        return this.projectManager.getProjectForFile(fileName).then(project => {
            var languageServiceHost = project.getLanguageServiceHost();
            var items = project.getLanguageService().getScriptLexicalStructure(fileName) || [] ;
            return items.map(item => ({
                name: item.name,
                containerName : item.containerName,
                position: languageServiceHost.indexToPosition(fileName, item.minChar)
            }));
        });
    }
}

export = LexicalStructureService;
