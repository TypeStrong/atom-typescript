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

import TypeScriptProjectConfig = require('./projectConfig');

/**
 * helper function that valid a config file
 * @param config the config object to validate
 */
export function validateTypeScriptProjectConfig(config: TypeScriptProjectConfig): boolean {
    if (!config) {
        return false;
    }    
    if (config.target && ['es3', 'es5'].indexOf(config.target.toLowerCase()) === -1) {
        return false;
    }
    if (config.module && ['none', 'amd', 'commonjs'].indexOf(config.module.toLowerCase()) === -1) {
        return false;
    }
    if (config.sourceRoot && typeof config.sourceRoot !== 'string') {
        return false;
    }
    if (!config.sources || !Array.isArray(config.sources) || !config.sources.every(pattern => typeof pattern === 'string')) {
        return false;
    }
   
    return true;
}


/**
 * Default configuration for typescript project
 */
export var typeScriptProjectConfigDefault: TypeScriptProjectConfig = {
    noLib: false,
    target: 'es3',
    module: 'none',
    noImplicitAny: false
};
