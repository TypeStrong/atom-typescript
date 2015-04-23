/**
 * This file is a work in progress
 */

import * as tsconfig from "../tsconfig/tsconfig";
import * as building from "../lang/modules/building";
import {Project} from "../lang/core/project";
import {selectMany} from "../lang/utils";

if (process.argv.length > 2) {
    // Read the first additional argument passed to the program
    var myfile = process.argv[2];

    var projectFile = tsconfig.getProjectSync(myfile);
    var proj = new Project(projectFile);

    var errors = selectMany(proj.projectFile.project.files.map((filePath) => {
        var output = building.emitFile(proj, filePath);
        return output.errors;
    }));

    if (errors.length == 0) {
        console.log('Compile successfull');
        process.exit(0);
    }
    else {
        console.log('Errors:');
        errors.forEach(e=>{
            console.log(e.filePath, e.message);
        })
        process.exit(1);
    }

} else {
    console.error("ERROR: Pass on a path to a .ts file or tsconfig.json file");
    process.exit(1);
}