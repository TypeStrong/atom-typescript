"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Atom = require("atom");
const lodash_1 = require("lodash");
const utils_1 = require("../../../utils");
const utils_2 = require("../utils");
const tooltipView_1 = require("./tooltipView");
class TooltipController {
    constructor(deps, editor, bufferPt) {
        this.deps = deps;
        this.editor = editor;
        this.cancelled = false;
        this.disposables = new Atom.CompositeDisposable();
        this.view = new tooltipView_1.TooltipView();
        document.body.appendChild(this.view.element);
        const debouncedUpdate = lodash_1.debounce(this.updateTooltip.bind(this), 100, { leading: true });
        this.disposables.add(this.editor.onDidChangeCursorPosition(evt => {
            utils_1.handlePromise(debouncedUpdate(evt.newBufferPosition));
        }));
        utils_1.handlePromise(this.updateTooltip(bufferPt));
    }
    isDisposed() {
        return this.cancelled;
    }
    dispose() {
        if (this.cancelled)
            return;
        this.cancelled = true;
        this.disposables.dispose();
        utils_1.handlePromise(this.view.destroy());
    }
    async updateTooltip(bufferPt) {
        if (this.cancelled)
            return;
        const rawView = atom.views.getView(this.editor);
        const pixelPos = rawView.pixelPositionForBufferPosition(bufferPt);
        const lines = rawView.querySelector(".lines");
        const linesRect = lines.getBoundingClientRect();
        const lineH = this.editor.getLineHeightInPixels();
        const Y = pixelPos.top + linesRect.top + lineH / 2;
        const X = pixelPos.left + linesRect.left;
        const offset = lineH * 0.7;
        const tooltipRect = {
            left: X,
            right: X,
            top: Y - offset,
            bottom: Y + offset,
        };
        const msg = await this.getMessage(bufferPt);
        if (!msg) {
            this.dispose();
            return;
        }
        if (this.cancelled)
            return;
        await this.view.update(Object.assign({}, tooltipRect, { sigHelp: msg }));
    }
    async getMessage(bufferPt) {
        if (!utils_2.isTypescriptEditorWithPath(this.editor))
            return;
        const filePath = this.editor.getPath();
        if (filePath === undefined)
            return;
        const client = await this.deps.getClient(filePath);
        try {
            await this.deps.withTypescriptBuffer(filePath, buffer => buffer.flush());
            const result = await client.execute("signatureHelp", {
                file: filePath,
                line: bufferPt.row + 1,
                offset: bufferPt.column + 1,
            });
            return result.body;
        }
        catch (e) {
            return;
        }
    }
}
exports.TooltipController = TooltipController;
//# sourceMappingURL=controller.js.map