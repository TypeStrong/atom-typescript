var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var view = require('./view');
var $ = view.$;
var MainPanelView = (function (_super) {
    __extends(MainPanelView, _super);
    function MainPanelView() {
        _super.apply(this, arguments);
        this.cleared = true;
    }
    MainPanelView.content = function () {
        var _this = this;
        return this.div({
            class: 'am-panel tool-panel panel-bottom native-key-bindings',
            tabindex: '-1'
        }, function () {
            _this.div({
                class: 'panel-resize-handle',
                style: 'position: absolute; top: 0; left: 0; right: 0; height: 10px; cursor: row-resize; z-index: 3'
            });
            _this.div({
                class: 'panel-heading'
            }, function () {
                _this.div({
                    class: 'heading-title inline-block',
                    style: 'cursor: pointer',
                    outlet: 'heading',
                    click: 'toggle'
                });
                _this.div({
                    class: 'heading-summary',
                    style: 'display:inline-block',
                    outlet: 'summary'
                });
                _this.div({
                    class: 'heading-buttoms inline-block pull-right'
                }, function () {
                    _this.div({
                        class: 'heading-fold inline-block icon-fold',
                        style: 'cursor: pointer',
                        outlet: 'btnFold',
                        click: 'toggle'
                    });
                });
            });
            _this.div({
                class: 'panel-body atomts-panel-body padded',
                outlet: 'body',
                style: 'overflow-y: auto; display:none'
            });
        });
    };
    MainPanelView.prototype.init = function () {
    };
    MainPanelView.prototype.setTitle = function (html) {
        this.heading.html(html);
    };
    MainPanelView.prototype.toggle = function () {
        this.btnFold.toggleClass('icon-fold, icon-unfold');
        this.body.toggle('fast');
        if (this.summary.css('display') === 'none') {
            this.summary.css('display', 'inline-block');
        }
        else {
            this.summary.hide();
        }
    };
    MainPanelView.prototype.clear = function () {
        this.cleared = true;
        this.body.empty();
    };
    MainPanelView.prototype.add = function (view) {
        if (this.cleared && view.getSummary) {
            this.setSummary(view.getSummary());
        }
        this.cleared = false;
        this.body.append(view.$);
    };
    MainPanelView.prototype.setSummary = function (summary) {
        var message = summary.summary, className = summary.className, raw = summary.rawSummary || false, handler = summary.handler || undefined;
        this.summary.attr('class', 'heading-summary inline-block');
        if (raw) {
            this.summary.html(message);
        }
        else {
            this.summary.text(message);
        }
        if (className) {
            this.summary.addClass(className);
        }
        if (handler) {
            handler(this.summary);
        }
    };
    return MainPanelView;
})(view.View);
exports.MainPanelView = MainPanelView;
exports.panelView;
var panel;
function attach() {
    if (exports.panelView)
        return;
    exports.panelView = new MainPanelView();
    panel = atom.workspace.addBottomPanel({ item: exports.panelView, priority: 1000, visible: true });
}
exports.attach = attach;
