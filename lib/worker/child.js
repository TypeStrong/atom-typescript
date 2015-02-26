var workerLib = require('./workerLib');
var child = new workerLib.Child();
var projectService = require('../main/lang/projectService');
child.registerAllFunctionsExportedFrom(projectService);
