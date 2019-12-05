"use strict";
// Inspiration : https://atom.io/packages/ide-haskell
// and https://atom.io/packages/ide-flow
Object.defineProperty(exports, "__esModule", { value: true });
const Atom = require("atom");
const fs = require("fs");
const atomUtils = require("../utils");
const element_listener_1 = require("../utils/element-listener");
const controller_1 = require("./controller");
const util_1 = require("./util");
class TooltipManager {
    constructor(getClientInternal) {
        this.getClientInternal = getClientInternal;
        this.subscriptions = new Atom.CompositeDisposable();
        this.editorMap = new WeakMap();
        this.getClient = async (editor) => {
            // Only on ".ts" files
            const filePath = editor.getPath();
            if (filePath === undefined)
                return;
            if (!atomUtils.isTypescriptEditorWithPath(editor))
                return;
            // We only create a "program" once the file is persisted to disk
            if (!fs.existsSync(filePath))
                return;
            return this.getClientInternal(filePath);
        };
        /** clears the timeout && the tooltip */
        this.clearExprTypeTimeout = () => {
            if (this.exprTypeTimeout !== undefined) {
                clearTimeout(this.exprTypeTimeout);
                this.exprTypeTimeout = undefined;
            }
            this.hideExpressionType();
        };
        this.trackMouseMovement = (editor) => {
            let lastExprTypeBufferPt;
            return (e) => {
                const bufferPt = util_1.bufferPositionFromMouseEvent(editor, e);
                if (!bufferPt)
                    return;
                if (lastExprTypeBufferPt && lastExprTypeBufferPt.isEqual(bufferPt) && this.pendingTooltip) {
                    return;
                }
                lastExprTypeBufferPt = bufferPt;
                this.clearExprTypeTimeout();
                this.exprTypeTimeout = window.setTimeout(() => this.showExpressionType(editor, e, bufferPt), atom.config.get("atom-typescript").tooltipDelay);
            };
        };
        this.subscriptions.add(atom.workspace.observeTextEditors(editor => {
            const rawView = atom.views.getView(editor);
            const lines = rawView.querySelector(".lines");
            this.editorMap.set(editor, {
                rawView,
                lines,
            });
            const disp = new Atom.CompositeDisposable();
            disp.add(element_listener_1.listen(rawView, "mousemove", ".scroll-view", this.trackMouseMovement(editor)), element_listener_1.listen(rawView, "mouseout", ".scroll-view", this.clearExprTypeTimeout), element_listener_1.listen(rawView, "keydown", ".scroll-view", this.clearExprTypeTimeout), rawView.onDidChangeScrollTop(this.clearExprTypeTimeout), rawView.onDidChangeScrollLeft(this.clearExprTypeTimeout), editor.onDidDestroy(() => {
                disp.dispose();
                this.subscriptions.remove(disp);
                this.clearExprTypeTimeout();
            }));
            this.subscriptions.add(disp);
        }));
    }
    dispose() {
        this.subscriptions.dispose();
        this.clearExprTypeTimeout();
    }
    showExpressionAt(editor) {
        const pt = editor.getLastCursor().getBufferPosition();
        const view = atom.views.getView(editor);
        let px;
        try {
            px = view.pixelPositionForBufferPosition(pt);
        }
        catch (e) {
            console.warn(e);
            return;
        }
        this.showExpressionType(editor, this.mousePositionForPixelPosition(editor, px), pt);
    }
    mousePositionForPixelPosition(editor, p) {
        const rawView = atom.views.getView(editor);
        const lines = rawView.querySelector(".lines");
        const linesRect = lines.getBoundingClientRect();
        return {
            clientY: p.top + linesRect.top + editor.getLineHeightInPixels() / 2,
            clientX: p.left + linesRect.left,
        };
    }
    showExpressionType(editor, e, bufferPt) {
        if (this.pendingTooltip)
            this.pendingTooltip.dispose();
        this.pendingTooltip = new controller_1.TooltipController(this.getClient, editor, e, bufferPt);
    }
    hideExpressionType() {
        if (!this.pendingTooltip)
            return;
        this.pendingTooltip.dispose();
        this.pendingTooltip = undefined;
    }
}
exports.TooltipManager = TooltipManager;
//# sourceMappingURL=manager.js.map