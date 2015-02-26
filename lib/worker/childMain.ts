///ts:ref=globals
/// <reference path="../globals.ts"/> ///ts:ref:generated

import workerLib = require('./lib/workerLib');
import projectService = require('../main/lang/projectService'); ///ts:import:generated

// Initiate the child logic
var child = new workerLib.Child();

// Automatically include all functions from "projectService" as a responder
child.registerAllFunctionsExportedFromAsResponders(projectService);
