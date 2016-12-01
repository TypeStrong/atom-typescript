"use strict";
var tslib_1 = require("tslib");
var view = require("./view");
var PlainMessageView = (function (_super) {
    tslib_1.__extends(PlainMessageView, _super);
    function PlainMessageView() {
        return _super.apply(this, arguments) || this;
    }
    PlainMessageView.content = function () {
        this.div({
            class: 'plain-message'
        });
    };
    PlainMessageView.prototype.init = function () {
        this.$.html(this.options.message);
        this.$.addClass(this.options.className);
    };
    PlainMessageView.prototype.getSummary = function () {
        return {
            summary: this.options.message,
            rawSummary: true,
            className: this.options.className
        };
    };
    return PlainMessageView;
}(view.View));
exports.PlainMessageView = PlainMessageView;
