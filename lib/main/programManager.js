var tsconfig = require('tsconfig');
var ProgramManager = (function () {
    function ProgramManager() {
    }
    return ProgramManager;
})();
var programs = {};
function getOrCreateAProgramManager(filePath) {
    try {
        var projects = tsconfig.getProjectSync(filePath);
    }
    catch (ex) {
    }
}
module.exports = getOrCreateAProgramManager;
