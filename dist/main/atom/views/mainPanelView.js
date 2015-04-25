var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var view = require('./view');
var $ = view.$;
var lineMessageView = require('./lineMessageView');
var atomUtils = require("../atomUtils");
var parent = require("../../../worker/parent");
var utils = require("../../lang/utils");
var panelHeaders = {
    error: 'Errors In Open Files',
    build: 'Last Build Output',
    references: 'References'
};
var gotoHistory = require('../gotoHistory');
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
                'click': view + "PanelSelected",
                'outlet': view + "PanelBtn",
                'style': 'top:-2px!important'
            }, text);
        };
        this.div({
            class: 'am-panel tool-panel panel-bottom native-key-bindings atomts-main-panel',
            tabindex: '-1'
        }, function () {
            _this.div({
                class: 'panel-resize-handle',
                style: 'position: absolute; top: 0; left: 0; right: 0; height: 10px; cursor: row-resize; z-index: 3'
            });
            _this.div({
                class: 'panel-heading'
            }, function () {
                _this.span({
                    style: 'cursor: pointer; color: rgb(0, 148, 255)',
                    click: 'toggle'
                }, function () {
                    _this.span({ class: "icon-microscope" });
                    _this.span({ style: 'font-weight:bold' }, " TypeScript ");
                });
                _this.div({
                    class: 'btn-group',
                    style: 'margin-left: 5px'
                }, function () {
                    btn("error", panelHeaders.error, 'selected');
                    btn("build", panelHeaders.build);
                    btn("references", panelHeaders.references);
                });
                _this.div({
                    class: 'heading-summary',
                    style: 'display:inline-block; margin-left:5px; width: calc(100% - 800px); max-height:12px; overflow: hidden; white-space:nowrap; text-overflow: ellipsis',
                    outlet: 'summary'
                });
                _this.div({
                    class: 'heading-buttons pull-right',
                    style: 'width:50px; display:inline-block'
                }, function () {
                    _this.span({
                        class: 'heading-fold icon-unfold',
                        style: 'cursor: pointer; margin-right:10px',
                        outlet: 'btnFold',
                        click: 'toggle'
                    });
                    _this.span({
                        class: 'heading-fold icon-sync',
                        style: 'cursor: pointer',
                        outlet: 'btnSoftReset',
                        click: 'softReset'
                    });
                });
                _this.progress({
                    class: 'inline-block build-progress',
                    style: 'display: none; color:red',
                    outlet: 'buildProgress'
                });
                _this.span({ class: 'pull-right section-pending', outlet: 'sectionPending', style: 'width: 50px' }, function () {
                    _this.span({
                        outlet: 'txtPendingCount'
                    });
                    _this.span({
                        class: 'loading loading-spinner-tiny inline-block',
                        style: 'cursor: pointer; margin-right: 7px;',
                        click: 'showPending'
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
            _this.div({
                class: 'panel-body atomts-panel-body padded',
                outlet: 'referencesBody',
                style: 'overflow-y: auto; display:none'
            });
        });
    };
    MainPanelView.prototype.init = function () {
        this.buildPanelBtn.html(panelHeaders.build + " ( <span class=\"text-success\">No Build</span> )");
        this.buildBody.html('<span class="text-success"> No Build. Press ( F12 ) to start a build for an active TypeScript file\'s project. </span>');
        this.referencesPanelBtn.html(panelHeaders.references + " ( <span class=\"text-success\">No Search</span> )");
        this.referencesBody.html('<span class="text-success"> You haven\'t searched for TypeScript references yet. </span>');
    };
    MainPanelView.prototype.softReset = function () {
        var editor = atom.workspace.getActiveTextEditor();
        var prom = parent.softReset({ filePath: editor.getPath(), text: editor.getText() })
            .then(function () {
        });
        if (atomUtils.onDiskAndTs(editor)) {
            prom.then(function () {
                atom.commands.dispatch(atom.views.getView(atom.workspace.getActiveTextEditor()), 'linter:lint');
                return parent.errorsForFile({ filePath: editor.getPath() });
            })
                .then(function (resp) { return errorView.setErrors(editor.getPath(), resp.errors); });
        }
    };
    MainPanelView.prototype.showPending = function () {
        atom.notifications.addInfo('Pending Requests: <br/> - ' + this.pendingRequests.join('<br/> - '));
    };
    MainPanelView.prototype.updatePendingRequests = function (pending) {
        this.pendingRequests = pending;
        this.txtPendingCount.html("<span class=\"text-highlight\">" + this.pendingRequests.length + "</span>");
        this.sectionPending.stop();
        if (pending.length) {
            this.sectionPending.fadeIn(500);
        }
        else {
            this.sectionPending.fadeOut(200);
        }
    };
    MainPanelView.prototype.errorPanelSelected = function (forceExpand) {
        if (forceExpand === void 0) { forceExpand = true; }
        this.expanded = forceExpand;
        this.selectPanel(this.errorPanelBtn, this.errorBody, gotoHistory.errorsInOpenFiles);
    };
    MainPanelView.prototype.buildPanelSelected = function (forceExpand) {
        if (forceExpand === void 0) { forceExpand = true; }
        this.expanded = forceExpand;
        this.selectPanel(this.buildPanelBtn, this.buildBody, gotoHistory.buildOutput);
    };
    MainPanelView.prototype.referencesPanelSelected = function (forceExpand) {
        if (forceExpand === void 0) { forceExpand = true; }
        this.expanded = forceExpand;
        this.selectPanel(this.referencesPanelBtn, this.referencesBody, gotoHistory.referencesOutput);
    };
    MainPanelView.prototype.selectPanel = function (btn, body, activeList) {
        var _this = this;
        var buttons = [this.errorPanelBtn, this.buildPanelBtn, this.referencesPanelBtn];
        var bodies = [this.errorBody, this.buildBody, this.referencesBody];
        buttons.forEach(function (b) {
            if (b !== btn)
                b.removeClass('selected');
            else
                b.addClass('selected');
        });
        bodies.forEach(function (b) {
            if (!_this.expanded) {
                b.hide('fast');
            }
            else {
                if (b !== body)
                    b.hide('fast');
                else {
                    body.show('fast');
                }
            }
        });
        gotoHistory.activeList = activeList;
        gotoHistory.activeList.lastPosition = null;
    };
    MainPanelView.prototype.setActivePanel = function () {
        if (this.errorPanelBtn.hasClass('selected')) {
            this.errorPanelSelected(this.expanded);
        }
        if (this.buildPanelBtn.hasClass('selected')) {
            this.buildPanelSelected(this.expanded);
        }
        if (this.referencesPanelBtn.hasClass('selected')) {
            this.referencesPanelSelected(this.expanded);
        }
    };
    MainPanelView.prototype.toggle = function () {
        this.expanded = !this.expanded;
        this.setActivePanel();
    };
    MainPanelView.prototype.setReferences = function (references) {
        this.referencesPanelSelected(true);
        this.referencesBody.empty();
        if (references.length == 0) {
            var title = panelHeaders.references + " ( <span class=\"text-success\">No References</span> )";
            this.referencesPanelBtn.html(title);
            this.referencesBody.html('<span class="text-success">No references found \u2665</span>');
            atom.notifications.addInfo('AtomTS: No References Found.');
            return;
        }
        var title = panelHeaders.references + " ( <span class=\"text-highlight\" style=\"font-weight: bold\">Found: " + references.length + "</span> )";
        this.referencesPanelBtn.html(title);
        gotoHistory.referencesOutput.members = [];
        for (var _i = 0; _i < references.length; _i++) {
            var ref = references[_i];
            var view = new lineMessageView.LineMessageView({
                goToLine: function (filePath, line, col) { return gotoHistory.gotoLine(filePath, line, col, gotoHistory.referencesOutput); },
                message: '',
                line: ref.position.line + 1,
                col: ref.position.col,
                file: ref.filePath,
                preview: ref.preview
            });
            this.referencesBody.append(view.$);
            gotoHistory.referencesOutput.members.push({ filePath: ref.filePath, line: ref.position.line + 1, col: ref.position.col });
        }
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
        this.summary.attr('class', 'heading-summary');
        this.summary.html(message);
        if (className) {
            this.summary.addClass(className);
        }
        if (handler) {
            handler(this.summary);
        }
    };
    MainPanelView.prototype.setErrorPanelErrorCount = function (fileErrorCount, totalErrorCount) {
        var title = panelHeaders.error + " ( <span class=\"text-success\">No Errors</span> )";
        if (totalErrorCount > 0) {
            title = panelHeaders.error + " (\n                <span class=\"text-highlight\" style=\"font-weight: bold\"> " + fileErrorCount + " </span>\n                <span class=\"text-error\" style=\"font-weight: bold;\"> file" + (fileErrorCount === 1 ? "" : "s") + " </span>\n                <span class=\"text-highlight\" style=\"font-weight: bold\"> " + totalErrorCount + " </span>\n                <span class=\"text-error\" style=\"font-weight: bold;\"> error" + (totalErrorCount === 1 ? "" : "s") + " </span>\n            )";
        }
        else {
            this.summary.html('');
            this.errorBody.html('<span class="text-success">No errors in open files \u2665</span>');
        }
        this.errorPanelBtn.html(title);
    };
    MainPanelView.prototype.setBuildPanelCount = function (errorCount, inProgressBuild) {
        if (inProgressBuild === void 0) { inProgressBuild = false; }
        var titleMain = inProgressBuild ? "Build Progress" : panelHeaders.build;
        var title = titleMain + " ( <span class=\"text-success\">No Errors</span> )";
        if (errorCount > 0) {
            title = titleMain + " (\n                <span class=\"text-highlight\" style=\"font-weight: bold\"> " + errorCount + " </span>\n                <span class=\"text-error\" style=\"font-weight: bold;\"> error" + (errorCount === 1 ? "" : "s") + " </span>\n            )";
        }
        else {
            if (!inProgressBuild)
                this.buildBody.html('<span class="text-success">No errors in last build \u2665</span>');
        }
        this.buildPanelBtn.html(title);
    };
    MainPanelView.prototype.clearBuild = function () {
        this.buildBody.empty();
    };
    MainPanelView.prototype.addBuild = function (view) {
        this.buildBody.append(view.$);
    };
    MainPanelView.prototype.setBuildProgress = function (progress) {
        var _this = this;
        if (progress.builtCount == 1) {
            this.buildProgress.show();
            this.buildProgress.removeClass('warn');
            this.buildBody.html('<span class="text-success">Things are looking good \u2665</span>');
            gotoHistory.buildOutput.members = [];
        }
        if (progress.builtCount == progress.totalCount) {
            this.buildProgress.hide();
            return;
        }
        this.buildProgress.prop('value', progress.builtCount);
        this.buildProgress.prop('max', progress.totalCount);
        this.setBuildPanelCount(progress.errorCount, true);
        if (progress.firstError) {
            this.buildProgress.addClass('warn');
            this.clearBuild();
        }
        if (progress.errorsInFile.length) {
            progress.errorsInFile.forEach(function (error) {
                _this.addBuild(new lineMessageView.LineMessageView({
                    goToLine: function (filePath, line, col) { return gotoHistory.gotoLine(filePath, line, col, gotoHistory.buildOutput); },
                    message: error.message,
                    line: error.startPos.line + 1,
                    col: error.startPos.col,
                    file: error.filePath,
                    preview: error.preview
                }));
                gotoHistory.buildOutput.members.push({ filePath: error.filePath, line: error.startPos.line + 1, col: error.startPos.col });
            });
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
    exports.panelView.setErrorPanelErrorCount(0, 0);
}
exports.attach = attach;
function show() {
    if (!exports.panelView)
        return;
    exports.panelView.$.show();
}
exports.show = show;
function hide() {
    if (!exports.panelView)
        return;
    exports.panelView.$.hide();
}
exports.hide = hide;
var errorView;
(function (errorView) {
    var filePathErrors = new utils.Dict();
    errorView.setErrors = function (filePath, errorsForFile) {
        if (!errorsForFile.length)
            filePathErrors.clearValue(filePath);
        else {
            if (errorsForFile.length > 50)
                errorsForFile = errorsForFile.slice(0, 50);
            filePathErrors.setValue(filePath, errorsForFile);
        }
        ;
        exports.panelView.clearError();
        var fileErrorCount = filePathErrors.keys().length;
        gotoHistory.errorsInOpenFiles.members = [];
        if (!fileErrorCount) {
            exports.panelView.setErrorPanelErrorCount(0, 0);
        }
        else {
            var totalErrorCount = 0;
            for (var path in filePathErrors.table) {
                filePathErrors.getValue(path).forEach(function (error) {
                    totalErrorCount++;
                    exports.panelView.addError(new lineMessageView.LineMessageView({
                        goToLine: function (filePath, line, col) { return gotoHistory.gotoLine(filePath, line, col, gotoHistory.errorsInOpenFiles); },
                        message: error.message,
                        line: error.startPos.line + 1,
                        col: error.startPos.col,
                        file: error.filePath,
                        preview: error.preview
                    }));
                    gotoHistory.errorsInOpenFiles.members.push({ filePath: error.filePath, line: error.startPos.line + 1, col: error.startPos.col });
                });
            }
            exports.panelView.setErrorPanelErrorCount(fileErrorCount, totalErrorCount);
        }
    };
    function showEmittedMessage(output) {
        if (output.success) {
            var message = 'TS emit succeeded<br/>' + output.outputFiles.join('<br/>');
            atomUtils.quickNotifySuccess(message);
        }
        else if (output.emitError) {
            atom.notifications.addError('TS Emit Failed');
        }
        else {
            atomUtils.quickNotifyWarning('Compile failed but emit succeeded<br/>' + output.outputFiles.join('<br/>'));
        }
    }
    errorView.showEmittedMessage = showEmittedMessage;
})(errorView = exports.errorView || (exports.errorView = {}));
