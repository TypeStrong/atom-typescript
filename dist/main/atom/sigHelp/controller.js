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
        const rawView = atom.views.getView(this.editor);
        this.view = new tooltipView_1.TooltipView(rawView);
        rawView.appendChild(this.view.element);
        const debouncedUpdate = lodash_1.debounce(this.updateTooltip.bind(this), 100, { leading: true });
        this.disposables.add(this.editor.onDidChangeCursorPosition(evt => {
            bufferPt = evt.newBufferPosition;
            utils_1.handlePromise(debouncedUpdate(bufferPt));
        }), rawView.onDidChangeScrollTop(() => {
            setImmediate(() => this.updateTooltipPosition(bufferPt));
        }), rawView.onDidChangeScrollLeft(() => {
            setImmediate(() => this.updateTooltipPosition(bufferPt));
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
    async rotateSigHelp(shift) {
        var _a, _b;
        const { visibleItem, sigHelp } = this.view.props;
        const curVisItem = visibleItem !== undefined
            ? visibleItem
            : ((_a = sigHelp) === null || _a === void 0 ? void 0 : _a.selectedItemIndex) !== undefined
                ? (_b = sigHelp) === null || _b === void 0 ? void 0 : _b.selectedItemIndex : 0;
        await this.view.update({ visibleItem: curVisItem + shift });
    }
    async updateTooltip(bufferPt) {
        if (this.cancelled)
            return;
        let tooltipRect;
        try {
            tooltipRect = this.computeTooltipPosition(bufferPt);
        }
        catch (e) {
            console.warn(e);
            return;
        }
        const msg = await this.getMessage(bufferPt);
        if (this.cancelled)
            return;
        if (!msg) {
            this.dispose();
            return;
        }
        await this.view.update(Object.assign(Object.assign({}, tooltipRect), { sigHelp: msg }));
    }
    updateTooltipPosition(bufferPt) {
        if (this.cancelled)
            return;
        const tooltipRect = this.computeTooltipPosition(bufferPt);
        utils_1.handlePromise(this.view.update(Object.assign({}, tooltipRect)));
    }
    computeTooltipPosition(bufferPt) {
        const rawView = atom.views.getView(this.editor);
        const pixelPos = rawView.pixelPositionForBufferPosition(bufferPt);
        const lines = rawView.querySelector(".lines");
        const linesRect = lines.getBoundingClientRect();
        const lineH = this.editor.getLineHeightInPixels();
        const parentRect = rawView.getBoundingClientRect();
        const Y = pixelPos.top + linesRect.top - parentRect.top + lineH / 2;
        const X = pixelPos.left + linesRect.left - parentRect.left;
        const offset = lineH * 0.7;
        return {
            left: X,
            right: X,
            top: Y - offset,
            bottom: Y + offset,
        };
    }
    async getMessage(bufferPt) {
        if (!utils_2.isTypescriptEditorWithPath(this.editor))
            return;
        const filePath = this.editor.getPath();
        if (filePath === undefined)
            return;
        const client = await this.deps.getClient(filePath);
        try {
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