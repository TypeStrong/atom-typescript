var tsproj = require('tsproj');
var ProgramManager = (function () {
    function ProgramManager() {
    }
    return ProgramManager;
})();
var programs = {};
function getOrCreateAProgramManager(filePath) {
    try {
        var projects = tsproj.getProjectsForFileSync(filePath);
    }
    catch (ex) {
    }
}
module.exports = getOrCreateAProgramManager;
