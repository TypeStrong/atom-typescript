"use strict";
const atomUtils = require("./atomUtils");
const atomts_1 = require("../atomts");
const path = require("path");
const fs = require("fs");
const emissary = require("emissary");
var Subscriber = emissary.Subscriber;
const tooltipView = require("./views/tooltipView");
var TooltipView = tooltipView.TooltipView;
const atom_space_pen_views_1 = require("atom-space-pen-views");
const escape = require("escape-html");
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
    var clientPromise = atomts_1.clientResolver.get(filePath);
    var scroll = getFromShadowDom(editorView, '.scroll-view');
    var subscriber = new Subscriber();
    var exprTypeTimeout = null;
    var exprTypeTooltip = null;
    var lastExprTypeBufferPt;
    subscriber.subscribe(scroll, 'mousemove', (e) => {
        var pixelPt = pixelPositionFromMouseEvent(editorView, e);
        var screenPt = editor.screenPositionForPixelPosition(pixelPt);
        var bufferPt = editor.bufferPositionForScreenPosition(screenPt);
        if (lastExprTypeBufferPt && lastExprTypeBufferPt.isEqual(bufferPt) && exprTypeTooltip)
            return;
        lastExprTypeBufferPt = bufferPt;
        clearExprTypeTimeout();
        exprTypeTimeout = setTimeout(() => showExpressionType(e), 100);
    });
    subscriber.subscribe(scroll, 'mouseout', (e) => clearExprTypeTimeout());
    subscriber.subscribe(scroll, 'keydown', (e) => clearExprTypeTimeout());
    editor.onDidDestroy(() => deactivate());
    function showExpressionType(e) {
        if (exprTypeTooltip)
            return;
        var pixelPt = pixelPositionFromMouseEvent(editorView, e);
        pixelPt.top += editor.getScrollTop();
        pixelPt.left += editor.getScrollLeft();
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
        clientPromise.then(client => {
            client.executeQuickInfo({
                file: filePath,
                line: bufferPt.row + 1,
                offset: bufferPt.column + 1
            }).then(({ body: { displayString, documentation } }) => {
                var message = `<b>${escape(displayString)}</b>`;
                if (documentation) {
                    message = message + `<br/><i>${escape(documentation).replace(/(?:\r\n|\r|\n)/g, '<br />')}</i>`;
                }
                exprTypeTooltip.updateText(message);
            }, () => { });
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
