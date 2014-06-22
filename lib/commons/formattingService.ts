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


import Promise = require('bluebird');

/**
 * A service allowing to retrieve formating information for a given file
 */
interface IFormattingService {
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
            startPos?: CodeMirror.Position, endPos?: CodeMirror.Position): Promise<TypeScript.Services.TextEdit[]>;
}

export = IFormattingService;
