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

///ts:ref=globals
/// <reference path="../globals.ts"/> ///ts:ref:generated

import Promise = require('bluebird');

/**
 * An Enum representing the different kind of hint
 */
export enum CompletionKind {
    /**
     * the completion entry correspond to a class name
     */
    CLASS,
    /**
     * the completion entry correspond to an interface name
     */
    INTERFACE,
    /**
     * the completion entry correspond to an enum name
     */
    ENUM,
    /**
     * the completion entry correspond to a module name
     */
    MODULE,
    /**
     * the completion entry correspond to a variable name
     */
    VARIABLE,
    /**
     * the completion entry correspond to a mehtod name
     */
    METHOD,
    /**
     * the completion entry correspond to a function
     */
    FUNCTION,
    /**
     * the completion entry correspond to a keyword
     */
    KEYWORD,
    /**
     * Any other type
     */
    DEFAULT
}

/**
 * Represent an entry in a completion proposal list
 */
export interface CompletionEntry {
    /**
     * the name of the entry (aka: the text to insert)
     */
    name: string;
    
    /**
     * type of the symbol of the entry
     */
    type: string;
    
    /**
     * the entry kind
     */
    kind: CompletionKind;
    
    /**
     * JSDoc contents corresponding to this entry
     */
    doc: string;
}

/**
 * Represent a completion result
 */
export interface CompletionResult {
    /**
     * the matched string portion
     */
    match: string;
    
    /**
     * list of proposed entries for code completion
     */
    entries: CompletionEntry[];
}

/**
 * A service allowing to request completion proposal
 */
export interface ICompletionService {
    /**
     * Retrieve completion proposal at a given point in a given file
     * @param fileName the absolute path of the file 
     * @param position in the file where you want to retrieve completion proposal
     * 
     * @return a promise resolving to a list of proposals
     */
    getCompletionAtPosition(fileName: string, position: CodeMirror.Position): Promise<CompletionResult>;
}
