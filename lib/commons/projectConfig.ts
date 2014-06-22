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

/**
 * Project Configuration
 */
interface TypeScriptProjectConfig {
    
    //---------------------------------------------
    //  Brackets-Typescript Specific settings
    //---------------------------------------------
    
    /**
     * Array of minimatch pattern string representing 
     * sources of a project
     */
    sources?: string[];
    
    /**
     * Path to an alternative typescriptCompiler
     */
    typescriptPath?: string;
    
    
    //---------------------------------------------
    //  Compiler Settings
    //---------------------------------------------
    
    /**
     * should the project include the default typescript library file
     */
    noLib?: boolean;
    /**
     * 
     */
    target?: string;
    
    /**
     * Specify ECMAScript target version: 'ES3' (default), or 'ES5'
     */
    module?: string;
    
    /**
     * Specifies the location where debugger should locate TypeScript files instead of source locations.
     */
    sourceRoot?: string;
    
    /**
     *  Warn on expressions and declarations with an implied 'any' type.
     */
    noImplicitAny?: boolean;
}

export = TypeScriptProjectConfig;
