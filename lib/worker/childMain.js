var workerLib = require('./lib/workerLib');
var projectService = require('../main/lang/projectService');
var child = new workerLib.Child();
child.registerAllFunctionsExportedFromAsResponders(projectService);
