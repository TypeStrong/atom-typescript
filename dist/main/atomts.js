"use strict";
const tslib_1 = require("tslib");
console.log("be initializing them package");
console.profile("atomts init");
const startTime = process.hrtime();
const atom_space_pen_views_1 = require("atom-space-pen-views");
const lodash_1 = require("lodash");
const clientResolver_1 = require("../client/clientResolver");
const fileStatusCache_1 = require("./atom/fileStatusCache");
const atomConfig = require("./atom/atomConfig");
const atomUtils = require("./atom/atomUtils");
const autoCompleteProvider = require("./atom/autoCompleteProvider");
const commands = require("./atom/commands/commands");
const fs = require("fs");
const hyperclickProvider = require("../hyperclickProvider");
const mainPanel = require("../main/atom/views/mainPanelView");
const mainPanelView = require("./atom/views/mainPanelView");
const path = require("path");
const renameView = require("./atom/views/renameView");
const tooltipManager = require("./atom/tooltipManager");
const tsconfig = require("tsconfig/dist/tsconfig");
const tsUtil_1 = require("./utils/tsUtil");
const error_pusher_1 = require("./error_pusher");
exports.clientResolver = new clientResolver_1.ClientResolver();
exports.config = atomConfig.schema;
let linter;
let errorPusher;
let statusBarMessage;
let editorWatch;
let autoCompleteWatch;
exports.clientResolver.on("pendingRequestsChange", () => {
    if (!mainPanel.panelView)
        return;
    const pending = Object.keys(exports.clientResolver.clients)
        .map(serverPath => exports.clientResolver.clients[serverPath].pending);
    mainPanel.panelView.updatePendingRequests([].concat.apply([], pending));
});
var hideIfNotActiveOnStart = lodash_1.debounce(() => {
    var editor = atom.workspace.getActiveTextEditor();
    if (!atomUtils.onDiskAndTsRelated(editor)) {
        mainPanelView.hide();
    }
}, 100);
function activate(state) {
    console.log("activating them package", state);
    require('atom-package-deps').install('atom-typescript').then(() => {
        if (linter) {
            errorPusher = new error_pusher_1.ErrorPusher(linter);
            exports.clientResolver.on("diagnostics", ({ type, serverPath, filePath, diagnostics }) => {
                errorPusher.addErrors(type + serverPath, filePath, diagnostics);
            });
        }
        mainPanelView.attach();
        renameView.attach();
        atom.workspace.onDidChangeActivePaneItem((editor) => {
            console.log("did change active panel", editor);
            if (atomUtils.onDiskAndTs(editor)) {
                var filePath = editor.getPath();
                updatePanelConfig(filePath);
                mainPanelView.panelView.updateFileStatus(filePath);
                mainPanelView.show();
            }
            else if (atomUtils.onDiskAndTsRelated(editor)) {
                mainPanelView.show();
            }
            else {
                mainPanelView.hide();
            }
        });
        editorWatch = atom.workspace.observeTextEditors(function (editor) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                let filePath = editor.getPath();
                console.log("opened editor", filePath);
                let client = yield exports.clientResolver.get(filePath);
                console.log("found client for editor", { filePath, client });
                var editorView = atom_space_pen_views_1.$(atom.views.getView(editor));
                tooltipManager.attach(editorView, editor);
                var ext = path.extname(filePath);
                if (atomUtils.isAllowedExtension(ext)) {
                    try {
                        client.executeOpen({
                            file: filePath,
                            fileContent: editor.getText()
                        });
                        updatePanelConfig(filePath);
                        var onDisk = false;
                        if (fs.existsSync(filePath)) {
                            onDisk = true;
                        }
                        hideIfNotActiveOnStart();
                        if (onDisk) {
                            client.executeGetErr({ files: [filePath], delay: 100 });
                        }
                        const markers = [];
                        editor.onDidChangeCursorPosition(() => {
                            for (const marker of markers) {
                                marker.destroy();
                            }
                            const pos = editor.getLastCursor().getBufferPosition();
                            client.executeOccurances({
                                file: filePath,
                                line: pos.row + 1,
                                offset: pos.column + 1
                            }).then(result => {
                                for (const ref of result.body) {
                                    const marker = editor.markBufferRange(tsUtil_1.spanToRange(ref));
                                    editor.decorateMarker(marker, {
                                        type: "highlight",
                                        class: "atom-typescript-occurrence"
                                    });
                                    markers.push(marker);
                                }
                            }).catch(() => null);
                        });
                        var changeObserver = editor.onDidStopChanging(() => {
                            if (editor === atom.workspace.getActiveTextEditor()) {
                                let status = fileStatusCache_1.getFileStatus(filePath);
                                status.modified = editor.isModified();
                                mainPanelView.panelView.updateFileStatus(filePath);
                            }
                            if (!onDisk) {
                                console.log("file is not on disk..");
                                return;
                            }
                            client.executeGetErr({ files: [filePath], delay: 100 });
                        });
                        var fasterChangeObserver = editor.buffer.onDidChange((diff) => {
                            client.executeChange({
                                endLine: diff.oldRange.end.row + 1,
                                endOffset: diff.oldRange.end.column + 1,
                                file: editor.getPath(),
                                line: diff.oldRange.start.row + 1,
                                offset: diff.oldRange.start.column + 1,
                                insertString: diff.newText,
                            });
                        });
                        var saveObserver = editor.onDidSave(function (event) {
                            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                                console.log("saved", editor.getPath());
                                onDisk = true;
                                if (filePath !== event.path) {
                                    console.log("file path changed to", event.path);
                                    client = yield exports.clientResolver.get(event.path);
                                }
                                filePath = event.path;
                            });
                        });
                        var destroyObserver = editor.onDidDestroy(() => {
                            client.executeClose({ file: editor.getPath() });
                            changeObserver.dispose();
                            fasterChangeObserver.dispose();
                            saveObserver.dispose();
                            destroyObserver.dispose();
                        });
                    }
                    catch (ex) {
                        console.error('Solve this in atom-typescript', ex);
                        throw ex;
                    }
                }
            });
        });
        commands.registerCommands();
    });
}
exports.activate = activate;
function updatePanelConfig(filePath) {
    exports.clientResolver.get(filePath).then(client => {
        client.executeProjectInfo({
            needFileNameList: false,
            file: filePath
        }).then(result => {
            mainPanelView.panelView.setTsconfigInUse(result.body.configFileName);
        }, err => {
            mainPanelView.panelView.setTsconfigInUse('');
        });
    });
}
function deactivate() {
    if (statusBarMessage)
        statusBarMessage.destroy();
    if (editorWatch)
        editorWatch.dispose();
    if (autoCompleteWatch)
        autoCompleteWatch.dispose();
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
