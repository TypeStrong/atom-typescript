///ts:ref=globals
/// <reference path="../globals.ts"/> ///ts:ref:generated

import workerLib = require('./workerLib');

var child = new workerLib.Child();
///ts:import=projectService
import projectService = require('../main/lang/projectService'); ///ts:import:generated
// Automatically include all functions from "projectService" as a responder
child.registerAllFunctionsExportedFrom(projectService);
