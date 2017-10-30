"use strict";
// Inspiration : https://atom.io/packages/ide-haskell
// and https://atom.io/packages/ide-flow
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const atomUtils = require("./utils");
const atomts_1 = require("../atomts");
const path = require("path");
const fs = require("fs");
const emissary = require("emissary");
const Subscriber = emissary.Subscriber;
const tooltipView = require("./views/tooltipView");
var TooltipView = tooltipView.TooltipView;
const atom_space_pen_views_1 = require("atom-space-pen-views");
const escape = require("escape-html");
function getFromShadowDom(element, selector) {
    const el = element[0];
    const found = el.querySelectorAll(selector);
    return atom_space_pen_views_1.$(found[0]);
}
exports.getFromShadowDom = getFromShadowDom;
// screen position from mouse event -- with <3 from Atom-Haskell
function bufferPositionFromMouseEvent(editor, event) {
    const sp = atom.views.getView(editor).component.screenPositionForMouseEvent(event);
    if (isNaN(sp.row) || isNaN(sp.column)) {
        return;
    }
    return editor.bufferPositionForScreenPosition(sp);
}
exports.bufferPositionFromMouseEvent = bufferPositionFromMouseEvent;
function attach(editorView, editor) {
    const rawView = editorView[0];
    // Only on ".ts" files
    const filePath = editor.getPath();
    if (!filePath) {
        return;
    }
    const filename = path.basename(filePath);
    const ext = path.extname(filename);
    if (!atomUtils.isAllowedExtension(ext)) {
        return;
    }
    // We only create a "program" once the file is persisted to disk
    if (!fs.existsSync(filePath)) {
        return;
    }
    const clientPromise = atomts_1.clientResolver.get(filePath);
    const scroll = getFromShadowDom(editorView, ".scroll-view");
    const subscriber = new Subscriber();
    let exprTypeTimeout;
    let exprTypeTooltip;
    // to debounce mousemove event's firing for some reason on some machines
    let lastExprTypeBufferPt;
    subscriber.subscribe(scroll, "mousemove", (e) => {
        const bufferPt = bufferPositionFromMouseEvent(editor, e);
        if (lastExprTypeBufferPt && lastExprTypeBufferPt.isEqual(bufferPt) && exprTypeTooltip) {
            return;
        }
        lastExprTypeBufferPt = bufferPt;
        clearExprTypeTimeout();
        exprTypeTimeout = setTimeout(() => showExpressionType(e), 100);
    });
    subscriber.subscribe(scroll, "mouseout", () => clearExprTypeTimeout());
    subscriber.subscribe(scroll, "keydown", () => clearExprTypeTimeout());
    // Setup for clearing
    editor.onDidDestroy(() => deactivate());
    function showExpressionType(e) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // If we are already showing we should wait for that to clear
            if (exprTypeTooltip) {
                return;
            }
            const bufferPt = bufferPositionFromMouseEvent(editor, e);
            const curCharPixelPt = rawView.pixelPositionForBufferPosition([bufferPt.row, bufferPt.column]);
            const nextCharPixelPt = rawView.pixelPositionForBufferPosition([
                bufferPt.row,
                bufferPt.column + 1,
            ]);
            if (curCharPixelPt.left >= nextCharPixelPt.left) {
                return;
            }
            // find out show position
            const offset = editor.getLineHeightInPixels() * 0.7;
            const tooltipRect = {
                left: e.clientX,
                right: e.clientX,
                top: e.clientY - offset,
                bottom: e.clientY + offset,
            };
            exprTypeTooltip = new TooltipView(tooltipRect);
            let result;
            const client = yield clientPromise;
            try {
                if (!filePath) {
                    return;
                }
                result = yield client.executeQuickInfo({
                    file: filePath,
                    line: bufferPt.row + 1,
                    offset: bufferPt.column + 1,
                });
            }
            catch (e) {
                return;
            }
            const { displayString, documentation } = result.body;
            let message = `<b>${escape(displayString)}</b>`;
            if (documentation) {
                message =
                    message + `<br/><i>${escape(documentation).replace(/(?:\r\n|\r|\n)/g, "<br />")}</i>`;
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
        if (!exprTypeTooltip) {
            return;
        }
        exprTypeTooltip.$.remove();
        exprTypeTooltip = undefined;
    }
}
exports.attach = attach;
function pixelPositionFromMouseEvent(editorView, event) {
    const clientX = event.clientX;
    const clientY = event.clientY;
    const linesClientRect = getFromShadowDom(editorView, ".lines")[0].getBoundingClientRect();
    const top = clientY - linesClientRect.top;
    const left = clientX - linesClientRect.left;
    return { top, left };
}
//# sourceMappingURL=tooltipManager.js.map