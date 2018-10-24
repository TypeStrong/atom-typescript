"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tooltipView_1 = require("./tooltipView");
const utils_1 = require("../../../utils");
const escape = require("escape-html");
const util_1 = require("./util");
class TooltipController {
    constructor(getClient, editor, e) {
        this.getClient = getClient;
        this.cancelled = false;
        utils_1.handlePromise(this.initialize(editor, e));
    }
    dispose() {
        this.cancelled = true;
        if (this.view) {
            utils_1.handlePromise(this.view.destroy());
            this.view = undefined;
        }
    }
    async initialize(editor, e) {
        const bufferPt = util_1.bufferPositionFromMouseEvent(editor, e);
        if (!bufferPt)
            return;
        const rawView = atom.views.getView(editor);
        const curCharPixelPt = rawView.pixelPositionForBufferPosition(bufferPt);
        const nextCharPixelPt = rawView.pixelPositionForBufferPosition(bufferPt.traverse([0, 1]));
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
        const { displayString, documentation } = result.body;
        let message = `<b>${escape(displayString)}</b>`;
        if (documentation) {
            message =
                message + `<br/><i>${escape(documentation).replace(/(?:\r\n|\r|\n)/g, "<br />")}</i>`;
        }
        return message;
    }
    async showTooltip(tooltipRect, message) {
        this.view = new tooltipView_1.TooltipView();
        document.body.appendChild(this.view.element);
        await this.view.update(Object.assign({}, tooltipRect, { text: message }));
    }
}
exports.TooltipController = TooltipController;
//# sourceMappingURL=controller.js.map