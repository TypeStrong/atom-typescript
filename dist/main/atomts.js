"use strict";
console.log("be initializing them package");
console.profile("atomts init");
const startTime = process.hrtime();
const clientResolver_1 = require("../client/clientResolver");
const atom_1 = require("atom");
const lodash_1 = require("lodash");
const error_pusher_1 = require("./error_pusher");
const typescript_editor_pane_1 = require("./typescript_editor_pane");
const atomConfig = require("./atom/atomConfig");
const autoCompleteProvider = require("./atom/autoCompleteProvider");
const commands = require("./atom/commands/commands");
const hyperclickProvider = require("../hyperclickProvider");
const mainPanel = require("../main/atom/views/mainPanelView");
const mainPanelView = require("./atom/views/mainPanelView");
const renameView = require("./atom/views/renameView");
const tsconfig = require("tsconfig/dist/tsconfig");
exports.clientResolver = new clientResolver_1.ClientResolver();
exports.config = atomConfig.schema;
let linter;
const errorPusher = new error_pusher_1.ErrorPusher();
const subscriptions = new atom_1.CompositeDisposable();
exports.clientResolver.on("pendingRequestsChange", () => {
    if (!mainPanel.panelView)
        return;
    const pending = Object.keys(exports.clientResolver.clients)
        .map(serverPath => exports.clientResolver.clients[serverPath].pending);
    mainPanel.panelView.updatePendingRequests([].concat.apply([], pending));
});
function activate(state) {
    require('atom-package-deps').install('atom-typescript').then(() => {
        if (linter) {
            errorPusher.setLinter(linter);
            exports.clientResolver.on("diagnostics", ({ type, serverPath, filePath, diagnostics }) => {
                errorPusher.addErrors(type + serverPath, filePath, diagnostics);
            });
        }
        mainPanelView.attach();
        mainPanelView.hide();
        renameView.attach();
        commands.registerCommands();
        const panes = [];
        const checkErrors = lodash_1.debounce((pane) => {
            console.log("checking errors for all panes for", pane.filePath);
            const files = panes
                .sort((a, b) => a.activeAt - b.activeAt)
                .filter(_pane => _pane.filePath && _pane.isTypescript && _pane.client === pane.client)
                .map(pane => pane.filePath);
            pane.client.executeGetErr({ files, delay: 100 });
        }, 50);
        subscriptions.add(atom.workspace.observeTextEditors((editor) => {
            panes.push(new typescript_editor_pane_1.TypescriptEditorPane(editor, {
                checkErrors
            }));
        }));
        let activePane = panes.find(pane => pane.editor === atom.workspace.getActiveTextEditor());
        if (activePane) {
            activePane.onActivated();
        }
        subscriptions.add(atom.workspace.onDidChangeActivePaneItem((editor) => {
            if (activePane) {
                activePane.onDeactivated();
                activePane = null;
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
function provide() {
    return [autoCompleteProvider.provider];
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
console.profileEnd();
console.log("init took", process.hrtime(startTime));
