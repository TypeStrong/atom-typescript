"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
const atomts_1 = require("../../atomts");
const atomUtils = require("../atomUtils");
const autoCompleteProvider = require("../autoCompleteProvider");
const contextView = require("../views/contextView");
const typeOverlayView_1 = require("../views/typeOverlayView");
const gotoHistory = require("../gotoHistory");
const mainPanelView_1 = require("../views/mainPanelView");
__export(require("../components/componentRegistry"));
function registerCommands() {
    var theContextView;
    atom.commands.add('atom-text-editor', 'typescript:context-actions', (e) => {
        if (!theContextView)
            theContextView = new contextView.ContextView();
        theContextView.show();
    });
    atom.commands.add('atom-text-editor', 'typescript:autocomplete', (e) => {
        autoCompleteProvider.triggerAutocompletePlus();
    });
    atom.commands.add('atom-workspace', 'typescript:show-type', (e) => {
        var editor = atom.workspace.getActiveTextEditor();
        var editorView = atom.views.getView(editor);
        var cursor = editor.getLastCursor();
        var position = cursor.getBufferPosition();
        var filePath = editor.getPath();
        atomts_1.clientResolver.get(filePath).then(client => {
            return client.executeQuickInfo({
                file: filePath,
                line: position.row + 1,
                offset: position.column + 1
            }).then(({ body: { displayString, documentation } }) => {
                var decoration = editor.decorateMarker(cursor.getMarker(), {
                    type: 'overlay',
                    item: typeOverlayView_1.create(displayString, documentation)
                });
                var onKeydown = (e) => {
                    if (e.keyCode == 27) {
                        destroyTypeOverlay();
                    }
                };
                var destroyTypeOverlay = () => {
                    decoration.destroy();
                    cursorListener.dispose();
                    editorView.removeEventListener('blur', destroyTypeOverlay);
                    editorView.removeEventListener('keydown', onKeydown);
                };
                var cursorListener = editor.onDidChangeCursorPosition(destroyTypeOverlay);
                editorView.addEventListener('blur', destroyTypeOverlay);
                editorView.addEventListener('keydown', onKeydown);
            }).catch(() => { });
        });
    });
    atom.commands.add('atom-workspace', 'typescript:go-to-next', (e) => {
        gotoHistory.gotoNext();
    });
    atom.commands.add('atom-workspace', 'typescript:go-to-previous', (e) => {
        gotoHistory.gotoPrevious();
    });
    atom.commands.add('atom-workspace', 'typescript:sync', (e) => {
        if (!atomUtils.commandForTypeScript(e))
            return;
        mainPanelView_1.panelView.softReset();
    });
}
exports.registerCommands = registerCommands;
