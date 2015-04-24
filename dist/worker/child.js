var makeTypeScriptGlobal_1 = require("../typescript/makeTypeScriptGlobal");
makeTypeScriptGlobal_1.makeTsGlobal();
var workerLib = require('./lib/workerLib');
var child = new workerLib.Child();
var projectCache = require("../main/lang/projectCache");
projectCache.fixChild(child);
var projectService = require('../main/lang/projectService');
child.registerAllFunctionsExportedFromAsResponders(projectService);
