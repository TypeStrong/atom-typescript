"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom"); // Emitter
const utils_1 = require("../../utils");
const utils_2 = require("../atom/utils");
/*
export interface FileEventPayload {
  type: FileEventTypes
  filePath: string
}

export interface EventTypes {
  file: FileEventPayload
}
*/
/**
 * ClientResolver takes care of finding the correct tsserver for a source file based on how a
 * require("typescript") from the same source file would resolve.
 */
class FileTracker {
    constructor(getClient, errorPusher) {
        this.getClient = getClient;
        this.errorPusher = errorPusher;
        this.files = new Map();
        this.errors = new Map();
        this.subscriptions = new atom_1.CompositeDisposable();
        this.trackHandler = (filePath, type) => () => {
            console.log(filePath);
            switch (type) {
                case "changed":
                    break;
                case "deleted":
                    utils_1.handlePromise(this.updateOpen(filePath, { closedFiles: [filePath] }));
                    break;
                case "renamed":
                    break;
                case "opened":
                case "closed":
                default:
                // noop
            }
            // this.emitter.emit("file", {type, filePath})
        };
    }
    async get(file, references) {
        const errors = Array.from(this.getErrorsAt(file));
        const files = [file, ...errors, ...references].reduce((acc, cur) => {
            if (!acc.includes(cur) && utils_2.isTypescriptFile(cur))
                acc.push(cur);
            return acc;
        }, []);
        await this.openFiles(file, files);
        return files;
    }
    async setError(triggerFile, { type, filePath, diagnostics }) {
        const errorFiles = this.getErrorsAt(triggerFile);
        if (!errorFiles.has(filePath)) {
            errorFiles.add(filePath);
        }
        this.errorPusher.setErrors(type, filePath, diagnostics);
    }
    async clear(file) {
        if (this.files.size > 0) {
            const openedFiles = this.getOpenedFiles(file);
            const closedFiles = Array.from(this.files)
                .filter(([filePath]) => !openedFiles.includes(filePath))
                .map(([filePath]) => filePath);
            this.files.clear();
            if (closedFiles.length > 0) {
                await this.updateOpen(file, { closedFiles });
            }
        }
    }
    dispose() {
        this.files.clear();
        this.errors.clear();
        this.subscriptions.dispose();
    }
    async openFiles(projectRootPath, files) {
        const openedFiles = this.getOpenedFiles(projectRootPath);
        const openFiles = files.reduce((acc, cur) => {
            if (!openedFiles.includes(cur) && !this.files.has(cur)) {
                const file = this.getFile(cur);
                if (file)
                    acc.push({ file: file.getPath(), projectRootPath });
            }
            return acc;
        }, []);
        if (openFiles.length > 0) {
            await this.updateOpen(projectRootPath, { openFiles });
        }
    }
    async updateOpen(file, option) {
        const client = await this.getClient(file);
        await client.execute("updateOpen", option);
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
    }
    getErrorsAt(triggerFile) {
        let errorFiles = this.errors.get(triggerFile);
        if (!errorFiles) {
            errorFiles = new Set();
            this.errors.set(triggerFile, errorFiles);
        }
        return errorFiles;
    }
    getOpenedFiles(filePath) {
        const [projectPath] = atom.project.relativizePath(filePath);
        if (projectPath === null)
            return [];
        return Array.from(utils_2.getOpenEditorsPaths()).reduce((acc, cur) => {
            if (!acc.includes(cur) && cur.includes(projectPath))
                acc.push(cur);
            return acc;
        }, []);
    }
}
exports.FileTracker = FileTracker;
//# sourceMappingURL=fileTrackController.js.map