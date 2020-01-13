"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom"); // Emitter
const utils_1 = require("../../utils");
const utils_2 = require("./utils");
class CheckListFileTracker {
    constructor(getClient) {
        this.getClient = getClient;
        this.busy = false;
        this.files = new Map();
        this.errors = new Map();
        this.subscriptions = new atom_1.CompositeDisposable();
        this.trackHandler = (filePath, type) => () => {
            const triggerFile = this.getTriggerFile();
            if (triggerFile === undefined)
                return;
            switch (type) {
                case "deleted":
                    utils_1.handlePromise(this.openFiles(triggerFile, [filePath]));
                    break;
                case "changed":
                case "renamed":
                    utils_1.handlePromise(this.closeFiles(triggerFile, [filePath]).then(() => this.openFiles(triggerFile, [filePath])));
                    break;
            }
        };
    }
    has(filePath) {
        return this.files.has(filePath);
    }
    async makeList(triggerFile, references) {
        if (this.busy)
            return null;
        const errors = Array.from(this.getErrorsAt(triggerFile));
        const checkList = [triggerFile, ...errors, ...references].reduce((acc, cur) => {
            if (!acc.includes(cur) && utils_2.isTypescriptFile(cur))
                acc.push(cur);
            return acc;
        }, []);
        this.busy = true;
        await this.openFiles(triggerFile, checkList);
        return checkList;
    }
    async clearList(file) {
        if (this.files.size > 0) {
            await this.closeFiles(file);
        }
        this.busy = false;
    }
    setError(prefix, filePath, hasError) {
        if (prefix !== "semanticDiag")
            return;
        const triggerFile = this.getTriggerFile();
        const errorFiles = this.getErrorsAt(triggerFile !== undefined ? triggerFile : filePath);
        if (hasError && !errorFiles.has(filePath)) {
            errorFiles.add(filePath);
        }
        if (!hasError && errorFiles.has(filePath)) {
            errorFiles.delete(filePath);
        }
    }
    dispose() {
        this.files.clear();
        this.errors.clear();
        this.subscriptions.dispose();
    }
    async openFiles(triggerFile, checkList) {
        const projectRootPath = this.getProjectRootPath(triggerFile);
        if (projectRootPath === null)
            return;
        const openedFiles = this.getOpenedFilesFromEditor(triggerFile);
        const openFiles = checkList
            .filter(filePath => !openedFiles.includes(filePath) && !this.files.has(filePath))
            .map(file => ({ file, projectRootPath }));
        if (openFiles.length > 0) {
            await this.updateOpen(triggerFile, { openFiles });
            openFiles.forEach(({ file }) => this.addFile(file, triggerFile));
        }
    }
    async closeFiles(triggerFile, checkList) {
        const openedFiles = this.getOpenedFilesFromEditor(triggerFile);
        const closedFiles = (checkList === undefined
            ? Array.from(this.files.keys())
            : checkList).filter(filePath => !openedFiles.includes(filePath));
        if (closedFiles.length > 0) {
            await this.updateOpen(triggerFile, { closedFiles });
            closedFiles.forEach(filePath => this.removeFile(filePath));
        }
    }
    async updateOpen(filePath, options) {
        const client = await this.getClient(filePath);
        await client.execute("updateOpen", options);
    }
    getErrorsAt(triggerFile) {
        let errorFiles = this.errors.get(triggerFile);
        if (!errorFiles) {
            errorFiles = new Set();
            this.errors.set(triggerFile, errorFiles);
        }
        return errorFiles;
    }
    addFile(filePath, triggerFile = this.getTriggerFile()) {
        if (this.files.has(filePath)) {
            return;
        }
        const src = new atom_1.File(filePath);
        const disp = new atom_1.CompositeDisposable();
        const fileMap = { triggerFile, disp, src };
        disp.add(src.onDidChange(this.trackHandler(filePath, "changed")), src.onDidDelete(this.trackHandler(filePath, "deleted")), src.onDidRename(this.trackHandler(filePath, "renamed")));
        this.files.set(filePath, fileMap);
        this.subscriptions.add(disp);
        return fileMap;
    }
    removeFile(filePath) {
        const file = this.files.get(filePath);
        if (file === undefined)
            return;
        this.files.delete(filePath);
        this.subscriptions.remove(file.disp);
    }
    getOpenedFilesFromEditor(filePath) {
        const projectRootPath = this.getProjectRootPath(filePath);
        if (projectRootPath === null)
            return [];
        return Array.from(utils_2.getOpenEditorsPaths()).reduce((acc, cur) => {
            if (!acc.includes(cur) && cur.includes(projectRootPath))
                acc.push(cur);
            return acc;
        }, []);
    }
    getTriggerFile() {
        const ed = atom.workspace.getActiveTextEditor();
        if (ed)
            return ed.getPath();
    }
    getProjectRootPath(filePath) {
        const [projectRootPath] = atom.project.relativizePath(filePath);
        return projectRootPath;
    }
}
exports.CheckListFileTracker = CheckListFileTracker;
//# sourceMappingURL=checkListFileTracker.js.map