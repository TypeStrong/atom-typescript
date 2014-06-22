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

//TODO that part of the application is not well tested and just 'work' it needs to be refactored


//--------------------------------------------------------------------------
//
//  TypeScriptProject
//
//--------------------------------------------------------------------------

var BRACKETS_CONFIG_FILE_NAME = '.brackets.json';

function isBracketsPreferenceFile(path: string): boolean {
    return path && path.substr(path.lastIndexOf('/') + 1, path.length) === BRACKETS_CONFIG_FILE_NAME;
}



/**
 * brackets Error message type
 */
var Type = {
    /** Unambiguous error, such as a syntax error */
    ERROR: 'problem_type_error',
    /** Maintainability issue, probable error / bad smell, etc. */
    WARNING: 'problem_type_warning',
    /** Inspector unable to continue, code too complex for static analysis, etc. Not counted in error/warning tally. */
    META: 'problem_type_meta'
};



/**
 * TypeScript Inspection Provider
 */
class TypeScriptConfigErrorReporter implements brackets.InspectionProvider {
    
    /**
     * name of the error reporter
     */
    name = 'TypeScript Configuration';
    
    /**
     * scan file
     */
    scanFile(content: string, path: string): { errors: brackets.LintingError[];  aborted: boolean; } {
        if (!isBracketsPreferenceFile(path)) {
            return null;
        }
        var data: any;
        try {
            data = JSON.parse(content);
        } catch (e) {
            return {
                errors: [],
                aborted: true
            };
        }
        
        var typescript = data.typescript;
        if (!data.typescript) {
            return {
                errors: [],
                aborted: false
            };
        }
        
        var errors: string[] = [];
        if (typescript.projects && typescript.sources) {
            errors.push('You cannot have sources and projects at the same level');
        }
        
        validateSection(null, typescript, !typescript.projects, errors);
        
        if (typescript.projects) {
            if (typeof typescript.projects !== 'object') {
                errors.push('invalid section projects, it must be an object');
            } 
            Object.keys(typescript.projects).forEach(key => {
               validateSection(key + ': ', typescript.projects[key], true, errors); 
            });
        }
        
        return {
            errors: errors.map(message => ({
                message: message,
                type: Type.ERROR,
                pos: {line: -1, ch: -1}
            })),
            aborted: false
        };
    }
}

function validateSection(sectionName: string, config: any, mustHaveSources: boolean, errors: string[] ) {
    var prefix = sectionName ? sectionName + ': ' : '';
    if (config.target && ['es3', 'es5'].indexOf(config.target.toLowerCase()) === -1) {
        errors.push(prefix + 'the target section has invalid value authorized values are \'es3\' or \'es5\'');
    }
    if (config.module && ['none', 'amd', 'commonjs'].indexOf(config.module.toLowerCase()) === -1) {
        errors.push(prefix + 'the module section has invalid value authorized values are \'none\', \'amd\' or \'commonjs\'');
    }
    if (config.sourceRoot && typeof config.sourceRoot !== 'string') {
        errors.push(prefix + 'the sourceRoot section must be a string');
    }
    if (mustHaveSources) {
        if (
            !config.sources || 
            !Array.isArray(config.sources) || 
            !config.sources.every((pattern: string) => typeof pattern === 'string')
        ) {
            errors.push(prefix + 'invalid sources section it must be an array of string');
        }  
    } 
      
}

export = TypeScriptConfigErrorReporter;
