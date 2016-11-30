"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var atomConfig = require("./atom/atomConfig");
var makeTypeScriptGlobal_1 = require("../typescript/makeTypeScriptGlobal");
makeTypeScriptGlobal_1.makeTsGlobal(atomConfig.typescriptServices);
var path = require("path");
var fs = require("fs");
var mainPanelView_1 = require("./atom/views/mainPanelView");
var autoCompleteProvider = require("./atom/autoCompleteProvider");
var tooltipManager = require("./atom/tooltipManager");
var atomUtils = require("./atom/atomUtils");
var commands = require("./atom/commands/commands");
var debugAtomTs = require("./atom/debugAtomTs");
var _atom = require("atom");
var atom_space_pen_views_1 = require("atom-space-pen-views");
var documentationView = require("./atom/views/documentationView");
var renameView = require("./atom/views/renameView");
var mainPanelView = require("./atom/views/mainPanelView");
var semanticView = require("./atom/views/semanticView");
var fileStatusCache_1 = require("./atom/fileStatusCache");
var editorSetup = require("./atom/editorSetup");
var statusBar;
var statusBarMessage;
var editorWatch;
var autoCompleteWatch;
var parent = require("../worker/parent");
exports.config = atomConfig.schema;
var utils_1 = require("./lang/utils");
var hideIfNotActiveOnStart = utils_1.debounce(function () {
    var editor = atom.workspace.getActiveTextEditor();
    if (!atomUtils.onDiskAndTsRelated(editor)) {
        mainPanelView.hide();
    }
}, 100);
var __onlyOnce = false;
function onlyOnceStuff() {
    if (__onlyOnce)
        return;
    else
        __onlyOnce = true;
    mainPanelView.attach();
    documentationView.attach();
    renameView.attach();
    semanticView.attach();
}
function readyToActivate() {
    parent.startWorker();
    atom.workspace.onDidChangeActivePaneItem(function (editor) {
        if (atomUtils.onDiskAndTs(editor)) {
            var filePath = editor.getPath();
            onlyOnceStuff();
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
        return __awaiter(this, void 0, void 0, function () {
            var filePath, client, editorView, ext, unsubSyntax_1, unsubSemantic_1, isTst, onDisk, changeObserver, buffer, fasterChangeObserver, saveObserver, destroyObserver;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        filePath = editor.getPath();
                        console.log("opened editor", filePath);
                        return [4 /*yield*/, parent.clients.get(filePath)];
                    case 1:
                        client = _a.sent();
                        console.log("found client for editor", { filePath: filePath, client: client });
                        editorView = atom_space_pen_views_1.$(atom.views.getView(editor));
                        tooltipManager.attach(editorView, editor);
                        ext = path.extname(filePath);
                        if (atomUtils.isAllowedExtension(ext)) {
                            unsubSyntax_1 = client.on("syntaxDiag", function (diag) {
                            });
                            unsubSemantic_1 = client.on("semanticDiag", function (diag) {
                                if (diag.file === filePath) {
                                    console.log("semantic errors", diag);
                                    mainPanelView_1.errorView.setErrors(filePath, diag.diagnostics.map(function (error) {
                                        var preview = editor.buffer.getTextInRange(new _atom.Range([error.start.line - 1, error.start.offset - 1], [error.end.line - 1, error.end.offset - 1]));
                                        return {
                                            filePath: filePath,
                                            startPos: { line: error.start.line - 1, col: error.start.offset - 1 },
                                            endPos: { line: error.end.line - 1, col: error.end.offset - 1 },
                                            message: ts.flattenDiagnosticMessageText(error.text, '\n'),
                                            preview: preview
                                        };
                                    }));
                                }
                            });
                            isTst = ext === '.tst';
                            try {
                                onlyOnceStuff();
                                client.executeOpen({
                                    file: filePath,
                                    fileContent: editor.getText()
                                });
                                updatePanelConfig(filePath);
                                onDisk = false;
                                if (fs.existsSync(filePath)) {
                                    onDisk = true;
                                }
                                hideIfNotActiveOnStart();
                                debugAtomTs.runDebugCode({ filePath: filePath, editor: editor });
                                if (onDisk) {
                                    client.executeGetErr({ files: [filePath], delay: 100 });
                                }
                                editorSetup.setupEditor(editor);
                                changeObserver = editor.onDidStopChanging(function () {
                                    if (editor === atom.workspace.getActiveTextEditor()) {
                                        var status_1 = fileStatusCache_1.getFileStatus(filePath);
                                        status_1.modified = editor.isModified();
                                        mainPanelView.panelView.updateFileStatus(filePath);
                                    }
                                    if (!onDisk) {
                                        var root = { line: 0, col: 0 };
                                        mainPanelView_1.errorView.setErrors(filePath, [{ startPos: root, endPos: root, filePath: filePath, message: "Please save file for it be processed by TypeScript", preview: "" }]);
                                        return;
                                    }
                                    client.executeGetErr({ files: [filePath], delay: 100 });
                                });
                                buffer = editor.buffer;
                                fasterChangeObserver = editor.buffer.onDidChange(function (diff) {
                                    client.executeChange({
                                        endLine: diff.oldRange.end.row + 1,
                                        endOffset: diff.oldRange.end.column + 1,
                                        file: editor.getPath(),
                                        line: diff.oldRange.start.row + 1,
                                        offset: diff.oldRange.start.column + 1,
                                        insertString: diff.newText,
                                    });
                                });
                                saveObserver = editor.onDidSave(function (event) {
                                    console.log("saved", editor.getPath());
                                    onDisk = true;
                                    filePath = event.path;
                                });
                                destroyObserver = editor.onDidDestroy(function () {
                                    client.executeClose({ file: editor.getPath() });
                                    mainPanelView_1.errorView.setErrors(filePath, []);
                                    changeObserver.dispose();
                                    fasterChangeObserver.dispose();
                                    saveObserver.dispose();
                                    destroyObserver.dispose();
                                    unsubSemantic_1();
                                    unsubSyntax_1();
                                });
                            }
                            catch (ex) {
                                console.error('Solve this in atom-typescript', ex);
                                throw ex;
                            }
                        }
                        return [2 /*return*/];
                }
            });
        });
    });
    commands.registerCommands();
}
function updatePanelConfig(filePath) {
    parent.clients.get(filePath).then(function (client) {
        client.executeProjectInfo({
            needFileNameList: false,
            file: filePath
        }).then(function (result) {
            mainPanelView.panelView.setTsconfigInUse(result.body.configFileName);
        }, function (err) {
            mainPanelView.panelView.setTsconfigInUse('');
        });
    });
}
function activate(state) {
    require('atom-package-deps').install('atom-typescript').then(readyToActivate);
}
exports.activate = activate;
function deactivate() {
    if (statusBarMessage)
        statusBarMessage.destroy();
    if (editorWatch)
        editorWatch.dispose();
    if (autoCompleteWatch)
        autoCompleteWatch.dispose();
    parent.stopWorker();
}
exports.deactivate = deactivate;
function serialize() {
    return {};
}
exports.serialize = serialize;
function deserialize() {
}
exports.deserialize = deserialize;
function provide() {
    return [autoCompleteProvider.provider];
}
exports.provide = provide;
var linter = require("../linter");
function provideLinter() {
    return linter.provider;
}
exports.provideLinter = provideLinter;
function consumeSnippets(snippetsManager) {
    atomUtils._setSnippetsManager(snippetsManager);
}
exports.consumeSnippets = consumeSnippets;
var hyperclickProvider = require("../hyperclickProvider");
function getHyperclickProvider() {
    return hyperclickProvider;
}
exports.getHyperclickProvider = getHyperclickProvider;
