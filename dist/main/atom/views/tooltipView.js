"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const view = require("./view");
var $ = view.$;
class TooltipView extends view.View {
    constructor(rect) {
        super(rect);
        this.rect = rect;
        $(document.body).append(this.$);
        this.updatePosition();
    }
    static content() {
        return this.div({ class: 'atom-typescript-tooltip tooltip' }, () => {
            this.div({ class: 'tooltip-inner', outlet: 'inner' });
        });
    }
    updateText(text) {
        this.inner.html(text);
        this.updatePosition();
        this.$.fadeTo(300, 1);
    }
    updatePosition() {
        var offset = 10;
        var left = this.rect.right;
        var top = this.rect.bottom;
        var right = undefined;
        // X axis adjust
        if (left + this.$[0].offsetWidth >= view.$(document.body).width())
            left = view.$(document.body).width() - this.$[0].offsetWidth - offset;
        if (left < 0) {
            this.$.css({ 'white-space': 'pre-wrap' });
            left = offset;
            right = offset;
        }
        // Y axis adjust
        if (top + this.$[0].offsetHeight >= $(document.body).height()) {
            top = this.rect.top - this.$[0].offsetHeight;
        }
        this.$.css({ left, top, right });
    }
}
exports.TooltipView = TooltipView;
//# sourceMappingURL=tooltipView.js.map