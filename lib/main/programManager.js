var tsconfig = require('tsconfig');
var Program = (function () {
    function Program() {
    }
    return Program;
})();
exports.Program = Program;
var programs = {};
function getOrCreateAProgram(filePath) {
    try {
        var project = tsconfig.getProjectSync(filePath);
        console.log('project found:', project);
    }
    catch (ex) {
        console.log('no project found');
    }
}
exports.getOrCreateAProgram = getOrCreateAProgram;
