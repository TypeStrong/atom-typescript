"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const navTreeUtils_1 = require("../views/outline/navTreeUtils");
const registry_1 = require("./registry");
registry_1.addCommand("atom-text-editor", "typescript:check-related-files", deps => ({
    description: "Typecheck all files in project related to current active text editor",
    async didDispatch(editor) {
        const file = editor.getPath();
        if (file === undefined)
            return;
        const [root] = atom.project.relativizePath(file);
        if (root === null)
            return;
        const line = editor.getLastCursor().getBufferRow();
        const client = await deps.getClient(file);
        await deps.reportBusyWhile("checkRelatedFiles", () => handleCheckRelatedFilesResult(line, line, root, file, client, deps.pushFileError, deps.getFileErrors));
    },
}));
const openedFilesBuffer = new Set();
async function handleCheckRelatedFilesResult(startLine, endLine, root, file, client, pushFileError, getFileErrors) {
    if (root === undefined)
        return;
    const files = new Set([file]);
    const navTreeRes = await client.execute("navtree", { file });
    const navTree = navTreeRes.body;
    navTreeUtils_1.prepareNavTree(navTree);
    const node = navTreeUtils_1.findNodeAt(startLine, endLine, navTree);
    const openFiles = [];
    setOpenfiles(getFileErrors(file));
    if (node && node.nameSpan) {
        const res = await client.execute("references", Object.assign({ file }, node.nameSpan.start));
        setOpenfiles(res.body ? res.body.refs.map(ref => ref.file) : []);
    }
    if (openFiles.length > 0) {
        await client.execute("updateOpen", { openFiles });
    }
    for (const filePath of files) {
        const res = await client.execute("semanticDiagnosticsSync", { file: filePath });
        pushFileError({
            filePath,
            type: "semanticDiag",
            diagnostics: res.body ? res.body : [],
            triggerFile: file,
        });
    }
    if (openedFilesBuffer.size > 0) {
        const openedFiles = getOpenedFilesFromEditor();
        const closedFiles = Array.from(openedFilesBuffer).filter(buff => !openedFiles.includes(buff));
        openedFilesBuffer.clear();
        await client.execute("updateOpen", { closedFiles });
    }
    function setOpenfiles(items) {
        const openedFiles = getOpenedFilesFromEditor();
        for (const item of items) {
            if (!files.has(item) && utils_1.isTypescriptFile(item)) {
                if (openedFiles.indexOf(item) < 0 && !openedFilesBuffer.has(item)) {
                    openFiles.push({ file: item, projectRootPath: root });
                    openedFilesBuffer.add(item);
                }
                files.add(item);
            }
        }
    }
    function getOpenedFilesFromEditor() {
        return Array.from(utils_1.getOpenEditorsPaths(root));
    }
}
exports.handleCheckRelatedFilesResult = handleCheckRelatedFilesResult;
//# sourceMappingURL=checkRelatedFiles.js.map