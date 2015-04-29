/**
 * For rename (move) files / folders
 */
function registerRenameHandling() {
    var renameListener = atom.project.onDidChangePaths(function (projectPaths) {
        console.log(arguments);
        console.log(projectPaths);
    });
}
exports.registerRenameHandling = registerRenameHandling;
