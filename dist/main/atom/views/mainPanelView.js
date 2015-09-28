var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var view = require('./view');
var $ = view.$;
var lineMessageView = require('./lineMessageView');
var atomUtils = require("../atomUtils");
var parent = require("../../../worker/parent");
var utils = require("../../lang/utils");
var fileStatusCache_1 = require("../fileStatusCache");
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
        this.pendingRequests = [];
        this.expanded = false;
        this.clearedError = true;
    }
    MainPanelView.content = function () {
        var _this = this;
        var btn = function (view, text, className) {
            if (className === void 0) { className = ''; }
            return _this.button({
                'class': "btn btn-sm " + className,
                'click': view + "PanelSelectedClick",
                'outlet': view + "PanelBtn"
            }, text);
        };
        this.div({
            class: 'atomts atomts-main-panel-view native-key-bindings',
            tabindex: '-1'
        }, function () {
            _this.div({
                class: 'layout horizontal',
                style: '-webkit-user-select: none; flex-wrap: wrap',
                dblclick: 'toggle'
            }, function () {
                _this.span({
                    class: 'layout horizontal atomts-panel-header',
                    style: 'align-items: center'
                }, function () {
                    _this.span({
                        style: 'cursor: pointer; color: rgb(0, 148, 255); -webkit-user-select: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 16px',
                        click: 'toggle'
                    }, function () {
                        _this.span({ class: 'icon-microscope' });
                        _this.span({ style: 'font-weight: bold' }, 'TypeScript');
                    });
                    _this.div({
                        class: 'btn-group',
                        style: 'margin-left: 6px; flex: 1 0 auto'
                    }, function () {
                        btn('error', panelHeaders.error, 'selected');
                        btn('build', panelHeaders.build);
                        btn('references', panelHeaders.references);
                    });
                });
                _this.span({
                    class: 'layout horizontal atomts-panel-header',
                    style: 'align-items: center; flex: 1 1 auto; line-height: 24px;'
                }, function () {
                    _this.div({
                        style: 'cursor: pointer;',
                        click: 'clickedCurrentTsconfigFilePath'
                    }, function () {
                        _this.span({
                            outlet: 'tsconfigInUse'
                        });
                    });
                    _this.div({
                        style: 'overflow-x: visible; white-space: nowrap;'
                    }, function () {
                        _this.span({
                            style: 'margin-left: 10px; transition: color 1s',
                            outlet: 'fileStatus'
                        });
                    });
                    _this.div({
                        class: 'heading-summary flex',
                        style: 'margin-left: 5px; overflow: hidden; white-space:nowrap; text-overflow: ellipsis',
                        outlet: 'summary'
                    });
                    _this.progress({
                        class: 'inline-block build-progress',
                        style: 'display: none; color: red',
                        outlet: 'buildProgress'
                    });
                    _this.span({
                        class: 'section-pending',
                        outlet: 'sectionPending',
                        click: 'showPending'
                    }, function () {
                        _this.span({
                            outlet: 'txtPendingCount',
                            style: 'cursor: pointer; margin-left: 5px',
                        });
                        _this.span({
                            class: 'loading loading-spinner-tiny inline-block',
                            style: 'cursor: pointer; margin-left: 5px'
                        });
                    });
                    _this.div({
                        class: 'heading-buttons',
                        style: 'margin-left: 5px'
                    }, function () {
                        _this.span({
                            class: 'heading-fold icon-unfold',
                            style: 'cursor: pointer; margin-right: 10px',
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
                });
                _this.div({
                    class: 'panel-body atomts-panel-body',
                    outlet: 'errorBody',
                    style: 'overflow-y: auto; flex: 1 0 100%; display: none'
                });
                _this.div({
                    class: 'panel-body atomts-panel-body',
                    outlet: 'buildBody',
                    style: 'overflow-y: auto; flex: 1 0 100%; display: none'
                });
                _this.div({
                    class: 'panel-body atomts-panel-body',
                    outlet: 'referencesBody',
                    style: 'overflow-y: auto; flex: 1 0 100%; display: none'
                });
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
                atomUtils.triggerLinter();
                return parent.errorsForFile({ filePath: editor.getPath() });
            })
                .then(function (resp) { return errorView.setErrors(editor.getPath(), resp.errors); });
        }
    };
    MainPanelView.prototype.setTsconfigInUse = function (tsconfigFilePath) {
        this.fullTsconfigPath = tsconfigFilePath;
        if (!this.fullTsconfigPath) {
            this.tsconfigInUse.text('no tsconfig.json');
        }
        else {
            var path = atomUtils.getFilePathRelativeToAtomProject(tsconfigFilePath);
            this.tsconfigInUse.text("" + path);
        }
    };
    MainPanelView.prototype.clickedCurrentTsconfigFilePath = function () {
        if (!this.fullTsconfigPath) {
            atom.notifications.addInfo("No tsconfig for current file");
            return;
        }
        else {
            atomUtils.openFile(this.fullTsconfigPath);
        }
    };
    MainPanelView.prototype.updateFileStatus = function (filePath) {
        var _this = this;
        parent.getProjectFileDetails({ filePath: filePath }).then(function (fileDetails) {
            if (!fileDetails.project.compileOnSave) {
                _this.fileStatus.addClass("hidden");
            }
            else {
                var status_1 = fileStatusCache_1.getFileStatus(filePath);
                _this.fileStatus.removeClass('icon-x icon-check text-error text-success hidden');
                if (status_1.emitDiffers || status_1.modified) {
                    _this.fileStatus.text('JS Outdated');
                    _this.fileStatus.addClass('icon-x text-error');
                }
                else {
                    _this.fileStatus.text('JS Current');
                    _this.fileStatus.addClass('icon-check text-success');
                }
            }
        });
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
    MainPanelView.prototype.errorPanelSelectedClick = function () {
        this.toggleIfThisIsntSelected(this.errorPanelBtn);
        this.errorPanelSelected();
    };
    MainPanelView.prototype.errorPanelSelected = function () {
        this.selectPanel(this.errorPanelBtn, this.errorBody, gotoHistory.errorsInOpenFiles);
    };
    MainPanelView.prototype.buildPanelSelectedClick = function () {
        this.toggleIfThisIsntSelected(this.buildPanelBtn);
        this.buildPanelSelected();
    };
    MainPanelView.prototype.buildPanelSelected = function () {
        this.selectPanel(this.buildPanelBtn, this.buildBody, gotoHistory.buildOutput);
    };
    MainPanelView.prototype.referencesPanelSelectedClick = function () {
        this.toggleIfThisIsntSelected(this.referencesPanelBtn);
        this.referencesPanelSelected();
    };
    MainPanelView.prototype.referencesPanelSelected = function (forceExpand) {
        if (forceExpand === void 0) { forceExpand = false; }
        this.selectPanel(this.referencesPanelBtn, this.referencesBody, gotoHistory.referencesOutput);
    };
    MainPanelView.prototype.toggleIfThisIsntSelected = function (btn) {
        if (btn.hasClass('selected')) {
            this.expanded = !this.expanded;
        }
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
            this.errorPanelSelected();
        }
        if (this.buildPanelBtn.hasClass('selected')) {
            this.buildPanelSelected();
        }
        if (this.referencesPanelBtn.hasClass('selected')) {
            this.referencesPanelSelected();
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
var panel;
function attach() {
    if (exports.panelView)
        return;
    exports.panelView = new MainPanelView({});
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
    var MAX_ERRORS = 50;
    var filePathErrors = new utils.Dict();
    errorView.setErrors = function (filePath, errorsForFile) {
        if (!exports.panelView || !exports.panelView.clearError) {
            return;
        }
        if (!errorsForFile.length) {
            filePathErrors.clearValue(filePath);
        }
        else {
            if (errorsForFile.length > MAX_ERRORS) {
                errorsForFile = errorsForFile.slice(0, MAX_ERRORS);
            }
            filePathErrors.setValue(filePath, errorsForFile);
        }
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
        if (output.emitError) {
            atom.notifications.addError('TS Emit Failed');
        }
        else if (!output.success) {
            atomUtils.quickNotifyWarning('Compile failed but emit succeeded<br/>' + output.outputFiles.join('<br/>'));
        }
    }
    errorView.showEmittedMessage = showEmittedMessage;
})(errorView = exports.errorView || (exports.errorView = {}));
