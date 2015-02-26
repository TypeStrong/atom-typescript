var workerLib = require('./lib/workerLib');
var child = new workerLib.Child();
var projectService = require('../main/lang/projectService');
child.registerAllFunctionsExportedFromAsResponders(projectService);
projectService.child = child;
