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

/**
 * Represent a Lexical Structure item
 */
export interface LexicalStructureItem {
    /**
     * Name of the item
     */
    name: string;
    
    /**
     * Name of the item container
     */
    containerName: string;
    
    /**
     * Position of the item in the file
     */
    position: CodeMirror.Position;
}

/**
 * A service allowing to retrieve lexical structure for a TypeScript file
 */
export interface ILexicalStructureService {
    /**
     * retrieve Lexical structure for a given file
     * 
     * @param fileName absolute path of the file 
     * 
     * @return a Promise that resolve to a list of LexicalStructureItem
     */
    getLexicalStructureForFile(fileName: string): Promise<LexicalStructureItem[]>;
}
