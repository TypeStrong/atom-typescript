"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Atom = require("atom");
const atom_1 = require("atom");
const lodash_1 = require("lodash");
const path = require("path");
const client_1 = require("../client");
const utils_1 = require("../utils");
const codeActionsProvider_1 = require("./atom-ide/codeActionsProvider");
const codeHighlightProvider_1 = require("./atom-ide/codeHighlightProvider");
const datatipProvider_1 = require("./atom-ide/datatipProvider");
const definitionsProvider_1 = require("./atom-ide/definitionsProvider");
const findReferencesProvider_1 = require("./atom-ide/findReferencesProvider");
const hyperclickProvider_1 = require("./atom-ide/hyperclickProvider");
const outlineProvider_1 = require("./atom-ide/outlineProvider");
const sigHelpProvider_1 = require("./atom-ide/sigHelpProvider");
const autoCompleteProvider_1 = require("./atom/autoCompleteProvider");
const codefix_1 = require("./atom/codefix");
const intentionsProvider_1 = require("./atom/codefix/intentionsProvider");
const commands_1 = require("./atom/commands");
const statusPanel_1 = require("./atom/components/statusPanel");
const editorPositionHistoryManager_1 = require("./atom/editorPositionHistoryManager");
const manager_1 = require("./atom/occurrence/manager");
const manager_2 = require("./atom/sigHelp/manager");
const manager_3 = require("./atom/tooltips/manager");
const utils_2 = require("./atom/utils");
const semanticViewController_1 = require("./atom/views/outline/semanticViewController");
const symbolsViewController_1 = require("./atom/views/symbols/symbolsViewController");
const errorPusher_1 = require("./errorPusher");
const typescriptEditorPane_1 = require("./typescriptEditorPane");
class PluginManager {
    constructor(state) {
        this.usingBuiltinTooltipManager = true;
        this.usingBuiltinSigHelpManager = true;
        this.pending = new Set();
        this.clearErrors = () => {
            this.errorPusher.clear();
        };
        this.clearFileErrors = (filePath) => {
            this.errorPusher.clearFileErrors(filePath);
        };
        this.getClient = async (filePath) => {
            return this.clientResolver.get(filePath);
        };
        this.killAllServers = () => {
            utils_1.handlePromise(this.clientResolver.restartAllServers());
        };
        this.withBuffer = async (filePath, action) => {
            const normalizedFilePath = path.normalize(filePath);
            const ed = atom.workspace.getTextEditors().find(p => p.getPath() === normalizedFilePath);
            // found open buffer
            if (ed)
                return action(ed.getBuffer());
            // no open buffer
            const buffer = await Atom.TextBuffer.load(normalizedFilePath);
            try {
                return await action(buffer);
            }
            finally {
                if (buffer.isModified())
                    await buffer.save();
                buffer.destroy();
            }
        };
        this.reportBusyWhile = async (title, generator) => {
            if (this.busySignalService) {
                return this.busySignalService.reportBusyWhile(title, generator);
            }
            else {
                const event = { title };
                try {
                    this.pending.add(event);
                    this.drawPending(Array.from(this.pending));
                    return await generator();
                }
                finally {
                    this.pending.delete(event);
                    this.drawPending(Array.from(this.pending));
                }
            }
        };
        this.reportProgress = (progress) => {
            utils_1.handlePromise(this.statusPanel.update({ progress }));
        };
        this.reportBuildStatus = (buildStatus) => {
            utils_1.handlePromise(this.statusPanel.update({ buildStatus }));
        };
        this.reportClientInfo = (info) => {
            utils_1.handlePromise(this.statusPanel.update(info));
        };
        this.applyEdits = async (edits) => void Promise.all(edits.map(edit => this.withBuffer(edit.fileName, async (buffer) => {
            buffer.transact(() => {
                const changes = edit.textChanges
                    .map(e => ({ range: utils_2.spanToRange(e), newText: e.newText }))
                    .reverse() // NOTE: needs reverse for cases where ranges are same for two changes
                    .sort((a, b) => b.range.compare(a.range));
                for (const change of changes) {
                    buffer.setTextInRange(change.range, change.newText);
                }
            });
        })));
        this.showTooltipAt = async (ed) => {
            if (this.usingBuiltinTooltipManager)
                this.tooltipManager.showExpressionAt(ed);
            else
                await atom.commands.dispatch(atom.views.getView(ed), "datatip:toggle");
        };
        this.showSigHelpAt = async (ed) => {
            if (this.usingBuiltinSigHelpManager)
                await this.sigHelpManager.showTooltipAt(ed);
            else
                await atom.commands.dispatch(atom.views.getView(ed), "signature-help:show");
        };
        this.hideSigHelpAt = (ed) => {
            if (this.usingBuiltinSigHelpManager)
                return this.sigHelpManager.hideTooltipAt(ed);
            else
                return false;
        };
        this.rotateSigHelp = (ed, shift) => {
            if (this.usingBuiltinSigHelpManager)
                return this.sigHelpManager.rotateSigHelp(ed, shift);
            else
                return false;
        };
        this.histGoForward = (ed, opts) => {
            return this.editorPosHist.goForward(ed, opts);
        };
        // tslint:disable-next-line:member-ordering
        this.drawPending = lodash_1.throttle((pending) => utils_1.handlePromise(this.statusPanel.update({ pending })), 100, { leading: false });
        this.subscriptions = new atom_1.CompositeDisposable();
        this.clientResolver = new client_1.ClientResolver(this.reportBusyWhile);
        this.subscriptions.add(this.clientResolver);
        this.statusPanel = new statusPanel_1.StatusPanel();
        this.subscriptions.add(this.statusPanel);
        this.errorPusher = new errorPusher_1.ErrorPusher();
        this.subscriptions.add(this.errorPusher);
        this.codefixProvider = new codefix_1.CodefixProvider(this.clientResolver, this.errorPusher, this.applyEdits);
        this.subscriptions.add(this.codefixProvider);
        this.semanticViewController = new semanticViewController_1.SemanticViewController(this.getClient);
        this.subscriptions.add(this.semanticViewController);
        this.editorPosHist = new editorPositionHistoryManager_1.EditorPositionHistoryManager(state && state.editorPosHistState);
        this.subscriptions.add(this.editorPosHist);
        this.symbolsViewController = new symbolsViewController_1.SymbolsViewController({
            histGoForward: this.histGoForward,
            getClient: this.getClient,
        });
        this.subscriptions.add(this.symbolsViewController);
        this.tooltipManager = new manager_3.TooltipManager(this.getClient);
        this.subscriptions.add(this.tooltipManager);
        this.sigHelpManager = new manager_2.SigHelpManager({
            getClient: this.getClient,
        });
        this.subscriptions.add(this.sigHelpManager);
        this.occurrenceManager = new manager_1.OccurrenceManager(this.getClient);
        this.subscriptions.add(this.occurrenceManager);
        this.typescriptPaneFactory = typescriptEditorPane_1.TypescriptEditorPane.createFactory({
            clearFileErrors: this.clearFileErrors,
            getClient: this.getClient,
            reportBuildStatus: this.reportBuildStatus,
            reportClientInfo: this.reportClientInfo,
        });
        this.subscribeEditors();
        // Register the commands
        this.subscriptions.add(commands_1.registerCommands({
            getClient: this.getClient,
            applyEdits: this.applyEdits,
            clearErrors: this.clearErrors,
            killAllServers: this.killAllServers,
            reportProgress: this.reportProgress,
            reportBuildStatus: this.reportBuildStatus,
            toggleSemanticViewController: () => {
                utils_1.handlePromise(this.semanticViewController.toggle());
            },
            toggleFileSymbolsView: ed => {
                this.symbolsViewController.toggleFileView(ed);
            },
            toggleProjectSymbolsView: ed => {
                this.symbolsViewController.toggleProjectView(ed);
            },
            histGoForward: this.histGoForward,
            histGoBack: () => this.editorPosHist.goBack(),
            histShowHistory: () => this.editorPosHist.showHistory(),
            showTooltipAt: this.showTooltipAt,
            showSigHelpAt: this.showSigHelpAt,
            hideSigHelpAt: this.hideSigHelpAt,
            rotateSigHelp: this.rotateSigHelp,
        }));
    }
    destroy() {
        this.subscriptions.dispose();
        for (const ed of atom.workspace.getTextEditors()) {
            const pane = typescriptEditorPane_1.TypescriptEditorPane.lookupPane(ed);
            if (pane)
                pane.destroy();
        }
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
        this.subscriptions.add(this.clientResolver.on("diagnostics", ({ type, filePath, diagnostics }) => {
            this.errorPusher.setErrors(type, filePath, diagnostics);
        }));
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
    consumeDatatipService(datatip) {
        if (atom.config.get("atom-typescript").preferBuiltinTooltips)
            return;
        const disp = datatip.addProvider(new datatipProvider_1.TSDatatipProvider(this.getClient));
        this.subscriptions.add(disp);
        this.tooltipManager.dispose();
        this.usingBuiltinTooltipManager = false;
        return disp;
    }
    consumeSigHelpService(registry) {
        if (atom.config.get("atom-typescript").preferBuiltinSigHelp)
            return;
        const provider = new sigHelpProvider_1.TSSigHelpProvider(this.getClient);
        const disp = registry(provider);
        this.subscriptions.add(disp, provider);
        this.sigHelpManager.dispose();
        this.usingBuiltinSigHelpManager = false;
        return disp;
    }
    consumeBusySignal(busySignalService) {
        if (atom.config.get("atom-typescript").preferBuiltinBusySignal)
            return;
        this.busySignalService = busySignalService;
        const disp = {
            dispose: () => {
                if (this.busySignalService)
                    this.busySignalService.dispose();
                this.busySignalService = undefined;
            },
        };
        this.subscriptions.add(disp);
        return disp;
    }
    // Registering an autocomplete provider
    provideAutocomplete() {
        return [new autoCompleteProvider_1.AutocompleteProvider(this.getClient)];
    }
    provideIntentions() {
        return intentionsProvider_1.getIntentionsProvider(this.codefixProvider);
    }
    provideIntentionsHighlight() {
        return intentionsProvider_1.getIntentionsHighlightsProvider(this.codefixProvider);
    }
    provideCodeActions() {
        return codeActionsProvider_1.getCodeActionsProvider(this.codefixProvider);
    }
    provideHyperclick() {
        return hyperclickProvider_1.getHyperclickProvider(this.getClient, this.histGoForward);
    }
    provideReferences() {
        return findReferencesProvider_1.getFindReferencesProvider(this.getClient);
    }
    provideOutlines() {
        return outlineProvider_1.getOutlineProvider(this.getClient);
    }
    provideDefinitions() {
        if (atom.config.get("atom-typescript").disableAtomIdeDefinitions)
            return;
        return definitionsProvider_1.getDefinitionProvider(this.getClient);
    }
    provideCodeHighlight() {
        if (atom.config.get("atom-typescript").preferBuiltinOccurrenceHighlight)
            return;
        this.occurrenceManager.dispose();
        return codeHighlightProvider_1.getCodeHighlightProvider(this.getClient);
    }
    subscribeEditors() {
        this.subscriptions.add(atom.workspace.observeTextEditors((editor) => {
            this.typescriptPaneFactory(editor);
        }), atom.workspace.onDidChangeActiveTextEditor(ed => {
            if (ed && utils_2.isTypescriptEditorWithPath(ed)) {
                utils_1.handlePromise(this.statusPanel.show());
                const tep = typescriptEditorPane_1.TypescriptEditorPane.lookupPane(ed);
                if (tep)
                    tep.didActivate();
            }
            else
                utils_1.handlePromise(this.statusPanel.hide());
        }));
    }
}
exports.PluginManager = PluginManager;
//# sourceMappingURL=pluginManager.js.map