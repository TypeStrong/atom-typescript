///ts:ref=globals
/// <reference path="../globals.ts"/> ///ts:ref:generated
var path = require('path');
var tsproj = require('tsproj');
// Make sure we have the packages we depend upon
var apd = require('atom-package-dependencies');
exports.linter;
// globals
var statusBar;
var statusBarMessage;
var editorWatch;
function activate(state) {
    // Don't activate if we have a dependency that isn't available
    exports.linter = apd.require('linter');
    if (!exports.linter) {
        apd.install(function () {
            atom.notifications.addSuccess("Some dependent packages were required for atom-typescript. These are now installed. Best you restart atom just this once.", { dismissable: true });
        });
        return;
    }
    atom.packages.once('activated', function () {
        // Setup the error reporter: 
        var errorReporter = require('./errors');
        statusBar = document.querySelector("status-bar");
        if (statusBar) {
        }
        editorWatch = atom.workspace.observeTextEditors(function (editor) {
            var filePath = editor.getPath();
            var filename = path.basename(filePath);
            var ext = path.extname(filename);
            if (ext == '.ts') {
                try {
                    var proj = tsproj.getProjectsForFileSync(filePath);
                }
                catch (ex) {
                    // So we don't have a project, create it:
                    if (ex.message == 'No Project Found') {
                        tsproj.createProjectsRootSync(filePath);
                    }
                }
            }
        });
    });
}
exports.activate = activate;
function deactivate() {
    if (statusBarMessage)
        statusBarMessage.destroy();
    editorWatch.dispose();
}
exports.deactivate = deactivate;
function serialize() {
    return {};
}
exports.serialize = serialize;
function deserialize() {
    /* do any tear down here */
}
exports.deserialize = deserialize;
