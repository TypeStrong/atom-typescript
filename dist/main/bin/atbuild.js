var makeTypeScriptGlobal_1 = require("../../typescript/makeTypeScriptGlobal");
makeTypeScriptGlobal_1.makeTsGlobal();
var tsconfig = require("../tsconfig/tsconfig");
var building = require("../lang/modules/building");
var project_1 = require("../lang/core/project");
var utils_1 = require("../lang/utils");
var startLoc;
if (process.argv.length > 2) {
    startLoc = process.argv[2];
}
else {
    startLoc = process.cwd();
}
var projectFile = tsconfig.getProjectSync(startLoc);
console.log("Compiling using project file: " + projectFile.projectFilePath);
var proj = new project_1.Project(projectFile);
var errors = utils_1.selectMany(proj.projectFile.project.files.map(function (filePath) {
    var output = building.emitFile(proj, filePath);
    return output.errors;
}));
building.emitDts(proj);
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
