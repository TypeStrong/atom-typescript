"use strict";
const tslib_1 = require("tslib");
const atom_space_pen_views_1 = require("atom-space-pen-views");
const atom_1 = require("atom");
const atomts_1 = require("./atomts");
const tsUtil_1 = require("./utils/tsUtil");
const path_1 = require("path");
const tooltipManager = require("./atom/tooltipManager");
const mainPanelView = require("./atom/views/mainPanelView");
class TypescriptEditorPane {
    constructor(editor, opts) {
        this.isTypescript = false;
        this.isTSConfig = false;
        this.isOpen = false;
        this.occurrenceMarkers = [];
        this.subscriptions = new atom_1.CompositeDisposable();
        this.onActivated = () => {
            this.activeAt = Date.now();
            if (this.isTypescript && this.filePath) {
                mainPanelView.show();
                if (this.client) {
                    this.client.executeGetErr({
                        files: [this.filePath],
                        delay: 100
                    });
                }
            }
        };
        this.onDeactivated = () => {
            mainPanelView.hide();
        };
        this.onDidChange = diff => {
            if (this.isOpen) {
                this.client.executeChange({
                    endLine: diff.oldRange.end.row + 1,
                    endOffset: diff.oldRange.end.column + 1,
                    file: this.editor.getPath(),
                    line: diff.oldRange.start.row + 1,
                    offset: diff.oldRange.start.column + 1,
                    insertString: diff.newText,
                });
            }
        };
        this.onDidChangeCursorPosition = () => {
            if (!this.isTypescript) {
                return;
            }
            for (const marker of this.occurrenceMarkers) {
                marker.destroy();
            }
            const pos = this.editor.getLastCursor().getBufferPosition();
            this.client.executeOccurances({
                file: this.filePath,
                line: pos.row + 1,
                offset: pos.column + 1
            }).then(result => {
                for (const ref of result.body) {
                    const marker = this.editor.markBufferRange(tsUtil_1.spanToRange(ref));
                    this.editor.decorateMarker(marker, {
                        type: "highlight",
                        class: "atom-typescript-occurrence"
                    });
                    this.occurrenceMarkers.push(marker);
                }
            }).catch(() => null);
        };
        this.onDidSave = (event) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            console.log("saved", this.editor.getPath());
            if (this.filePath !== event.path) {
                console.log("file path changed to", event.path);
                this.client = yield atomts_1.clientResolver.get(event.path);
                this.filePath = event.path;
                this.isTSConfig = path_1.basename(this.filePath) === "tsconfig.json";
            }
            if (this.onSave) {
                this.onSave(this);
            }
        });
        this.onDidStopChanging = () => {
            if (this.isTypescript && this.filePath) {
                this.client.executeGetErr({
                    files: [this.filePath],
                    delay: 100
                });
            }
        };
        this.onSave = opts.onSave;
        this.editor = editor;
        this.filePath = editor.getPath();
        this.isTypescript = isTypescriptGrammar(editor.getGrammar());
        this.subscriptions.add(editor.onDidChangeGrammar(grammar => {
            this.isTypescript = isTypescriptGrammar(grammar);
        }));
        if (this.filePath) {
            this.isTSConfig = path_1.basename(this.filePath) === "tsconfig.json";
        }
        console.log("opened", this.filePath);
        atomts_1.clientResolver.get(this.filePath).then(client => {
            this.client = client;
            this.subscriptions.add(editor.buffer.onDidChange(this.onDidChange));
            this.subscriptions.add(editor.onDidChangeCursorPosition(this.onDidChangeCursorPosition));
            this.subscriptions.add(editor.onDidSave(this.onDidSave));
            this.subscriptions.add(editor.onDidStopChanging(this.onDidStopChanging));
            if (this.isTypescript && this.filePath) {
                this.client.executeOpen({
                    file: this.filePath,
                    fileContent: this.editor.getText()
                });
                this.client.executeGetErr({
                    files: [this.filePath],
                    delay: 100
                });
                this.isOpen = true;
                this.updatePanelConfig();
            }
        });
        this.setupTooltipView();
    }
    dispose() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.subscriptions.dispose();
            if (this.isOpen) {
                this.client.executeClose({ file: this.filePath });
            }
        });
    }
    setupTooltipView() {
        const editorView = atom_space_pen_views_1.$(atom.views.getView(this.editor));
        tooltipManager.attach(editorView, this.editor);
    }
    updatePanelConfig() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let configPath = "";
            try {
                const result = yield this.client.executeProjectInfo({
                    needFileNameList: false,
                    file: this.filePath
                });
                configPath = result.body.configFileName;
            }
            catch (error) { }
            mainPanelView.panelView.setTsconfigInUse(configPath);
        });
    }
}
exports.TypescriptEditorPane = TypescriptEditorPane;
function isTypescriptGrammar(grammar) {
    return grammar.scopeName === "source.ts" || grammar.scopeName === "source.tsx";
}
