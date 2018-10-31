"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const lodash_1 = require("lodash");
const utils_1 = require("../utils");
const utils_2 = require("./atom/utils");
const typescriptBuffer_1 = require("./typescriptBuffer");
class TypescriptEditorPane {
    constructor(editor, opts) {
        this.editor = editor;
        this.opts = opts;
        // Timestamp for activated event
        this.activeAt = 0;
        this.subscriptions = new atom_1.CompositeDisposable();
        this.changedActiveEditor = async (activeEditor) => {
            if (activeEditor === this.editor) {
                // activated
                this.activeAt = Date.now();
                const filePath = this.buffer.getPath();
                console.log(this._client);
                if (this._client) {
                    this.opts.reportTSConfigPath(this.configFile);
                    if (filePath !== undefined) {
                        const client = await this._client;
                        this.opts.reportClientVersion(client.version);
                        await client.execute("geterr", {
                            files: [filePath],
                            delay: 100,
                        });
                    }
                }
            }
        };
        this.onChanged = async () => {
            if (!this._client)
                return;
            const filePath = this.buffer.getPath();
            if (filePath === undefined)
                return;
            const client = await this._client;
            this.opts.reportBuildStatus(undefined);
            await client.execute("geterr", {
                files: [filePath],
                delay: 100,
            });
        };
        this.onDidDestroy = () => {
            this.dispose();
        };
        this.onOpened = async () => {
            const filePath = this.buffer.getPath();
            if (filePath === undefined)
                return;
            const client = await this.opts.getClient(filePath);
            const isActive = atom.workspace.getActiveTextEditor() === this.editor;
            if (isActive)
                this.opts.reportClientVersion(client.version);
            if (this._client) {
                await client.execute("geterr", {
                    files: [filePath],
                    delay: 100,
                });
                try {
                    const result = await client.execute("projectInfo", {
                        needFileNameList: false,
                        file: filePath,
                    });
                    this.configFile = result.body.configFileName;
                    if (isActive)
                        this.opts.reportTSConfigPath(this.configFile);
                    const options = await utils_2.getProjectCodeSettings(this.configFile);
                    await client.execute("configure", {
                        file: filePath,
                        formatOptions: options,
                    });
                }
                catch (e) {
                    if (window.atom_typescript_debug)
                        console.error(e);
                }
            }
        };
        this.onSaved = async () => {
            if (!this._client)
                return;
            const client = await this._client;
            await client.execute("geterr", { files: Array.from(this.getOpenEditorsPaths()), delay: 100 });
            return this.compileOnSave();
        };
        this.checkIfTypescript = () => {
            const filePath = this.editor.getPath();
            if (utils_2.isTypescriptEditorWithPath(this.editor)) {
                this._client = this.opts.getClient(filePath);
                atom.views.getView(this.editor).classList.add("typescript-editor");
            }
            else {
                this._client = undefined;
                atom.views.getView(this.editor).classList.remove("typescript-editor");
            }
        };
        this.buffer = typescriptBuffer_1.TypescriptBuffer.create(editor.getBuffer(), opts.getClient);
        this.subscriptions.add(this.buffer.on("changed", () => utils_1.handlePromise(this.onChanged())), this.buffer.on("closed", () => {
            const filePath = editor.getPath();
            if (filePath !== undefined)
                this.opts.clearErrors(filePath);
        }), this.buffer.on("opened", () => utils_1.handlePromise(this.onOpened())), this.buffer.on("saved", () => utils_1.handlePromise(this.onSaved())));
        this.checkIfTypescript();
        this.subscriptions.add(editor.onDidChangePath(this.checkIfTypescript), editor.onDidChangeGrammar(this.checkIfTypescript), this.editor.onDidDestroy(this.onDidDestroy), atom.workspace.onDidChangeActiveTextEditor(ed => utils_1.handlePromise(this.changedActiveEditor(ed))));
    }
    // tslint:disable-next-line:member-ordering
    static createFactory(opts) {
        return (editor) => {
            let tep = TypescriptEditorPane.editorMap.get(editor);
            if (!tep) {
                tep = new TypescriptEditorPane(editor, opts);
                TypescriptEditorPane.editorMap.set(editor, tep);
            }
            return tep;
        };
    }
    // tslint:disable-next-line:member-ordering
    static lookupPane(editor) {
        return TypescriptEditorPane.editorMap.get(editor);
    }
    dispose() {
        atom.views.getView(this.editor).classList.remove("typescript-editor");
        this.subscriptions.dispose();
    }
    *getOpenEditorsPaths() {
        for (const ed of atom.workspace.getTextEditors()) {
            if (utils_2.isTypescriptEditorWithPath(ed))
                yield ed.getPath();
        }
    }
    async compileOnSave() {
        if (!this._client)
            return;
        const filePath = this.buffer.getPath();
        if (filePath === undefined)
            return;
        const client = await this._client;
        const result = await client.execute("compileOnSaveAffectedFileList", {
            file: filePath,
        });
        this.opts.reportBuildStatus(undefined);
        const fileNames = lodash_1.flatten(result.body.map(project => project.fileNames));
        if (fileNames.length === 0)
            return;
        try {
            const promises = fileNames.map(file => client.execute("compileOnSaveEmitFile", { file }));
            const saved = await Promise.all(promises);
            if (!saved.every(res => !!res.body)) {
                throw new Error("Some files failed to emit");
            }
            this.opts.reportBuildStatus({ success: true });
        }
        catch (error) {
            const e = error;
            console.error("Save failed with error", e);
            this.opts.reportBuildStatus({ success: false, message: e.message });
        }
    }
}
TypescriptEditorPane.editorMap = new WeakMap();
exports.TypescriptEditorPane = TypescriptEditorPane;
//# sourceMappingURL=typescriptEditorPane.js.map