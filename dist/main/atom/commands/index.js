// import atomUtils = require("../utils");
// import path = require('path');
// import renameView = require("../views/renameView");
// import fileSymbolsView = require("../views/fileSymbolsView");
// import projectSymbolsView = require("../views/projectSymbolsView");
// import {create as createTypeOverlay} from "../views/typeOverlayView";
// import gotoHistory = require("../gotoHistory");
// import utils = require("../../lang/utils");
// import {simpleSelectionView} from "../views/simpleSelectionView";
// import escapeHtml = require('escape-html');
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Load all the web components
// export * from "../components/componentRegistry";
const registry_1 = require("./registry");
// Import all of the command files for their side effects
require("./build");
require("./checkAllFiles");
require("./clearErrors");
require("./formatCode");
require("./findReferences");
require("./goToDeclaration");
require("./renameRefactor");
function registerCommands(deps) {
    for (const [name, command] of registry_1.commands) {
        atom.commands.add("atom-workspace", name, command(deps));
    }
    // atom.commands.add('atom-workspace', 'typescript:create-tsconfig.json-project-file', (e) => {
    //     if (!atomUtils.commandForTypeScript(e)) return;
    //     var editor = atom.workspace.getActiveTextEditor();
    //     var filePath = editor.getPath();
    //     parent.createProject({ filePath }).then((res) => {
    //         if (res.createdFilePath) {
    //             atom.notifications.addSuccess(`tsconfig.json file created: <br/> ${res.createdFilePath}`);
    //         }
    //     });
    // });
    // atom.commands.add('atom-workspace', 'typescript:show-type', (e) => {
    //   var editor = atom.workspace.getActiveTextEditor();
    //   var editorView = atom.views.getView(editor);
    //   var cursor = editor.getLastCursor()
    //   var position = cursor.getBufferPosition()
    //   var filePath = editor.getPath();
    //
    //   clientResolver.get(filePath).then(client => {
    //     return client.executeQuickInfo({
    //         file: filePath,
    //         line: position.row+1,
    //         offset: position.column+1
    //     }).then(({body: {displayString, documentation}}) => {
    //         var decoration = editor.decorateMarker(cursor.getMarker(), {
    //           type: 'overlay',
    //           item: createTypeOverlay(displayString, documentation)
    //         });
    //
    //         var onKeydown = (e) => {
    //           if (e.keyCode == 27) { // esc
    //             destroyTypeOverlay();
    //           }
    //         };
    //         var destroyTypeOverlay = () => {
    //           decoration.destroy();
    //           cursorListener.dispose();
    //           editorView.removeEventListener('blur', destroyTypeOverlay);
    //           editorView.removeEventListener('keydown', onKeydown);
    //         };
    //
    //         var cursorListener = editor.onDidChangeCursorPosition(destroyTypeOverlay);
    //         editorView.addEventListener('blur', destroyTypeOverlay);
    //         editorView.addEventListener('keydown', onKeydown);
    //     }).catch(() => { /* ignore errors */ })
    //   })
    // });
    //
    // atom.commands.add('atom-workspace', 'typescript:go-to-next', (e) => {
    //     gotoHistory.gotoNext();
    // });
    // atom.commands.add('atom-workspace', 'typescript:go-to-previous', (e) => {
    //     gotoHistory.gotoPrevious();
    // });
    // I've needed to debounce this as it gets called multiple times for some reason
    // Has to do with how we override toggle-file-symbols
    // var theFileSymbolsView: fileSymbolsView.FileSymbolsView;
    // var showFileSymbols = utils.debounce((filePath: string) => {
    //     if (!theFileSymbolsView) theFileSymbolsView = new fileSymbolsView.FileSymbolsView();
    //     parent.getNavigationBarItems({ filePath }).then((res) => {
    //         theFileSymbolsView.setNavBarItems(res.items, filePath);
    //         theFileSymbolsView.show();
    //     });
    // }, 400);
    // We support symbols view as well
    // atom.commands.add('atom-text-editor', 'symbols-view:toggle-file-symbols', (e) => {
    //     var editor = atom.workspace.getActiveTextEditor();
    //     if (!editor) return false;
    //     if (path.extname(editor.getPath()) !== '.ts' && path.extname(editor.getPath()) !== '.tsx') return false;
    //     // Abort it for others
    //     e.abortKeyBinding();
    //     var filePath = editor.getPath();
    //     showFileSymbols(filePath);
    // });
    // We support project level symbols
    // var theProjectSymbolsView: projectSymbolsView.ProjectSymbolsView;
    // var showProjectSymbols = utils.debounce((filePath: string) => {
    //     if (!theProjectSymbolsView) theProjectSymbolsView = new projectSymbolsView.ProjectSymbolsView();
    //     parent.getNavigateToItems({ filePath }).then((res) => {
    //         theProjectSymbolsView.setNavBarItems(res.items);
    //         theProjectSymbolsView.show();
    //     });
    // }, 400);
}
exports.registerCommands = registerCommands;
