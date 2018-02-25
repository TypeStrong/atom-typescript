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
class PluginManager {
    constructor() {
        this.panes = []; // TODO: do we need it?
        this.clearErrors = () => {
            this.errorPusher.clear();
        };
        this.getClient = async (filePath) => {
            const pane = this.panes.find(p => p.filePath === filePath);
            if (pane && pane.client) {
                return pane.client;
            }
            return this.clientResolver.get(filePath);
        };
        this.getStatusPanel = () => this.statusPanel;
        this.getTypescriptBuffer = async (filePath) => {
            const pane = this.panes.find(p => p.filePath === filePath);
            if (pane) {
                return {
                    buffer: pane.buffer,
                    isOpen: true,
                };
            }
            // Wait for the buffer to load before resolving the promise
            const buffer = await Atom.TextBuffer.load(filePath);
            return {
                buffer: typescriptBuffer_1.TypescriptBuffer.create(buffer, fp => this.clientResolver.get(fp)),
                isOpen: false,
            };
        };
        this.getSemanticViewController = () => this.semanticViewController;
        this.subscriptions = new atom_1.CompositeDisposable();
        this.clientResolver = new clientResolver_1.ClientResolver();
        this.statusPanel = new statusPanel_1.StatusPanel({ clientResolver: this.clientResolver });
        this.errorPusher = new errorPusher_1.ErrorPusher();
        this.codefixProvider = new codefix_1.CodefixProvider(this.clientResolver, this.errorPusher, this.getTypescriptBuffer);
        this.semanticViewController = new semanticViewController_1.SemanticViewController(this.clientResolver);
        this.subscriptions.add(this.statusPanel);
        this.subscriptions.add(this.clientResolver);
        this.subscriptions.add(this.errorPusher);
        this.subscriptions.add(this.semanticViewController);
        // Register the commands
        this.subscriptions.add(commands_1.registerCommands(this));
        let activePane;
        const onSave = lodash_1.debounce((pane) => {
            if (!pane.client) {
                return;
            }
            const files = [];
            for (const p of this.panes.sort((a, b) => a.activeAt - b.activeAt)) {
                if (p.filePath && p.isTypescript && p.client === p.client) {
                    files.push(p.filePath);
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
                getTypescriptBuffer: this.getTypescriptBuffer,
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