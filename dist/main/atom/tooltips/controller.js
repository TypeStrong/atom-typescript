"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../utils");
const tooltipView_1 = require("./tooltipView");
class TooltipController {
    constructor(getClient, editor, e, bufferPt) {
        this.getClient = getClient;
        this.cancelled = false;
        utils_1.handlePromise(this.initialize(editor, e, bufferPt));
    }
    dispose() {
        this.cancelled = true;
        if (this.view) {
            utils_1.handlePromise(this.view.destroy());
            this.view = undefined;
        }
    }
    async initialize(editor, e, bufferPt) {
        const rawView = atom.views.getView(editor);
        // tslint:disable-next-line: one-variable-per-declaration
        let curCharPixelPt, nextCharPixelPt;
        try {
            curCharPixelPt = rawView.pixelPositionForBufferPosition(bufferPt);
            nextCharPixelPt = rawView.pixelPositionForBufferPosition(bufferPt.traverse([0, 1]));
        }
        catch (e) {
            console.warn(e);
            return;
        }
        if (curCharPixelPt.left >= nextCharPixelPt.left)
            return;
        // find out show position
        const offset = editor.getLineHeightInPixels() * 0.7;
        const tooltipRect = {
            left: e.clientX,
            right: e.clientX,
            top: e.clientY - offset,
            bottom: e.clientY + offset,
        };
        const msg = await this.getMessage(editor, bufferPt);
        if (this.cancelled)
            return;
        if (msg !== undefined)
            await this.showTooltip(tooltipRect, msg);
    }
    async getMessage(editor, bufferPt) {
        let result;
        const client = await this.getClient(editor);
        if (!client)
            return;
        const filePath = editor.getPath();
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
        return result.body;
    }
    async showTooltip(tooltipRect, info) {
        this.view = new tooltipView_1.TooltipView();
        document.body.appendChild(this.view.element);
        await this.view.update(Object.assign(Object.assign({}, tooltipRect), { info }));
    }
}
exports.TooltipController = TooltipController;
//# sourceMappingURL=controller.js.map