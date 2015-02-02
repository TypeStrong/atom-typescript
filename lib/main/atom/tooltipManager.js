var programManager = require('../lang/programManager');
var atomUtils = require('./atomUtils');
var path = require('path');
var fs = require('fs');
var ts = require('typescript');
var emissary = require('emissary');
var Subscriber = emissary.Subscriber;
var TooltipView = require('views/tooltip');
function attach(editorView) {
    var editor = editorView.editor;
    var filePath = editor.getPath();
    var filename = path.basename(filePath);
    var ext = path.extname(filename);
    if (ext !== '.ts')
        return;
    if (!fs.existsSync(filePath)) {
        return;
    }
    var program = programManager.getOrCreateProgram(filePath);
    var scroll = editorView.find('.scroll-view');
    var subscriber = new Subscriber();
    var exprTypeTimeout = null;
    var exprTypeTooltip = null;
    subscriber.subscribe(scroll, 'mousemove', function (e) {
        clearExprTypeTimeout();
        exprTypeTimeout = setTimeout(function () { return showExpressionType(e); }, 100);
    });
    subscriber.subscribe(scroll, 'mouseout', function (e) { return clearExprTypeTimeout(); });
    subscriber.subscribe(editorView, 'editor:will-be-removed', function () { return deactivate(); });
    function showExpressionType(e) {
        if (exprTypeTooltip)
            return;
        var pixelPt = pixelPositionFromMouseEvent(editorView, e);
        var screenPt = editor.screenPositionForPixelPosition(pixelPt);
        var bufferPt = editor.bufferPositionForScreenPosition(screenPt);
        var curCharPixelPt = editor.pixelPositionForBufferPosition([bufferPt.row, bufferPt.column]);
        var nextCharPixelPt = editor.pixelPositionForBufferPosition([bufferPt.row, bufferPt.column + 1]);
        if (curCharPixelPt.left >= nextCharPixelPt.left)
            return;
        var offset = editorView.lineHeight * 0.7;
        var tooltipRect = {
            left: e.clientX,
            right: e.clientX,
            top: e.clientY - offset,
            bottom: e.clientY + offset
        };
        exprTypeTooltip = new TooltipView(tooltipRect);
        var position = atomUtils.getEditorPositionForBufferPosition(editor, bufferPt);
        var info = program.languageService.getQuickInfoAtPosition(filePath, position);
        if (!info) {
            hideExpressionType();
        }
        else {
            var displayName = ts.displayPartsToString(info.displayParts || []);
            var documentation = ts.displayPartsToString(info.documentation || []);
            var message = "<b>" + displayName + "</b>";
            if (documentation)
                message = message + ("<br/><i>" + documentation + "</i>");
            exprTypeTooltip.updateText(message);
        }
    }
    function deactivate() {
        subscriber.unsubscribe();
        clearExprTypeTimeout();
    }
    function clearExprTypeTimeout() {
        if (exprTypeTimeout) {
            clearTimeout(exprTypeTimeout);
            exprTypeTimeout = null;
        }
        hideExpressionType();
    }
    function hideExpressionType() {
        if (!exprTypeTooltip)
            return;
        exprTypeTooltip.remove();
        exprTypeTooltip = null;
    }
}
exports.attach = attach;
function pixelPositionFromMouseEvent(editorView, event) {
    var clientX = event.clientX, clientY = event.clientY;
    var linesClientRect = editorView.find('.lines')[0].getBoundingClientRect();
    var top = clientY - linesClientRect.top;
    var left = clientX - linesClientRect.left;
    return { top: top, left: left };
}
function screenPositionFromMouseEvent(editorView, event) {
    return editorView.getModel().screenPositionForPixelPosition(pixelPositionFromMouseEvent(editorView, event));
}
