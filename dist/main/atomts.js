"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const Atom = require("atom");
const tsconfig = require("tsconfig/dist/tsconfig");
const renameView_1 = require("./atom/views/renameView");
const autoCompleteProvider_1 = require("./atom/autoCompleteProvider");
const clientResolver_1 = require("../client/clientResolver");
const hyperclickProvider_1 = require("./atom/hyperclickProvider");
const codefix_1 = require("./atom/codefix");
const atom_1 = require("atom");
const lodash_1 = require("lodash");
const errorPusher_1 = require("./errorPusher");
const lodash_2 = require("lodash");
const statusPanel_1 = require("./atom/components/statusPanel");
const typescriptEditorPane_1 = require("./typescriptEditorPane");
const typescriptBuffer_1 = require("./typescriptBuffer");
// globals
const subscriptions = new atom_1.CompositeDisposable();
exports.clientResolver = new clientResolver_1.ClientResolver();
const panes = [];
const statusPanel = statusPanel_1.StatusPanel.create();
const errorPusher = new errorPusher_1.ErrorPusher();
const codefixProvider = new codefix_1.CodefixProvider(exports.clientResolver);
// Register all custom components
require("./atom/components");
const commands_1 = require("./atom/commands");
function activate() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const pns = atom.packages.getAvailablePackageNames();
        if (!(pns.includes("atom-ide-ui") || pns.includes("linter"))) {
            yield require("atom-package-deps").install("atom-typescript", true);
        }
        // Add the rename view
        const { renameView } = renameView_1.attach();
        errorPusher.setUnusedAsInfo(atom.config.get("atom-typescript.unusedAsInfo"));
        subscriptions.add(atom.config.onDidChange("atom-typescript.unusedAsInfo", val => {
            errorPusher.setUnusedAsInfo(val.newValue);
        }));
        codefixProvider.errorPusher = errorPusher;
        codefixProvider.getTypescriptBuffer = getTypescriptBuffer;
        exports.clientResolver.on("pendingRequestsChange", () => {
            const pending = lodash_2.flatten(lodash_2.values(exports.clientResolver.clients).map(cl => cl.pending));
            statusPanel.setPending(pending);
        });
        // Register the commands
        commands_1.registerCommands({
            clearErrors() {
                errorPusher.clear();
            },
            getTypescriptBuffer,
            getClient(filePath) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const pane = panes.find(p => p.filePath === filePath);
                    if (pane && pane.client) {
                        return pane.client;
                    }
                    return exports.clientResolver.get(filePath);
                });
            },
            renameView,
            statusPanel,
        });
        let activePane;
        const onSave = lodash_1.debounce((pane) => {
            if (!pane.client) {
                return;
            }
            const files = [];
            for (const p of panes.sort((a, b) => a.activeAt - b.activeAt)) {
                if (p.filePath && p.isTypescript && p.client === p.client) {
                    files.push(p.filePath);
                }
            }
            pane.client.executeGetErr({ files, delay: 100 });
        }, 50);
        subscriptions.add(atom.workspace.observeTextEditors((editor) => {
            panes.push(new typescriptEditorPane_1.TypescriptEditorPane(editor, {
                getClient: (filePath) => exports.clientResolver.get(filePath),
                onClose(filePath) {
                    // Clear errors if any from this file
                    errorPusher.setErrors("syntaxDiag", filePath, []);
                    errorPusher.setErrors("semanticDiag", filePath, []);
                },
                onDispose(pane) {
                    if (activePane === pane) {
                        activePane = undefined;
                    }
                    panes.splice(panes.indexOf(pane), 1);
                },
                onSave,
                statusPanel,
            }));
        }));
        activePane = panes.find(pane => pane.editor === atom.workspace.getActiveTextEditor());
        if (activePane) {
            activePane.onActivated();
        }
        subscriptions.add(atom.workspace.onDidChangeActiveTextEditor((editor) => {
            if (activePane) {
                activePane.onDeactivated();
                activePane = undefined;
            }
            const pane = panes.find(p => p.editor === editor);
            if (pane) {
                activePane = pane;
                pane.onActivated();
            }
        }));
    });
}
exports.activate = activate;
function deactivate() {
    subscriptions.dispose();
}
exports.deactivate = deactivate;
function consumeLinter(register) {
    const linter = register({
        name: "Typescript",
    });
    errorPusher.setLinter(linter);
    exports.clientResolver.on("diagnostics", ({ type, filePath, diagnostics }) => {
        errorPusher.setErrors(type, filePath, diagnostics);
    });
}
exports.consumeLinter = consumeLinter;
function consumeStatusBar(statusBar) {
    let statusPriority = 100;
    for (const panel of statusBar.getRightTiles()) {
        if (atom.views.getView(panel.getItem()).tagName === "GRAMMAR-SELECTOR-STATUS") {
            statusPriority = panel.getPriority() - 1;
        }
    }
    statusBar.addRightTile({
        item: statusPanel,
        priority: statusPriority,
    });
    subscriptions.add(statusPanel);
}
exports.consumeStatusBar = consumeStatusBar;
// Registering an autocomplete provider
function provideAutocomplete() {
    return [new autoCompleteProvider_1.AutocompleteProvider(exports.clientResolver, { getTypescriptBuffer })];
}
exports.provideAutocomplete = provideAutocomplete;
function provideIntentions() {
    return new codefix_1.IntentionsProvider(codefixProvider);
}
exports.provideIntentions = provideIntentions;
function provideCodeActions() {
    return new codefix_1.CodeActionsProvider(codefixProvider);
}
exports.provideCodeActions = provideCodeActions;
function hyperclickProvider() {
    return hyperclickProvider_1.getHyperclickProvider(exports.clientResolver);
}
exports.hyperclickProvider = hyperclickProvider;
function getProjectConfigPath(sourcePath) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const client = yield exports.clientResolver.get(sourcePath);
        const result = yield client.executeProjectInfo({
            needFileNameList: false,
            file: sourcePath,
        });
        return result.body.configFileName;
    });
}
function loadProjectConfig(sourcePath, configFile) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return tsconfig.readFile(configFile || (yield getProjectConfigPath(sourcePath)));
    });
}
exports.loadProjectConfig = loadProjectConfig;
// Get Typescript buffer for the given path
function getTypescriptBuffer(filePath) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const pane = panes.find(p => p.filePath === filePath);
        if (pane) {
            return {
                buffer: pane.buffer,
                isOpen: true,
            };
        }
        // Wait for the buffer to load before resolving the promise
        const buffer = yield Atom.TextBuffer.load(filePath);
        return {
            buffer: new typescriptBuffer_1.TypescriptBuffer(buffer, fp => exports.clientResolver.get(fp)),
            isOpen: false,
        };
    });
}
//# sourceMappingURL=atomts.js.map