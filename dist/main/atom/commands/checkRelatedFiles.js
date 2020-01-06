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
    const erroredFiles = getFileErrors(file);
    if (erroredFiles.length > 0) {
        const openedFiles = Array.from(utils_1.getOpenEditorsPaths(root));
        for (const item of erroredFiles) {
            if (!files.has(item) && utils_1.isTypescriptFile(item)) {
                if (!openedFiles.includes(item) && !openedFilesBuffer.has(item)) {
                    openFiles.push({ file: item, projectRootPath: root });
                    openedFilesBuffer.add(item);
                }
                files.add(item);
            }
        }
    }
    if (node && node.nameSpan) {
        const res = await client.execute("references", Object.assign({ file }, node.nameSpan.start));
        const references = res.body ? res.body.refs.map(ref => ref.file) : [];
        const openedFiles = Array.from(utils_1.getOpenEditorsPaths(root));
        for (const item of references) {
            if (!files.has(item) && utils_1.isTypescriptFile(item)) {
                if (!openedFiles.includes(item) && !openedFilesBuffer.has(item)) {
                    openFiles.push({ file: item, projectRootPath: root });
                    openedFilesBuffer.add(item);
                }
                files.add(item);
            }
        }
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
        const openedFiles = Array.from(utils_1.getOpenEditorsPaths(root));
        const closedFiles = Array.from(openedFilesBuffer).filter(buff => !openedFiles.includes(buff));
        openedFilesBuffer.clear();
        await client.execute("updateOpen", { closedFiles });
    }
}
exports.handleCheckRelatedFilesResult = handleCheckRelatedFilesResult;
//# sourceMappingURL=checkRelatedFiles.js.map