var workerLib = require('./lib/workerLib');
var child = new workerLib.Child();
var parentResponses = require('./parentResponses');
exports.plus1 = child.sendToIpc(parentResponses.plus1);
var projectService = require('../main/lang/projectService');
child.registerAllFunctionsExportedFromAsResponders(projectService);
