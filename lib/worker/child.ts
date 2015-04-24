// setup typescript
import {makeTsGlobal} from "../typescript/makeTypeScriptGlobal";
makeTsGlobal();

import workerLib = require('./lib/workerLib');


// Initiate the child logic
var child = new workerLib.Child();

/////////////////////////////////////// END INFRASTRUCTURE ////////////////////////////////////////////////////
import * as projectCache from "../main/lang/projectCache";
// push in child
projectCache.fixChild(child);


// Automatically include all functions from "projectService" as a responder
import projectService = require('../main/lang/projectService');
child.registerAllFunctionsExportedFromAsResponders(projectService);
