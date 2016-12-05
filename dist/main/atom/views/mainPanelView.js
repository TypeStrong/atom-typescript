"use strict";
const tslib_1 = require("tslib");
const view = require("./view");
const lineMessageView = require("./lineMessageView");
const atomUtils = require("../atomUtils");
const panelHeaders = {
    build: 'Last Build Output',
    references: 'References'
};
const gotoHistory = require("../gotoHistory");
class MainPanelView extends view.View {
    constructor() {
        super(...arguments);
        this.pendingRequests = [];
        this.expanded = false;
    }
    static content() {
        var btn = (view, text, className = '') => this.button({
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
                        btn('build', panelHeaders.build, 'selected');
                        btn('references', panelHeaders.references);
                    });
                });
                this.span({
                    class: 'layout horizontal atomts-panel-header',
                    style: 'align-items: center; flex: 1 1 auto; line-height: 24px;'
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
                            style: 'margin-left: 10px; transition: color 1s',
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
        this.buildBody.html('<span class="text-success"> No Build. Press ( F12 ) to start a build for an active TypeScript file\'s project. </span>');
        this.referencesPanelBtn.html(`${panelHeaders.references} ( <span class="text-success">No Search</span> )`);
        this.referencesBody.html('<span class="text-success"> You haven\'t searched for TypeScript references yet. </span>');
    }
    softReset() {
        console.log("soft reset");
    }
    setTsconfigInUse(tsconfigFilePath) {
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
            atom.notifications.addInfo("No tsconfig for current file");
            return;
        }
        else {
            atomUtils.openFile(this.fullTsconfigPath);
        }
    }
    updateFileStatus(filePath) {
    }
    showPending() {
        atom.notifications.addInfo('Pending Requests: <br/> - ' + this.pendingRequests.join('<br/> - '));
    }
    updatePendingRequests(pending) {
        this.pendingRequests = pending;
        this.txtPendingCount.html(`<span class="text-highlight">${this.pendingRequests.length}</span>`);
        this.sectionPending.stop();
        if (pending.length) {
            this.sectionPending.animate({ opacity: 0.5 }, 500);
        }
        else {
            this.sectionPending.animate({ opacity: 0 }, 200);
        }
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
    toggleIfThisIsntSelected(btn) {
        if (btn.hasClass('selected')) {
            this.expanded = !this.expanded;
        }
    }
    selectPanel(btn, body, activeList) {
        var buttons = [this.buildPanelBtn, this.referencesPanelBtn];
        var bodies = [this.buildBody, this.referencesBody];
        buttons.forEach(b => {
            if (b !== btn)
                b.removeClass('selected');
            else
                b.addClass('selected');
        });
        bodies.forEach(b => {
            if (!this.expanded) {
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
    }
    setActivePanel() {
        if (this.buildPanelBtn.hasClass('selected')) {
            this.buildPanelSelected();
        }
        if (this.referencesPanelBtn.hasClass('selected')) {
            this.referencesPanelSelected();
        }
    }
    toggle() {
        this.expanded = !this.expanded;
        this.setActivePanel();
    }
    setReferences(references) {
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
            gotoHistory.referencesOutput.members.push({ filePath: ref.filePath, line: ref.position.line + 1, col: ref.position.col });
        }
    }
    setBuildPanelCount(errorCount, inProgressBuild = false) {
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
    addBuild(view) {
        this.buildBody.append(view.$);
    }
    setBuildProgress(progress) {
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
            progress.errorsInFile.forEach(error => {
                this.addBuild(new lineMessageView.LineMessageView({
                    goToLine: (filePath, line, col) => gotoHistory.gotoLine(filePath, line, col, gotoHistory.buildOutput),
                    message: error.message,
                    line: error.startPos.line + 1,
                    col: error.startPos.col,
                    file: error.filePath,
                    preview: error.preview
                }));
                gotoHistory.buildOutput.members.push({ filePath: error.filePath, line: error.startPos.line + 1, col: error.startPos.col });
            });
        }
    }
}
exports.MainPanelView = MainPanelView;
function attach() {
    const view = new MainPanelView({});
    atom.workspace.addBottomPanel({ item: view, priority: 1000, visible: true });
    return {
        show() { view.$.show(); },
        hide() { view.$.hide(); },
        view
    };
}
exports.attach = attach;
