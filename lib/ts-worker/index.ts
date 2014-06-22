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

// inject global in the worker
global.TypeScript = require('typescriptServices');
global.window = self;


import TypeScriptProjectManager = require('./projectManager');
import TypeScriptProject = require('./project');
import ErrorService = require('./errorService');
import DefinitionService = require('./definitionService');
import CompletionService = require('./completionService');
import FormattingService = require('./formattingService');
import LexicalStructureService = require('./lexicalStructureService');
import WorkerBridge = require('../commons/workerBridge');
import logger = require('../commons/logger');

//instantiate the different service 
var projectManager = new TypeScriptProjectManager(),
    errorService = new ErrorService(projectManager),
    completionService = new CompletionService(projectManager),
    definitionService = new DefinitionService(projectManager),
    lexicalStructureService = new LexicalStructureService(projectManager),
    formattingService = new FormattingService(projectManager),
    bridge = new WorkerBridge(<any>self);

//expose the worker services
bridge.init({
    errorService: errorService,
    completionService: completionService,
    definitionService: definitionService,
    lexicalStructureService: lexicalStructureService,
    formattingService: formattingService
}).then(proxy => {
    //inject main services into worker components
    proxy.getTypeScriptLocation().then( (location: string) => {
        proxy.getLogLevel().then((logLevel: string) => {  
            self.console = proxy.console;
            logger.setLogLevel(logLevel);
            projectManager.init(
                location, 
                proxy.preferencesManager, 
                proxy.fileSystem, proxy.workingSet, 
                TypeScriptProject.newProject
            ).then(() => {
                if (logger.information()) {
                    logger.log('TSWorker : initilialization complete');
                }
            });
        });
    });
});
