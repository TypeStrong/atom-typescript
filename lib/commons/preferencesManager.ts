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
import signal = require('./signal');
import Promise = require('bluebird');


/**
 * Manage typescript section in project preference
 */
interface ITypescriptPreferenceManager {
    
    /**
     * @return a Promise resolving to and map projectId <=> project config
     * corresponding to the typescript section in project preference
     */
    getProjectsConfig(): Promise<{ [projectId: string]: TypeScriptProjectConfig; }>;
    
    /**
     * A signal notifying when preferences might have changed
     */
    configChanged: signal.ISignal<void>;
}

export = ITypescriptPreferenceManager;
