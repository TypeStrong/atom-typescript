var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var view = require('./view');
var $ = view.$;
var PlainMessageView = (function (_super) {
    __extends(PlainMessageView, _super);
    function PlainMessageView() {
        _super.apply(this, arguments);
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
})(view.View);
exports.PlainMessageView = PlainMessageView;
