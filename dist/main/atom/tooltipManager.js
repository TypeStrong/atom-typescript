// Inspiration : https://atom.io/packages/ide-haskell
// and https://atom.io/packages/ide-flow
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const atomUtils = require("./utils"); ///ts:import:generated
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
    // Only on ".ts" files
    var filePath = editor.getPath();
    if (!filePath) {
        return;
    }
    var filename = path.basename(filePath);
    var ext = path.extname(filename);
    if (!atomUtils.isAllowedExtension(ext))
        return;
    // We only create a "program" once the file is persisted to disk
    if (!fs.existsSync(filePath)) {
        return;
    }
    var clientPromise = atomts_1.clientResolver.get(filePath);
    var scroll = getFromShadowDom(editorView, '.scroll-view');
    var subscriber = new Subscriber();
    var exprTypeTimeout;
    var exprTypeTooltip;
    // to debounce mousemove event's firing for some reason on some machines
    var lastExprTypeBufferPt;
    subscriber.subscribe(scroll, 'mousemove', (e) => {
        var pixelPt = pixelPositionFromMouseEvent(editorView, e);
        var screenPt = editor.element.screenPositionForPixelPosition(pixelPt);
        var bufferPt = editor.bufferPositionForScreenPosition(screenPt);
        if (lastExprTypeBufferPt && lastExprTypeBufferPt.isEqual(bufferPt) && exprTypeTooltip)
            return;
        lastExprTypeBufferPt = bufferPt;
        clearExprTypeTimeout();
        exprTypeTimeout = setTimeout(() => showExpressionType(e), 100);
    });
    subscriber.subscribe(scroll, 'mouseout', () => clearExprTypeTimeout());
    subscriber.subscribe(scroll, 'keydown', () => clearExprTypeTimeout());
    // Setup for clearing
    editor.onDidDestroy(() => deactivate());
    function showExpressionType(e) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // If we are already showing we should wait for that to clear
            if (exprTypeTooltip)
                return;
            var pixelPt = pixelPositionFromMouseEvent(editorView, e);
            pixelPt.top += editor.element.getScrollTop();
            pixelPt.left += editor.element.getScrollLeft();
            var screenPt = editor.element.screenPositionForPixelPosition(pixelPt);
            var bufferPt = editor.bufferPositionForScreenPosition(screenPt);
            var curCharPixelPt = rawView.pixelPositionForBufferPosition([bufferPt.row, bufferPt.column]);
            var nextCharPixelPt = rawView.pixelPositionForBufferPosition([bufferPt.row, bufferPt.column + 1]);
            if (curCharPixelPt.left >= nextCharPixelPt.left)
                return;
            // find out show position
            var offset = editor.getLineHeightInPixels() * 0.7;
            var tooltipRect = {
                left: e.clientX,
                right: e.clientX,
                top: e.clientY - offset,
                bottom: e.clientY + offset
            };
            exprTypeTooltip = new TooltipView(tooltipRect);
            const client = yield clientPromise;
            const result = yield client.executeQuickInfo({
                file: filePath,
                line: bufferPt.row + 1,
                offset: bufferPt.column + 1
            }).catch(err => undefined);
            if (!result) {
                return;
            }
            const { displayString, documentation } = result.body;
            var message = `<b>${escape(displayString)}</b>`;
            if (documentation) {
                message = message + `<br/><i>${escape(documentation).replace(/(?:\r\n|\r|\n)/g, '<br />')}</i>`;
            }
            if (exprTypeTooltip) {
                exprTypeTooltip.updateText(message);
            }
        });
    }
    function deactivate() {
        subscriber.unsubscribe();
        clearExprTypeTimeout();
    }
    /** clears the timeout && the tooltip */
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
        exprTypeTooltip = undefined;
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
//# sourceMappingURL=tooltipManager.js.map