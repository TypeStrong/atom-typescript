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
        parent.getOutputJs(query).then(res=> {
            if (!res.jsFilePath) {
                atom.notifications.addInfo('AtomTS: No emit for this file');
                return;
            }
            else {
                // pane for uri needs file system path so:
                var uri = res.jsFilePath.split("/").join(path.sep);
                let previewPane = atom.workspace.paneForURI(uri);
                if (previewPane) {
                    previewPane.destroyItem(previewPane.itemForURI(uri))
                }
                else {
                    atom.workspace.open(res.jsFilePath, { split: "right" }).then(() => {
                        previousActivePane.activate();
                    });
                }
            }
        });
    });

    atom.commands.add('atom-workspace', 'typescript:output-file-execute-in-node', (e) => {
        if (!atomUtils.commandForTypeScript(e)) return;

        var query = atomUtils.getFilePath();
        parent.getOutputJs(query).then(res=> {
            if (!res.jsFilePath) {
                atom.notifications.addInfo('AtomTS: No emit for this file');
                return;
            }
            else {
                // spawn('cmd', ['/C', 'start ' + "node " + res.output.outputFiles[0].name]);
                var command = `node ${path.basename(res.jsFilePath) }`;
                console.log(command);

                exec(command, { cwd: path.dirname(res.jsFilePath), env: { ATOM_SHELL_INTERNAL_RUN_AS_NODE: '1' } }, (err, stdout, stderr) => {
                    console.log(stdout);
                    if (stderr.toString().trim().length) {
                        console.error(stderr);
                    }
                });
            }
        });
    });
}
