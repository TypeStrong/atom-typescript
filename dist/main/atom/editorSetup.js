var utils_1 = require("../lang/utils");
var parent = require("../../worker/parent");
var atomUtils = require("./atomUtils");
var transformer_1 = require("../lang/transformers/transformer");
function setupEditor(editor) {
    var quickFixDecoration = null;
    var quickFixMarker = null;
    function clearExistingQuickfixDecoration() {
        if (quickFixDecoration) {
            quickFixDecoration.destroy();
            quickFixDecoration = null;
        }
        if (quickFixMarker) {
            quickFixMarker.destroy();
            quickFixMarker = null;
        }
    }
    var queryForQuickFix = utils_1.debounce(function (filePathPosition) {
        parent.getQuickFixes(filePathPosition).then(function (res) {
            clearExistingQuickfixDecoration();
            if (res.fixes.length) {
                quickFixMarker = editor.markBufferRange(editor.getSelectedBufferRange());
                quickFixDecoration = editor.decorateMarker(quickFixMarker, { type: "line-number", class: "quickfix" });
            }
        });
    }, 500);
    var cursorObserver = editor.onDidChangeCursorPosition(function () {
        try {
            var pathPos = atomUtils.getFilePathPosition();
            if (transformer_1.isTransformerFile(pathPos.filePath)) {
                clearExistingQuickfixDecoration();
                return;
            }
            queryForQuickFix(pathPos);
        }
        catch (ex) {
            clearExistingQuickfixDecoration();
        }
    });
    var destroyObserver = editor.onDidDestroy(function () {
        cursorObserver.dispose();
        destroyObserver.dispose();
    });
}
exports.setupEditor = setupEditor;
