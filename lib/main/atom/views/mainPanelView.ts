import view = require('./view');
var $ = view.$;

import lineMessageView = require('./lineMessageView');
import atomUtils = require("../atomUtils");
import parent = require("../../../worker/parent");
import * as utils from "../../lang/utils";

var panelHeaders = {
    error: 'Errors In Open Files',
    build: 'Last Build Output',
    references: 'References'
}

import gotoHistory = require('../gotoHistory');

export class MainPanelView extends view.View<any> {

    private btnFold: JQuery;
    private btnSoftReset: JQuery;
    private summary: JQuery;
    private heading: JQuery;

    private errorPanelBtn: JQuery;
    private buildPanelBtn: JQuery;
    private referencesPanelBtn: JQuery;
    private errorBody: JQuery;
    private buildBody: JQuery;
    private referencesBody: JQuery;

    private buildProgress: JQuery;

    private sectionPending: JQuery;
    private txtPendingCount: JQuery;
    private pendingRequests: string[];

    static content() {
        var btn = (view, text, className: string = '') =>
            this.button({
                'class': "btn " + className,
                'click': `${view}PanelSelected`,
                'outlet': `${view}PanelBtn`,
                'style': 'top:-2px!important'
            }, text);

        this.div({
            class: 'am-panel tool-panel panel-bottom native-key-bindings atomts-main-panel',
            tabindex: '-1'
        }, () => {
                this.div({
                    class: 'panel-resize-handle',
                    style: 'position: absolute; top: 0; left: 0; right: 0; height: 10px; cursor: row-resize; z-index: 3'
                });
                this.div({
                    class: 'panel-heading'
                }, () => {
                        this.span({
                            style: 'cursor: pointer; color: rgb(0, 148, 255)',
                            click: 'toggle'
                        }, () => {
                                this.span({ class: "icon-microscope" });
                                this.span({ style: 'font-weight:bold' }, " TypeScript ");
                            });

                        this.div({
                            class: 'btn-group',
                            style: 'margin-left: 5px'
                        },
                            () => {
                                btn("error", panelHeaders.error, 'selected')
                                btn("build", panelHeaders.build)
                                btn("references", panelHeaders.references)
                            });

                        this.div({
                            class: 'heading-summary',
                            style: 'display:inline-block; margin-left:5px; width: calc(100% - 800px); max-height:12px; overflow: hidden; white-space:nowrap; text-overflow: ellipsis',
                            outlet: 'summary'
                        });

                        this.div({
                            class: 'heading-buttons pull-right',
                            style: 'width:50px; display:inline-block'
                        }, () => {
                                this.span({
                                    class: 'heading-fold icon-unfold',
                                    style: 'cursor: pointer; margin-right:10px',
                                    outlet: 'btnFold',
                                    click: 'toggle'
                                });
                                this.span({
                                    class: 'heading-fold icon-sync',
                                    style: 'cursor: pointer',
                                    outlet: 'btnSoftReset',
                                    click: 'softReset'
                                });
                            });

                        this.progress({
                            class: 'inline-block build-progress',
                            style: 'display: none; color:red',
                            outlet: 'buildProgress'
                        });

                        this.span({ class: 'pull-right section-pending', outlet: 'sectionPending', style: 'width: 50px' }, () => {
                            this.span({
                                outlet: 'txtPendingCount'
                            });
                            this.span({
                                class: 'loading loading-spinner-tiny inline-block',
                                style: 'cursor: pointer; margin-right: 7px;',
                                click: 'showPending'
                            });
                        });
                    });
                this.div({
                    class: 'panel-body atomts-panel-body padded',
                    outlet: 'errorBody',
                    style: 'overflow-y: auto; display:none'
                });
                this.div({
                    class: 'panel-body atomts-panel-body padded',
                    outlet: 'buildBody',
                    style: 'overflow-y: auto; display:none'
                });
                this.div({
                    class: 'panel-body atomts-panel-body padded',
                    outlet: 'referencesBody',
                    style: 'overflow-y: auto; display:none'
                });
            });
    }


    init() {
        this.buildPanelBtn.html(`${panelHeaders.build} ( <span class="text-success">No Build</span> )`);
        this.buildBody.html('<span class="text-success"> No Build. Press ( F12 ) to start a build for an active TypeScript file\'s project. </span>')

        this.referencesPanelBtn.html(`${panelHeaders.references} ( <span class="text-success">No Search</span> )`)
        this.referencesBody.html('<span class="text-success"> You haven\'t searched for TypeScript references yet. </span>')
    }

    softReset() {
        var editor = atom.workspace.getActiveTextEditor();
        var prom = parent.softReset({ filePath: editor.getPath(), text: editor.getText() })
            .then(() => {

        });
        if (atomUtils.onDiskAndTs(editor)) {
            prom.then(() => {
                // also invalidate linter
                atom.commands.dispatch(
                    atom.views.getView(atom.workspace.getActiveTextEditor()),
                    'linter:lint');

                return parent.errorsForFile({ filePath: editor.getPath() })
            })
                .then((resp) => errorView.setErrors(editor.getPath(), resp.errors));
        }
    }

