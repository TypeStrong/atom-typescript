// import atomUtils = require("../atomUtils");
// import path = require('path');
// import renameView = require("../views/renameView");
// import fileSymbolsView = require("../views/fileSymbolsView");
// import projectSymbolsView = require("../views/projectSymbolsView");
// import {create as createTypeOverlay} from "../views/typeOverlayView";
// import gotoHistory = require("../gotoHistory");
// import utils = require("../../lang/utils");
// import {simpleSelectionView} from "../views/simpleSelectionView";
// import escapeHtml = require('escape-html');

// Load all the web components
// export * from "../components/componentRegistry";

import {commands, Dependencies} from "./registry"

// Import all of the command files for their side effects
import "./build"
import "./checkAllFiles"
import "./clearErrors"
import "./findReferences"
import "./goToDeclaration"
import "./renameRefactor"

export function registerCommands(deps: Dependencies) {

  for (const [name, command] of commands) {
    atom.commands.add("atom-workspace", name, command(deps))
  }

    // Setup custom commands NOTE: these need to be added to the keymaps
    // atom.commands.add('atom-text-editor', 'typescript:format-code', (e) => {
    //     if (!atomUtils.commandForTypeScript(e)) return;

    //     var editor = atom.workspace.getActiveTextEditor();
    //     var filePath = editor.getPath();
    //     var selection = editor.getSelectedBufferRange();
    //     if (selection.isEmpty()) {
    //         parent.formatDocument({ filePath: filePath }).then((result) => {
    //             if (!result.edits.length) return;
    //             editor.transact(() => {
    //                 atomUtils.formatCode(editor, result.edits);
    //             });
    //         });
    //     } else {
    //         parent.formatDocumentRange({ filePath: filePath, start: { line: selection.start.row, col: selection.start.column }, end: { line: selection.end.row, col: selection.end.column } }).then((result) => {
    //             if (!result.edits.length) return;
    //             editor.transact(() => {
    //                 atomUtils.formatCode(editor, result.edits);
    //             });
    //         });

    //     }
    // });

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

    atom.commands.add('atom-workspace', 'typescript:sync', (e) => {
        console.log("typescript:sync trigerred")

        // if (!atomUtils.commandForTypeScript(e)) return;
        // panelView.softReset();
    });

}
