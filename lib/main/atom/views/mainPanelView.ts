import view = require('./view');
var $ = view.$;

import lineMessageView = require('./lineMessageView');
import atomUtils = require("../atomUtils");
import parent = require("../../../worker/parent");
import * as utils from "../../lang/utils";
import { FileStatus, getFileStatus } from "../fileStatusCache";

var panelHeaders = {
    error: 'Errors In Open Files',
    build: 'Last Build Output',
    references: 'References'
}

import gotoHistory = require('../gotoHistory');

export class MainPanelView extends view.View<any> {

    private tsconfigInUse: JQuery;
    private fileStatus: JQuery;
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
    private pendingRequests: string[] = [];

    static content() {
        var btn = (view, text, className: string = '') =>
            this.button({
                'class': `btn btn-sm ${className}`,
                'click': `${view}PanelSelectedClick`,
                'outlet': `${view}PanelBtn`
            }, text);

        this.div({
            class: 'atomts atomts-main-panel-view native-key-bindings',
            tabindex: '-1'
        }, () => {
            this.div({
                class: 'layout horizontal',
                style: '-webkit-user-select: none; flex-wrap: wrap',
                dblclick: 'toggle'
            }, () => {
                this.span({
                  class: 'layout horizontal atomts-panel-header',
                  style: 'align-items: center'
                }, () => {
                    this.span({
                        style: 'cursor: pointer; color: rgb(0, 148, 255); -webkit-user-select: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 16px',
                        click: 'toggle'
                    }, () => {
                        this.span({ class: 'icon-microscope' });
                        this.span({ style: 'font-weight: bold' }, 'TypeScript');
                    });

                    this.div({
                        class: 'btn-group',
                        style: 'margin-left: 6px; flex: 1 0 auto'
                    }, () => {
                        btn('error', panelHeaders.error, 'selected')
                        btn('build', panelHeaders.build)
                        btn('references', panelHeaders.references)
                    });
                });

                this.span({
                  class: 'layout horizontal atomts-panel-header',
                  style: 'align-items: center; flex: 1 1 auto; line-height: 24px;' // Line height is equal to height of github loading icon
                }, () => {
                    this.div({
                        style: 'cursor: pointer;',
                        click: 'clickedCurrentTsconfigFilePath'
                    }, () => {
                        this.span({
                            outlet: 'tsconfigInUse'
                        });
                    });

                    this.div({
                        style: 'overflow-x: visible; white-space: nowrap;'
                    }, () => {
                        this.span({
                            style: 'margin-left: 10px; transition: color 1s', // Added transition to make it easy to see *yes I just did this compile*.
                            outlet: 'fileStatus'
                        });
                    });

                    this.div({
                        class: 'heading-summary flex',
                        style: 'margin-left: 5px; overflow: hidden; white-space:nowrap; text-overflow: ellipsis',
                        outlet: 'summary'
                    });

                    this.progress({
                        class: 'inline-block build-progress',
                        style: 'display: none; color: red',
                        outlet: 'buildProgress'
                    });

                    this.span({
                        class: 'section-pending',
                        outlet: 'sectionPending',
                        click: 'showPending'
                    }, () => {
                        this.span({
                            outlet: 'txtPendingCount',
                            style: 'cursor: pointer; margin-left: 5px',
                        });

                        this.span({
                            class: 'loading loading-spinner-tiny inline-block',
                            style: 'cursor: pointer; margin-left: 5px'
                        });
                    });

                    this.div({
                        class: 'heading-buttons',
                        style: 'margin-left: 5px'
                    }, () => {
                        this.span({
                            class: 'heading-fold icon-unfold',
                            style: 'cursor: pointer; margin-right: 10px',
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
                });

                this.div({
                    class: 'panel-body atomts-panel-body',
                    outlet: 'errorBody',
                    style: 'overflow-y: auto; flex: 1 0 100%; display: none'
                });
                this.div({
                    class: 'panel-body atomts-panel-body',
                    outlet: 'buildBody',
                    style: 'overflow-y: auto; flex: 1 0 100%; display: none'
                });
                this.div({
                    class: 'panel-body atomts-panel-body',
                    outlet: 'referencesBody',
                    style: 'overflow-y: auto; flex: 1 0 100%; display: none'
                });
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
                atomUtils.triggerLinter();

                return parent.errorsForFile({ filePath: editor.getPath() })
            })
                .then((resp) => errorView.setErrors(editor.getPath(), resp.errors));
        }
    }

    ///////////// Current TSconfig
    private fullTsconfigPath: string;
    setTsconfigInUse(tsconfigFilePath: string) {
        this.fullTsconfigPath = tsconfigFilePath;
        if (!this.fullTsconfigPath) {
            this.tsconfigInUse.text('no tsconfig.json');
        }
        else {
            var path = atomUtils.getFilePathRelativeToAtomProject(tsconfigFilePath);
            this.tsconfigInUse.text(`${path}`);
        }
    }
    clickedCurrentTsconfigFilePath() {
        if (!this.fullTsconfigPath) {
            atom.notifications.addInfo("No tsconfig for current file")
            return;
        }
        else{
            atomUtils.openFile(this.fullTsconfigPath);
        }
    }

    ///////////// Change JS File Status
    updateFileStatus(filePath: string) {
        parent.getProjectFileDetails({ filePath }).then(fileDetails => {
            if (!fileDetails.project.compileOnSave) {
                this.fileStatus.addClass("hidden");
            } else {
                let status = getFileStatus(filePath);
                this.fileStatus.removeClass('icon-x icon-check text-error text-success hidden');
                if (status.emitDiffers || status.modified) {
                    this.fileStatus.text('JS Outdated');
                    this.fileStatus.addClass('icon-x text-error');
                } else {
                    this.fileStatus.text('JS Current');
                    this.fileStatus.addClass('icon-check text-success');
                }
            }
        });
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
    errorPanelSelectedClick() {
        this.toggleIfThisIsntSelected(this.errorPanelBtn);
        this.errorPanelSelected();
    }
    errorPanelSelected() {
        this.selectPanel(this.errorPanelBtn, this.errorBody, gotoHistory.errorsInOpenFiles);
    }

    buildPanelSelectedClick() {
        this.toggleIfThisIsntSelected(this.buildPanelBtn);
        this.buildPanelSelected();
    }
    buildPanelSelected() {
        this.selectPanel(this.buildPanelBtn, this.buildBody, gotoHistory.buildOutput);
    }

    referencesPanelSelectedClick() {
        this.toggleIfThisIsntSelected(this.referencesPanelBtn);
        this.referencesPanelSelected();
    }
    referencesPanelSelected(forceExpand = false) {
        this.selectPanel(this.referencesPanelBtn, this.referencesBody, gotoHistory.referencesOutput);
    }

    private toggleIfThisIsntSelected(btn:JQuery){
        if(btn.hasClass('selected')){
            this.expanded = !this.expanded;
        }
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
            this.errorPanelSelected();
        }
        if (this.buildPanelBtn.hasClass('selected')) {
            this.buildPanelSelected();
        }
        if (this.referencesPanelBtn.hasClass('selected')) {
            this.referencesPanelSelected();
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

    /*TODO: Type this*/
    setErrorSummary(summary: any) {
        var message = summary.summary,
            className = summary.className,
            raw = summary.rawSummary || false,
            handler = summary.handler || undefined;
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

    panelView = new MainPanelView({});
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
    const MAX_ERRORS = 50;

    var filePathErrors: utils.Dict<CodeError[]> = new utils.Dict<any[]>();

    export var setErrors = (filePath: string, errorsForFile: CodeError[]) => {
        if (!panelView || !panelView.clearError) {
          // if not initialized, just quit; might happen when atom is first opened.
          return;
        }

        if (!errorsForFile.length) {
          filePathErrors.clearValue(filePath);
        } else {
          // Currently we are limiting errors
          // Too many errors crashes our display
          if (errorsForFile.length > MAX_ERRORS) {
            errorsForFile = errorsForFile.slice(0, MAX_ERRORS);
          }

          filePathErrors.setValue(filePath, errorsForFile)
        }

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
                filePathErrors.getValue(path).forEach((error: CodeError) => {
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
        if (output.emitError) {
            atom.notifications.addError('TS Emit Failed');
        } else if (!output.success) {
            atomUtils.quickNotifyWarning('Compile failed but emit succeeded<br/>' + output.outputFiles.join('<br/>'));
        }
    }

}