    ///////////// Pending Requests
    showPending() {
        atom.notifications.addInfo('Pending Requests: <br/> - ' + this.pendingRequests.join('<br/> - '));
    }
    updatePendingRequests(pending: string[]) {
        this.pendingRequests = pending;
        this.txtPendingCount.html(`<span class="text-highlight">${this.pendingRequests.length}</span>`);

        this.sectionPending.stop();
        if (pending.length) {
            this.sectionPending.fadeIn(500);
        }
        else {
            this.sectionPending.fadeOut(200);
        }
    }

    ///// Panel selection
    errorPanelSelected(forceExpand = true) {
        this.expanded = forceExpand;
        this.selectPanel(this.errorPanelBtn, this.errorBody, gotoHistory.errorsInOpenFiles);
    }

    buildPanelSelected(forceExpand = true) {
        this.expanded = forceExpand;
        this.selectPanel(this.buildPanelBtn, this.buildBody, gotoHistory.buildOutput);
    }

    referencesPanelSelected(forceExpand = true) {
        this.expanded = forceExpand;
        this.selectPanel(this.referencesPanelBtn, this.referencesBody, gotoHistory.referencesOutput);
    }

    private selectPanel(btn: JQuery, body: JQuery, activeList: TabWithGotoPositions) {
        var buttons = [this.errorPanelBtn, this.buildPanelBtn, this.referencesPanelBtn];
        var bodies = [this.errorBody, this.buildBody, this.referencesBody];

        buttons.forEach(b=> {
            if (b !== btn)
                b.removeClass('selected')
            else
                b.addClass('selected');
        });
        bodies.forEach(b=> {
            if (!this.expanded) {
                b.hide('fast')
            }
            else {
                if (b !== body)
                    b.hide('fast')
                else {
                    body.show('fast');
                }
            }
        });

        gotoHistory.activeList = activeList;
        gotoHistory.activeList.lastPosition = null;
    }

    private setActivePanel() {
        if (this.errorPanelBtn.hasClass('selected')) {
            this.errorPanelSelected(this.expanded);
        }
        if (this.buildPanelBtn.hasClass('selected')) {
            this.buildPanelSelected(this.expanded);
        }
        if (this.referencesPanelBtn.hasClass('selected')) {
            this.referencesPanelSelected(this.expanded);
        }
    }

    private expanded = false;
    toggle() {
        this.expanded = !this.expanded;
        this.setActivePanel();
    }

    ////////////// REFERENCES
    setReferences(references: ReferenceDetails[]) {
        // Select it
        this.referencesPanelSelected(true);

        this.referencesBody.empty();

        if (references.length == 0) {
            var title = `${panelHeaders.references} ( <span class="text-success">No References</span> )`;
            this.referencesPanelBtn.html(title);
            this.referencesBody.html('<span class="text-success">No references found \u2665</span>');
            atom.notifications.addInfo('AtomTS: No References Found.');
            return;
        }

        var title = `${panelHeaders.references} ( <span class="text-highlight" style="font-weight: bold">Found: ${references.length}</span> )`;
        this.referencesPanelBtn.html(title);

        gotoHistory.referencesOutput.members = [];
        for (let ref of references) {

            var view = new lineMessageView.LineMessageView({
                goToLine: (filePath, line, col) => gotoHistory.gotoLine(filePath, line, col, gotoHistory.referencesOutput),
                message: '',
                line: ref.position.line + 1,
                col: ref.position.col,
                file: ref.filePath,
                preview: ref.preview
            });

            this.referencesBody.append(view.$);

            // Update the list for goto history
            gotoHistory.referencesOutput.members.push({ filePath: ref.filePath, line: ref.position.line + 1, col: ref.position.col });
        }
    }

    ///////////// ERROR
    private clearedError = true;
    clearError() {
        this.clearedError = true;
        this.errorBody.empty();
    }

    addError(view: lineMessageView.LineMessageView) {
        if (this.clearedError && view.getSummary) {
            // This is the first message, so use it to
            // set the summary
            this.setErrorSummary(view.getSummary());
        }
        this.clearedError = false;

        this.errorBody.append(view.$);
    }

    setErrorSummary(summary: any /*TODO: Type this*/) {
        var
            message = summary.summary,
            className = summary.className,
            raw = summary.rawSummary || false,
            handler = summary.handler || undefined;
        // Reset the class-attributes on the old summary
        this.summary.attr('class', 'heading-summary');
        // Set the new summary
        this.summary.html(message);

        if (className) {
            this.summary.addClass(className);
        }
        if (handler) {
            handler(this.summary);
        }
    }

