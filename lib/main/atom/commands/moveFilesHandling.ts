/**
 * For rename (move) files / folders
 */

export function registerRenameHandling() {
    /** https://atom.io/docs/api/v0.190.0/Project#instance-onDidChangePaths */
    var renameListener = atom.project.onDidChangePaths(function(projectPaths) {
        console.log(arguments);
        console.log(projectPaths);
    });
}
