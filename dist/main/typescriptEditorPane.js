"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const lodash_1 = require("lodash");
const utils_1 = require("./atom/utils");
const typescriptBuffer_1 = require("./typescriptBuffer");
const tooltipManager_1 = require("./atom/tooltipManager");
class TypescriptEditorPane {
    constructor(editor, opts) {
        this.editor = editor;
        this.opts = opts;
        // Timestamp for activated event
        this.activeAt = 0;
        this.isTypescript = false;
        // Path to the project's tsconfig.json
        this.configFile = "";
        this.isActive = false;
        this.isOpen = false;
        this.occurrenceMarkers = [];
        this.subscriptions = new atom_1.CompositeDisposable();
        this.onActivated = () => {
            this.activeAt = Date.now();
            this.isActive = true;
            const filePath = this.buffer.getPath();
            if (this.isTypescript && filePath !== undefined) {
                this.opts.statusPanel.show();
                // The first activation might happen before we even have a client
                if (this.client) {
                    this.client.execute("geterr", {
                        files: [filePath],
                        delay: 100,
                    });
                    this.opts.statusPanel.update({ version: this.client.version });
                }
            }
            this.opts.statusPanel.update({ tsConfigPath: this.configFile });
        };
        this.onDeactivated = () => {
            this.isActive = false;
            this.opts.statusPanel.hide();
        };
        this.onChanged = () => {
            if (!this.client)
                return;
            const filePath = this.buffer.getPath();
            if (filePath === undefined)
                return;
            this.opts.statusPanel.update({ buildStatus: undefined });
            this.client.execute("geterr", {
                files: [filePath],
                delay: 100,
            });
        };
        this.onDidChangeCursorPosition = ({ textChanged }) => {
            if (!this.isTypescript || !this.isOpen)
                return;
            if (textChanged) {
                this.clearOccurrenceMarkers();
                return;
            }
            this.updateMarkers();
        };
        this.onDidDestroy = () => {
            this.dispose();
        };
        this.onOpened = async () => {
            const filePath = this.buffer.getPath();
            if (filePath === undefined)
                return;
            this.client = await this.opts.getClient(filePath);
            // onOpened might trigger before onActivated so we can't rely on isActive flag
            if (atom.workspace.getActiveTextEditor() === this.editor) {
                this.isActive = true;
                this.opts.statusPanel.update({ version: this.client.version });
            }
            if (this.isTypescript) {
                this.client.execute("geterr", {
                    files: [filePath],
                    delay: 100,
                });
                this.isOpen = true;
                try {
                    const result = await this.client.execute("projectInfo", {
                        needFileNameList: false,
                        file: filePath,
                    });
                    this.configFile = result.body.configFileName;
                    if (this.isActive) {
                        this.opts.statusPanel.update({ tsConfigPath: this.configFile });
                    }
                    utils_1.getProjectCodeSettings(this.configFile).then(options => {
                        this.client.execute("configure", {
                            file: filePath,
                            formatOptions: options,
                        });
                    });
                }
                catch (e) {
                    if (window.atom_typescript_debug)
                        console.error(e);
                }
            }
        };
        this.onSaved = () => {
            this.opts.onSave(this);
            this.compileOnSave();
        };
        this.checkIfTypescript = () => {
            this.isTypescript = utils_1.isTypescriptEditorWithPath(this.editor);
            // Add 'typescript-editor' class to the <atom-text-editor> where typescript is active.
            if (this.isTypescript) {
                atom.views.getView(this.editor).classList.add("typescript-editor");
            }
        };
        this.updateMarkers = lodash_1.debounce(this.updateMarkers.bind(this), 100);
        this.buffer = typescriptBuffer_1.TypescriptBuffer.create(editor.getBuffer(), opts.getClient);
        this.subscriptions.add(this.buffer.events.on("changed", this.onChanged), this.buffer.events.on("closed", this.opts.onClose), this.buffer.events.on("opened", this.onOpened), this.buffer.events.on("saved", this.onSaved));
        this.checkIfTypescript();
        this.subscriptions.add(editor.onDidChangePath(this.checkIfTypescript), editor.onDidChangeGrammar(this.checkIfTypescript), this.editor.onDidChangeCursorPosition(this.onDidChangeCursorPosition), this.editor.onDidDestroy(this.onDidDestroy));
        this.subscriptions.add(new tooltipManager_1.TooltipManager(this.editor, opts.getClient));
    }
    dispose() {
        atom.views.getView(this.editor).classList.remove("typescript-editor");
        this.subscriptions.dispose();
        this.opts.onDispose(this);
    }
    clearOccurrenceMarkers() {
        for (const marker of this.occurrenceMarkers) {
            marker.destroy();
        }
    }
    async updateMarkers() {
        if (!this.client)
            return;
        const filePath = this.buffer.getPath();
        if (filePath === undefined)
            return;
        const pos = this.editor.getLastCursor().getBufferPosition();
        this.clearOccurrenceMarkers();
        try {
            const result = await this.client.execute("occurrences", {
                file: filePath,
                line: pos.row + 1,
                offset: pos.column + 1,
            });
            for (const ref of result.body) {
                const marker = this.editor.markBufferRange(utils_1.spanToRange(ref));
                this.editor.decorateMarker(marker, {
                    type: "highlight",
                    class: "atom-typescript-occurrence",
                });
                this.occurrenceMarkers.push(marker);
            }
        }
        catch (e) {
            if (window.atom_typescript_debug)
                console.error(e);
        }
    }
    async compileOnSave() {
        const { client } = this;
        if (!client)
            return;
        const filePath = this.buffer.getPath();
        if (filePath === undefined)
            return;
        const result = await client.execute("compileOnSaveAffectedFileList", {
            file: filePath,
        });
        this.opts.statusPanel.update({ buildStatus: undefined });
        const fileNames = lodash_1.flatten(result.body.map(project => project.fileNames));
        if (fileNames.length === 0)
            return;
        try {
            const promises = fileNames.map(file => client.execute("compileOnSaveEmitFile", { file }));
            const saved = await Promise.all(promises);
            if (!saved.every(res => !!res.body)) {
                throw new Error("Some files failed to emit");
            }
            this.opts.statusPanel.update({ buildStatus: { success: true } });
        }
        catch (error) {
            const e = error;
            console.error("Save failed with error", e);
            this.opts.statusPanel.update({ buildStatus: { success: false, message: e.message } });
        }
    }
}
exports.TypescriptEditorPane = TypescriptEditorPane;
//# sourceMappingURL=typescriptEditorPane.js.map