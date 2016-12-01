"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var parent = require("../../../worker/parent");
var atomUtils = require("../atomUtils");
var autoCompleteProvider = require("../autoCompleteProvider");
var contextView = require("../views/contextView");
var typeOverlayView_1 = require("../views/typeOverlayView");
var gotoHistory = require("../gotoHistory");
var mainPanelView_1 = require("../views/mainPanelView");
__export(require("../components/componentRegistry"));
function registerCommands() {
    var theContextView;
    atom.commands.add('atom-text-editor', 'typescript:context-actions', function (e) {
        if (!theContextView)
            theContextView = new contextView.ContextView();
        theContextView.show();
    });
    atom.commands.add('atom-text-editor', 'typescript:autocomplete', function (e) {
        autoCompleteProvider.triggerAutocompletePlus();
    });
    atom.commands.add('atom-workspace', 'typescript:show-type', function (e) {
        var editor = atom.workspace.getActiveTextEditor();
        var editorView = atom.views.getView(editor);
        var cursor = editor.getLastCursor();
        var position = cursor.getBufferPosition();
        var filePath = editor.getPath();
        parent.clients.get(filePath).then(function (client) {
            return client.executeQuickInfo({
                file: filePath,
                line: position.row + 1,
                offset: position.column + 1
            }).then(function (_a) {
                var _b = _a.body, displayString = _b.displayString, documentation = _b.documentation;
                var decoration = editor.decorateMarker(cursor.getMarker(), {
                    type: 'overlay',
                    item: typeOverlayView_1.create(displayString, documentation)
                });
                var onKeydown = function (e) {
                    if (e.keyCode == 27) {
                        destroyTypeOverlay();
                    }
                };
                var destroyTypeOverlay = function () {
                    decoration.destroy();
                    cursorListener.dispose();
                    editorView.removeEventListener('blur', destroyTypeOverlay);
                    editorView.removeEventListener('keydown', onKeydown);
                };
                var cursorListener = editor.onDidChangeCursorPosition(destroyTypeOverlay);
                editorView.addEventListener('blur', destroyTypeOverlay);
                editorView.addEventListener('keydown', onKeydown);
            }).catch(function () { });
        });
    });
    atom.commands.add('atom-workspace', 'typescript:go-to-next', function (e) {
        gotoHistory.gotoNext();
    });
    atom.commands.add('atom-workspace', 'typescript:go-to-previous', function (e) {
        gotoHistory.gotoPrevious();
    });
    atom.commands.add('atom-workspace', 'typescript:sync', function (e) {
        if (!atomUtils.commandForTypeScript(e))
            return;
        mainPanelView_1.panelView.softReset();
    });
}
exports.registerCommands = registerCommands;
