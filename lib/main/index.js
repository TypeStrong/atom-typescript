var path = require('path');
var tsproj = require('tsproj');
var apd = require('atom-package-dependencies');
apd.install();
var statusBar;
var statusBarMessage;
var editorWatch;
function activate(state) {
    atom.packages.once('activated', function () {
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
