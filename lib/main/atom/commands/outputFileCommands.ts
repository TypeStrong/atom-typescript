import * as atomUtils from "../atomUtils";
import * as parent from "../../../worker/parent";
import {spawn, exec} from "child_process";

/**
 * Command related to output files
 */
export function register() {
    atom.commands.add('atom-workspace', 'typescript:output-file-open', (e) => {
        if (!atomUtils.commandForTypeScript(e)) return;

        var query = atomUtils.getFilePath();
        parent.getOutput(query).then(res=> {
            if (res.output.emitSkipped) {
                atom.notifications.addInfo('AtomTS: No emit for this file');
                return;
            }
            else {
                atom.workspace.open(res.output.outputFiles[0].name, {});
            }
        });
    });

    atom.commands.add('atom-workspace', 'typescript:output-file-execute-in-node', (e) => {
        if (!atomUtils.commandForTypeScript(e)) return;

        var query = atomUtils.getFilePath();
        parent.getOutput(query).then(res=> {
            if (res.output.emitSkipped) {
                atom.notifications.addInfo('AtomTS: No emit for this file');
                return;
            }
            else {
                exec("node " + res.output.outputFiles[0].name, (err, stdout, stderr) => {
                    console.log(stdout);
                    if (stderr.toString().trim().length) {
                        console.error(stderr);
                    }
                });
            }
        });
    });
}
