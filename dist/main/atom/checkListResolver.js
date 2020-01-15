"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const utils_1 = require("../../utils");
const utils_2 = require("./utils");
const navTreeUtils_1 = require("./views/outline/navTreeUtils");
class ChecklistResolver {
    constructor(getClient) {
        this.getClient = getClient;
        this.files = new Map();
        this.errors = new Map();
        this.subscriptions = new atom_1.CompositeDisposable();
        this.emitter = new atom_1.Emitter();
        this.isInProgress = false;
        // tslint:disable-next-line:member-ordering
        this.on = this.emitter.on.bind(this.emitter);
        this.trackHandler = (triggerFile, filePath, type) => () => {
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
    async check(file, startLine, endLine) {
        if (this.isInProgress)
            return;
        const [root] = atom.project.relativizePath(file);
        if (root === null)
            return;
        this.isInProgress = true;
        const client = await this.getClient(file);
        const navTreeRes = await client.execute("navtree", { file });
        const navTree = navTreeRes.body;
        navTreeUtils_1.prepareNavTree(navTree);
        const node = navTreeUtils_1.findNodeAt(startLine, endLine, navTree);
        let references = [];
        if (node && node.nameSpan) {
            const res = await client.execute("references", Object.assign({ file }, node.nameSpan.start));
            references = res.body ? res.body.refs.map(ref => ref.file) : [];
        }
        const files = await this.makeList(file, references);
        for (const filePath of files) {
            const res = await client.execute("semanticDiagnosticsSync", { file: filePath });
            if (res.body) {
                this.emitter.emit("diagnostics", {
                    filePath,
                    type: "semanticDiag",
                    serverPath: client.tsServerPath,
                    diagnostics: res.body,
                });
                this.setError(file, filePath, res.body.length !== 0);
            }
        }
        await this.clearList(file);
    }
    async setFile(filePath, isOpen) {
        var _a;
        if (!this.files.has(filePath))
            return;
        const target = (_a = this.files.get(filePath)) === null || _a === void 0 ? void 0 : _a.target;
        const triggerFile = target !== undefined ? target : filePath;
        switch (isOpen) {
            // execute before "open" command
            case true:
                await this.closeFiles(triggerFile, [filePath]);
                break;
            // execute after "close" command
            case false:
                this.removeFile(filePath);
                await this.openFiles(triggerFile, [filePath]);
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
        this.emitter.dispose();
        this.subscriptions.dispose();
    }
    async makeList(triggerFile, references) {
        const errors = this.getErrorsAt(triggerFile);
        const checkList = [...errors, ...references].reduce((acc, cur) => {
            if (!acc.includes(cur) && utils_2.isTypescriptFile(cur))
                acc.push(cur);
            return acc;
        }, []);
        await this.openFiles(triggerFile, checkList);
        return checkList;
    }
    async clearList(file) {
        if (this.files.size > 0)
            await this.closeFiles(file);
        this.isInProgress = false;
    }
    setError(triggerFile, filePath, hasError) {
        const errorFiles = this.getErrorsAt(triggerFile);
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
            .filter(filePath => triggerFile !== filePath && !openedFiles.includes(filePath) && !this.files.has(filePath))
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
    addFile(filePath, target) {
        if (this.files.has(filePath)) {
            return;
        }
        const disp = new atom_1.CompositeDisposable();
        const source = new atom_1.File(filePath);
        const fileMap = { target, source, disp };
        disp.add(source.onDidChange(this.trackHandler(target, filePath, "changed")), source.onDidDelete(this.trackHandler(target, filePath, "deleted")), source.onDidRename(this.trackHandler(target, filePath, "renamed")));
        this.files.set(filePath, fileMap);
        this.subscriptions.add(disp);
        return fileMap;
    }
    removeFile(filePath) {
        const file = this.files.get(filePath);
        if (!file)
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
    getProjectRootPath(filePath) {
        const [projectRootPath] = atom.project.relativizePath(filePath);
        return projectRootPath;
    }
}
exports.ChecklistResolver = ChecklistResolver;
//# sourceMappingURL=checklistResolver.js.map