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
                        delay: 100
                    });
                    this.opts.statusPanel.setVersion(this.client.version);
                }
            }
            this.opts.statusPanel.setTsConfigPath(this.configFile);
        };
        this.onChanged = () => {
            if (!this.client)
                return;
            this.opts.statusPanel.setBuildStatus(undefined);
            this.client.executeGetErr({
                files: [this.filePath],
                delay: 100
            });
        };
        this.onDeactivated = () => {
            this.isActive = false;
            this.opts.statusPanel.hide();
        };
        this.updateMarkers = lodash_1.debounce(() => {
            if (!this.client)
                return;
            const pos = this.editor.getLastCursor().getBufferPosition();
            this.client.executeOccurances({
                file: this.filePath,
                line: pos.row + 1,
                offset: pos.column + 1
            }).then(result => {
                this.clearOccurrenceMarkers();
                for (const ref of result.body) {
                    const marker = this.editor.markBufferRange(utils_1.spanToRange(ref));
                    this.editor.decorateMarker(marker, {
                        type: "highlight",
                        class: "atom-typescript-occurrence"
                    });
                    this.occurrenceMarkers.push(marker);
                }
            }).catch(() => this.clearOccurrenceMarkers());
        }, 100);
        this.onDidChangeCursorPosition = ({ textChanged }) => {
            if (!this.isTypescript) {
                return;
            }
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
            this.client = yield this.opts.getClient(this.filePath);
            this.subscriptions.add(this.editor.onDidChangeCursorPosition(this.onDidChangeCursorPosition));
            this.subscriptions.add(this.editor.onDidDestroy(this.onDidDestroy));
            // onOpened might trigger before onActivated so we can't rely on isActive flag
            if (atom.workspace.getActiveTextEditor() === this.editor) {
                this.isActive = true;
                this.opts.statusPanel.setVersion(this.client.version);
            }
            if (this.isTypescript && this.filePath) {
                this.client.executeGetErr({
                    files: [this.filePath],
                    delay: 100
                });
                this.isOpen = true;
                this.client.executeProjectInfo({
                    needFileNameList: false,
                    file: this.filePath
                }).then(result => {
                    this.configFile = result.body.configFileName;
                    if (this.isActive) {
                        this.opts.statusPanel.setTsConfigPath(this.configFile);
                    }
                }, error => null);
            }
        });
        this.onSaved = () => {
            this.filePath = this.editor.getPath();
            if (this.opts.onSave) {
                this.opts.onSave(this);
            }
            this.compileOnSave();
        };
        this.editor = editor;
        this.filePath = editor.getPath();
        this.opts = opts;
        this.buffer = new typescriptBuffer_1.TypescriptBuffer(editor.buffer, opts.getClient)
            .on("changed", this.onChanged)
            .on("opened", this.onOpened)
            .on("saved", this.onSaved);
        this.isTypescript = isTypescriptGrammar(editor.getGrammar());
        // Add 'typescript-editor' class to the <atom-text-editor> where typescript is active.
        if (this.isTypescript) {
            this.editor.element.classList.add('typescript-editor');
        }
        this.subscriptions.add(editor.onDidChangeGrammar(grammar => {
            this.isTypescript = isTypescriptGrammar(grammar);
        }));
        this.setupTooltipView();
    }
    dispose() {
        this.editor.element.classList.remove('typescript-editor');
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
            const result = yield client.executeCompileOnSaveAffectedFileList({
                file: this.filePath
            });
            this.opts.statusPanel.setBuildStatus(undefined);
            const fileNames = lodash_1.flatten(result.body.map(project => project.fileNames));
            if (fileNames.length === 0) {
                return;
            }
            try {
                const promises = fileNames.map(file => client.executeCompileOnSaveEmitFile({ file }));
                const saved = yield Promise.all(promises);
                if (!saved.every(res => res.body)) {
                    throw new Error("Some files failed to emit");
                }
                this.opts.statusPanel.setBuildStatus({
                    success: true
                });
            }
            catch (error) {
                console.error("Save failed with error", error);
                this.opts.statusPanel.setBuildStatus({
                    success: false
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
function isTypescriptGrammar(grammar) {
    return grammar.scopeName === "source.ts" || grammar.scopeName === "source.tsx";
}
//# sourceMappingURL=typescriptEditorPane.js.map