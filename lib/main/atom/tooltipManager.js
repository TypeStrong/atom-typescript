var atomUtils = require('./atomUtils');
var parent = require('../../worker/parent');
var path = require('path');
var fs = require('fs');
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
        parent.quickInfo({ filePath: filePath, position: position }).then(function (resp) {
            if (!resp.valid) {
                hideExpressionType();
            }
            else {
                var message = "<b>" + resp.name + "</b>";
                if (resp.comment)
                    message = message + ("<br/><i>" + resp.comment + "</i>");
                if (exprTypeTooltip)
                    exprTypeTooltip.updateText(message);
            }
        });
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
