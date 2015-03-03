import view = require('./view');
var $ = view.$;

import lineMessageView = require('./lineMessageView');


var panelHeaders = {
    error: 'Errors In Open Files',
    build: 'Last Build Output'
}

export class MainPanelView extends view.View<any> {

    private btnFold: JQuery;
    private summary: JQuery;
    private heading: JQuery;
    private errorPanelBtn: JQuery;
    private buildPanelBtn: JQuery;
    private errorBody: JQuery;
    private buildBody: JQuery;
    static content() {
        var btn = (view, text, className: string = '') =>
            this.button({
                'class': "btn " + className,
                'click': `${view}PanelSelected`,
                'outlet': `${view}PanelBtn`,
                'style': 'top:-2px!important'
            }, text);

        this.div({
            class: 'am-panel tool-panel panel-bottom native-key-bindings',
            tabindex: '-1'
        },() => {
                this.div({
                    class: 'panel-resize-handle',
                    style: 'position: absolute; top: 0; left: 0; right: 0; height: 10px; cursor: row-resize; z-index: 3'
                });
                this.div({
                    class: 'panel-heading'
                },() => {
                        this.span({ style: 'cursor: pointer', 'click': 'toggle' },() => {
                            this.span({ class: "icon-bug" });
                            this.span({}, " TypeScript ");
                        });

                        this.div({
                            class: 'btn-group'
                        },
                            () => {
                                btn("error", panelHeaders.error, 'selected')
                                // TODO: later 
                                btn("build", panelHeaders.build)
                            });

                        this.span({}, " ");

                        this.div({
                            class: 'heading-title inline-block',
                            style: 'cursor: pointer',
                            outlet: 'heading',
                            click: 'toggle'
                        });


                        this.div({
                            class: 'heading-summary',
                            style: 'display:inline-block',
                            outlet: 'summary'
                        });
                        this.div({
                            class: 'heading-buttoms inline-block pull-right'
                        },() => {
                                this.div({
                                    class: 'heading-fold inline-block icon-unfold',
                                    style: 'cursor: pointer',
                                    outlet: 'btnFold',
                                    click: 'toggle'
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
            });
    }


    init() {
        this.buildPanelBtn.html(`${panelHeaders.build} ( <span class="text-success">No Build</span> )`);
        this.buildBody.html('<span class="text-success"> No Build. Press (ctrl+shift+b / cmd+shift+b ) to start a build for an active TypeScript file\'s project. </span>')
    }

    errorPanelSelected() {
        this.errorPanelBtn.addClass('selected');
        this.buildPanelBtn.removeClass('selected');
        this.expanded = true;
        this.setActivePanel();
    }

    buildPanelSelected() {
        this.errorPanelBtn.removeClass('selected');
        this.buildPanelBtn.addClass('selected');
        this.expanded = true;
        this.setActivePanel();
    }

    private setActivePanel() {
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
    }

    private expanded = false;
    toggle() {
        this.expanded = !this.expanded;
        this.setActivePanel();
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
        this.summary.attr('class', 'heading-summary inline-block');
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
    setBuildPanelCount(errorCount: number) {
        var title = `${panelHeaders.build} ( <span class="text-success">No Errors</span> )`;
        if (errorCount > 0) {
            title = `${panelHeaders.build} (
                <span class="text-highlight" style="font-weight: bold"> ${errorCount} </span>
                <span class="text-error" style="font-weight: bold;"> error${errorCount === 1 ? "" : "s"} </span>
            )`;
        }
        else {
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
}

export var panelView: MainPanelView;
var panel: AtomCore.Panel;
export function attach() {
    
    // Only attach once
    if (panelView) return;

    panelView = new MainPanelView();
    panel = atom.workspace.addBottomPanel({ item: panelView, priority: 1000, visible: true });
}
