"use strict";
const tslib_1 = require("tslib");
// import {getFileStatus} from "./atom/fileStatusCache"
// import {$} from "atom-space-pen-views"
// import * as atomUtils from './atom/utils'
// import * as fs from 'fs'
// import * as path from 'path'
const Atom = require("atom");
const atomConfig = require("./atom/atomConfig");
const hyperclickProvider = require("../hyperclickProvider");
const tsconfig = require("tsconfig/dist/tsconfig");
const renameView_1 = require("./atom/views/renameView");
const autoCompleteProvider_1 = require("./atom/autoCompleteProvider");
const clientResolver_1 = require("../client/clientResolver");
const atom_1 = require("atom");
const lodash_1 = require("lodash");
const errorPusher_1 = require("./errorPusher");
const lodash_2 = require("lodash");
const statusPanel_1 = require("./atom/components/statusPanel");
const typescriptEditorPane_1 = require("./typescriptEditorPane");
// globals
const subscriptions = new atom_1.CompositeDisposable();
exports.clientResolver = new clientResolver_1.ClientResolver();
exports.config = atomConfig.schema;
// Register all custom components
require("./atom/components");
const commands_1 = require("./atom/commands");
let linter;
let statusBar;
function activate(state) {
    require('atom-package-deps').install('atom-typescript').then(() => {
        let statusPriority = 100;
        for (const panel of statusBar.getRightTiles()) {
            if (panel.getItem().tagName === "GRAMMAR-SELECTOR-STATUS") {
                statusPriority = panel.getPriority() - 1;
            }
        }
        // Add the rename view
        const { renameView } = renameView_1.attach();
        const statusPanel = statusPanel_1.StatusPanel.create();
        statusBar.addRightTile({
            item: statusPanel,
            priority: statusPriority
        });
        subscriptions.add(statusPanel);
        const errorPusher = new errorPusher_1.ErrorPusher();
        exports.clientResolver.on("pendingRequestsChange", () => {
            const pending = lodash_2.flatten(lodash_2.values(exports.clientResolver.clients).map(cl => cl.pending));
            statusPanel.setPending(pending);
        });
        if (linter) {
            errorPusher.setLinter(linter);
            exports.clientResolver.on("diagnostics", ({ type, filePath, diagnostics }) => {
                errorPusher.setErrors(type, filePath, diagnostics);
            });
        }
        // Register the commands
        commands_1.registerCommands({
            clearErrors() {
                errorPusher.clear();
            },
            getBuffer(filePath) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const pane = panes.find(pane => pane.filePath === filePath);
                    if (pane) {
                        return {
                            buffer: pane.editor.buffer,
                            isOpen: true
                        };
                    }
                    // Wait for the buffer to load before resolving the promise
                    const buffer = yield new Promise(resolve => {
                        const buffer = new Atom.TextBuffer({
                            filePath,
                            load: true
                        });
                        buffer.onDidReload(() => {
                            resolve(buffer);
                        });
                    });
                    return {
                        buffer,
                        isOpen: false
                    };
                });
            },
            getClient(filePath) {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const pane = panes.find(pane => pane.filePath === filePath);
                    if (pane) {
                        return pane.client;
                    }
                    return exports.clientResolver.get(filePath);
                });
            },
            renameView,
            statusPanel,
        });
        let activePane;
        const panes = [];
        const onSave = lodash_1.debounce((pane) => {
            console.log("checking errors for all panes for", pane.filePath);
            const files = panes
                .sort((a, b) => a.activeAt - b.activeAt)
                .filter(_pane => _pane.filePath && _pane.isTypescript && _pane.client === pane.client)
                .map(pane => pane.filePath);
            pane.client.executeGetErr({ files, delay: 100 });
        }, 50);
        subscriptions.add(atom.workspace.observeTextEditors((editor) => {
            panes.push(new typescriptEditorPane_1.TypescriptEditorPane(editor, {
                getClient: (filePath) => exports.clientResolver.get(filePath),
                onDispose(pane) {
                    if (activePane === pane) {
                        activePane = undefined;
                    }
                    panes.splice(panes.indexOf(pane), 1);
                    // Clear errors if any from this pane
                    errorPusher.setErrors("syntaxDiag", pane.filePath, []);
                    errorPusher.setErrors("semanticDiag", pane.filePath, []);
                },
                onSave,
                statusPanel,
            }));
        }));
        panes.find(pane => pane.editor === atom.workspace.getActiveTextEditor());
        if (activePane) {
            activePane.onActivated();
        }
        subscriptions.add(atom.workspace.onDidChangeActivePaneItem((editor) => {
            if (activePane) {
                activePane.onDeactivated();
                activePane = undefined;
            }
            if (atom.workspace.isTextEditor(editor)) {
                const pane = panes.find(pane => pane.editor === editor);
                if (pane) {
                    activePane = pane;
                    pane.onActivated();
                }
            }
        }));
    });
}
exports.activate = activate;
function deactivate() {
    subscriptions.dispose();
}
exports.deactivate = deactivate;
function serialize() {
    return {};
}
exports.serialize = serialize;
function consumeLinter(registry) {
    console.log("consume linter");
    linter = registry.register({
        name: ""
    });
    console.log("linter is", linter);
}
exports.consumeLinter = consumeLinter;
function consumeStatusBar(_statusBar) {
    statusBar = _statusBar;
}
exports.consumeStatusBar = consumeStatusBar;
// Registering an autocomplete provider
function provide() {
    return [
        new autoCompleteProvider_1.AutocompleteProvider(exports.clientResolver),
    ];
}
exports.provide = provide;
function getHyperclickProvider() {
    return hyperclickProvider;
}
exports.getHyperclickProvider = getHyperclickProvider;
function loadProjectConfig(sourcePath) {
    return exports.clientResolver.get(sourcePath).then(client => {
        return client.executeProjectInfo({ needFileNameList: false, file: sourcePath }).then(result => {
            return tsconfig.load(result.body.configFileName);
        });
    });
}
exports.loadProjectConfig = loadProjectConfig;
