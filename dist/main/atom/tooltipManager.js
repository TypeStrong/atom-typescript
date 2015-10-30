var atomUtils = require('./atomUtils');
var parent = require('../../worker/parent');
var path = require('path');
var fs = require('fs');
var emissary = require('emissary');
var Subscriber = emissary.Subscriber;
var tooltipView = require('./views/tooltipView');
var TooltipView = tooltipView.TooltipView;
var atom_space_pen_views_1 = require("atom-space-pen-views");
var escape = require('escape-html');
function getFromShadowDom(element, selector) {
    var el = element[0];
    var found = el.rootElement.querySelectorAll(selector);
    return atom_space_pen_views_1.$(found[0]);
}
exports.getFromShadowDom = getFromShadowDom;
function attach(editorView, editor) {
    var rawView = editorView[0];
    var filePath = editor.getPath();
    var filename = path.basename(filePath);
    var ext = path.extname(filename);
    if (!atomUtils.isAllowedExtension(ext))
        return;
    if (!fs.existsSync(filePath)) {
        return;
    }
    var scroll = getFromShadowDom(editorView, '.scroll-view');
    var subscriber = new Subscriber();
    var exprTypeTimeout = null;
    var exprTypeTooltip = null;
    var lastExprTypeBufferPt;
    subscriber.subscribe(scroll, 'mousemove', function (e) {
        var pixelPt = pixelPositionFromMouseEvent(editorView, e);
        var screenPt = editor.screenPositionForPixelPosition(pixelPt);
        var bufferPt = editor.bufferPositionForScreenPosition(screenPt);
        if (lastExprTypeBufferPt && lastExprTypeBufferPt.isEqual(bufferPt) && exprTypeTooltip)
            return;
        lastExprTypeBufferPt = bufferPt;
        clearExprTypeTimeout();
        exprTypeTimeout = setTimeout(function () { return showExpressionType(e); }, 100);
    });
    subscriber.subscribe(scroll, 'mouseout', function (e) { return clearExprTypeTimeout(); });
    subscriber.subscribe(scroll, 'keydown', function (e) { return clearExprTypeTimeout(); });
    editor.onDidDestroy(function () { return deactivate(); });
    function showExpressionType(e) {
        if (exprTypeTooltip)
            return;
        var pixelPt = pixelPositionFromMouseEvent(editorView, e);
        pixelPt.top += editor.displayBuffer.getScrollTop();
        pixelPt.left += editor.displayBuffer.getScrollLeft();
        var screenPt = editor.screenPositionForPixelPosition(pixelPt);
        var bufferPt = editor.bufferPositionForScreenPosition(screenPt);
        var curCharPixelPt = rawView.pixelPositionForBufferPosition([bufferPt.row, bufferPt.column]);
        var nextCharPixelPt = rawView.pixelPositionForBufferPosition([bufferPt.row, bufferPt.column + 1]);
        if (curCharPixelPt.left >= nextCharPixelPt.left)
            return;
        var offset = editor.getLineHeightInPixels() * 0.7;
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
                var message = "<b>" + escape(resp.name) + "</b>";
                if (resp.comment) {
                    message = message + ("<br/><i>" + escape(resp.comment).replace(/(?:\r\n|\r|\n)/g, '<br />') + "</i>");
                }
                if (exprTypeTooltip) {
                    exprTypeTooltip.updateText(message);
                }
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
        exprTypeTooltip.$.remove();
        exprTypeTooltip = null;
    }
}
exports.attach = attach;
function pixelPositionFromMouseEvent(editorView, event) {
    var clientX = event.clientX, clientY = event.clientY;
    var linesClientRect = getFromShadowDom(editorView, '.lines')[0].getBoundingClientRect();
    var top = clientY - linesClientRect.top;
    var left = clientX - linesClientRect.left;
    return { top: top, left: left };
}
function screenPositionFromMouseEvent(editorView, event) {
    return editorView.getModel().screenPositionForPixelPosition(pixelPositionFromMouseEvent(editorView, event));
}
