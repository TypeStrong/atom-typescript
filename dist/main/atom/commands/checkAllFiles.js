"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const registry_1 = require("./registry");
let buffer = null;
registry_1.addCommand("atom-text-editor", "typescript:check-all-files", deps => ({
    description: "Typecheck all files in project related to current active text editor",
    async didDispatch(editor) {
        const file = editor.getPath();
        if (file === undefined)
            return;
        const client = await deps.getClient(file);
        const projectInfo = await client.execute("projectInfo", {
            file,
            needFileNameList: true,
        });
        const { configFileName, fileNames } = projectInfo.body;
        const tsconfig = configFileName ? new atom_1.File(configFileName).getPath() : configFileName;
        if (buffer && buffer.files.size !== 0) {
            if (file === buffer.file || tsconfig === buffer.tsconfig)
                return;
            cancel();
        }
        const files = new Set(fileNames);
        const max = files.size;
        // There's no real way to know when all of the errors have been received and not every file from
        // the files set is going to receive a a diagnostic event (typically some d.ts files). To counter
        // that, we cancel the listener and close the progress bar after no diagnostics have been received
        // for some amount of time.
        let cancelTimeout;
        const disp = client.on("syntaxDiag", evt => {
            if (cancelTimeout !== undefined)
                window.clearTimeout(cancelTimeout);
            cancelTimeout = window.setTimeout(cancel, 2000);
            if ("file" in evt)
                files.delete(evt.file);
            updateStatus();
        });
        buffer = { max, file, files, disp, tsconfig };
        deps.reportProgress({ max, value: 0 });
        await client.execute("geterrForProject", { file, delay: 0 });
        function cancel() {
            if (!buffer)
                return;
            buffer.files.clear();
            updateStatus();
        }
        function updateStatus() {
            if (!buffer)
                return;
            deps.reportProgress({ max: buffer.max, value: buffer.max - buffer.files.size });
            if (buffer.files.size === 0) {
                buffer.disp.dispose();
                buffer = null;
            }
        }
    },
}));
//# sourceMappingURL=checkAllFiles.js.map