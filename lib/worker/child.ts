///ts:ref=globals
/// <reference path="../globals.ts"/> ///ts:ref:generated

import workerLib = require('./lib/workerLib');


// Initiate the child logic
var child = new workerLib.Child();

/////////////////////////////////////// END INFRASTRUCTURE ////////////////////////////////////////////////////

// Automatically include all functions from "projectService" as a responder
import projectService = require('../main/lang/projectService');
child.registerAllFunctionsExportedFromAsResponders(projectService);

// push in child
projectService.fixChild(child);
