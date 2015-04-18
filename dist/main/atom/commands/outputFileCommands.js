var atomUtils = require("../atomUtils");
var parent = require("../../../worker/parent");
var child_process_1 = require("child_process");
function register() {
    atom.commands.add('atom-workspace', 'typescript:output-file-open', function (e) {
        if (!atomUtils.commandForTypeScript(e))
            return;
        var query = atomUtils.getFilePath();
        parent.getOutput(query).then(function (res) {
            if (res.output.emitSkipped) {
                atom.notifications.addInfo('AtomTS: No emit for this file');
                return;
            }
            else {
                atom.workspace.open(res.output.outputFiles[0].name, {});
            }
        });
    });
    atom.commands.add('atom-workspace', 'typescript:output-file-execute-in-node', function (e) {
        if (!atomUtils.commandForTypeScript(e))
            return;
        var query = atomUtils.getFilePath();
        parent.getOutput(query).then(function (res) {
            if (res.output.emitSkipped) {
                atom.notifications.addInfo('AtomTS: No emit for this file');
                return;
            }
            else {
                child_process_1.exec("node " + res.output.outputFiles[0].name, function (err, stdout, stderr) {
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
