"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const utils_1 = require("../utils");
const utils_2 = require("./atom/utils");
const navTreeUtils_1 = require("./atom/views/outline/navTreeUtils");
class ChecklistResolver {
    constructor(getClient) {
        this.getClient = getClient;
        this.files = new Map();
        this.errors = new Map();
        this.triggers = new Set();
        this.subscriptions = new atom_1.CompositeDisposable();
        this.emitter = new atom_1.Emitter();
        this.isBusy = false;
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
    async checkErrorAt(file, startLine, endLine) {
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
        this.triggers.add({ client, file, references });
        await this.checkErrors();
    }
    async closeFile(filePath) {
        var _a;
        if (!this.files.has(filePath))
            return;
        const target = (_a = this.files.get(filePath)) === null || _a === void 0 ? void 0 : _a.target;
        const triggerFile = target !== undefined ? target : filePath;
        await this.closeFiles(triggerFile, [filePath]);
    }
    revokeErrors(triggerFile) {
        const openedFiles = this.getOpenedFilesFromEditor(triggerFile);
        const errorFiles = Array.from(this.getErrorsAt(triggerFile));
        const files = errorFiles.filter(filePath => openedFiles.includes(filePath));
        this.errors.delete(triggerFile);
        utils_1.handlePromise(this.getError(triggerFile, files));
        return errorFiles;
    }
    dispose() {
        this.files.clear();
        this.errors.clear();
        this.triggers.clear();
        this.emitter.dispose();
        this.subscriptions.dispose();
    }
    async checkErrors() {
        if (!this.isBusy && this.triggers.size > 0) {
            this.isBusy = true;
            const [triggerMap] = this.triggers;
            await this.checkReferences(triggerMap);
            this.triggers.delete(triggerMap);
            this.isBusy = false;
            await this.checkErrors();
        }
    }
    async checkReferences({ client, file, references }) {
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
    async makeList(file, references) {
        const errors = this.getErrorsAt(file);
        const checkList = [...errors, ...references].reduce((acc, cur) => {
            if (!acc.includes(cur) && utils_2.isTypescriptFile(cur))
                acc.push(cur);
            return acc;
        }, []);
        await this.openFiles(file, checkList);
        return checkList;
    }
    async clearList(file) {
        if (this.files.size > 0)
            await this.closeFiles(file);
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
    async getError(triggerFile, files) {
        const client = await this.getClient(triggerFile);
        await client.execute("geterr", { files, delay: 100 });
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
        const openedFiles = this.getOpenedFilesFromEditor(triggerFile);
        const openFiles = checkList
            .filter(filePath => {
            if (triggerFile !== filePath && !openedFiles.includes(filePath)) {
                return this.addFile(filePath, triggerFile);
            }
            return false;
        })
            .map(file => ({ file }));
        await this.updateOpen(triggerFile, { openFiles });
    }
    async closeFiles(triggerFile, checkList) {
        const openedFiles = this.getOpenedFilesFromEditor(triggerFile);
        const closedFiles = (checkList === undefined
            ? Array.from(this.files.keys())
            : checkList).filter(filePath => {
            if (!openedFiles.includes(filePath)) {
                return this.removeFile(filePath);
            }
            return false;
        });
        await this.updateOpen(triggerFile, { closedFiles });
    }
    async updateOpen(filePath, options) {
        const { openFiles, closedFiles } = options;
        if ((closedFiles && closedFiles.length === 0) || (openFiles && openFiles.length === 0))
            return;
        const client = await this.getClient(filePath);
        await client.execute("updateOpen", options);
    }
    addFile(filePath, target) {
        if (this.files.has(filePath))
            return false;
        const source = new atom_1.File(filePath);
        if (!source.existsSync())
            return false;
        const disp = new atom_1.CompositeDisposable();
        const fileMap = { target, source, disp };
        disp.add(source.onDidChange(this.trackHandler(target, filePath, "changed")), source.onDidDelete(this.trackHandler(target, filePath, "deleted")), source.onDidRename(this.trackHandler(target, filePath, "renamed")));
        this.files.set(filePath, fileMap);
        this.subscriptions.add(disp);
        return true;
    }
    removeFile(filePath) {
        const file = this.files.get(filePath);
        if (!file)
            return false;
        file.disp.dispose();
        this.files.delete(filePath);
        this.subscriptions.remove(file.disp);
        return true;
    }
    getOpenedFilesFromEditor(filePath) {
        const [projectRootPath] = atom.project.relativizePath(filePath);
        if (projectRootPath === null)
            return [];
        return Array.from(utils_2.getOpenEditorsPaths()).reduce((acc, cur) => {
            if (!acc.includes(cur) && cur.includes(projectRootPath))
                acc.push(cur);
            return acc;
        }, []);
    }
}
exports.ChecklistResolver = ChecklistResolver;
//# sourceMappingURL=checklistResolver.js.map