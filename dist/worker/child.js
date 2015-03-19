///ts:ref=globals
/// <reference path="../globals.ts"/> ///ts:ref:generated
var workerLib = require('./lib/workerLib');
var child = new workerLib.Child();
var projectService = require('../main/lang/projectService');
child.registerAllFunctionsExportedFromAsResponders(projectService);
projectService.fixChild(child);
//# sourceMappingURL=child.js.map