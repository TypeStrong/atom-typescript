'use strict';
global.TypeScript = require('typescriptServices');
global.window = self;
var TypeScriptProjectManager = require('./projectManager');
var TypeScriptProject = require('./project');
var ErrorService = require('./errorService');
var DefinitionService = require('./definitionService');
var CompletionService = require('./completionService');
var FormattingService = require('./formattingService');
var LexicalStructureService = require('./lexicalStructureService');
var WorkerBridge = require('../commons/workerBridge');
var logger = require('../commons/logger');
var projectManager = new TypeScriptProjectManager(), errorService = new ErrorService(projectManager), completionService = new CompletionService(projectManager), definitionService = new DefinitionService(projectManager), lexicalStructureService = new LexicalStructureService(projectManager), formattingService = new FormattingService(projectManager), bridge = new WorkerBridge(self);
bridge.init({
    errorService: errorService,
    completionService: completionService,
    definitionService: definitionService,
    lexicalStructureService: lexicalStructureService,
    formattingService: formattingService
}).then(function (proxy) {
    proxy.getTypeScriptLocation().then(function (location) {
        proxy.getLogLevel().then(function (logLevel) {
            self.console = proxy.console;
            logger.setLogLevel(logLevel);
            projectManager.init(location, proxy.preferencesManager, proxy.fileSystem, proxy.workingSet, TypeScriptProject.newProject).then(function () {
                if (logger.information()) {
                    logger.log('TSWorker : initilialization complete');
                }
            });
        });
    });
});
