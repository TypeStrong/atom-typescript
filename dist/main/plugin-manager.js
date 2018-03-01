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
class PluginManager {
    constructor() {
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
            const pane = this.panes.find(p => p.buffer.getPath() === filePath);
            if (pane)
                return action(pane.buffer);
            // no open buffer
            const buffer = await Atom.TextBuffer.load(filePath);
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
        this.getSemanticViewController = () => this.semanticViewController;
        this.getSymbolsViewController = () => this.symbolsViewController;
        this.subscriptions = new atom_1.CompositeDisposable();
        this.clientResolver = new clientResolver_1.ClientResolver();
        this.statusPanel = new statusPanel_1.StatusPanel({ clientResolver: this.clientResolver });
        this.errorPusher = new errorPusher_1.ErrorPusher();
        this.codefixProvider = new codefix_1.CodefixProvider(this.clientResolver, this.errorPusher, this.withTypescriptBuffer);
        this.semanticViewController = new semanticViewController_1.SemanticViewController(this.withTypescriptBuffer);
        this.symbolsViewController = new symbolsViewController_1.SymbolsViewController({
            withTypescriptBuffer: this.withTypescriptBuffer,
        });
        this.subscriptions.add(this.statusPanel);
        this.subscriptions.add(this.clientResolver);
        this.subscriptions.add(this.errorPusher);
        this.subscriptions.add(this.semanticViewController);
        this.subscriptions.add(this.symbolsViewController);
        // Register the commands
        this.subscriptions.add(commands_1.registerCommands(this));
        let activePane;
        const onSave = lodash_1.debounce((pane) => {
            if (!pane.client) {
                return;
            }
            const files = [];
            for (const p of this.panes.sort((a, b) => a.activeAt - b.activeAt)) {
                const filePath = p.buffer.getPath();
                if (filePath && p.isTypescript && p.client === p.client) {
                    files.push(filePath);
                }
            }
            pane.client.executeGetErr({ files, delay: 100 });
        }, 50);
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
                onSave,
                statusPanel: this.statusPanel,
            }));
        }));
        activePane = this.panes.find(pane => pane.editor === atom.workspace.getActiveTextEditor());
        if (activePane) {
            activePane.onActivated();
        }
        this.subscriptions.add(atom.workspace.onDidChangeActiveTextEditor((editor) => {
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
    destroy() {
        this.subscriptions.dispose();
    }
    consumeLinter(register) {
        const linter = register({
            name: "Typescript",
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
        return hyperclickProvider_1.getHyperclickProvider(this.clientResolver);
    }
}
exports.PluginManager = PluginManager;
//# sourceMappingURL=plugin-manager.js.map