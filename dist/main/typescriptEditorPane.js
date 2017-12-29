"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const atom_space_pen_views_1 = require("atom-space-pen-views");
const atom_1 = require("atom");
const lodash_1 = require("lodash");
const utils_1 = require("./atom/utils");
const typescriptBuffer_1 = require("./typescriptBuffer");
const tooltipManager = require("./atom/tooltipManager");
class TypescriptEditorPane {
    constructor(editor, opts) {
        // Path to the project's tsconfig.json
        this.configFile = "";
        this.isActive = false;
        this.isTypescript = false;
        this.isOpen = false;
        this.occurrenceMarkers = [];
        this.subscriptions = new atom_1.CompositeDisposable();
        this.onActivated = () => {
            this.activeAt = Date.now();
            this.isActive = true;
            if (this.isTypescript && this.filePath) {
                this.opts.statusPanel.show();
                // The first activation might happen before we even have a client
                if (this.client) {
                    this.client.executeGetErr({
                        files: [this.filePath],
                        delay: 100,
                    });
                    this.opts.statusPanel.setVersion(this.client.version);
                }
            }
            this.opts.statusPanel.setTsConfigPath(this.configFile);
        };
        this.onChanged = () => {
            if (!this.client)
                return;
            if (!this.filePath)
                return;
            this.opts.statusPanel.setBuildStatus(undefined);
            this.client.executeGetErr({
                files: [this.filePath],
                delay: 100,
            });
        };
        this.onDeactivated = () => {
            this.isActive = false;
            this.opts.statusPanel.hide();
        };
        this.updateMarkers = lodash_1.debounce(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.client)
                return;
            if (!this.filePath)
                return;
            const pos = this.editor.getLastCursor().getBufferPosition();
            try {
                const result = yield this.client.executeOccurances({
                    file: this.filePath,
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
            this.clearOccurrenceMarkers();
        }), 100);
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
        this.onOpened = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const filePath = this.editor.getPath();
            this.filePath = filePath;
            if (!filePath)
                return;
            this.client = yield this.opts.getClient(filePath);
            // onOpened might trigger before onActivated so we can't rely on isActive flag
            if (atom.workspace.getActiveTextEditor() === this.editor) {
                this.isActive = true;
                this.opts.statusPanel.setVersion(this.client.version);
            }
            if (this.isTypescript) {
                this.client.executeGetErr({
                    files: [filePath],
                    delay: 100,
                });
                this.isOpen = true;
                try {
                    const result = yield this.client.executeProjectInfo({
                        needFileNameList: false,
                        file: filePath,
                    });
                    this.configFile = result.body.configFileName;
                    if (this.isActive) {
                        this.opts.statusPanel.setTsConfigPath(this.configFile);
                    }
                    utils_1.getProjectCodeSettings(filePath, this.configFile).then(options => {
                        this.client.executeConfigure({
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
        });
        this.onSaved = () => {
            this.filePath = this.editor.getPath();
            this.opts.onSave(this);
            this.compileOnSave();
        };
        this.editor = editor;
        this.filePath = editor.getPath();
        this.opts = opts;
        this.buffer = typescriptBuffer_1.TypescriptBuffer.construct(editor.buffer, opts.getClient)
            .on("changed", this.onChanged)
            .on("closed", this.opts.onClose)
            .on("opened", this.onOpened)
            .on("saved", this.onSaved);
        this.isTypescript = utils_1.isTypescriptGrammar(editor);
        // Add 'typescript-editor' class to the <atom-text-editor> where typescript is active.
        if (this.isTypescript) {
            atom.views.getView(this.editor).classList.add("typescript-editor");
        }
        this.subscriptions.add(editor.onDidChangeGrammar(() => {
            this.isTypescript = utils_1.isTypescriptGrammar(editor);
        }));
        this.subscriptions.add(this.editor.onDidChangeCursorPosition(this.onDidChangeCursorPosition));
        this.subscriptions.add(this.editor.onDidDestroy(this.onDidDestroy));
        this.setupTooltipView();
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
    compileOnSave() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { client } = this;
            if (!client)
                return;
            if (!this.filePath)
                return;
            const result = yield client.executeCompileOnSaveAffectedFileList({
                file: this.filePath,
            });
            this.opts.statusPanel.setBuildStatus(undefined);
            const fileNames = lodash_1.flatten(result.body.map(project => project.fileNames));
            if (fileNames.length === 0)
                return;
            try {
                const promises = fileNames.map(file => client.executeCompileOnSaveEmitFile({ file }));
                const saved = yield Promise.all(promises);
                if (!saved.every(res => !!res.body)) {
                    throw new Error("Some files failed to emit");
                }
                this.opts.statusPanel.setBuildStatus({
                    success: true,
                });
            }
            catch (error) {
                console.error("Save failed with error", error);
                this.opts.statusPanel.setBuildStatus({
                    success: false,
                });
            }
        });
    }
    setupTooltipView() {
        // subscribe for tooltips
        // inspiration : https://github.com/chaika2013/ide-haskell
        const editorView = atom_space_pen_views_1.$(atom.views.getView(this.editor));
        tooltipManager.attach(editorView, this.editor);
    }
}
exports.TypescriptEditorPane = TypescriptEditorPane;
//# sourceMappingURL=typescriptEditorPane.js.map