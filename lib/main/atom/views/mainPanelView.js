var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var view = require('./view');
var $ = view.$;
var panelHeaders = {
    error: 'Errors In Open Files',
    build: 'Last Build Output'
};
var MainPanelView = (function (_super) {
    __extends(MainPanelView, _super);
    function MainPanelView() {
        _super.apply(this, arguments);
        this.expanded = false;
        this.clearedError = true;
    }
    MainPanelView.content = function () {
        var _this = this;
        var btn = function (view, text, className) {
            if (className === void 0) { className = ''; }
            return _this.button({
                'class': "btn " + className,
                'click': "" + view + "PanelSelected",
                'outlet': "" + view + "PanelBtn",
                'style': 'top:-2px!important'
            }, text);
        };
        this.div({
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
                _this.span({ style: 'cursor: pointer', 'click': 'toggle' }, function () {
                    _this.span({ class: "icon-bug" });
                    _this.span({}, " TypeScript ");
                });
                _this.div({
                    class: 'btn-group'
                }, function () {
                    btn("error", panelHeaders.error, 'selected');
                    btn("build", panelHeaders.build);
                });
                _this.span({}, " ");
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
                        class: 'heading-fold inline-block icon-unfold',
                        style: 'cursor: pointer',
                        outlet: 'btnFold',
                        click: 'toggle'
                    });
                });
            });
            _this.div({
                class: 'panel-body atomts-panel-body padded',
                outlet: 'errorBody',
                style: 'overflow-y: auto; display:none'
            });
            _this.div({
                class: 'panel-body atomts-panel-body padded',
                outlet: 'buildBody',
                style: 'overflow-y: auto; display:none'
            });
        });
    };
    MainPanelView.prototype.init = function () {
        this.buildPanelBtn.html("" + panelHeaders.build + " ( <span class=\"text-success\">No Build</span> )");
        this.buildBody.html('<span class="text-success"> No Build. Press (ctrl+shift+b / cmd+shift+b ) to start a build for an active TypeScript file\'s project. </span>');
    };
    MainPanelView.prototype.errorPanelSelected = function () {
        this.errorPanelBtn.addClass('selected');
        this.buildPanelBtn.removeClass('selected');
        this.expanded = true;
        this.setActivePanel();
    };
    MainPanelView.prototype.buildPanelSelected = function () {
        this.errorPanelBtn.removeClass('selected');
        this.buildPanelBtn.addClass('selected');
        this.expanded = true;
        this.setActivePanel();
    };
    MainPanelView.prototype.setActivePanel = function () {
        if (this.expanded) {
            if (this.errorPanelBtn.hasClass('selected')) {
                this.errorBody.show('fast');
                this.buildBody.hide('fast');
            }
            else {
                this.buildBody.show('fast');
                this.errorBody.hide('fast');
            }
        }
        else {
            this.errorBody.hide('fast');
            this.buildBody.hide('fast');
        }
    };
    MainPanelView.prototype.toggle = function () {
        this.expanded = !this.expanded;
        this.setActivePanel();
    };
    MainPanelView.prototype.clearError = function () {
        this.clearedError = true;
        this.errorBody.empty();
    };
    MainPanelView.prototype.addError = function (view) {
        if (this.clearedError && view.getSummary) {
            this.setErrorSummary(view.getSummary());
        }
        this.clearedError = false;
        this.errorBody.append(view.$);
    };
    MainPanelView.prototype.setErrorSummary = function (summary) {
        var message = summary.summary, className = summary.className, raw = summary.rawSummary || false, handler = summary.handler || undefined;
        this.summary.attr('class', 'heading-summary inline-block');
        this.summary.html(message);
        if (className) {
            this.summary.addClass(className);
        }
        if (handler) {
            handler(this.summary);
        }
    };
    MainPanelView.prototype.setErrorPanelErrorCount = function (fileErrorCount, totalErrorCount) {
        var title = "" + panelHeaders.error + " ( <span class=\"text-success\">No Errors</span> )";
        if (totalErrorCount > 0) {
            title = "" + panelHeaders.error + " (\n                <span class=\"text-highlight\" style=\"font-weight: bold\"> " + fileErrorCount + " </span>\n                <span class=\"text-error\" style=\"font-weight: bold;\"> file" + (fileErrorCount === 1 ? "" : "s") + " </span>\n                <span class=\"text-highlight\" style=\"font-weight: bold\"> " + totalErrorCount + " </span>\n                <span class=\"text-error\" style=\"font-weight: bold;\"> error" + (totalErrorCount === 1 ? "" : "s") + " </span>\n            )";
        }
        else {
            this.summary.html('');
        }
        this.errorPanelBtn.html(title);
    };
    MainPanelView.prototype.setBuildPanelCount = function (errorCount) {
        var title = "" + panelHeaders.build + " ( <span class=\"text-success\">No Errors</span> )";
        if (errorCount > 0) {
            title = "" + panelHeaders.build + " (\n                <span class=\"text-highlight\" style=\"font-weight: bold\"> " + errorCount + " </span>\n                <span class=\"text-error\" style=\"font-weight: bold;\"> error" + (errorCount === 1 ? "" : "s") + " </span>\n            )";
        }
        this.buildPanelBtn.html(title);
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
