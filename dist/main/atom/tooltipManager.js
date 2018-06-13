"use strict";
// Inspiration : https://atom.io/packages/ide-haskell
// and https://atom.io/packages/ide-flow
Object.defineProperty(exports, "__esModule", { value: true });
const atomUtils = require("./utils");
const Atom = require("atom");
const fs = require("fs");
const element_listener_1 = require("./utils/element-listener");
const tooltipView_1 = require("./views/tooltipView");
const escape = require("escape-html");
const tooltipMap = new WeakMap();
// screen position from mouse event -- with <3 from Atom-Haskell
function bufferPositionFromMouseEvent(editor, event) {
    const sp = atom.views
        .getView(editor)
        .getComponent()
        .screenPositionForMouseEvent(event);
    if (isNaN(sp.row) || isNaN(sp.column)) {
        return;
    }
    return editor.bufferPositionForScreenPosition(sp);
}
async function showExpressionAt(editor, pt) {
    const ed = tooltipMap.get(editor);
    if (ed) {
        return ed.showExpressionTypeKbd(pt);
    }
}
exports.showExpressionAt = showExpressionAt;
class TooltipManager {
    constructor(editor, getClient) {
        this.editor = editor;
        this.getClient = getClient;
        this.subscriptions = new Atom.CompositeDisposable();
        this.reinitialize = () => {
            this.clientPromise = undefined;
            // Only on ".ts" files
            const filePath = this.editor.getPath();
            if (filePath === undefined)
                return;
            if (!atomUtils.isTypescriptEditorWithPath(this.editor))
                return;
            // We only create a "program" once the file is persisted to disk
            if (!fs.existsSync(filePath))
                return;
            this.clientPromise = this.getClient(filePath);
        };
        /** clears the timeout && the tooltip */
        this.clearExprTypeTimeout = () => {
            if (this.exprTypeTimeout !== undefined) {
                clearTimeout(this.exprTypeTimeout);
                this.exprTypeTimeout = undefined;
            }
            if (this.cancelShowTooltip)
                this.cancelShowTooltip();
            this.hideExpressionType();
        };
        this.trackMouseMovement = (e) => {
            const bufferPt = bufferPositionFromMouseEvent(this.editor, e);
            if (!bufferPt)
                return;
            if (this.lastExprTypeBufferPt &&
                this.lastExprTypeBufferPt.isEqual(bufferPt) &&
                TooltipManager.exprTypeTooltip) {
                return;
            }
            this.lastExprTypeBufferPt = bufferPt;
            this.clearExprTypeTimeout();
            this.exprTypeTimeout = window.setTimeout(() => this.showExpressionType(e), atom.config.get("atom-typescript.tooltipDelay"));
        };
        this.rawView = atom.views.getView(editor);
        this.lines = this.rawView.querySelector(".lines");
        tooltipMap.set(editor, this);
        this.subscriptions.add(element_listener_1.listen(this.rawView, "mousemove", ".scroll-view", this.trackMouseMovement), element_listener_1.listen(this.rawView, "mouseout", ".scroll-view", this.clearExprTypeTimeout), element_listener_1.listen(this.rawView, "keydown", ".scroll-view", this.clearExprTypeTimeout), this.rawView.onDidChangeScrollTop(this.clearExprTypeTimeout), this.rawView.onDidChangeScrollLeft(this.clearExprTypeTimeout));
        this.subscriptions.add(this.editor.onDidChangePath(this.reinitialize));
        this.reinitialize();
    }
    dispose() {
        this.subscriptions.dispose();
        this.clearExprTypeTimeout();
    }
    async showExpressionTypeKbd(pt) {
        const view = atom.views.getView(this.editor);
        const px = view.pixelPositionForBufferPosition(pt);
        return this.showExpressionType(this.mousePositionForPixelPosition(px));
    }
    mousePositionForPixelPosition(p) {
        const linesRect = this.lines.getBoundingClientRect();
        return {
            clientY: p.top + linesRect.top + this.editor.getLineHeightInPixels() / 2,
            clientX: p.left + linesRect.left,
        };
    }
    async showExpressionType(e) {
        if (!this.clientPromise)
            return;
        // If we are already showing we should wait for that to clear
        if (TooltipManager.exprTypeTooltip)
            return;
        if (this.cancelShowTooltip)
            this.cancelShowTooltip();
        let cancelled = false;
        this.cancelShowTooltip = () => {
            cancelled = true;
            this.cancelShowTooltip = undefined;
        };
        const bufferPt = bufferPositionFromMouseEvent(this.editor, e);
        if (!bufferPt)
            return;
        const curCharPixelPt = this.rawView.pixelPositionForBufferPosition(bufferPt);
        const nextCharPixelPt = this.rawView.pixelPositionForBufferPosition(bufferPt.traverse([0, 1]));
        if (curCharPixelPt.left >= nextCharPixelPt.left) {
            return;
        }
        // find out show position
        const offset = this.editor.getLineHeightInPixels() * 0.7;
        const tooltipRect = {
            left: e.clientX,
            right: e.clientX,
            top: e.clientY - offset,
            bottom: e.clientY + offset,
        };
        const msg = await this.getMessage(bufferPt);
        if (cancelled)
            return;
        if (msg !== undefined)
            this.showTooltip(tooltipRect, msg);
    }
    async getMessage(bufferPt) {
        let result;
        if (!this.clientPromise)
            return;
        const client = await this.clientPromise;
        const filePath = this.editor.getPath();
        try {
            if (filePath === undefined) {
                return;
            }
            result = await client.execute("quickinfo", {
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
        return message;
    }
    showTooltip(tooltipRect, message) {
        if (TooltipManager.exprTypeTooltip)
            return;
        TooltipManager.exprTypeTooltip = new tooltipView_1.TooltipView();
        document.body.appendChild(TooltipManager.exprTypeTooltip.element);
        TooltipManager.exprTypeTooltip.update(Object.assign({}, tooltipRect, { text: message }));
    }
    hideExpressionType() {
        if (!TooltipManager.exprTypeTooltip)
            return;
        TooltipManager.exprTypeTooltip.destroy();
        TooltipManager.exprTypeTooltip = undefined;
    }
}
exports.TooltipManager = TooltipManager;
//# sourceMappingURL=tooltipManager.js.map