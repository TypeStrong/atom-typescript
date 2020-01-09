"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom"); // Emitter
const utils_1 = require("../../utils");
const utils_2 = require("./utils");
class FileTracker {
    constructor(getClient, errorPusher) {
        this.getClient = getClient;
        this.errorPusher = errorPusher;
        this.files = new Map();
        this.errors = new Map();
        this.subscriptions = new atom_1.CompositeDisposable();
        this.trackHandler = (filePath, type) => () => {
            console.log("[IDE.FilerTracker.Event]", type, filePath);
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
    async getCheckList(triggerFile, references) {
        const errors = Array.from(this.getErrorsAt(triggerFile));
        const checkList = [triggerFile, ...errors, ...references].reduce((acc, cur) => {
            if (!acc.includes(cur) && utils_2.isTypescriptFile(cur))
                acc.push(cur);
            return acc;
        }, []);
        await this.openFiles(triggerFile, checkList);
        return checkList;
    }
    async clearCheckList(file) {
        if (this.files.size > 0) {
            await this.closeFiles(file);
            this.files.clear();
        }
    }
    async setError(triggerFile, { type, filePath, diagnostics }) {
        const errorFiles = this.getErrorsAt(triggerFile);
        if (!errorFiles.has(filePath)) {
            errorFiles.add(filePath);
        }
        this.errorPusher.setErrors(type, filePath, diagnostics);
    }
    dispose() {
        this.files.clear();
        this.errors.clear();
        this.subscriptions.dispose();
    }
    async openFiles(triggerFile, checkList) {
        const projectRootPath = this.getProjectRootPath(triggerFile);
        if (projectRootPath === null)
            return [];
        const openedFiles = this.getOpenedFilesFromEditor(triggerFile);
        const openFiles = checkList.filter(filePath => {
            if (!openedFiles.includes(filePath) && !this.files.has(filePath)) {
                const file = this.getFile(filePath);
                if (file)
                    return true;
            }
            return false;
        }).map(file => ({ file, projectRootPath }));
        if (openFiles.length > 0) {
            await this.updateOpen(triggerFile, { openFiles });
        }
    }
    async closeFiles(triggerFile) {
        const openedFiles = this.getOpenedFilesFromEditor(triggerFile);
        const closedFiles = Array.from(this.files.keys())
            .filter(filePath => !openedFiles.includes(filePath));
        if (closedFiles.length > 0) {
            await this.updateOpen(triggerFile, { closedFiles });
        }
    }
    async open(filePath) {
        if (this.files.has(filePath))
            return;
        const file = this.getFile(filePath);
        if (file)
            await this.updateOpen(filePath, { openFiles: [{ file: file.getPath() }] });
    }
    async close(filePath) {
        if (!this.files.has(filePath))
            return;
        const file = this.getFile(filePath);
        if (file) {
            await this.updateOpen(filePath, { closedFiles: [filePath] });
            this.files.delete(filePath);
        }
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
        const newFile = new atom_1.File(filePath);
        if (newFile.existsSync()) {
            this.files.set(filePath, newFile);
            this.subscriptions.add(newFile.onDidChange(this.trackHandler(filePath, "changed")), newFile.onDidDelete(this.trackHandler(filePath, "deleted")), newFile.onDidRename(this.trackHandler(filePath, "renamed")));
            return newFile;
        }
        return null;
    }
    getProjectRootPath(filePath) {
        const [projectRootPath] = atom.project.relativizePath(filePath);
        return projectRootPath;
    }
}
exports.FileTracker = FileTracker;
//# sourceMappingURL=fileTracker.js.map