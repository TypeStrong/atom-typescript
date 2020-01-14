"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom"); // Emitter
const utils_1 = require("../../utils");
const utils_2 = require("./utils");
class CheckListFileTracker {
    constructor(getClient) {
        this.getClient = getClient;
        this.files = new Map();
        this.errors = new Map();
        this.subscriptions = new atom_1.CompositeDisposable();
        this.busyPromise = new Promise(resolve => resolve());
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
        this.busyPromiseResolver = () => { };
    }
    async makeList(triggerFile, references) {
        await this.busyPromise;
        const errors = this.getErrorsAt(triggerFile);
        const checkList = [triggerFile, ...errors, ...references].reduce((acc, cur) => {
            if (!acc.includes(cur) && utils_2.isTypescriptFile(cur))
                acc.push(cur);
            return acc;
        }, []);
        this.busyPromise = new Promise(resolve => {
            this.busyPromiseResolver = resolve;
        });
        await this.openFiles(triggerFile, checkList);
        return checkList;
    }
    async clearList(file) {
        if (this.files.size > 0)
            await this.closeFiles(file);
        this.busyPromiseResolver();
    }
    async setFile(filePath, isOpen) {
        var _a;
        if (!this.files.has(filePath))
            return;
        const triggerFile = (_a = this.files.get(filePath)) === null || _a === void 0 ? void 0 : _a.triggerFile;
        const triggerFilePath = triggerFile !== undefined ? triggerFile : filePath;
        switch (isOpen) {
            // execute before "open" command
            case true:
                await this.closeFiles(triggerFilePath, [filePath]);
                break;
            // execute after "close" command
            case false:
                this.removeFile(filePath);
                await this.openFiles(triggerFilePath, [filePath]);
                break;
        }
    }
    setError(filePath, hasError) {
        const triggerFile = this.getTriggerFile();
        const errorFiles = this.getErrorsAt(triggerFile !== undefined ? triggerFile : filePath);
        switch (hasError) {
            case true:
                if (!errorFiles.has(filePath))
                    errorFiles.add(filePath);
                break;
            case false:
                if (errorFiles.has(filePath))
                    errorFiles.delete(filePath);
                break;
        }
    }
    clearErrors(triggerFile) {
        const errorFiles = this.getErrorsAt(triggerFile);
        this.errors.delete(triggerFile);
        return errorFiles;
    }
    dispose() {
        this.files.clear();
        this.errors.clear();
        this.subscriptions.dispose();
    }
    getErrorsAt(triggerFile) {
        let errorFiles = this.errors.get(triggerFile);
        if (!errorFiles) {
            errorFiles = new Set();
            this.errors.set(triggerFile, errorFiles);
        }
        return errorFiles;
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