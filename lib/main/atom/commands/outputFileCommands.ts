import * as atomUtils from "../atomUtils";
import * as parent from "../../../worker/parent";
import {spawn, exec} from "child_process";
import * as path from "path";

/**
 * Command related to output files
 */
export function register() {
    atom.commands.add('atom-workspace', 'typescript:output-toggle', (e) => {
        if (!atomUtils.commandForTypeScript(e)) return;

        var query = atomUtils.getFilePath();
        var previousActivePane = atom.workspace.getActivePane()
        parent.getOutput(query).then(res=> {
            if (res.output.emitSkipped) {
                atom.notifications.addInfo('AtomTS: No emit for this file');
                return;
            }
            else {
                // pane for uri needs file system path so:
                var jsOutput = res.output.outputFiles.filter(x=> path.extname(x.name) == ".js")[0].name;
                var uri = jsOutput.split("/").join(path.sep);
                let previewPane = atom.workspace.paneForURI(uri);
                if (previewPane) {
                    previewPane.destroyItem(previewPane.itemForURI(uri))
                }
                else {
                    atom.workspace.open(jsOutput, { split: "right" }).then(() => {
                        previousActivePane.activate();
                    });
                }
            }
        });
    });

    atom.commands.add('atom-workspace', 'typescript:output-file-execute-in-iojs', (e) => {
        if (!atomUtils.commandForTypeScript(e)) return;

        var query = atomUtils.getFilePath();
        parent.getOutput(query).then(res=> {
            if (res.output.emitSkipped) {
                atom.notifications.addInfo('AtomTS: No emit for this file');
                return;
            }
            else {
                // spawn('cmd', ['/C', 'start ' + "node " + res.output.outputFiles[0].name]);
                var command = "iojs " + res.output.outputFiles.filter(x=> path.extname(x.name) == ".js")[0].name;
                console.log(command)

                exec(command, (err, stdout, stderr) => {
                    console.log(stdout);
                    if (stderr.toString().trim().length) {
                        console.error(stderr);
                    }
                });
            }
        });
    });
}
