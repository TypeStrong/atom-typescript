/**
 * This file is a work in progress
 */
var tsconfig = require("../tsconfig/tsconfig");
var building = require("../lang/modules/building");
var project_1 = require("../lang/core/project");
var utils_1 = require("../lang/utils");
if (process.argv.length > 2) {
    var myfile = process.argv[2];
    var projectFile = tsconfig.getProjectSync(myfile);
    var proj = new project_1.Project(projectFile);
    var errors = utils_1.selectMany(proj.projectFile.project.files.map(function (filePath) {
        var output = building.emitFile(proj, filePath);
        return output.errors;
    }));
    if (errors.length == 0) {
        console.log('Compile successfull');
        process.exit(0);
    }
    else {
        console.log('Errors:');
        errors.forEach(function (e) {
            console.log(e.filePath, e.message);
        });
        process.exit(1);
    }
}
else {
    console.error("ERROR: Pass on a path to a .ts file or tsconfig.json file");
    process.exit(1);
}
