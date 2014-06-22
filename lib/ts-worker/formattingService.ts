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

import IFormattingService = require('../commons/formattingService');
import TypeScriptProjectManager = require('./projectManager');
import Promise = require('bluebird');



class FormattingService implements IFormattingService {
    
    /**
     * @param projectManager the Project manager used by the service to retrieve project
     */
    constructor(
        private projectManager: TypeScriptProjectManager
    ) {}
    
        
    /**
     * Retrieve formating information for a givent file
     * @param fileName the absolute path of the file 
     * @param options formation options
     * @param startPos an option start position for the formating range
     * @param endPos an optional end position for the formating range
     * 
     * @return a promise resolving to a formating range info
     */
    getFormatingForFile(fileName: string, options: TypeScript.Services.FormatCodeOptions,
            startPos?: CodeMirror.Position, endPos?: CodeMirror.Position): Promise<TypeScript.Services.TextEdit[]> {
        return this.projectManager.getProjectForFile(fileName).then(project => {
            
            var languageServiceHost = project.getLanguageServiceHost(),
                languageService = project.getLanguageService(),
                minChar: number, limChar: number;
            
            if (!startPos || ! endPos) {
                minChar = 0;
                limChar = project.getLanguageServiceHost().getScriptContent(fileName).length - 1;
            } else {
                minChar = languageServiceHost.getIndexFromPos(fileName, startPos);
                limChar = languageServiceHost.getIndexFromPos(fileName, endPos);
            }
            
            var result = languageService.getFormattingEditsForRange(fileName, minChar, limChar, options);
            
            return result && result.reverse();
        });
    }
}

export = FormattingService;
