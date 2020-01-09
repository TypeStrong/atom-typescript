"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom"); // Emitter
const utils_1 = require("../../utils");
const utils_2 = require("./utils");
class CheckListFileTracker {
    constructor(reportBusyWhile, getClient) {
        this.reportBusyWhile = reportBusyWhile;
        this.getClient = getClient;
        this.files = new Map();
        this.errors = new Map();
        this.subscriptions = new atom_1.CompositeDisposable();
        this.completeResolver = { resolve: () => { } };
        this.trackHandler = (filePath, type) => () => {
            switch (type) {
                case "deleted":
                    utils_1.handlePromise(this.close(filePath));
                    break;
                case "changed":
                case "renamed":
                    utils_1.handlePromise(this.close(filePath).then(() => this.open(filePath)));
                    break;
            }
        };
    }
    has(filePath) {
        return this.files.has(filePath);
    }
    async makeList(triggerFile, references) {
        const errors = Array.from(this.getErrorsAt(triggerFile));
        const checkList = [triggerFile, ...errors, ...references].reduce((acc, cur) => {
            if (!acc.includes(cur) && utils_2.isTypescriptFile(cur))
                acc.push(cur);
            return acc;
        }, []);
        utils_1.handlePromise(this.waitComplete());
        await this.openFiles(triggerFile, checkList);
        return checkList;
    }
    async clearList(file) {
        if (this.files.size > 0) {
            await this.closeFiles(file);
            this.files.clear();
        }
        this.completeResolver.resolve();
    }
    setError(filePath) {
        const ed = atom.workspace.getActiveTextEditor();
        const triggerFile = ed ? ed.getPath() : undefined;
        const errorFiles = this.getErrorsAt(triggerFile !== undefined ? triggerFile : filePath);
        if (!errorFiles.has(filePath)) {
            errorFiles.add(filePath);
        }
    }
    dispose() {
        this.files.clear();
        this.errors.clear();
        this.subscriptions.dispose();
    }
    waitComplete() {
        const promise = new Promise(resolve => {
            this.completeResolver.resolve = resolve;
        });
        return this.reportBusyWhile("Checking Related Files", () => promise);
    }
    async openFiles(triggerFile, checkList) {
        const projectRootPath = this.getProjectRootPath(triggerFile);
        if (projectRootPath === null)
            return [];
        const openedFiles = this.getOpenedFilesFromEditor(triggerFile);
        const openFiles = checkList
            .filter(filePath => !openedFiles.includes(filePath) && !this.files.has(filePath))
            .map(filePath => this.getFile(filePath).src.getPath())
            .map(file => ({ file, projectRootPath }));
        if (openFiles.length > 0) {
            await this.updateOpen(triggerFile, { openFiles });
        }
    }
    async closeFiles(triggerFile) {
        const openedFiles = this.getOpenedFilesFromEditor(triggerFile);
        const closedFiles = Array.from(this.files.keys())
            .filter(filePath => !openedFiles.includes(filePath))
            .map(filePath => this.removeFile(filePath));
        if (closedFiles.length > 0) {
            await this.updateOpen(triggerFile, { closedFiles });
        }
    }
    async open(filePath) {
        if (this.files.has(filePath))
            return;
        const openedFiles = this.getOpenedFilesFromEditor(filePath);
        if (openedFiles.includes(filePath)) {
            this.removeFile(filePath);
            return;
        }
        await this.updateOpen(filePath, { openFiles: [{ file: filePath }] });
    }
    async close(filePath) {
        if (!this.files.has(filePath))
            return;
        const openedFiles = this.getOpenedFilesFromEditor(filePath);
        if (!openedFiles.includes(filePath)) {
            await this.updateOpen(filePath, { closedFiles: [filePath] });
        }
        this.removeFile(filePath);
    }
    async updateOpen(filePath, options) {
        const client = await this.getClient(filePath);
        await client.execute("updateOpen", options);
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
    getErrorsAt(triggerFile) {
        let errorFiles = this.errors.get(triggerFile);
        if (!errorFiles) {
            errorFiles = new Set();
            this.errors.set(triggerFile, errorFiles);
        }
        return errorFiles;
    }
    getFile(filePath) {
        const file = this.files.get(filePath);
        if (file)
            return file;
        const src = new atom_1.File(filePath);
        const disp = new atom_1.CompositeDisposable();
        const fileMap = { disp, src };
        disp.add(src.onDidChange(this.trackHandler(filePath, "changed")), src.onDidDelete(this.trackHandler(filePath, "deleted")), src.onDidRename(this.trackHandler(filePath, "renamed")));
        this.files.set(filePath, fileMap);
        this.subscriptions.add(disp);
        return fileMap;
    }
    removeFile(filePath) {
        const file = this.getFile(filePath);
        this.files.delete(filePath);
        this.subscriptions.remove(file.disp);
        return filePath;
    }
    getProjectRootPath(filePath) {
        const [projectRootPath] = atom.project.relativizePath(filePath);
        return projectRootPath;
    }
}
exports.CheckListFileTracker = CheckListFileTracker;
//# sourceMappingURL=checkListFileTracker.js.map