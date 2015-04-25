var typescriptServices = '';
if (process.argv.length > 2) {
    typescriptServices = process.argv[2];
}
var makeTypeScriptGlobal_1 = require("../typescript/makeTypeScriptGlobal");
makeTypeScriptGlobal_1.makeTsGlobal(typescriptServices);
var workerLib = require('./lib/workerLib');
var child = new workerLib.Child();
var projectCache = require("../main/lang/projectCache");
projectCache.fixChild(child);
var projectService = require('../main/lang/projectService');
child.registerAllFunctionsExportedFromAsResponders(projectService);
