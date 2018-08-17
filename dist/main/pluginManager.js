"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Atom = require("atom");
const autoCompleteProvider_1 = require("./atom/autoCompleteProvider");
const clientResolver_1 = require("../client/clientResolver");
const hyperclickProvider_1 = require("./atom/hyperclickProvider");
const codefix_1 = require("./atom/codefix");
const atom_1 = require("atom");
const lodash_1 = require("lodash");
const errorPusher_1 = require("./errorPusher");
const statusPanel_1 = require("./atom/components/statusPanel");
const typescriptEditorPane_1 = require("./typescriptEditorPane");
const typescriptBuffer_1 = require("./typescriptBuffer");
const commands_1 = require("./atom/commands");
const semanticViewController_1 = require("./atom/views/outline/semanticViewController");
const symbolsViewController_1 = require("./atom/views/symbols/symbolsViewController");
const editorPositionHistoryManager_1 = require("./atom/editorPositionHistoryManager");
const utils_1 = require("./atom/utils");
const path = require("path");
class PluginManager {
    constructor(state) {
        this.panes = []; // TODO: do we need it?
        this.clearErrors = () => {
            this.errorPusher.clear();
        };
        this.getClient = async (filePath) => {
            const pane = this.panes.find(p => p.buffer.getPath() === filePath);
            if (pane && pane.client) {
                return pane.client;
            }
            return this.clientResolver.get(filePath);
        };
        this.getStatusPanel = () => this.statusPanel;
        this.withTypescriptBuffer = async (filePath, action) => {
            const normalizedFilePath = path.normalize(filePath);
            const pane = this.panes.find(p => p.buffer.getPath() === normalizedFilePath);
            if (pane)
                return action(pane.buffer);
            // no open buffer
            const buffer = await Atom.TextBuffer.load(normalizedFilePath);
            try {
                const tsbuffer = typescriptBuffer_1.TypescriptBuffer.create(buffer, fp => this.clientResolver.get(fp));
                return await action(tsbuffer);
            }
            finally {
                if (buffer.isModified())
                    await buffer.save();
                buffer.destroy();
            }
        };
        this.applyEdits = async (edits) => void Promise.all(edits.map(edit => this.withTypescriptBuffer(edit.fileName, async (buffer) => {
            buffer.buffer.transact(() => {
                const changes = edit.textChanges
                    .map(e => ({ range: utils_1.spanToRange(e), newText: e.newText }))
                    .sort((a, b) => b.range.compare(a.range));
                for (const change of changes) {
                    buffer.buffer.setTextInRange(change.range, change.newText);
                }
            });
            return buffer.flush();
        })));
        this.getSemanticViewController = () => this.semanticViewController;
        this.getSymbolsViewController = () => this.symbolsViewController;
        this.getEditorPositionHistoryManager = () => this.editorPosHist;
        this.subscriptions = new atom_1.CompositeDisposable();
        this.clientResolver = new clientResolver_1.ClientResolver();
        this.subscriptions.add(this.clientResolver);
        this.statusPanel = new statusPanel_1.StatusPanel({ clientResolver: this.clientResolver });
        this.subscriptions.add(this.statusPanel);
        this.errorPusher = new errorPusher_1.ErrorPusher();
        this.subscriptions.add(this.errorPusher);
        // NOTE: This has to run before withTypescriptBuffer is used to populate this.panes
        this.subscribeEditors();
        this.codefixProvider = new codefix_1.CodefixProvider(this.clientResolver, this.errorPusher, this.applyEdits);
        this.subscriptions.add(this.codefixProvider);
        this.semanticViewController = new semanticViewController_1.SemanticViewController(this.withTypescriptBuffer);
        this.subscriptions.add(this.semanticViewController);
        this.symbolsViewController = new symbolsViewController_1.SymbolsViewController(this);
        this.subscriptions.add(this.symbolsViewController);
        this.editorPosHist = new editorPositionHistoryManager_1.EditorPositionHistoryManager(state && state.editorPosHistState);
        this.subscriptions.add(this.editorPosHist);
        // Register the commands
        this.subscriptions.add(commands_1.registerCommands(this));
    }
    destroy() {
        this.subscriptions.dispose();
    }
    serialize() {
        return {
            version: "0.1",
            editorPosHistState: this.editorPosHist.serialize(),
        };
    }
    consumeLinter(register) {
        const linter = register({
            name: "TypeScript",
        });
        this.errorPusher.setLinter(linter);
        this.clientResolver.on("diagnostics", ({ type, filePath, diagnostics }) => {
            this.errorPusher.setErrors(type, filePath, diagnostics);
        });
    }
    consumeStatusBar(statusBar) {
        let statusPriority = 100;
        for (const panel of statusBar.getRightTiles()) {
            if (atom.views.getView(panel.getItem()).tagName === "GRAMMAR-SELECTOR-STATUS") {
                statusPriority = panel.getPriority() - 1;
            }
        }
        const tile = statusBar.addRightTile({
            item: this.statusPanel,
            priority: statusPriority,
        });
        const disp = new Atom.Disposable(() => {
            tile.destroy();
        });
        this.subscriptions.add(disp);
        return disp;
    }
    // Registering an autocomplete provider
    provideAutocomplete() {
        return [
            new autoCompleteProvider_1.AutocompleteProvider(this.clientResolver, {
                withTypescriptBuffer: this.withTypescriptBuffer,
            }),
        ];
    }
    provideIntentions() {
        return new codefix_1.IntentionsProvider(this.codefixProvider);
    }
    provideCodeActions() {
        return new codefix_1.CodeActionsProvider(this.codefixProvider);
    }
    provideHyperclick() {
        return hyperclickProvider_1.getHyperclickProvider(this.clientResolver, this.editorPosHist);
    }
    subscribeEditors() {
        let activePane;
        this.subscriptions.add(atom.workspace.observeTextEditors((editor) => {
            this.panes.push(new typescriptEditorPane_1.TypescriptEditorPane(editor, {
                getClient: (filePath) => this.clientResolver.get(filePath),
                onClose: filePath => {
                    // Clear errors if any from this file
                    this.errorPusher.setErrors("syntaxDiag", filePath, []);
                    this.errorPusher.setErrors("semanticDiag", filePath, []);
                },
                onDispose: pane => {
                    if (activePane === pane) {
                        activePane = undefined;
                    }
                    this.panes.splice(this.panes.indexOf(pane), 1);
                },
                onSave: lodash_1.debounce((pane) => {
                    if (!pane.client) {
                        return;
                    }
                    const files = [];
                    for (const p of this.panes.sort((a, b) => a.activeAt - b.activeAt)) {
                        const filePath = p.buffer.getPath();
                        if (filePath !== undefined && p.isTypescript && p.client === pane.client) {
                            files.push(filePath);
                        }
                    }
                    pane.client.execute("geterr", { files, delay: 100 });
                }, 50),
                statusPanel: this.statusPanel,
            }));
        }));
        this.subscriptions.add(atom.workspace.observeActiveTextEditor((editor) => {
            if (activePane) {
                activePane.onDeactivated();
                activePane = undefined;
            }
            const pane = this.panes.find(p => p.editor === editor);
            if (pane) {
                activePane = pane;
                pane.onActivated();
            }
        }));
    }
}
exports.PluginManager = PluginManager;
//# sourceMappingURL=pluginManager.js.map