    setErrorPanelErrorCount(fileErrorCount: number, totalErrorCount: number) {
        var title = `${panelHeaders.error} ( <span class="text-success">No Errors</span> )`;
        if (totalErrorCount > 0) {
            title = `${panelHeaders.error} (
                <span class="text-highlight" style="font-weight: bold"> ${fileErrorCount} </span>
                <span class="text-error" style="font-weight: bold;"> file${fileErrorCount === 1 ? "" : "s"} </span>
                <span class="text-highlight" style="font-weight: bold"> ${totalErrorCount} </span>
                <span class="text-error" style="font-weight: bold;"> error${totalErrorCount === 1 ? "" : "s"} </span>
            )`;
        }
        else {
            this.summary.html('');
            this.errorBody.html('<span class="text-success">No errors in open files \u2665</span>');
        }

        this.errorPanelBtn.html(title);
    }

    ///////////////////// BUILD
    setBuildPanelCount(errorCount: number, inProgressBuild = false) {
        var titleMain = inProgressBuild ? "Build Progress" : panelHeaders.build;
        var title = `${titleMain} ( <span class="text-success">No Errors</span> )`;
        if (errorCount > 0) {
            title = `${titleMain} (
                <span class="text-highlight" style="font-weight: bold"> ${errorCount} </span>
                <span class="text-error" style="font-weight: bold;"> error${errorCount === 1 ? "" : "s"} </span>
            )`;
        }
        else {
            if (!inProgressBuild)
                this.buildBody.html('<span class="text-success">No errors in last build \u2665</span>');
        }
        this.buildPanelBtn.html(title);
    }

    clearBuild() {
        this.buildBody.empty();
    }

    addBuild(view: lineMessageView.LineMessageView) {
        this.buildBody.append(view.$);
    }

    setBuildProgress(progress: BuildUpdate) {
        // just for the first time
        if (progress.builtCount == 1) {
            this.buildProgress.show();
            this.buildProgress.removeClass('warn');
            this.buildBody.html('<span class="text-success">Things are looking good \u2665</span>');

            // Update the errors list for goto history
            gotoHistory.buildOutput.members = [];
        }

        // For last time we don't care just return
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
            progress.errorsInFile.forEach(error => {
                this.addBuild(new lineMessageView.LineMessageView({
                    goToLine: (filePath, line, col) => gotoHistory.gotoLine(filePath, line, col, gotoHistory.buildOutput),
                    message: error.message,
                    line: error.startPos.line + 1,
                    col: error.startPos.col,
                    file: error.filePath,
                    preview: error.preview
                }));
                // Update the errors list for goto history
                gotoHistory.buildOutput.members.push({ filePath: error.filePath, line: error.startPos.line + 1, col: error.startPos.col });
            });
        }
    }
}

export var panelView: MainPanelView;
var panel: AtomCore.Panel;
export function attach() {

    // Only attach once
    if (panelView) return;

    panelView = new MainPanelView();
    panel = atom.workspace.addBottomPanel({ item: panelView, priority: 1000, visible: true });
    panelView.setErrorPanelErrorCount(0, 0);
}

export function show() {
    if (!panelView) return;
    panelView.$.show();
}

export function hide() {
    if (!panelView) return;
    panelView.$.hide();
}


export module errorView {
    var filePathErrors: utils.Dict<TSError[]> = new utils.Dict<any[]>();

    export var setErrors = (filePath: string, errorsForFile: TSError[]) => {
        if (!errorsForFile.length) filePathErrors.clearValue(filePath);
        else {
            // Currently we are limiting errors
            // To many errors crashes our display
            if (errorsForFile.length > 50) errorsForFile = errorsForFile.slice(0, 50);

            filePathErrors.setValue(filePath, errorsForFile)
        };

        // TODO: this needs to be optimized at some point
        panelView.clearError();

        var fileErrorCount = filePathErrors.keys().length;

        // Update the errors list for goto history
        gotoHistory.errorsInOpenFiles.members = [];

        if (!fileErrorCount) {
            panelView.setErrorPanelErrorCount(0, 0);
        }
        else {
            var totalErrorCount = 0;
            for (var path in filePathErrors.table) {
                filePathErrors.getValue(path).forEach((error: TSError) => {
                    totalErrorCount++;
                    panelView.addError(new lineMessageView.LineMessageView({
                        goToLine: (filePath, line, col) => gotoHistory.gotoLine(filePath, line, col, gotoHistory.errorsInOpenFiles),
                        message: error.message,
                        line: error.startPos.line + 1,
                        col: error.startPos.col,
                        file: error.filePath,
                        preview: error.preview
                    }));
                    // Update the errors list for goto history
                    gotoHistory.errorsInOpenFiles.members.push({ filePath: error.filePath, line: error.startPos.line + 1, col: error.startPos.col });
                });
            }
            panelView.setErrorPanelErrorCount(fileErrorCount, totalErrorCount);
        }
    };

    export function showEmittedMessage(output: EmitOutput) {
        if (output.success) {
            var message = 'TS emit succeeded<br/>' + output.outputFiles.join('<br/>');
            atomUtils.quickNotifySuccess(message);
        } else if (output.emitError) {
            atom.notifications.addError('TS Emit Failed');
        } else {
            atomUtils.quickNotifyWarning('Compile failed but emit succeeded<br/>' + output.outputFiles.join('<br/>'));
        }
    }

}
