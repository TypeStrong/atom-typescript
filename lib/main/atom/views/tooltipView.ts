import view = require('./view');
var $ = view.$;

interface Rect {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

export class TooltipView extends view.View<Rect> {

    constructor(public rect: Rect) {
        super(rect);
        $(document.body).append(this.$);
        this.updatePosition()
    }

    private inner: JQuery;
    static content() {
        return this.div({ class: 'atom-typescript-tooltip tooltip' }, () => {
            this.div({ class: 'tooltip-inner', outlet: 'inner' })
        });
    }

    updateText(text: string) {
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
            this.$.css({ 'white-space': 'pre-wrap' })
            left = offset
            right = offset
        }

        // Y axis adjust
        if (top + this.$[0].offsetHeight >= $(document.body).height()) {
            top = this.rect.top - this.$[0].offsetHeight
        }

        this.$.css({ left, top, right });
    }
}
