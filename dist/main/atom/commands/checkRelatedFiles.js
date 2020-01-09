"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const navTreeUtils_1 = require("../views/outline/navTreeUtils");
const registry_1 = require("./registry");
registry_1.addCommand("atom-text-editor", "typescript:check-related-files", deps => ({
    description: "Typecheck all files in project related to current active text editor",
    async didDispatch(editor) {
        const file = editor.getPath();
        if (file === undefined)
            return;
        const line = editor.getLastCursor().getBufferRow();
        const client = await deps.getClient(file);
        await deps.reportBusyWhile("checkRelatedFiles", () => handleCheckRelatedFilesResult(line, line, file, client, deps.pushFileError, deps.createFileList, deps.clearFileList));
    },
}));
async function handleCheckRelatedFilesResult(startLine, endLine, file, client, pushFileError, getCheckList, clearCheckList) {
    const [root] = atom.project.relativizePath(file);
    if (root === null)
        return;
    const navTreeRes = await client.execute("navtree", { file });
    const navTree = navTreeRes.body;
    navTreeUtils_1.prepareNavTree(navTree);
    const node = navTreeUtils_1.findNodeAt(startLine, endLine, navTree);
    let references = [];
    if (node && node.nameSpan) {
        const res = await client.execute("references", Object.assign({ file }, node.nameSpan.start));
        references = res.body ? res.body.refs.map(ref => ref.file) : [];
    }
    const serverPath = "";
    const checkList = await getCheckList(file, references);
    for (const filePath of checkList) {
        const res = await client.execute("semanticDiagnosticsSync", { file: filePath });
        pushFileError(file, {
            filePath,
            serverPath,
            type: "semanticDiag",
            diagnostics: res.body ? res.body : [],
        });
    }
    await clearCheckList(file);
}
exports.handleCheckRelatedFilesResult = handleCheckRelatedFilesResult;
//# sourceMappingURL=checkRelatedFiles.js.map