var atomUtils = require("../atomUtils");
var parent = require("../../../worker/parent");
var child_process_1 = require("child_process");
var path = require("path");
function register() {
    atom.commands.add('atom-workspace', 'typescript:output-toggle', function (e) {
        if (!atomUtils.commandForTypeScript(e))
            return;
        var query = atomUtils.getFilePath();
        var previousActivePane = atom.workspace.getActivePane();
        parent.getOutputJs(query).then(function (res) {
            if (!res.jsFilePath) {
                atom.notifications.addInfo('AtomTS: No emit for this file');
                return;
            }
            else {
                var uri = res.jsFilePath.split("/").join(path.sep);
                var previewPane = atom.workspace.paneForURI(uri);
                if (previewPane) {
                    previewPane.destroyItem(previewPane.itemForURI(uri));
                }
                else {
                    atom.workspace.open(res.jsFilePath, { split: "right" }).then(function () {
                        previousActivePane.activate();
                    });
                }
            }
        });
    });
    atom.commands.add('atom-workspace', 'typescript:output-file-execute-in-node', function (e) {
        if (!atomUtils.commandForTypeScript(e))
            return;
        var query = atomUtils.getFilePath();
        parent.getOutputJs(query).then(function (res) {
            if (!res.jsFilePath) {
                atom.notifications.addInfo('AtomTS: No emit for this file');
                return;
            }
            else {
                var command = "node " + path.basename(res.jsFilePath);
                console.log(command);
                child_process_1.exec(command, { cwd: path.dirname(res.jsFilePath), env: { ATOM_SHELL_INTERNAL_RUN_AS_NODE: '1' } }, function (err, stdout, stderr) {
                    console.log(stdout);
                    if (stderr.toString().trim().length) {
                        console.error(stderr);
                    }
                });
            }
        });
    });
}
exports.register = register;
