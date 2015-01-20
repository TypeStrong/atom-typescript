var path = require('path');
var tsproj = require('tsproj');
var apd = require('atom-package-dependencies');
exports.linter;
var statusBar;
var statusBarMessage;
var editorWatch;
function activate(state) {
    exports.linter = apd.require('linter');
    if (!exports.linter) {
        apd.install(function () {
            atom.notifications.addSuccess("Some dependent packages were required for atom-typescript. These are now installed. Best you restart atom just this once.", { dismissable: true });
        });
        return;
    }
    atom.packages.once('activated', function () {
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
}
exports.deserialize = deserialize;
