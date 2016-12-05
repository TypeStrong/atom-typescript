"use strict";
const tslib_1 = require("tslib");
const atom_space_pen_views_1 = require("atom-space-pen-views");
const path_1 = require("path");
const atomts_1 = require("./atomts");
const atom_1 = require("atom");
const tsUtil_1 = require("./utils/tsUtil");
const tooltipManager = require("./atom/tooltipManager");
class TypescriptEditorPane {
    constructor(editor, opts) {
        this.configFile = "";
        this.isActive = false;
        this.isTSConfig = false;
        this.isTypescript = false;
        this.isOpen = false;
        this.occurrenceMarkers = [];
        this.subscriptions = new atom_1.CompositeDisposable();
        this.onActivated = () => {
            this.activeAt = Date.now();
            this.isActive = true;
            if (this.isTypescript && this.filePath) {
                this.mainPanel.show();
                if (this.client) {
                    this.client.executeGetErr({
                        files: [this.filePath],
                        delay: 100
                    });
                }
            }
            this.mainPanel.view.setTsconfigInUse(this.configFile);
        };
        this.onDeactivated = () => {
            this.isActive = false;
            this.mainPanel.hide();
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
            const result = yield this.client.executeCompileOnSaveAffectedFileList({
                file: this.filePath
            });
            for (const project of result.body) {
                for (const file of project.fileNames) {
                    this.client.executeCompileOnSaveEmitFile({ file });
                }
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
        this.mainPanel = opts.mainPanel;
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
                this.client.executeProjectInfo({
                    needFileNameList: false,
                    file: this.filePath
                }).then(result => {
                    this.configFile = result.body.configFileName;
                    if (this.isActive) {
                        this.mainPanel.view.setTsconfigInUse(this.configFile);
                    }
                }, error => null);
            }
        });
        this.setupTooltipView();
    }
    dispose() {
        this.subscriptions.dispose();
        if (this.isOpen) {
            this.client.executeClose({ file: this.filePath });
        }
        this.onDispose(this);
    }
    setupTooltipView() {
        const editorView = atom_space_pen_views_1.$(atom.views.getView(this.editor));
        tooltipManager.attach(editorView, this.editor);
    }
}
exports.TypescriptEditorPane = TypescriptEditorPane;
function isTypescriptGrammar(grammar) {
    return grammar.scopeName === "source.ts" || grammar.scopeName === "source.tsx";
}
