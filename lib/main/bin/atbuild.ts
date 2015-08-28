/**
 * This file is a work in progress
 */

import {makeTsGlobal} from "../../typescript/makeTypeScriptGlobal";
makeTsGlobal();

import * as tsconfig from "../tsconfig/tsconfig";
import * as building from "../lang/modules/building";
import {Project} from "../lang/core/project";
import {selectMany} from "../lang/utils";

var startLoc;
if (process.argv.length > 2) {
    // Read the first additional argument passed to the program
    startLoc = process.argv[2];
}
else {
    startLoc = process.cwd();
}

var projectFile = tsconfig.getProjectSync(startLoc);
console.log(`Compiling using project file: ${projectFile.projectFilePath}`);
var proj = new Project(projectFile);

var errors = selectMany(proj.projectFile.project.files.map((filePath) => {
    var output = building.emitFile(proj, filePath);
    return output.errors;
}));

// Also optionally emit a root dts:		
building.emitDts(proj);

if (errors.length == 0) {
    console.log('Compile successfull');
    process.exit(0);
}
else {
    console.log('Errors:');
    errors.forEach(e=> {
        console.log(e.filePath, e.message);
    })
    process.exit(1);
}