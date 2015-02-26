///ts:ref=globals
/// <reference path="../globals.ts"/> ///ts:ref:generated

import workerLib = require('./lib/workerLib');


// Initiate the child logic
var child = new workerLib.Child();

/////////////////////////////////////// END INFRASTRUCTURE ////////////////////////////////////////////////////

import parentResponses = require('./parentResponses');
export var plus1 = child.sendToIpc(parentResponses.plus1);

// Automatically include all functions from "projectService" as a responder
import projectService = require('../main/lang/projectService');
child.registerAllFunctionsExportedFromAsResponders(projectService);
